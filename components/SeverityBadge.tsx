import type { Severity } from "c2pa-manifest-validator";

const STYLES: Record<Severity, string> = {
  error: "bg-error-soft text-error border-error/20",
  warning: "bg-warn-soft text-warn border-warn/20",
  info: "bg-ink-100 text-ink-700 border-ink-200",
};

const LABELS: Record<Severity, string> = {
  error: "error",
  warning: "warning",
  info: "info",
};

export function SeverityBadge({
  severity,
  className = "",
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STYLES[severity]} ${className}`}
    >
      {LABELS[severity]}
    </span>
  );
}
