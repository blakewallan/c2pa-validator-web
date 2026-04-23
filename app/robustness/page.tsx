import Link from "next/link";
import { OrthogonalHeadline } from "@/components/robustness/OrthogonalHeadline";
import { ScoresStrip } from "@/components/robustness/ScoresStrip";
import { FullMatrix } from "@/components/robustness/FullMatrix";
import { sampleReport } from "@/lib/robustness/report";
import { NavTabs } from "@/components/NavTabs";
import { Sparkle } from "@/components/Sparkle";

export const metadata = {
  title: "robustness auditor // does AI-disclosure survive the internet?",
  description:
    "Interactive report: do C2PA and IPTC XMP disclosure survive re-encoding, platform transcoding, and targeted strip attacks?",
};

export default function RobustnessPage() {
  const { runId, generatedAt, summary, scores, report } = sampleReport;
  const { env, corpus, attacks, detectors, cells } = report;

  const runDate = new Date(generatedAt);
  const runYear = runDate.getUTCFullYear();

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 grid-bg" />

      <TopBar />

      <header className="mx-auto max-w-6xl px-6 pt-12 pb-10">
        <h1 className="chrome-blue font-display text-[64px] font-extrabold leading-[0.88] tracking-tight sm:text-[88px] md:text-[104px]">
          ROBUST<span className="inline-block -mx-[0.08em]">·</span>NESS
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <Sparkle size="sm" />
          <span className="eyebrow-mono text-aqua-200">
            Sample run &middot;{" "}
            {runDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <p className="mt-8 max-w-3xl text-[16px] leading-[1.65] text-ink-100/90">
          EU AI Act Article 50(2) requires AI-generated content to carry a
          disclosure that is <em>robust</em>. We ran the two standards the
          industry uses &mdash; cryptographically-signed C2PA manifests and
          unsigned IPTC XMP tags &mdash; through re-encoding, platform
          transcoding, and two targeted strip attacks. This page shows what
          survived, for every file and every attack.
        </p>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-24">
        <OrthogonalHeadline
          cells={cells}
          attacks={attacks}
          detectors={detectors}
        />

        <section>
          <SectionHeader
            eyebrow="Overall survival"
            title="Per-detector grades across the full battery"
            blurb="Share of applicable test cases where the label was still detectable after each attack. Letter grades bucket ≥90% A, ≥75% B, ≥50% C, ≥25% D, else F."
          />
          <ScoresStrip scores={scores} detectors={detectors} />
        </section>

        <FullMatrix
          cells={cells}
          attacks={attacks}
          detectors={detectors}
          corpus={corpus}
        />

        <Glossary />

        <section className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/6 p-5 shadow-aero-sm backdrop-blur-xl sm:p-6">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
            <AttackThumbStrip attacks={attacks} />

            <div
              aria-hidden="true"
              className="outline-num font-display text-[96px] font-extrabold leading-none tabular-nums sm:text-[132px]"
            >
              {runYear}
            </div>

            <a
              href="/reports/sample-run.json"
              download
              className="aero-btn justify-self-start md:justify-self-end"
            >
              Download report (JSON)
            </a>
          </div>

          <div className="chrome-rule mt-6" />

          <dl className="mt-5 grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-3">
            <EnvRow
              k="Battery"
              v={`${summary.inputs} files × ${summary.attacks} attacks = ${summary.cells} cells`}
            />
            <EnvRow
              k="Wall time"
              v={`${Math.round(
                (new Date(env.finishedAt).getTime() -
                  new Date(env.startedAt).getTime()) /
                  1000,
              )} s`}
            />
            <EnvRow k="Auditor" v={`v${env.auditorVersion}`} />
            <EnvRow
              k="ffmpeg"
              v={env.ffmpegVersion
                .replace(/\s+Copyright.*$/, "")
                .replace(/^ffmpeg version\s*/, "")}
            />
            <EnvRow k="Methodology" v={env.methodologyVersion} />
            <EnvRow k="Run" v={runId} />
          </dl>
        </section>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11.5px] text-ink-200/70">
          <span>
            Sibling of{" "}
            <Link
              href="/"
              className="text-ink-100 underline decoration-aqua-200/40 hover:decoration-aqua-200"
            >
              c2pa-manifest-validator
            </Link>
          </span>
          <a
            href="https://github.com/blakewallan/ai-watermark-robustness-auditor"
            className="text-ink-100 underline decoration-aqua-200/40 hover:decoration-aqua-200"
          >
            Source on GitHub
          </a>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Sparkle size="sm" />
        <span className="eyebrow-mono text-aqua-200">{eyebrow}</span>
      </div>
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      {blurb ? (
        <p className="mt-1 max-w-2xl text-[13px] text-ink-200/85">{blurb}</p>
      ) : null}
    </div>
  );
}

function AttackThumbStrip({
  attacks,
}: {
  attacks: readonly { id: string; title: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      {attacks.slice(0, 5).map((a) => (
        <div
          key={a.id}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/20 bg-[linear-gradient(180deg,rgba(147,197,253,0.18)_0%,rgba(29,78,216,0.18)_100%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_2px_6px_rgba(0,0,0,0.35)]"
          title={a.title}
        >
          <AttackIcon id={a.id} />
        </div>
      ))}
    </div>
  );
}

function AttackIcon({ id }: { id: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "rgba(219, 234, 254, 0.95)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "reencode.h264.crf23":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="6" width="16" height="12" rx="1.5" />
          <path d="M4 10h16M8 6v12M16 6v12" />
        </svg>
      );
    case "platform-sim.youtube.1080p":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <polygon
            points="10.5,9.5 15,12 10.5,14.5"
            fill="rgba(219,234,254,0.95)"
            stroke="none"
          />
        </svg>
      );
    case "abr-ladder.hls-default":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 18h4v-3M10 18h4v-6M16 18h4v-9" />
          <path d="M4 18h16" />
        </svg>
      );
    case "container.strip.c2pa":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 5l14 14M5 19L19 5" />
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
        </svg>
      );
    case "container.strip.xmp":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 8l8 8M12 8l-8 8" />
          <path d="M15 5l5 5-5 5M20 10h-8" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

function Glossary() {
  const terms: { term: string; def: React.ReactNode }[] = [
    {
      term: "C2PA",
      def: (
        <>
          A signed, cryptographic standard for content provenance backed by
          Adobe, Microsoft, Meta, OpenAI, the BBC, and the NYT. The digital
          equivalent of a notarised certificate attached to the file.
        </>
      ),
    },
    {
      term: "IPTC XMP DigitalSourceType",
      def: (
        <>
          An older, unsigned metadata tag that flags a file as
          algorithmically generated. Easy to add, easy to strip.
        </>
      ),
    },
    {
      term: "Hard-binding hash",
      def: (
        <>
          The cryptographic seal on a C2PA manifest that proves the bytes of
          the file haven&rsquo;t been altered since signing. If a byte
          changes, the seal breaks.
        </>
      ),
    },
    {
      term: "Re-encoding",
      def: (
        <>
          Reprocessing a video or image &mdash; for example, when a platform
          compresses an upload to save bandwidth. Happens to almost every
          file that touches the internet.
        </>
      ),
    },
    {
      term: "Container strip",
      def: (
        <>
          A surgical edit that removes a specific piece of metadata from a
          file while leaving the picture or audio intact. Anyone with
          ffmpeg or a hex editor can do it in seconds.
        </>
      ),
    },
    {
      term: "Survival threshold",
      def: (
        <>
          The confidence level at which a label counts as &ldquo;still
          present.&rdquo; 0.5 on a 0-to-1 scale; the standard midpoint in
          provenance research.
        </>
      ),
    },
    {
      term: "Excluded cell",
      def: (
        <>
          A test case that doesn&rsquo;t count for or against the score
          &mdash; either the file never had the label to begin with, or the
          attack itself failed to run. Grey tiles in the matrix.
        </>
      ),
    },
  ];
  return (
    <details className="group rounded-2xl border border-white/15 bg-white/6 p-5 shadow-aero-sm backdrop-blur-xl">
      <summary className="cursor-pointer select-none list-none">
        <div className="flex items-center gap-2">
          <Sparkle size="sm" />
          <span className="eyebrow-mono text-aqua-200">Glossary</span>
          <span className="ml-auto text-[11.5px] text-ink-200/65 group-open:hidden">
            click to expand
          </span>
          <span className="ml-auto hidden text-[11.5px] text-ink-200/65 group-open:inline">
            click to collapse
          </span>
        </div>
      </summary>
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {terms.map((t) => (
          <div key={t.term}>
            <dt className="font-semibold text-white">{t.term}</dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-ink-100/85">
              {t.def}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function EnvRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
      <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-aqua-200/80">
        {k}
      </span>
      <span className="truncate font-mono text-ink-100/95" title={v}>
        {v}
      </span>
    </div>
  );
}

function TopBar() {
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link
          href="/"
          className="flex items-baseline gap-2.5 text-[12.5px] text-ink-100 transition-opacity hover:opacity-90"
        >
          <Sparkle size="sm" className="self-center" />
          <span className="chrome-blue font-display text-[15px] font-extrabold tracking-[0.02em]">
            AUDIT&middot;CO
          </span>
        </Link>
        <NavTabs active="robustness" />
        <span aria-hidden="true" className="w-[86px]" />
      </div>
    </div>
  );
}
