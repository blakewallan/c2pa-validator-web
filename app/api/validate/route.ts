import { NextResponse } from "next/server";
import { z } from "zod";
import { writeFile, unlink, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  ALL_CLAIM_RULES,
  ALL_PLATFORM_URL_RULES,
  fromJumbf,
  isCaiBackendAvailable,
  loadPlatformUrl,
  loadTrustAnchors,
  runCaiBackend,
  runRules,
  type Issue,
  type PlatformUrlScan,
  type SignatureDescriptor,
  type ManifestKind,
  type ValidationReport,
} from "c2pa-manifest-validator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Room for ~30MB videos + a little headroom. Matches the UI cap.
export const maxDuration = 30;

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const UrlBodySchema = z.object({
  url: z.string().url().max(2048),
  downloadBytes: z.number().int().min(0).max(8 * 1024 * 1024).optional(),
  cdnUrl: z.string().url().max(2048).optional(),
});

/**
 * Compact, UI-friendly view of the COSE_Sign1 verification block. The
 * underlying `SignatureDescriptor` / `SignatureVerificationResult` types
 * carry everything; we pass through the subset the UI actually renders so
 * the response stays stable even if the engine adds more fields later.
 */
export interface SignatureSummary {
  present: boolean;
  alg?: string;
  verified: boolean;
  signatureValid?: boolean;
  certificateValid?: boolean;
  chainTrusted?: boolean;
  signerSubject?: string;
  signerIssuer?: string;
  signerNotBefore?: string;
  signerNotAfter?: string;
  errors: string[];
  warnings: string[];
  manifestKind?: ManifestKind;
}

/**
 * Records which parsing path produced the report. Surfaces to the UI so
 * users can see whether we're running on CAI's Rust core or our native
 * TS parser, and why we chose that path.
 *
 * The `detail` field carries a human-readable note (e.g. "peer dep
 * missing, fell back to native") for the UI badge tooltip.
 */
export interface BackendInfo {
  backend: "cai" | "native" | "platform-url";
  durationMs?: number;
  version?: string;
  detail?: string;
}

export interface ValidateResponse {
  report: ValidationReport;
  /** Populated only when the input was a platform URL. */
  scan?: PlatformUrlScan;
  /** Populated when the source is a file / CDN bytes with a C2PA manifest. */
  signature?: SignatureSummary;
  backend: BackendInfo;
  /** File name / URL we ran against — echoed for the UI header. */
  source: string;
}

export interface ValidateError {
  error: string;
  detail?: unknown;
}

/**
 * Dispatch on Content-Type: JSON = URL validation (legacy path),
 * multipart = file upload validation (new v0.2 path). The two paths
 * funnel into a unified ValidateResponse so the client never has to
 * branch on which entry point it hit.
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    return handleFileUpload(req);
  }

  // Default to JSON — the URL-validation path.
  return handleUrlJson(req);
}

async function handleUrlJson(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ValidateError>(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = UrlBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ValidateError>(
      { error: "Invalid request.", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { url, downloadBytes, cdnUrl } = parsed.data;

  let scan: PlatformUrlScan;
  try {
    scan = await loadPlatformUrl(url, {
      downloadBytes: downloadBytes && downloadBytes > 0 ? downloadBytes : undefined,
      explicitCdnUrl: cdnUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json<ValidateError>(
      { error: `Loader failed: ${message}` },
      { status: 502 },
    );
  }

  const platformReport = runRules<PlatformUrlScan>({
    kind: "platform-url",
    source: url,
    rules: [...ALL_PLATFORM_URL_RULES],
    context: {
      parsed: scan,
      source: url,
      url,
    },
  });

  // When the byte scan pulled an actual JUMBF payload out of the CDN
  // response, escalate: parse it into a C2PAPayload and run the claim /
  // manifest / AI / compliance rule pack over it so we can report
  // signature validity alongside the platform-url findings.
  const jumbfBytes = scan.byteScan?.isobmff?.c2paPayload;
  let claimIssues: Issue[] = [];
  let claimRulesRun = 0;
  let signature: SignatureSummary | undefined;

  if (jumbfBytes && jumbfBytes.byteLength > 0) {
    const payload = fromJumbf(jumbfBytes);
    const trustAnchorsPath = process.env.C2PA_TRUST_ANCHORS_PATH;
    if (trustAnchorsPath) {
      const loaded = loadTrustAnchors({ path: trustAnchorsPath });
      if (loaded.anchors.length > 0) {
        payload.meta.trustAnchors = loaded.anchors;
      }
    }
    const claimReport = runRules({
      kind: "isobmff",
      source: url,
      rules: [...ALL_CLAIM_RULES],
      context: { parsed: payload, source: url },
    });
    claimIssues = claimReport.issues;
    claimRulesRun = claimReport.rulesRun;
    signature = buildSignatureSummary(payload.signature, payload.meta.manifestKind);
  }

  const report: ValidationReport = {
    ...platformReport,
    issues: [...platformReport.issues, ...claimIssues],
    counts: recount([...platformReport.issues, ...claimIssues]),
    rulesRun: platformReport.rulesRun + claimRulesRun,
  };

  return NextResponse.json<ValidateResponse>({
    report,
    scan,
    signature,
    source: url,
    backend: {
      backend: "platform-url",
      detail: jumbfBytes?.byteLength
        ? "Embedded C2PA found in CDN bytes — ran claim rules on native parser."
        : "Ran platform-url rules on the oEmbed/URL payload.",
    },
  });
}

/**
 * File-upload path: writes the multipart part to a short-lived temp
 * file, invokes the CAI backend (falling back to the native parser if
 * the optional peer dep is absent), then cleans up on the way out.
 *
 * We intentionally do NOT stream directly into the parser — both
 * backends want a file path on disk today, and the temp-file
 * round-trip is measured in single-digit milliseconds for sub-50MB
 * uploads.
 */
async function handleFileUpload(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json<ValidateError>(
      { error: "Failed to parse multipart body." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json<ValidateError>(
      { error: 'Expected a "file" field in the multipart body.' },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json<ValidateError>(
      { error: "Uploaded file is empty." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json<ValidateError>(
      {
        error: `Uploaded file is ${Math.round(file.size / 1024 / 1024)}MB — max is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB. For larger files use the CLI.`,
      },
      { status: 413 },
    );
  }

  const workDir = await mkdtemp(join(tmpdir(), "c2pa-web-"));
  const safeName = sanitizeFilename(file.name || "upload.bin");
  const tempPath = join(workDir, `${randomUUID()}-${safeName}`);

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(tempPath, bytes);

    const trustAnchorsPath = process.env.C2PA_TRUST_ANCHORS_PATH;
    const caiAvailable = await isCaiBackendAvailable();

    if (caiAvailable) {
      try {
        const { payload, durationMs, c2paNodeVersion } = await runCaiBackend(
          tempPath,
          {
            verifyTrust: true,
            ocspFetch: false,
          },
        );
        if (trustAnchorsPath) {
          const loaded = loadTrustAnchors({ path: trustAnchorsPath });
          if (loaded.anchors.length > 0) {
            payload.meta.trustAnchors = loaded.anchors;
          }
        }
        const report = runRules({
          kind: "claim",
          source: file.name,
          rules: [...ALL_CLAIM_RULES],
          context: { parsed: payload, source: file.name },
        });
        return NextResponse.json<ValidateResponse>({
          report,
          signature: buildSignatureSummary(
            payload.signature,
            payload.meta.manifestKind,
          ),
          source: file.name,
          backend: {
            backend: "cai",
            durationMs,
            version: c2paNodeVersion,
            detail: `Parsed by @contentauth/c2pa-node ${c2paNodeVersion ?? ""} (Rust bindings to c2pa-rs).`.trim(),
          },
        });
      } catch (err) {
        // CAI backend threw on this specific asset (unsupported format,
        // truncated file, etc.) — fall through to native so the user
        // still gets a report rather than a bare 500.
        const detail = err instanceof Error ? err.message : String(err);
        return runNativeOnTempFile(tempPath, file.name, trustAnchorsPath, {
          reason: `CAI backend failed: ${detail}. Fell back to native parser.`,
        });
      }
    }

    return runNativeOnTempFile(tempPath, file.name, trustAnchorsPath, {
      reason:
        "@contentauth/c2pa-node is not installed on this server. Ran on native TS parser.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json<ValidateError>(
      { error: `File processing failed: ${message}` },
      { status: 500 },
    );
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

/**
 * Native parser on a temp file. Used by the CAI fallback branch and
 * by `C2PA_DISABLE_CAI=1` deployments that want to avoid the peer
 * dep on principle.
 */
async function runNativeOnTempFile(
  tempPath: string,
  displayName: string,
  trustAnchorsPath: string | undefined,
  info: { reason: string },
) {
  const { readFile } = await import("node:fs/promises");
  const started = Date.now();
  const bytes = await readFile(tempPath);

  // The native parser accepts either ISOBMFF bytes (which it'll scan
  // for a JUMBF box) or a raw JUMBF payload. We try ISOBMFF first
  // since uploads are usually videos, falling back to a direct JUMBF
  // parse if the scan returns nothing.
  const { fromIsobmff } = await import("c2pa-manifest-validator");
  let payload = fromIsobmff(bytes);

  if (!payload.claim && !payload.signature.present) {
    // Try a raw JUMBF interpretation in case the upload is a bare
    // manifest export (c2pa/c2patool `--manifest-only` output).
    try {
      payload = fromJumbf(bytes);
    } catch {
      // Keep the empty payload — rules will flag "no manifest".
    }
  }

  if (trustAnchorsPath) {
    const loaded = loadTrustAnchors({ path: trustAnchorsPath });
    if (loaded.anchors.length > 0) {
      payload.meta.trustAnchors = loaded.anchors;
    }
  }

  const report = runRules({
    kind: "isobmff",
    source: displayName,
    rules: [...ALL_CLAIM_RULES],
    context: { parsed: payload, source: displayName },
  });

  return NextResponse.json<ValidateResponse>({
    report,
    signature: buildSignatureSummary(
      payload.signature,
      payload.meta.manifestKind,
    ),
    source: displayName,
    backend: {
      backend: "native",
      durationMs: Date.now() - started,
      detail: info.reason,
    },
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function buildSignatureSummary(
  desc: SignatureDescriptor,
  manifestKind: ManifestKind | undefined,
): SignatureSummary {
  const v = desc.verification;
  return {
    present: desc.present,
    alg: desc.alg ?? v?.alg,
    verified: Boolean(v),
    signatureValid: v?.signatureValid,
    certificateValid: v?.certificateValid,
    chainTrusted: v?.chainTrusted,
    signerSubject: v?.signerSubject,
    signerIssuer: v?.signerIssuer,
    signerNotBefore: v?.signerNotBefore,
    signerNotAfter: v?.signerNotAfter,
    errors: v?.errors ?? [],
    warnings: v?.warnings ?? [],
    manifestKind,
  };
}

function recount(issues: Issue[]): ValidationReport["counts"] {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const i of issues) {
    if (i.severity === "error") counts.error += 1;
    else if (i.severity === "warning") counts.warning += 1;
    else counts.info += 1;
  }
  return counts;
}
