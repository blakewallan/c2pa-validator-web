import type {
  ComplianceCheck,
  ComplianceSummary,
  Verdict,
} from "@/lib/compliance";

export function ComplianceBanner({ summary }: { summary: ComplianceSummary }) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Compliance verdict
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <OverallBadge verdict={summary.overall} />
            <span className="text-sm text-ink-600">
              across {summary.checks.length}{" "}
              {summary.checks.length === 1 ? "regulation" : "regulations"}
            </span>
          </div>
        </div>
        <Legend />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {summary.checks.map((check) => (
          <CheckCard key={check.id} check={check} />
        ))}
      </div>
    </section>
  );
}

function OverallBadge({ verdict }: { verdict: Verdict }) {
  const style = styleFor(verdict);
  const label =
    verdict === "pass"
      ? "Compliant"
      : verdict === "fail"
        ? "Non-compliant"
        : "Indeterminate";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}

function CheckCard({ check }: { check: ComplianceCheck }) {
  const style = styleFor(check.verdict);
  return (
    <div className={`rounded-lg border p-4 ${style.cardBorder} ${style.cardBg}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {check.clause}
        </div>
        <VerdictPill verdict={check.verdict} />
      </div>

      <div className="mt-2 text-sm font-semibold text-ink-900">
        {check.regulation}
      </div>
      <div className="mt-0.5 text-xs text-ink-600">{check.question}</div>

      <p className="mt-3 text-sm leading-relaxed text-ink-700">
        {check.reason}
      </p>

      {check.evidence.length > 0 ? (
        <div className="mt-3 border-t border-ink-200/60 pt-2.5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Evidence
          </div>
          <ul className="mt-1 flex flex-wrap gap-1">
            {check.evidence.map((ev) => (
              <li
                key={ev}
                className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-ink-700"
              >
                {ev}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <a
        href={check.citation.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-xs text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline"
      >
        {check.citation.label} &rarr;
      </a>
    </div>
  );
}

function VerdictPill({ verdict }: { verdict: Verdict }) {
  const s = styleFor(verdict);
  const label =
    verdict === "pass" ? "Pass" : verdict === "fail" ? "Fail" : "Unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${s.bg} ${s.text}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function Legend() {
  return (
    <div className="hidden items-center gap-3 text-[11px] text-ink-500 sm:flex">
      <Dot className="bg-emerald-500" label="Pass" />
      <Dot className="bg-red-500" label="Fail" />
      <Dot className="bg-amber-500" label="Unknown" />
    </div>
  );
}

function Dot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function styleFor(verdict: Verdict): {
  bg: string;
  text: string;
  dot: string;
  cardBg: string;
  cardBorder: string;
} {
  if (verdict === "pass") {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      cardBg: "bg-emerald-50/30",
      cardBorder: "border-emerald-200",
    };
  }
  if (verdict === "fail") {
    return {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      cardBg: "bg-red-50/30",
      cardBorder: "border-red-200",
    };
  }
  return {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    cardBg: "bg-amber-50/30",
    cardBorder: "border-amber-200",
  };
}
