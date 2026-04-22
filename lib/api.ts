import type {
  ManifestKind,
  PlatformUrlScan,
  ValidationReport,
} from "c2pa-manifest-validator";

export type { PlatformUrlScan, ValidationReport, ManifestKind };

export interface ValidateUrlRequest {
  url: string;
  downloadBytes?: number;
  cdnUrl?: string;
}

/**
 * Compact view of the COSE_Sign1 verification outcome. Mirrors
 * `SignatureSummary` in `/api/validate/route.ts` — duplicated here to
 * avoid cross-importing server code into the client bundle.
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
 * Which backend parsed the asset. Surfaces to the UI as a small badge
 * so users know whether they're seeing CAI's Rust core (`cai`), our
 * pure-TS parser (`native`), or the platform-URL oEmbed path.
 */
export interface BackendInfo {
  backend: "cai" | "native" | "platform-url";
  durationMs?: number;
  version?: string;
  detail?: string;
}

export interface ValidateResponse {
  report: ValidationReport;
  /** Only present on URL submissions. */
  scan?: PlatformUrlScan;
  signature?: SignatureSummary;
  backend: BackendInfo;
  source: string;
}

export interface ValidateErrorResponse {
  error: string;
  detail?: unknown;
}

/**
 * POST JSON body to /api/validate — legacy "paste a URL" path.
 */
export async function callValidateUrl(
  body: ValidateUrlRequest,
  signal?: AbortSignal,
): Promise<ValidateResponse> {
  const res = await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  const json = (await res.json()) as ValidateResponse | ValidateErrorResponse;

  if (!res.ok) {
    const err = json as ValidateErrorResponse;
    throw new Error(err.error ?? `Validation failed (HTTP ${res.status}).`);
  }

  return json as ValidateResponse;
}

/**
 * POST multipart/form-data to /api/validate — file-upload path. Uses
 * the CAI backend server-side with a native-parser fallback.
 */
export async function callValidateFile(
  file: File,
  signal?: AbortSignal,
): Promise<ValidateResponse> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch("/api/validate", {
    method: "POST",
    body: form,
    signal,
  });

  const json = (await res.json()) as ValidateResponse | ValidateErrorResponse;

  if (!res.ok) {
    const err = json as ValidateErrorResponse;
    throw new Error(err.error ?? `Validation failed (HTTP ${res.status}).`);
  }

  return json as ValidateResponse;
}

// Legacy alias so existing consumers don't break during the v0.1 → v0.2
// transition. Prefer `callValidateUrl` in new code.
export const callValidate = callValidateUrl;
export type ValidateRequest = ValidateUrlRequest;
