import {
  HEADLINE_ATTACK_IDS,
  HEADLINE_DETECTOR_IDS,
  rollupSurvivalByAttackDetector,
  type MatrixCell,
  type AttackDescriptor,
  type DetectorDescriptor,
} from "@/lib/robustness/report";
import { Sparkle } from "@/components/Sparkle";

/**
 * The 2×2 "orthogonal failure modes" table — the thesis of the demo.
 *
 * Restricts to the two surgical byte-level attacks × the two first-class
 * disclosure detectors. Everything else lives in the full matrix below,
 * but this is the cell the stakeholder pitch turns on: each attack kills
 * its own target and leaves the other signal intact.
 */
export function OrthogonalHeadline({
  cells,
  attacks,
  detectors,
}: {
  cells: readonly MatrixCell[];
  attacks: readonly AttackDescriptor[];
  detectors: readonly DetectorDescriptor[];
}) {
  const rollup = rollupSurvivalByAttackDetector(cells);

  const attackRows = HEADLINE_ATTACK_IDS.map(
    (id) => attacks.find((a) => a.id === id),
  ).filter((a): a is AttackDescriptor => !!a);
  const detectorCols = HEADLINE_DETECTOR_IDS.map(
    (id) => detectors.find((d) => d.id === id),
  ).filter((d): d is DetectorDescriptor => !!d);

  return (
    <section
      aria-label="Orthogonal failure modes"
      className="rounded-2xl border border-white/15 bg-white/8 p-6 shadow-aero-sm backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkle size="sm" />
            <span className="eyebrow-mono text-aqua-200">
              Finding № 1 &middot; Submitted for the record
            </span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-[32px]">
            Two labels,{" "}
            <span className="chrome-blue">two separate failures</span>
          </h2>
        </div>
        <span className="aero-pill shrink-0">
          <span className="aero-led green" style={{ width: 7, height: 7 }} />
          <span>4 test files carrying both labels</span>
        </span>
      </div>

      <p className="mt-3 max-w-3xl text-[14.5px] leading-[1.65] text-ink-100/90">
        Industry best practice is to put <strong>both</strong> labels on a
        file — the signed C2PA manifest and the older unsigned XMP tag —
        on the theory that one will back the other up. The result below
        shows this doesn&rsquo;t work. Each attack kills its own target
        and leaves the other label completely untouched. Stacking the two
        labels gives you two independent points of failure, not a single
        resilient system.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/12">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-white/6">
              <th className="w-64 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-200/80">
                <div>Attack applied ↓</div>
                <div className="mt-0.5 text-[9.5px] normal-case tracking-normal text-ink-200/55">
                  (what got done to the file)
                </div>
              </th>
              {detectorCols.map((d) => (
                <th
                  key={d.id}
                  className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-ink-200/80"
                >
                  <div className="text-[12px] normal-case tracking-normal text-white">
                    {detectorFriendlyName(d.id)}
                  </div>
                  <div className="mt-0.5 text-[9.5px] normal-case tracking-normal text-ink-200/55">
                    (did this label survive?)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attackRows.map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="px-4 py-4 align-top">
                  <div className="text-[13px] font-semibold text-white">
                    {attackFriendlyName(a.id)}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-ink-200/70">
                    {attackFriendlyDescription(a.id)}
                  </div>
                </td>
                {detectorCols.map((d) => {
                  const b = rollup.get(`${a.id}||${d.id}`);
                  return (
                    <td key={d.id} className="px-4 py-4 text-center align-top">
                      <HeadlineCell bucket={b} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-ink-200/75">
        &ldquo;Survived&rdquo; means the label was still detectable after
        the attack. The 100% result in the bottom-right is a subtle one:
        the C2PA manifest is still structurally present, but its
        cryptographic seal is now broken. A conforming validator should
        treat it as tampered. See the glossary below for what that means
        in practice.
      </p>
    </section>
  );
}

function detectorFriendlyName(id: string): string {
  switch (id) {
    case "detector.c2pa":
      return "C2PA (signed)";
    case "detector.xmp-dst":
      return "IPTC XMP (unsigned)";
    default:
      return id;
  }
}

function attackFriendlyName(id: string): string {
  switch (id) {
    case "container.strip.c2pa":
      return "Strip the C2PA manifest";
    case "container.strip.xmp":
      return "Strip the XMP tag";
    default:
      return id;
  }
}

function attackFriendlyDescription(id: string): string {
  switch (id) {
    case "container.strip.c2pa":
      return "A surgical edit that removes just the C2PA box from the file, leaving everything else — including the XMP tag — intact.";
    case "container.strip.xmp":
      return "A surgical edit that removes just the XMP tag from the file, leaving everything else — including the C2PA manifest box — intact.";
    default:
      return "";
  }
}

function HeadlineCell({
  bucket,
}: {
  bucket:
    | {
        survived: number;
        considered: number;
      }
    | undefined;
}) {
  if (!bucket || bucket.considered === 0) {
    return <span className="text-ink-200/50">—</span>;
  }
  const rate = bucket.survived / bucket.considered;
  const pct = `${Math.round(rate * 100)}%`;
  const isHigh = rate >= 0.5;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`font-display text-[36px] font-semibold leading-none tabular-nums ${
          isHigh ? "text-phosphor" : "text-error"
        }`}
      >
        {pct}
      </div>
      <div className="text-[11.5px] text-ink-200/80">
        {isHigh ? (
          <>
            survived in {bucket.survived} of {bucket.considered} files
          </>
        ) : (
          <>
            destroyed in {bucket.considered - bucket.survived} of{" "}
            {bucket.considered} files
          </>
        )}
      </div>
    </div>
  );
}
