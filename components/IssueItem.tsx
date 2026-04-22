import type { Issue } from "c2pa-manifest-validator";
import { SeverityBadge } from "./SeverityBadge";

export function IssueItem({ issue }: { issue: Issue }) {
  return (
    <li className="group border-t border-ink-200 py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <SeverityBadge severity={issue.severity} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <code className="font-mono text-xs text-ink-500">
              {issue.ruleId}
            </code>
            {issue.statusCode ? (
              <StatusCodePill code={issue.statusCode} />
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-800">
            {issue.message}
          </p>
          {issue.specReference ? (
            <p className="mt-1.5 text-xs text-ink-500">
              <span className="font-mono">spec:</span> {issue.specReference}
            </p>
          ) : null}
          {issue.value !== undefined ? (
            <pre className="mt-2 overflow-x-auto rounded border border-ink-200 bg-ink-50 p-2.5 font-mono text-[11px] leading-snug text-ink-700">
              {JSON.stringify(issue.value, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * Compact pill that surfaces the canonical C2PA §15.2.2 status code next
 * to the rule ID. Canonical codes are how conforming verifiers interop;
 * rendering them inline lets consumers (lawyers, platform trust teams)
 * copy-paste the exact code into their compliance notes.
 */
function StatusCodePill({ code }: { code: string }) {
  const tone = toneForStatusCode(code);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-tight ${tone}`}
      title="Canonical C2PA §15.2.2 status code"
    >
      {code}
    </span>
  );
}

function toneForStatusCode(code: string): string {
  if (
    code.endsWith(".validated") ||
    code.endsWith(".trusted") ||
    code.endsWith(".accessible") ||
    code.endsWith(".match") ||
    code.endsWith(".insideValidity") ||
    code.endsWith(".notRevoked")
  ) {
    return "bg-ok-soft text-ok border-ok/20";
  }
  if (code.startsWith("algorithm.deprecated")) {
    return "bg-warn-soft text-warn border-warn/20";
  }
  if (
    code.endsWith(".missing") ||
    code.endsWith(".mismatch") ||
    code.endsWith(".invalid") ||
    code.endsWith(".untrusted") ||
    code.endsWith(".outsideValidity") ||
    code.endsWith(".unsupported") ||
    code.endsWith(".malformed") ||
    code.endsWith(".revoked")
  ) {
    return "bg-error-soft text-error border-error/20";
  }
  return "bg-ink-100 text-ink-700 border-ink-200";
}
