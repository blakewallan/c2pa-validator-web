import type { DetectorDescriptor, DetectorScore } from "@/lib/robustness/report";

/**
 * Three cards — one per detector — summarising the overall survival
 * rate and the letter grade assigned by the auditor's methodology.
 *
 * Not the same as the 2×2 above: that one restricts to the synth-xmp
 * subset and the two strip attacks to make a *finding*; this one shows
 * the full-corpus whole-battery *score card*, which is the regulator-
 * facing number.
 */
export function ScoresStrip({
  scores,
  detectors,
}: {
  scores: readonly DetectorScore[];
  detectors: readonly DetectorDescriptor[];
}) {
  const primary = scores.filter((s) => s.detectorId !== "detector.null");
  return (
    <section
      aria-label="Detector scores"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {primary.map((s) => {
        const meta = detectors.find((d) => d.id === s.detectorId);
        return <ScoreCard key={s.detectorId} score={s} meta={meta} />;
      })}
    </section>
  );
}

function ScoreCard({
  score,
  meta,
}: {
  score: DetectorScore;
  meta?: DetectorDescriptor;
}) {
  const pct = Math.round(score.survivalRate * 100);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/8 p-5 shadow-aero-sm backdrop-blur-xl backdrop-saturate-150">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-white">
              {friendlyLabel(score.detectorId)}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-200/70">
              {friendlySubtitle(score.detectorId, meta?.title)}
            </div>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg font-semibold ${gradeStyle(score.grade)}`}
            aria-label={`grade ${score.grade}`}
          >
            {score.grade}
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tabular-nums text-white">
            {pct}%
          </span>
          <span className="text-[12px] text-ink-200/75">
            still detectable after attack
          </span>
        </div>

        <div className="mt-2 text-[11.5px] text-ink-200/75">
          {score.survived} of {score.cellsConsidered} applicable test cases
          survived.
        </div>

        {score.excludedNoBaseline + score.excludedAttackError > 0 ? (
          <div className="mt-3 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-ink-200/70">
            {score.excludedNoBaseline} cases skipped (file didn&rsquo;t
            carry this label);{" "}
            {score.excludedAttackError} cases skipped (attack didn&rsquo;t
            apply).
          </div>
        ) : null}
      </div>
    </div>
  );
}

function friendlyLabel(id: string): string {
  switch (id) {
    case "detector.c2pa":
      return "C2PA (signed)";
    case "detector.xmp-dst":
      return "IPTC XMP (unsigned)";
    default:
      return id;
  }
}

function friendlySubtitle(id: string, fallback?: string): string {
  switch (id) {
    case "detector.c2pa":
      return "Cryptographically signed provenance manifest";
    case "detector.xmp-dst":
      return "Older unsigned metadata tag";
    default:
      return fallback ?? "";
  }
}

function gradeStyle(grade: DetectorScore["grade"]): string {
  switch (grade) {
    case "A":
      return "border-phosphor/50 bg-phosphor/15 text-phosphor";
    case "B":
      return "border-aqua-300/50 bg-aqua-300/15 text-aqua-200";
    case "C":
      return "border-warn/50 bg-warn/15 text-warn";
    case "D":
      return "border-orange-400/50 bg-orange-400/15 text-orange-300";
    case "F":
      return "border-error/50 bg-error/15 text-error";
  }
}
