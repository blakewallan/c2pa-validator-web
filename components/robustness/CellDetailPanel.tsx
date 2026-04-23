"use client";

import { useEffect } from "react";
import { ConfidenceGauge } from "./ConfidenceGauge";
import {
  classifyCell,
  type AttackDescriptor,
  type CorpusItem,
  type DetectorDescriptor,
  type MatrixCell,
} from "@/lib/robustness/report";

/**
 * Slide-out detail panel for a single (input × attack × detector) cell.
 *
 * Renders as a fixed right-side drawer so it never disrupts the matrix
 * layout. ESC and backdrop click both close it; scrolling the matrix
 * underneath is preserved so users can browse without dismissing state.
 */
export function CellDetailPanel({
  cell,
  attack,
  detector,
  corpusItem,
  onClose,
}: {
  cell: MatrixCell | null;
  attack?: AttackDescriptor;
  detector?: DetectorDescriptor;
  corpusItem?: CorpusItem;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!cell) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cell, onClose]);

  if (!cell) return null;

  const status = classifyCell(cell);
  const statusLabel = statusCopy(status);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-label="Cell details"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/15 bg-[linear-gradient(180deg,rgba(4,61,40,0.98)_0%,rgba(2,31,20,0.98)_100%)] p-6 shadow-aero backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.22em] text-aqua-200/80">
              Cell
            </div>
            <h3 className="mt-1 font-display text-lg font-semibold text-white">
              {statusLabel.title}
            </h3>
            <p className="mt-1 text-[12px] text-ink-200/80">
              {statusLabel.body}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="aero-pill shrink-0 cursor-pointer hover:scale-[1.02]"
          >
            <span className="opacity-60">esc</span>
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 text-[12.5px]">
          <Field label="Input" value={corpusItem?.label ?? cell.inputId}>
            <div className="mt-0.5 font-mono text-[11px] text-ink-200/75">
              {cell.inputId}
            </div>
            {corpusItem?.notes ? (
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-200/70">
                {corpusItem.notes}
              </p>
            ) : null}
          </Field>

          <Field label="Attack" value={attack?.title ?? cell.attackId}>
            <div className="mt-0.5 font-mono text-[11px] text-aqua-200">
              {cell.attackId}
            </div>
          </Field>

          <Field label="Detector" value={detector?.title ?? cell.detectorId}>
            <div className="mt-0.5 font-mono text-[11px] text-aqua-200">
              {cell.detectorId}
            </div>
          </Field>
        </dl>

        <div className="mt-6 rounded-xl border border-white/12 bg-black/25 p-4">
          <ConfidenceGauge
            value={cell.postAttackConfidence}
            label="Post-attack confidence"
          />
          <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]">
            <StatBadge
              label="Baseline"
              value={cell.baselineDetected ? "detected" : "absent"}
              tone={cell.baselineDetected ? "good" : "mute"}
            />
            <StatBadge
              label="Post-attack"
              value={
                cell.postAttackDetected
                  ? "detected"
                  : cell.attackErrorMessage
                    ? "n/a"
                    : "destroyed"
              }
              tone={
                cell.postAttackDetected
                  ? "good"
                  : cell.attackErrorMessage
                    ? "warn"
                    : "bad"
              }
            />
            <StatBadge
              label="Attack time"
              value={`${cell.attackDurationMs} ms`}
              tone="mute"
            />
            <StatBadge
              label="Survival"
              value={status === "survived" ? "yes" : status === "lost" ? "no" : "—"}
              tone={
                status === "survived"
                  ? "good"
                  : status === "lost"
                    ? "bad"
                    : "mute"
              }
            />
          </div>
        </div>

        {cell.attackErrorMessage ? (
          <div className="mt-4 rounded-lg border border-warn/40 bg-warn/10 p-3 text-[11.5px] leading-relaxed text-warn-soft">
            <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wider">
              Attack error
            </div>
            <code className="whitespace-pre-wrap break-words font-mono">
              {cell.attackErrorMessage}
            </code>
          </div>
        ) : null}

        {corpusItem ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-[11px]">
            <div className="mb-1 font-mono uppercase tracking-wider text-ink-200/70">
              Provenance
            </div>
            <dl className="space-y-1 text-ink-100/90">
              <RowKV k="sha256" v={corpusItem.sha256} mono />
              <RowKV k="license" v={corpusItem.license} />
              <RowKV
                k="expected"
                v={corpusItem.expectedWatermarks.join(", ") || "—"}
              />
              <RowKV k="source" v={corpusItem.source} link />
            </dl>
          </div>
        ) : null}
      </aside>
    </>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-200/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-white">{value}</dd>
      {children}
    </div>
  );
}

function StatBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "warn" | "mute";
}) {
  const tones = {
    good: "border-phosphor/40 bg-phosphor/10 text-phosphor",
    bad: "border-error/40 bg-error/10 text-error",
    warn: "border-warn/40 bg-warn/10 text-warn",
    mute: "border-white/15 bg-white/5 text-ink-100/85",
  } as const;
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 ${tones[tone]} flex items-baseline justify-between`}
    >
      <span className="text-[10px] uppercase tracking-wider opacity-80">
        {label}
      </span>
      <span className="font-mono text-[11.5px] tabular-nums">{value}</span>
    </div>
  );
}

function RowKV({
  k,
  v,
  mono,
  link,
}: {
  k: string;
  v: string;
  mono?: boolean;
  link?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-200/60">
        {k}
      </span>
      {link ? (
        <a
          href={v}
          target="_blank"
          rel="noreferrer noopener"
          className={`truncate text-aqua-200 hover:text-aqua-100 underline decoration-aqua-200/30 underline-offset-2 ${
            mono ? "font-mono" : ""
          }`}
          title={v}
        >
          {v}
        </a>
      ) : (
        <span
          className={`truncate ${mono ? "font-mono" : ""}`}
          title={v}
        >
          {v}
        </span>
      )}
    </div>
  );
}

function statusCopy(status: ReturnType<typeof classifyCell>): {
  title: string;
  body: string;
} {
  switch (status) {
    case "survived":
      return {
        title: "Disclosure survived",
        body: "Post-attack confidence meets the 0.5 survival threshold. The detector still reads a disclosure signal on the attacked output.",
      };
    case "lost":
      return {
        title: "Disclosure destroyed",
        body: "Post-attack confidence falls below the 0.5 threshold. The attack eliminated every detectable trace of the disclosure.",
      };
    case "excluded-error":
      return {
        title: "Excluded — attack errored",
        body: "The attack failed to apply to this input. The cell is excluded from the denominator; a failed attack is not evidence about the watermark's robustness.",
      };
    case "excluded-absent":
      return {
        title: "Excluded — no baseline",
        body: "The detector did not find a disclosure on the baseline input, so there was nothing to attack. Cell is excluded from the denominator.",
      };
  }
}
