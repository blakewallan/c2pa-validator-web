/**
 * Rotated crimson rubber stamp — the rhetorical device at the
 * heart of the "committee of affairs" framing. Carries a top
 * slogan in bold caps (FILED, EXHIBIT A, UNDER REVIEW), a mid
 * file number, and an optional date. Rotated slightly off-axis
 * like it was pressed by an indifferent clerk.
 *
 * The stamp is absolutely positioned by the caller. It is
 * decorative only — all copy surfaced here is also present in
 * the readable body text, so a screen reader ignoring it loses
 * no information. `aria-hidden` on the root reflects that.
 */
export function BureauStamp({
  label,
  fileNo,
  date,
  rotate = -7,
  className = "",
}: {
  label: string;
  fileNo?: string;
  date?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`stamp ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span className="text-[22px] leading-none">{label}</span>
      {(fileNo || date) && (
        <span className="mt-1 text-[9px] font-semibold tracking-[0.28em] opacity-85">
          {fileNo ? `№ ${fileNo}` : ""}
          {fileNo && date ? " · " : ""}
          {date ?? ""}
        </span>
      )}
    </div>
  );
}
