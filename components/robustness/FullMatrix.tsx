"use client";

import { useMemo, useState } from "react";
import {
  classifyCell,
  type AttackDescriptor,
  type CellStatus,
  type DetectorDescriptor,
  type MatrixCell,
  type CorpusItem,
} from "@/lib/robustness/report";
import { CellDetailPanel } from "./CellDetailPanel";

/**
 * Full attack × detector × corpus explorer. Three-way grouped rendering:
 *
 *   - Each *detector* gets its own tab / view.
 *   - Inside the view, rows are corpus items, columns are attacks.
 *   - Each cell is a coloured square indicating survival status; click to
 *     open the detail panel with confidence, attack error, and metadata.
 *
 * Compact by design: 24 rows × 5 columns per detector fits on one screen
 * without scrolling at normal desktop zoom and gives the stakeholder the
 * full-data picture alongside the headline 2×2 above it.
 */
export function FullMatrix({
  cells,
  attacks,
  detectors,
  corpus,
}: {
  cells: readonly MatrixCell[];
  attacks: readonly AttackDescriptor[];
  detectors: readonly DetectorDescriptor[];
  corpus: readonly CorpusItem[];
}) {
  // Filter out the null detector in the default view — it's a wiring
  // smoke test that is never applicable to any corpus item (baseline
  // always false), so it would render as a grid of "excluded-absent"
  // noise and hurt readability.
  const primaryDetectors = detectors.filter((d) => d.id !== "detector.null");
  const [activeDetector, setActiveDetector] = useState<string>(
    primaryDetectors[0]?.id ?? detectors[0]?.id ?? "",
  );
  const [selected, setSelected] = useState<MatrixCell | null>(null);

  const activeDescriptor = detectors.find((d) => d.id === activeDetector);
  const filteredCells = useMemo(
    () => cells.filter((c) => c.detectorId === activeDetector),
    [cells, activeDetector],
  );

  // Sort corpus rows by baseline-presence-first so rows with usable
  // signal float to the top of the grid. Exclusion rows still render but
  // are visually subordinate (see `excluded-absent` cell colour).
  const orderedCorpus = useMemo(() => {
    const applicability = new Map<string, number>();
    for (const c of filteredCells) {
      applicability.set(
        c.inputId,
        (applicability.get(c.inputId) ?? 0) + (c.baselineDetected ? 1 : 0),
      );
    }
    return [...corpus].sort((a, b) => {
      const da = applicability.get(a.id) ?? 0;
      const db = applicability.get(b.id) ?? 0;
      if (da !== db) return db - da;
      return a.id.localeCompare(b.id);
    });
  }, [corpus, filteredCells]);

  // Build a (inputId, attackId) -> cell lookup for O(1) rendering.
  const cellIndex = useMemo(() => {
    const m = new Map<string, MatrixCell>();
    for (const c of filteredCells) {
      m.set(`${c.inputId}||${c.attackId}`, c);
    }
    return m;
  }, [filteredCells]);

  return (
    <section
      aria-label="Full matrix"
      className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-aero-sm backdrop-blur-xl backdrop-saturate-150 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.22em] text-aqua-200/80">
            Full matrix &middot; click any cell for detail
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-white">
            Every file, every attack
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-200/80">
            {activeDescriptor
              ? `Showing whether the ${friendlyDetectorLabel(activeDescriptor.id)} label survived each attack, for every file in the corpus.`
              : ""}{" "}
            Switch detectors with the buttons on the right.
          </p>
        </div>

        <div className="flex gap-1.5">
          {primaryDetectors.map((d) => {
            const on = d.id === activeDetector;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setActiveDetector(d.id);
                  setSelected(null);
                }}
                className={`aero-pill cursor-pointer transition-transform ${
                  on ? "!bg-white/15 !text-white" : "hover:scale-[1.02]"
                }`}
              >
                <span
                  className={`aero-led ${on ? "green" : ""}`}
                  style={{ width: 7, height: 7 }}
                />
                <span className="text-[12px]">
                  {friendlyDetectorLabel(d.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-aqua-300/30 bg-aqua-500/8 px-4 py-2.5 text-[12.5px] text-ink-100/90">
        <span
          className="aero-led pulse shrink-0"
          style={{ width: 10, height: 10 }}
        />
        <span>
          <span className="font-semibold text-white">
            Click any tile below
          </span>{" "}
          to see the confidence score, attack details, and file provenance
          for that specific result.
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[780px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-forest-900/80 px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-wider text-ink-200/75 backdrop-blur"
              >
                File
              </th>
              {attacks.map((a) => (
                <th
                  key={a.id}
                  scope="col"
                  className="px-2 py-2 text-center"
                  title={a.title}
                >
                  <div className="text-[11px] font-medium leading-tight text-white">
                    {friendlyAttackLabel(a.id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedCorpus.map((row) => (
              <tr key={row.id}>
                <td
                  scope="row"
                  className="sticky left-0 z-10 max-w-[240px] truncate border-t border-white/5 bg-forest-900/80 px-3 py-1.5 text-left font-mono text-[11.5px] text-ink-100/90 backdrop-blur"
                  title={`${row.id} — ${row.label}`}
                >
                  {row.id}
                </td>
                {attacks.map((a) => {
                  const cell = cellIndex.get(`${row.id}||${a.id}`);
                  const status: CellStatus | null = cell
                    ? classifyCell(cell)
                    : null;
                  return (
                    <td
                      key={a.id}
                      className="border-t border-white/5 px-1 py-1 text-center"
                    >
                      <CellSquare
                        cell={cell}
                        status={status}
                        isSelected={
                          selected?.inputId === row.id &&
                          selected?.attackId === a.id
                        }
                        onClick={() => setSelected(cell ?? null)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Legend />

      <CellDetailPanel
        cell={selected}
        attack={
          selected
            ? attacks.find((a) => a.id === selected.attackId)
            : undefined
        }
        detector={
          selected
            ? detectors.find((d) => d.id === selected.detectorId)
            : undefined
        }
        corpusItem={
          selected
            ? corpus.find((c) => c.id === selected.inputId)
            : undefined
        }
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

function CellSquare({
  cell,
  status,
  isSelected,
  onClick,
}: {
  cell: MatrixCell | undefined;
  status: CellStatus | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  const base =
    "h-7 w-full min-w-[32px] rounded-[6px] border transition-all";
  const focus = isSelected
    ? "ring-2 ring-aqua-300 ring-offset-2 ring-offset-forest-900"
    : "";
  if (!cell || !status) {
    return (
      <div className={`${base} border-white/10 bg-black/20 ${focus}`} />
    );
  }
  const { bg, border, title } = styleFor(status, cell);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`${base} ${bg} ${border} ${focus} cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] hover:-translate-y-px hover:scale-[1.15] hover:brightness-125 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.5)] active:translate-y-0`}
    />
  );
}

function styleFor(
  status: CellStatus,
  cell: MatrixCell,
): { bg: string; border: string; title: string } {
  const conf = cell.postAttackConfidence.toFixed(2);
  switch (status) {
    case "survived":
      return {
        bg: "bg-[linear-gradient(180deg,#34d399_0%,#10b981_50%,#047857_100%)]",
        border: "border-phosphor/60",
        title: `Click for details · Label still detectable (confidence ${conf})`,
      };
    case "lost":
      return {
        bg: "bg-[linear-gradient(180deg,#f87171_0%,#dc2626_55%,#7f1d1d_100%)]",
        border: "border-error/60",
        title: `Click for details · Label destroyed by the attack (confidence ${conf})`,
      };
    case "excluded-error":
      return {
        bg: "bg-[repeating-linear-gradient(-45deg,rgba(217,119,6,0.55)_0_4px,rgba(120,53,15,0.3)_4px_8px)]",
        border: "border-warn/60",
        title: `Click for details · Attack failed to run on this file type`,
      };
    case "excluded-absent":
      return {
        bg: "bg-white/5",
        border: "border-white/10",
        title: `Click for details · This file never had this label to begin with, so the test doesn't apply`,
      };
  }
}

function Legend() {
  const item = (
    className: string,
    title: string,
    sub: string,
  ) => (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-[3px] inline-block h-3.5 w-3.5 shrink-0 rounded-[4px] border border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] ${className}`}
      />
      <div className="text-[11.5px] leading-tight">
        <div className="font-medium text-ink-100">{title}</div>
        <div className="mt-0.5 text-ink-200/70">{sub}</div>
      </div>
    </div>
  );
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-4">
      {item(
        "bg-[linear-gradient(180deg,#34d399_0%,#10b981_50%,#047857_100%)]",
        "Survived",
        "Label still detectable",
      )}
      {item(
        "bg-[linear-gradient(180deg,#f87171_0%,#dc2626_55%,#7f1d1d_100%)]",
        "Destroyed",
        "Label erased by the attack",
      )}
      {item(
        "bg-[repeating-linear-gradient(-45deg,rgba(217,119,6,0.55)_0_4px,rgba(120,53,15,0.3)_4px_8px)]",
        "Not testable",
        "Attack didn't apply to this file",
      )}
      {item(
        "bg-white/5",
        "Not applicable",
        "File never had this label",
      )}
    </div>
  );
}

function friendlyDetectorLabel(id: string): string {
  switch (id) {
    case "detector.c2pa":
      return "C2PA (signed)";
    case "detector.xmp-dst":
      return "IPTC XMP (unsigned)";
    default:
      return id;
  }
}

function friendlyAttackLabel(id: string): string {
  switch (id) {
    case "reencode.h264.crf23":
      return "Re-encode (H.264)";
    case "platform-sim.youtube.1080p":
      return "YouTube upload sim";
    case "abr-ladder.hls-default":
      return "HLS streaming sim";
    case "container.strip.c2pa":
      return "Strip C2PA";
    case "container.strip.xmp":
      return "Strip XMP";
    default:
      return id;
  }
}
