import Link from "next/link";
import { OrthogonalHeadline } from "@/components/robustness/OrthogonalHeadline";
import { ScoresStrip } from "@/components/robustness/ScoresStrip";
import { FullMatrix } from "@/components/robustness/FullMatrix";
import { sampleReport } from "@/lib/robustness/report";
import { NavTabs } from "@/components/NavTabs";
import { Sparkle } from "@/components/Sparkle";
import { BureauStamp } from "@/components/BureauStamp";

export const metadata = {
  title:
    "robustness auditor // does AI-disclosure actually survive the internet?",
  description:
    "Interactive explorer for the robustness auditor. Measures whether C2PA and IPTC XMP disclosure survive the kinds of transformations every platform pipeline applies every day.",
};

export default function RobustnessPage() {
  const { runId, generatedAt, summary, scores, report } = sampleReport;
  const { env, corpus, attacks, detectors, cells } = report;

  const runDate = new Date(generatedAt);
  const runDateShort = runDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const runYear = runDate.getUTCFullYear();

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 grid-bg" />

      <TopBar runYear={runYear} />

      {/*
        Hero — asymmetric poster layout with a Lynchian-committee
        overlay. Left column: a small uppercase manifesto-style
        setup block, plus the bureau dossier mark (file number,
        date filed, classification). Right column: the chrome-blue
        ROBUST·NESS masthead with a crimson FILED rubber stamp
        pressed into the corner. A typewriter MEMORANDUM block
        sits under the intro — deadpan official, slightly wrong.
      */}
      <header className="mx-auto max-w-6xl px-6 pt-12 pb-10">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-10">
          <div className="max-w-sm">
            <div className="eyebrow-mono text-ink-100/90">
              The following has been filed for the record. It is not a
              vendor claim. It is a measurement. Re-run the procedure on
              a clean clone of the repository and the committee will
              return the same numbers, byte-for-byte.
            </div>
            <div className="chrome-rule mt-4" />
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="folio">
                File &mdash; <span className="crimson">№ 0024-R</span>
              </span>
              <span className="folio">
                Session &mdash; s.{runYear}
              </span>
              <span className="folio">
                Filed &mdash; {runDateShort}
              </span>
              <span className="folio">
                Jurisdiction &mdash; EU AI Act 50(2)
              </span>
            </div>
          </div>

          <div className="relative md:text-right">
            <h1 className="chrome-blue font-display text-[64px] font-extrabold leading-[0.88] tracking-tight sm:text-[96px] md:text-[120px]">
              ROBUST
              <span className="inline-block -mx-[0.08em]">·</span>NESS
            </h1>
            <div className="mt-2 flex items-center gap-2 md:justify-end">
              <Sparkle size="sm" />
              <span className="eyebrow-mono text-ink-100/85">
                Dossier &middot; Committee of Provenance Affairs
              </span>
              <Sparkle size="sm" />
            </div>

            {/*
              The FILED stamp. Pressed over the top-right of the
              wordmark, rotated, crimson. Intentionally the only
              red on the page — reads as "this matter has been
              officially noted" rather than as a theme colour.
            */}
            <div className="pointer-events-none absolute -top-3 right-0 md:-top-4 md:-right-2">
              <BureauStamp
                label="FILED"
                fileNo="0024-R"
                date={runDateShort}
                rotate={-8}
              />
            </div>
          </div>
        </div>

        <p className="mt-10 max-w-3xl text-[17px] leading-[1.65] text-ink-100/90">
          Regulators now require AI-generated images and video to be
          labelled in a way that actually holds up in the real world. We
          ran the two labelling standards the industry uses &mdash; one
          signed and cryptographic, one older and unsigned &mdash;
          through the kinds of edits that happen to every file that
          touches the internet: re-encoding, platform transcoding, and
          two deliberate tamper attempts. This page shows what survived
          and what didn&rsquo;t.
        </p>

        {/*
          Memorandum block. Monospace, ruled, committee-minutes
          tone. Says nothing the body copy doesn't already say,
          but it says it in the voice of a minor office that
          oversees a thing nobody asked for. Absurdist-functional
          by design.
        */}
        <div className="typewriter mt-8 max-w-3xl rounded-r-sm">
          <strong>Memorandum</strong>
          &nbsp;&middot;&nbsp;for the record
          <br />
          The committee has determined that files do not survive
          transit. Members are directed to review the enclosed exhibits
          and to note, with some regret, that two labels are not the
          same as two defences. The findings are binding within the
          four corners of this document.
        </div>
      </header>

      {/*
        "How to read this page" — plain onboarding card, kept simple.
        Chrome-blue sparkle replaces the old eyebrow dot.
      */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="rounded-2xl border border-aqua-300/25 bg-aqua-500/5 p-5 shadow-aero-sm backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sparkle size="sm" />
            <span className="eyebrow-mono text-aqua-200">
              Proceedings &middot; How to read this dossier
            </span>
          </div>
          <div className="mt-3 grid gap-4 text-[13.5px] text-ink-100/90 sm:grid-cols-3">
            <Step n="01" title="Finding">
              The committee&rsquo;s central observation. Two targeted
              attacks, two labels &mdash; each attack destroys its own
              target and leaves the other untouched. Stacking the labels
              yields two separate failures, not defense-in-depth.
            </Step>
            <Step n="02" title="Schedule B">
              Survival rates across the full battery. Letter grades are
              the summary members are expected to cite in correspondence
              with regulators.
            </Step>
            <Step n="03" title="Exhibits">
              Every file &times; every attack, one coloured tile per
              result.
              <span className="ml-1 font-semibold text-aqua-200">
                Click any exhibit
              </span>{" "}
              for the confidence score, attack particulars, and file
              provenance. All entries are available for inspection.
            </Step>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-6 pb-24">
        <OrthogonalHeadline
          cells={cells}
          attacks={attacks}
          detectors={detectors}
        />

        <section>
          <SectionHeader
            eyebrow="Schedule B &middot; Survival rates as observed"
            title="How each label held up, overall"
            blurb="The percentage of test cases where the label was still detectable after the attack. Anything below a B is, in the committee's informed view, a label that cannot be relied upon alone."
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

        {/*
          Signature marquee strip — directly inspired by the BLISS
          poster's bottom strip: a row of thumbnail photo tiles, a
          giant outlined numeral (the year of the run), and a
          URL-style tagline pushing the next action. Replaces the
          earlier "Reproducibility" card-of-keys with something
          visually distinctive.
        */}
        <section className="vaio-surface relative overflow-hidden rounded-2xl border border-white/12 p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 55% 40% at 12% 100%, rgba(165,243,252,0.32) 0%, transparent 65%), radial-gradient(ellipse 50% 38% at 88% 0%, rgba(165,180,252,0.28) 0%, transparent 60%)",
            }}
          />

          <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
            <AttackThumbStrip attacks={attacks} />

            <div
              aria-hidden="true"
              className="outline-num font-display text-[96px] font-extrabold leading-none tabular-nums sm:text-[132px]"
            >
              {runYear}
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
              <div className="eyebrow-mono text-aqua-200">
                Certified by the undersigned.
                <br />
                For circulation within the record.
              </div>
              <a
                href="/reports/sample-run.json"
                download
                className="aero-btn"
              >
                Obtain the record (JSON)
              </a>
            </div>
          </div>

          <div className="chrome-rule relative mt-6" />

          <dl className="relative mt-5 grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-3">
            <EnvRow
              k="Test battery"
              v={`${summary.inputs} files × ${summary.attacks} attacks = ${summary.cells} cells`}
            />
            <EnvRow
              k="Wall time"
              v={`${Math.round(
                (new Date(env.finishedAt).getTime() -
                  new Date(env.startedAt).getTime()) /
                  1000,
              )} seconds`}
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

        <footer className="mt-4 pt-4">
          {/*
            Closing remark — single deadpan line, the committee's
            sign-off. The kind of thing you'd read on the bottom
            of a memo and not be sure whether it's a joke.
          */}
          <div className="tagline-italic text-center text-[13px] text-ink-100/80">
            &mdash; This matter has been duly filed. You may now proceed.
          </div>
          <div className="chrome-rule mt-5" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11.5px]">
            <span className="eyebrow-mono text-ink-200/75">
              <Sparkle size="sm" className="mr-1.5" />
              Sibling of{" "}
              <Link
                href="/"
                className="text-ink-100 underline decoration-aqua-200/40 hover:decoration-aqua-200"
              >
                c2pa &middot; validator
              </Link>
            </span>
            <span className="folio">
              cc: DG&nbsp;Connect &middot; File № 0024-R &middot; s.{runYear}
            </span>
          </div>
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
        <p className="mt-1 max-w-2xl text-[13px] text-ink-200/85">
          {blurb}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Thumbnail row of SVG icons, one per attack. Inspired by the
 * BLISS poster's photo thumb strip: small, square, uniformly
 * framed. Pure SVG so it stays crisp at any size and doesn't add
 * a bundle-size hit.
 */
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
          <polygon points="10.5,9.5 15,12 10.5,14.5" fill="rgba(219,234,254,0.95)" stroke="none" />
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
          A signed, cryptographic standard for content provenance — backed
          by Adobe, Microsoft, Meta, OpenAI, the BBC, and the NYT. Thinks
          of itself as the digital equivalent of a notarised certificate
          attached to the file.
        </>
      ),
    },
    {
      term: "IPTC XMP DigitalSourceType",
      def: (
        <>
          An older, unsigned metadata tag that flags a file as
          algorithmically generated. Easy to add, easy to strip, trusted
          only as a hint.
        </>
      ),
    },
    {
      term: "Hard-binding hash",
      def: (
        <>
          The cryptographic seal on a C2PA manifest that proves the bytes
          of the file haven&rsquo;t been altered since signing. If a byte
          changes, the seal breaks.
        </>
      ),
    },
    {
      term: "Re-encoding",
      def: (
        <>
          Reprocessing a video or image — for example, when a platform
          compresses an upload to save bandwidth. Every platform does this
          to almost every file.
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
          present.&rdquo; We use 0.5 on a 0-to-1 scale, which is the
          standard midpoint in provenance research.
        </>
      ),
    },
    {
      term: "Excluded cell",
      def: (
        <>
          A test case that doesn&rsquo;t count for or against the score —
          either the file never had the label to begin with, or the attack
          failed to run. Grey tiles in the matrix.
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
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Plain-English definitions
          </span>
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

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div
        aria-hidden="true"
        className="chrome-silver font-display text-[22px] font-bold tabular-nums leading-none"
      >
        {n}
      </div>
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-ink-100/80">
          {children}
        </div>
      </div>
    </div>
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

/**
 * Top bar — stripped down. Gone: the right-side StatusChip cluster
 * that showed corpus / attacks / detectors counts. Those were
 * internal audit-rig trivia, not navigation, and they crowded the
 * nav tabs. Kept: the wordmark on the left, NavTabs centred.
 */
function TopBar({ runYear }: { runYear: number }) {
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
          <span
            aria-hidden="true"
            className="tagline-italic hidden text-[11px] sm:inline"
          >
            Office of Provenance Affairs
          </span>
        </Link>
        <NavTabs active="robustness" />
        {/*
          Folio mark — a small filing tag at the right edge of the
          nav, balancing the wordmark on the left. Crimson file
          number is the one whisper of Lynchian red in the chrome.
        */}
        <div className="hidden flex-col items-end leading-tight sm:flex">
          <span className="folio">
            File <span className="crimson">№ 0024-R</span>
          </span>
          <span className="folio opacity-70">s.{runYear}</span>
        </div>
        <span aria-hidden="true" className="w-[86px] sm:hidden" />
      </div>
    </div>
  );
}
