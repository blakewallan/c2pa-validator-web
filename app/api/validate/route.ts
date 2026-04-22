import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ALL_CLAIM_RULES,
  ALL_PLATFORM_URL_RULES,
  fromJumbf,
  loadPlatformUrl,
  loadTrustAnchors,
  runRules,
  type Issue,
  type PlatformUrlScan,
  type SignatureDescriptor,
  type ManifestKind,
  type ValidationReport,
} from "c2pa-manifest-validator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
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
  /** Whether a signature block was found in the JUMBF manifest. */
  present: boolean;
  /** Algorithm label (e.g. "ES256"). Undefined when not discovered. */
  alg?: string;
  /** Whether §15.7 verification was attempted at all. */
  verified: boolean;
  /** Math outcome: signature computes over the claim bytes. */
  signatureValid?: boolean;
  /** Cert validity window covers verification time. */
  certificateValid?: boolean;
  /** Cert chain rooted in a supplied trust anchor. (v0.2: always false
   *  because we don't yet ship a trust list.) */
  chainTrusted?: boolean;
  signerSubject?: string;
  signerIssuer?: string;
  signerNotBefore?: string;
  signerNotAfter?: string;
  errors: string[];
  warnings: string[];
  /** Which kind of JUMBF manifest the box was — informs UI copy. */
  manifestKind?: ManifestKind;
}

export interface ValidateResponse {
  report: ValidationReport;
  scan: PlatformUrlScan;
  /**
   * Populated when the byte scan discovered a C2PA JUMBF box AND we ran
   * the claim-level rules over it. Undefined when no embedded manifest
   * was found, which is the common case for today's platform uploads.
   */
  signature?: SignatureSummary;
}

export interface ValidateError {
  error: string;
  detail?: unknown;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ValidateError>(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(body);
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
    // Allow ops to configure a trust bundle without a rebuild. When
    // C2PA_TRUST_ANCHORS_PATH is unset we still run the rule set — it
    // just can't flip signingCredential.untrusted → .trusted.
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

  return NextResponse.json<ValidateResponse>({ report, scan, signature });
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
