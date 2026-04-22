import type { PlatformUrlScan } from "c2pa-manifest-validator";

export function ForensicCard({ scan }: { scan: PlatformUrlScan }) {
  const uploadTime = scan.decodedUploadTimeIso
    ? new Date(scan.decodedUploadTimeIso).toUTCString()
    : null;

  return (
    <div className="rounded-lg border border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-ink-500">
          Forensic metadata
        </h3>
        <span className="font-mono text-xs text-ink-500">
          platform:{" "}
          <span className="text-ink-800">{scan.platform}</span>
        </span>
      </div>

      <dl className="divide-y divide-ink-200">
        <Row label="Video ID" value={scan.videoId ?? "—"} mono />
        <Row label="Creator handle" value={scan.creatorHandle ? `@${scan.creatorHandle}` : "—"} mono />
        <Row
          label="Decoded upload time"
          value={uploadTime ? `${uploadTime}  ·  ${scan.decodedUploadTimeIso}` : "— (platform does not encode timestamp in video ID)"}
        />
        {scan.oembed?.title ? (
          <Row label="oEmbed title" value={scan.oembed.title} />
        ) : null}
        {scan.oembed?.authorName ? (
          <Row label="oEmbed author" value={scan.oembed.authorName} />
        ) : null}
        <Row
          label="Hashtags detected"
          value={
            scan.hashtags.length === 0
              ? "none"
              : scan.hashtags.map((h) => `#${h}`).join("  ")
          }
          mono
        />
        <Row
          label="AI hashtags"
          value={
            scan.aiHashtags.length === 0
              ? "none"
              : scan.aiHashtags.map((h) => `#${h}`).join("  ")
          }
          mono
          highlight={scan.aiHashtags.length > 0}
        />
        <Row
          label="AI keywords"
          value={scan.aiKeywords.length === 0 ? "none" : scan.aiKeywords.join(", ")}
          highlight={scan.aiKeywords.length > 0}
        />
        <Row
          label="CDN URLs discovered"
          value={
            scan.discoveredCdnUrls.length === 0
              ? "none"
              : `${scan.discoveredCdnUrls.length} url(s)`
          }
          mono
        />
        {scan.byteScan ? (
          <Row
            label="Byte scan"
            value={
              scan.byteScan.error
                ? `error: ${scan.byteScan.error}`
                : `HTTP ${scan.byteScan.httpStatus} · ${scan.byteScan.bytesFetched.toLocaleString()} bytes · c2pa box ${
                    scan.byteScan.isobmff?.c2paBoxFound ? "FOUND" : "not found"
                  }`
            }
            mono
            highlight={scan.byteScan.isobmff?.c2paBoxFound === true}
          />
        ) : null}
        {scan.fetchWarnings.length > 0 ? (
          <Row
            label="Fetch warnings"
            value={scan.fetchWarnings.join(" · ")}
            mono
          />
        ) : null}
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 px-5 py-2.5">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd
        className={`${mono ? "font-mono text-xs" : "text-sm"} break-words ${
          highlight ? "text-accent font-medium" : "text-ink-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
