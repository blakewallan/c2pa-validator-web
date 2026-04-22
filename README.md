# c2pa-validator-web

Web UI for [`c2pa-manifest-validator`](../c2pa-manifest-validator). Paste a TikTok or YouTube URL and get a compliance-grade report on whether the video carries machine-readable AI-disclosure signals (C2PA, IPTC `digital_source_type`) or only human-readable hints (hashtags, keywords).

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
