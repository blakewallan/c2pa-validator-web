import { ValidatorForm } from "@/components/ValidatorForm";
import { SAMPLE_URLS } from "@/lib/samples";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 grid-bg" />

      <header className="mx-auto max-w-5xl px-6 pt-14 pb-10">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          c2pa-manifest-validator
          <span className="text-ink-300">/</span>
          <span className="text-ink-500">v0.1</span>
        </div>

        <h1 className="mt-5 font-serif text-4xl leading-tight tracking-tight text-ink-900 sm:text-5xl">
          Is this video{" "}
          <span className="italic text-accent">actually disclosed</span> as
          AI-generated?
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600">
          Paste a TikTok or YouTube URL. We resolve zero-auth metadata, decode
          the upload timestamp from the video ID, scan for AI hashtags and
          keywords, and optionally pull the first 1&nbsp;MB of the CDN stream to
          check for an embedded C2PA manifest. Output is a structured report
          against EU AI Act Article&nbsp;50(4) and California SB-942 signaling
          conventions.
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <ValidatorForm samples={SAMPLE_URLS} />

        <section className="mt-16 grid gap-6 border-t border-ink-200 pt-10 sm:grid-cols-3">
          <Fact
            title="Provenance, not detection"
            body="This validates cryptographically-signed disclosure standards (C2PA, IPTC digital_source_type). It does not run a perceptual deepfake classifier."
          />
          <Fact
            title="Zero-auth by default"
            body="Uses only public oEmbed endpoints and unsigned URL parsing. No cookies, no API keys, no login walls. Fully reproducible from any terminal."
          />
          <Fact
            title="Compliance-grade output"
            body="Every issue cites its spec reference. Copy the JSON report into your case file, CI log, or governance dashboard."
          />
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-ink-200 pt-6 text-xs text-ink-500">
          <span>
            Built on{" "}
            <code className="font-mono text-ink-700">
              c2pa-manifest-validator
            </code>
          </span>
          <span className="font-mono">
            EU AI Act Art. 50(4) · Cal. SB-942 · C2PA 2.0
          </span>
        </footer>
      </main>
    </div>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{body}</p>
    </div>
  );
}
