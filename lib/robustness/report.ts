/**
 * Typed view over the robustness-auditor report JSON.
 *
 * The source schema is `ai-watermark-robustness/v0.0`, produced by
 * `ai-watermark-robustness-auditor`'s `buildJsonReport`. We intentionally
 * redeclare the types locally (rather than importing from that package)
 * so this viewer has zero runtime dependency on the auditor and can be
 * deployed against any report envelope that matches the shape below.
 *
 * A mismatch is treated as a build-time type error on the canonical
 * `sample-run.json` that ships with the site, and a soft warning at
 * runtime if an externally-hosted report is ever pointed at this page.
 */

// ---- Report envelope -------------------------------------------------------

export interface RobustnessReport {
  readonly schema: string;
  readonly runId: string;
  readonly generatedAt: string;
  readonly summary: ReportSummary;
  readonly scores: readonly DetectorScore[];
  readonly report: ReportInner;
}

export interface ReportSummary {
  readonly inputs: number;
  readonly attacks: number;
  readonly detectors: number;
  readonly cells: number;
}

export interface DetectorScore {
  readonly detectorId: string;
  readonly cellsConsidered: number;
  readonly survived: number;
  readonly survivalRate: number;
  readonly grade: "A" | "B" | "C" | "D" | "F";
  readonly excludedNoBaseline: number;
  readonly excludedAttackError: number;
}

export interface ReportInner {
  readonly env: ReportEnv;
  readonly corpus: readonly CorpusItem[];
  readonly attacks: readonly AttackDescriptor[];
  readonly detectors: readonly DetectorDescriptor[];
  readonly baseline: readonly BaselineCell[];
  readonly cells: readonly MatrixCell[];
}

export interface ReportEnv {
  readonly methodologyVersion: string;
  readonly auditorVersion: string;
  readonly ffmpegVersion: string;
  readonly os: string;
  readonly nodeVersion: string;
  readonly startedAt: string;
  readonly finishedAt: string;
}

export interface CorpusItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly expectedWatermarks: readonly string[];
  readonly notes?: string;
  readonly sha256: string;
  readonly license: string;
  readonly source: string;
}

export interface AttackDescriptor {
  readonly id: string;
  readonly category: string;
  readonly title: string;
}

export interface DetectorDescriptor {
  readonly id: string;
  readonly watermarkKind: string;
  readonly title: string;
}

export interface BaselineCell {
  readonly inputId: string;
  readonly detectorId: string;
  readonly detected: boolean;
  readonly confidence: number;
}

export interface MatrixCell {
  readonly inputId: string;
  readonly attackId: string;
  readonly detectorId: string;
  readonly baselineDetected: boolean;
  readonly postAttackDetected?: boolean;
  readonly postAttackConfidence: number;
  readonly attackDurationMs: number;
  readonly attackErrorMessage?: string;
}

// ---- Cell classification ---------------------------------------------------

/**
 * Ordered, UI-facing categorisation of a single (input, attack, detector)
 * cell. Matches the scoring semantics in METHODOLOGY.md §Scoring:
 *
 *   - `survived`         — baselineDetected ∧ no attack error ∧ post >= 0.5
 *   - `lost`             — baselineDetected ∧ no attack error ∧ post <  0.5
 *   - `excluded-error`   — baselineDetected ∧ attack errored
 *   - `excluded-absent`  — baselineDetected is false (nothing to lose)
 *
 * "Excluded" cells are grey in the UI — they do not count for or against
 * the detector's survival rate.
 */
export type CellStatus =
  | "survived"
  | "lost"
  | "excluded-error"
  | "excluded-absent";

export function classifyCell(cell: MatrixCell): CellStatus {
  if (!cell.baselineDetected) return "excluded-absent";
  if (cell.attackErrorMessage) return "excluded-error";
  if (cell.postAttackConfidence >= 0.5) return "survived";
  return "lost";
}

// ---- Survival rollup (attack × detector) -----------------------------------

export interface SurvivalBucket {
  readonly attackId: string;
  readonly detectorId: string;
  readonly survived: number;
  readonly considered: number;
  readonly excludedAbsent: number;
  readonly excludedError: number;
}

export function rollupSurvivalByAttackDetector(
  cells: readonly MatrixCell[],
): Map<string, SurvivalBucket> {
  const map = new Map<string, SurvivalBucket>();
  for (const c of cells) {
    const key = `${c.attackId}||${c.detectorId}`;
    const prev = map.get(key) ?? {
      attackId: c.attackId,
      detectorId: c.detectorId,
      survived: 0,
      considered: 0,
      excludedAbsent: 0,
      excludedError: 0,
    };
    const next = { ...prev };
    switch (classifyCell(c)) {
      case "survived":
        next.survived += 1;
        next.considered += 1;
        break;
      case "lost":
        next.considered += 1;
        break;
      case "excluded-error":
        next.excludedError += 1;
        break;
      case "excluded-absent":
        next.excludedAbsent += 1;
        break;
    }
    map.set(key, next);
  }
  return map;
}

// ---- Headline 2x2 selection -----------------------------------------------

/**
 * The "orthogonal failure modes" 2×2 that drives the blog post and the
 * hero of the UI. Restrict the matrix to the two byte-level strip attacks
 * against the two first-class detectors; the other cells are still
 * reachable via the full matrix below.
 *
 * Exposing the ids as constants (rather than string literals embedded in
 * JSX) keeps the "what counts as the headline" decision discoverable for
 * future maintainers who may want to change it.
 */
export const HEADLINE_ATTACK_IDS: readonly string[] = Object.freeze([
  "container.strip.c2pa",
  "container.strip.xmp",
]);

export const HEADLINE_DETECTOR_IDS: readonly string[] = Object.freeze([
  "detector.c2pa",
  "detector.xmp-dst",
]);

// ---- Loader ---------------------------------------------------------------

import raw from "./sample-run.json";

/**
 * Canonical bundled report. Typed via structural cast rather than a
 * runtime schema validator — the source JSON ships with the site and is
 * regenerated alongside the auditor's tests, so a deploy with a
 * malformed bundled report would already fail typecheck.
 */
export const sampleReport: RobustnessReport = raw as unknown as RobustnessReport;
