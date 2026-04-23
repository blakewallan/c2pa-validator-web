import Link from "next/link";
import { ValidatorForm } from "@/components/ValidatorForm";
import { SAMPLE_URLS } from "@/lib/samples";
import { NavTabs } from "@/components/NavTabs";
import { Sparkle } from "@/components/Sparkle";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 grid-bg" />

      <TopBar />

      <header className="mx-auto max-w-5xl px-6 pt-12 pb-10">
        <div className="flex items-center gap-3">
          <span className="aero-pill">
            <span className="aero-led green pulse" />
            <span className="font-medium tracking-wide">
              c2pa-manifest-validator
            </span>
            <span className="opacity-40">·</span>
            <span className="opacity-80">v0.8</span>
          </span>
          <span className="aero-pill">
            <span className="opacity-70">build</span>
            <span className="opacity-40">·</span>
            <span className="text-aqua-200">frutiger-aero</span>
          </span>
        </div>

        <h1 className="mt-7 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-[56px]">
          Is this video{" "}
          <span className="bg-gradient-to-br from-aqua-200 via-aqua-300 to-phosphor bg-clip-text italic text-transparent">
            actually disclosed
          </span>{" "}
          as AI-generated?
        </h1>

        <p className="mt-5 max-w-2xl text-[16px] leading-[1.65] text-ink-100/90">
          Drop a video file or paste a TikTok or YouTube URL. We parse
          the content credentials with the Content Authenticity
          Initiative's Rust reference implementation, verify the
          signature, fuse in IPTC XMP and platform-caption signals, and
          grade the whole thing against EU AI Act Article 50 and
          California SB-942 &mdash; so you see a regulation-level pass
          or fail, not a pile of rule outputs.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-200/70">
          <span className="uppercase tracking-[0.18em] text-aqua-200/80">
            Stack
          </span>
          <span className="opacity-40">&#8226;</span>
          <span className="font-mono">@contentauth/c2pa-node</span>
          <span className="opacity-40">&#8226;</span>
          <span className="font-mono">COSE_Sign1</span>
          <span className="opacity-40">&#8226;</span>
          <span className="font-mono">C2PA 2.3</span>
          <span className="opacity-40">&#8226;</span>
          <span className="font-mono">EU AI Act Art. 50</span>
          <span className="opacity-40">&#8226;</span>
          <span className="font-mono">Cal. SB-942</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <ValidatorForm samples={SAMPLE_URLS} />

        <section className="mt-16 grid gap-5 sm:grid-cols-3">
          <Fact
            number="01"
            title="Provenance, not detection"
            body="Validates cryptographically-signed disclosure standards (C2PA, IPTC digital_source_type). Does not run a perceptual deepfake classifier."
          />
          <Fact
            number="02"
            title="CAI-backed parsing"
            body="Native Rust bindings to c2pa-rs — full format + signature coverage across MP4, MOV, JPEG, PNG, WebM, and HEIF."
          />
          <Fact
            number="03"
            title="Regulation-grade output"
            body="EU AI Act Art. 50(2), Art. 50(4), and California SB-942 verdicts rendered as pass / fail / unknown with the evidence that drove each verdict."
          />
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-200/70">
            <span>
              Built on{" "}
              <span className="font-medium text-ink-100">
                c2pa-manifest-validator
              </span>
            </span>
            <span className="font-mono tracking-wide">
              EU AI Act · 50(2) + 50(4) &nbsp;·&nbsp; Cal SB-942
              &nbsp;·&nbsp; C2PA 2.3
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3">
        <Link
          href="/"
          className="flex items-baseline gap-2.5 text-[12.5px] text-ink-100 transition-opacity hover:opacity-90"
        >
          <Sparkle size="sm" className="self-center" />
          <span className="chrome-blue font-display text-[15px] font-extrabold tracking-[0.02em]">
            AUDIT&middot;CO
          </span>
        </Link>
        <NavTabs active="validator" />
        <span aria-hidden="true" className="w-[86px]" />
      </div>
    </div>
  );
}

/**
 * Three translucent info cards. Large numeric ordinal on the left is
 * straight out of 2006 product-page pattern language (iPod nano /
 * iTunes feature grid). Frosted glass panel with soft aqua glow.
 */
function Fact({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/8 p-5 shadow-aero-sm backdrop-blur-xl backdrop-saturate-150">
      {/* top specular sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent"
      />
      <div className="relative">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-light tabular-nums text-aqua-200/80">
            {number}
          </span>
          <h3 className="text-[14px] font-semibold tracking-wide text-white">
            {title}
          </h3>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-100/85">
          {body}
        </p>
      </div>
    </div>
  );
}

