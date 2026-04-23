import Link from "next/link";
import { Sparkle } from "./Sparkle";

/**
 * Primary navigation between the two sibling auditors.
 *
 * Y2K-poster treatment: uppercase letterspaced labels, chrome-blue
 * sparkle accents the active tab, muted glass pill for the
 * inactive one. Cleaner visual than the earlier two-line "title
 * + subtitle" pills — this version reads as a single row of
 * typography, which is what a top nav should feel like.
 */
export type NavKey = "validator" | "robustness";

export function NavTabs({ active }: { active: NavKey }) {
  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-5 text-[12.5px] tracking-[0.14em] uppercase"
    >
      <TabLink href="/" label="Validator" isActive={active === "validator"} />
      <span
        aria-hidden="true"
        className="h-3 w-px bg-white/18"
      />
      <TabLink
        href="/robustness"
        label="Robustness"
        isActive={active === "robustness"}
      />
    </nav>
  );
}

function TabLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  if (isActive) {
    return (
      <span
        aria-current="page"
        className="relative inline-flex items-center gap-2 font-semibold text-white"
      >
        <Sparkle size="sm" />
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1.5 left-6 right-0 h-px bg-gradient-to-r from-aqua-200 via-blue-400 to-transparent"
        />
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-medium text-ink-100/65 transition-colors hover:text-white"
    >
      <span>{label}</span>
    </Link>
  );
}
