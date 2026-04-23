/**
 * Glossy horizontal confidence gauge, 0..1.
 *
 * Green → amber → red, tuned around the 0.5 survival threshold from the
 * auditor's methodology. Intentionally analogue-looking rather than a
 * hard binary, because the "present-but-broken" 0.5 state is one of the
 * most interesting findings and needs its own visual real-estate
 * (the needle sits exactly on the edge of the green zone).
 */
export function ConfidenceGauge({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = `${(clamped * 100).toFixed(0)}%`;
  return (
    <div className="w-full">
      {label ? (
        <div className="mb-1 flex items-baseline justify-between text-[11px] text-ink-200/80">
          <span className="uppercase tracking-wider">{label}</span>
          <span className="font-mono tabular-nums text-ink-100">{pct}</span>
        </div>
      ) : null}
      <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/15 bg-black/30">
        {/* coloured track — fixed gradient; a scaled mask reveals the
            portion up to `value`. Keeps the gradient stops meaningful
            regardless of needle position. */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: pct,
            background:
              "linear-gradient(90deg, #dc2626 0%, #d97706 45%, #10b981 55%, #34d399 100%)",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.4)",
          }}
        />
        {/* 0.5 threshold tick — the survival line */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0"
          style={{
            left: "50%",
            width: 1,
            background: "rgba(255,255,255,0.55)",
          }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-200/50">
        <span>0.0</span>
        <span>0.5 · survival threshold</span>
        <span>1.0</span>
      </div>
    </div>
  );
}
