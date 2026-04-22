import type { Severity } from "c2pa-manifest-validator";
import type { ValidateResponse } from "@/lib/api";
import { classifyCompliance } from "@/lib/compliance";
import { ComplianceBanner } from "./ComplianceBanner";
import { ForensicCard } from "./ForensicCard";
import { IssueItem } from "./IssueItem";
import { ReportActions } from "./ReportActions";
import { SignatureCard } from "./SignatureCard";

const SEVERITY_ORDER: Severity[] = ["error", "warning", "info"];

export function ReportPanel({ data }: { data: ValidateResponse }) {
  const { report, scan, signature, backend, source } = data;

  const verdict = buildVerdict(report.counts, signature);
  const compliance = classifyCompliance(report, signature);

  const groups = SEVERITY_ORDER.map((sev) => ({
    severity: sev,
    issues: report.issues.filter((i) => i.severity === sev),
  }));

  return (
    <div className="mt-8 space-y-6">
      {/* Verdict summary (technical) + header actions */}
      <div
        className={`rounded-lg border p-5 ${verdict.toneClass}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                {source}
              </div>
              <BackendBadge backend={backend} />
            </div>
            <div className="mt-1 text-lg font-semibold leading-snug">
              {verdict.title}
            </div>
            <div className="mt-1 text-sm opacity-80">{verdict.subtitle}</div>
          </div>
          <ReportActions data={data} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs opacity-80">
          <span>
            <span className="opacity-60">errors:</span> {report.counts.error}
          </span>
          <span>
            <span className="opacity-60">warnings:</span>{" "}
            {report.counts.warning}
          </span>
          <span>
            <span className="opacity-60">info:</span> {report.counts.info}
          </span>
          <span>
            <span className="opacity-60">rules:</span> {report.rulesRun}
          </span>
          <span>
            <span className="opacity-60">time:</span> {report.durationMs}ms
          </span>
        </div>
      </div>

      {/* Regulatory verdict (lay audience) */}
      <ComplianceBanner summary={compliance} />

      {signature ? <SignatureCard signature={signature} /> : null}

      {scan ? <ForensicCard scan={scan} /> : null}

      <div className="rounded-lg border border-ink-200 bg-white">
        <div className="border-b border-ink-200 px-5 py-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-ink-500">
            Issues ({report.issues.length})
          </h3>
        </div>

        {report.issues.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-600">
            No issues raised. Every rule in the rule pack passed.
          </p>
        ) : (
          <div className="px-5">
            {groups.map((g) =>
              g.issues.length === 0 ? null : (
                <ul key={g.severity} className="py-2">
                  {g.issues.map((issue, idx) => (
                    <IssueItem key={`${g.severity}-${idx}`} issue={issue} />
                  ))}
                </ul>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BackendBadge({ backend }: { backend: ValidateResponse["backend"] }) {
  const style =
    backend.backend === "cai"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : backend.backend === "native"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-ink-100 text-ink-700 border-ink-200";
  const label =
    backend.backend === "cai"
      ? `CAI${backend.version ? ` · ${backend.version}` : ""}`
      : backend.backend === "native"
        ? "Native TS"
        : "Platform URL";
  return (
    <span
      title={backend.detail}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${style}`}
    >
      {label}
      {backend.durationMs !== undefined ? (
        <span className="ml-1.5 opacity-70">{backend.durationMs}ms</span>
      ) : null}
    </span>
  );
}

function buildVerdict(
  counts: { error: number; warning: number; info: number },
  signature: ValidateResponse["signature"],
): {
  title: string;
  subtitle: string;
  toneClass: string;
} {
  // Signature failures dominate the verdict when present — a failed
  // COSE_Sign1 check is categorically more serious than a disclosure gap.
  if (signature?.verified) {
    if (signature.signatureValid === false) {
      return {
        title: "C2PA signature did not verify",
        subtitle:
          "The embedded COSE_Sign1 block does not match the claim bytes. Treat the provenance assertion as untrustworthy: the claim was either tampered with post-signing, or the signing cert doesn't match the key that actually signed.",
        toneClass: "border-error/30 bg-error-soft text-error",
      };
    }
    if (signature.signatureValid === true && signature.certificateValid === false) {
      return {
        title: "Signature valid, but signing cert is expired",
        subtitle:
          "The math verifies, but the cert fell outside its notBefore/notAfter window at verification time. C2PA §15.2.2 classifies this as claimSignature.outsideValidity.",
        toneClass: "border-warn/30 bg-warn-soft text-warn",
      };
    }
    if (signature.signatureValid === true && counts.error === 0) {
      return {
        title: "C2PA signature verified",
        subtitle: signature.chainTrusted
          ? "COSE_Sign1 math verifies, signing cert is in its validity window, and issuer matched a supplied trust anchor."
          : "COSE_Sign1 math verifies and signing cert is in its validity window. Chain trust not yet evaluated against a trust list.",
        toneClass: "border-ok/30 bg-ok-soft text-ok",
      };
    }
  }

  if (counts.error > 0) {
    return {
      title: "AI-disclosure gap detected",
      subtitle:
        "Creator or platform signaling is inconsistent with EU AI Act / SB-942 expectations. See error issues below.",
      toneClass: "border-error/30 bg-error-soft text-error",
    };
  }
  if (counts.warning > 0) {
    return {
      title: "Weak disclosure signals only",
      subtitle:
        "No hard failures, but the disclosures present are non-portable (e.g. hashtag-only). Review warnings.",
      toneClass: "border-warn/30 bg-warn-soft text-warn",
    };
  }
  return {
    title: "No disclosure conflicts found",
    subtitle:
      "No AI-disclosure gap detected from zero-auth signals. This is not proof the video is human-made — only that nothing contradicts its public framing.",
    toneClass: "border-ok/30 bg-ok-soft text-ok",
  };
}
