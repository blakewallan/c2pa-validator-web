/**
 * Four-pointed chrome-blue sparkle, Y2K poster style. Pure CSS
 * via globals — this component is just a JSX convenience for
 * inlining the motif next to headings or eyebrow labels.
 *
 * Sized in em so it inherits from the surrounding text block.
 */
export function Sparkle({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "sparkle sm" : size === "lg" ? "sparkle lg" : "sparkle";
  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} ${className}`}
    />
  );
}
