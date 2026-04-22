import type { SignatureSummary } from "@/lib/api";

/**
 * Renders the COSE_Sign1 verification outcome when the validator was able
 * to run §15.7 over an embedded manifest. This is separate from the issue
 * list on purpose: signature validity is the single most important fact
 * for downstream trust decisions and deserves dedicated real estate.
 */
export function SignatureCard({ signature }: { signature: SignatureSummary }) {
  // Nothing to render when there's no manifest at all.
  if (!signature.present && !signature.verified) return null;

  const verdict = buildVerdict(signature);

  return (
    <div className="rounded-lg border border-ink-200 bg-white">
      <div
        className={`flex items-center justify-between border-b border-ink-200 px-5 py-3 ${verdict.headerClass}`}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-xs uppercase tracking-widest">
            COSE_Sign1 verification
          </h3>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${verdict.pillClass}`}
          >
            {verdict.label}
          </span>
        </div>
        <span className="font-mono text-xs opacity-70">
          spec: <span className="opacity-100">C2PA 2.3 §15.7</span>
        </span>
      </div>

      <dl className="divide-y divide-ink-200">
        <Row label="Status" value={verdict.statusLine} />
        {signature.alg ? (
          <Row
            label="Algorithm"
            value={signature.alg}
            mono
            highlight={isDeprecatedAlg(signature.alg)}
          />
        ) : null}
        {signature.manifestKind ? (
          <Row label="Manifest kind" value={signature.manifestKind} mono />
        ) : null}
        {signature.signerSubject ? (
          <Row label="Signer subject" value={signature.signerSubject} mono />
        ) : null}
        {signature.signerIssuer ? (
          <Row
            label="Signer issuer"
            value={signature.signerIssuer}
            mono
            highlight={
              signature.signerSubject === signature.signerIssuer
            }
          />
        ) : null}
        {signature.signerNotBefore && signature.signerNotAfter ? (
          <Row
            label="Validity window"
            value={`${signature.signerNotBefore}  →  ${signature.signerNotAfter}`}
            mono
            highlight={signature.certificateValid === false}
          />
        ) : null}
        <Row
          label="Trust chain"
          value={
            signature.chainTrusted
              ? "Matched supplied trust anchor"
              : "Not matched (v0.3 will resolve the C2PA Trust List)"
          }
          highlight={signature.chainTrusted === false}
        />
        {signature.errors.length > 0 ? (
          <Row
            label="Verification errors"
            value={signature.errors.join(" · ")}
            mono
            highlight
          />
        ) : null}
        {signature.warnings.length > 0 ? (
          <Row
            label="Warnings"
            value={signature.warnings.join(" · ")}
            mono
          />
        ) : null}
      </dl>
    </div>
  );
}

function buildVerdict(sig: SignatureSummary): {
  label: string;
  statusLine: string;
  headerClass: string;
  pillClass: string;
} {
  if (!sig.present) {
    return {
      label: "no signature",
      statusLine:
        "No COSE_Sign1 signature block was found in the embedded JUMBF manifest.",
      headerClass: "bg-ink-50 text-ink-700",
      pillClass: "bg-ink-100 text-ink-700 border-ink-200",
    };
  }
  if (!sig.verified) {
    return {
      label: "not attempted",
      statusLine:
        "Signature block present, but §15.7 verification did not run. This usually means a sidecar input without JUMBF wrapping.",
      headerClass: "bg-ink-50 text-ink-700",
      pillClass: "bg-ink-100 text-ink-700 border-ink-200",
    };
  }

  const algBad = sig.errors.some((e) => /Unsupported COSE algorithm/i.test(e));
  if (algBad) {
    return {
      label: "unsupported alg",
      statusLine:
        "Signature block uses a COSE algorithm identifier this verifier doesn't recognise.",
      headerClass: "bg-error-soft text-error",
      pillClass: "bg-error-soft text-error border-error/20",
    };
  }

  if (sig.signatureValid === true && sig.certificateValid === true) {
    return {
      label: sig.chainTrusted ? "verified + trusted" : "verified",
      statusLine: sig.chainTrusted
        ? "Signature math verified. Signing cert is in its validity window and matched a supplied trust anchor."
        : "Signature math verified. Signing cert is in its validity window. Chain trust not yet evaluated — supply trust anchors to promote to 'trusted'.",
      headerClass: "bg-ok-soft text-ok",
      pillClass: "bg-ok-soft text-ok border-ok/20",
    };
  }

  if (sig.signatureValid === false) {
    return {
      label: "signature mismatch",
      statusLine:
        "COSE_Sign1 signature did not verify against the reconstructed Sig_structure. The claim bytes were tampered with, the cert doesn't match the key that signed, or the JUMBF payload is truncated.",
      headerClass: "bg-error-soft text-error",
      pillClass: "bg-error-soft text-error border-error/20",
    };
  }

  if (sig.certificateValid === false) {
    return {
      label: "cert expired",
      statusLine:
        "Signature math is correct, but the signing certificate is outside its notBefore/notAfter window. §15.2.2 emits claimSignature.outsideValidity.",
      headerClass: "bg-warn-soft text-warn",
      pillClass: "bg-warn-soft text-warn border-warn/20",
    };
  }

  return {
    label: "unverified",
    statusLine:
      "Verification ran but did not produce a definitive outcome. See errors below.",
    headerClass: "bg-warn-soft text-warn",
    pillClass: "bg-warn-soft text-warn border-warn/20",
  };
}

function isDeprecatedAlg(alg: string): boolean {
  return /^RS(256|384|512)$/.test(alg);
}

function Row({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 px-5 py-2.5">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd
        className={`${mono ? "font-mono text-xs" : "text-sm"} break-words ${
          highlight ? "text-error font-medium" : "text-ink-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
