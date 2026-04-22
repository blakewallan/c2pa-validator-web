import type {
  ManifestKind,
  PlatformUrlScan,
  ValidationReport,
} from "c2pa-manifest-validator";

export type { PlatformUrlScan, ValidationReport, ManifestKind };

export interface ValidateRequest {
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

export interface ValidateResponse {
  report: ValidationReport;
  scan: PlatformUrlScan;
  signature?: SignatureSummary;
}

export interface ValidateErrorResponse {
  error: string;
  detail?: unknown;
}

export async function callValidate(
  body: ValidateRequest,
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
