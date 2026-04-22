# c2pa-validator-web

Web UI for the [`c2pa-manifest-validator`](../c2pa-manifest-validator) AI-disclosure compliance auditor. Drop a video or paste a TikTok / YouTube URL and get a per-regulation verdict — **EU AI Act Art. 50(2), Art. 50(4), California SB-942** — each with the evidence that drove pass / fail / unknown.

> **What this is not.** It's not a general-purpose C2PA viewer — the CAI team already ships that at [contentcredentials.org/verify](https://contentcredentials.org/verify). It's a **regulatory auditor** on top of the same stack. Parsing and cryptography are delegated to `@contentauth/c2pa-node` (Rust bindings to `c2pa-rs`). The verdict logic, platform-URL forensics, IPTC XMP signal fusion, and regulation mapping are what this project adds on top.

## Quick start

```bash
cd ../c2pa-manifest-validator
npm install
npm run build

cd ../c2pa-validator-web
npm install
npm run dev
```

Then open http://localhost:3000 and paste:

- `https://www.tiktok.com/@lulumelontv/video/7614364582382963981`
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

## How it works

- The web app is a Next.js 14 App Router project.
- `app/api/validate/route.ts` is a Node.js-runtime API route that imports `loadPlatformUrl` and the `ALL_PLATFORM_URL_RULES` pack from `c2pa-manifest-validator` and returns a `ValidationReport` as JSON.
- The frontend submits the URL + options to that route and renders the report.

The validator is wired in via a `file:../c2pa-manifest-validator` dependency. When the library gets published to npm, swap it for a version range.

## v0.1 scope

- TikTok / YouTube watch URL input
- Optional 1 MB CDN byte scan (opt-in checkbox)
- Forensic card: platform, creator, video ID, decoded upload time
- Issue list grouped by severity, with spec references
- Raw JSON report (copy to clipboard)

v0.2 candidates: file upload for sidecar `.c2pa` / MP4, HLS/DASH manifest text paste, shareable permalinks, history.

## Deploying

On Vercel, the `file:` dependency will not work — you must either:
1. Publish `c2pa-manifest-validator` to npm and swap the dependency for a version, or
2. Use a pnpm/npm workspace monorepo and deploy the workspace.

For local dev, `file:` works fine.
