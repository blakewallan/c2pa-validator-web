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
          Drop a video file or paste a TikTok / YouTube URL. We parse the C2PA
          manifest with the Content Authenticity Initiative's reference
          implementation, verify the COSE_Sign1 signature, and grade the
          output against EU AI Act Article&nbsp;50 and California SB-942 — so
          you see a regulation-level pass / fail, not just a pile of rule
          outputs.
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
            title="CAI-backed parsing"
            body="Server-side parsing runs on @contentauth/c2pa-node (native Rust bindings to c2pa-rs, the reference implementation). Full format + signature coverage — MP4, MOV, JPEG, PNG, WebM, HEIF."
          />
          <Fact
            title="Regulation-grade output"
            body="EU AI Act Art. 50(2), Art. 50(4), and California SB-942 verdicts rendered as pass / fail / unknown with the evidence that drove each. Copy-paste into a case file, CI log, or governance dashboard."
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
