"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  callValidateFile,
  callValidateUrl,
  type ValidateResponse,
} from "@/lib/api";
import type { SampleUrl } from "@/lib/samples";
import { ReportPanel } from "./ReportPanel";

type Tab = "upload" | "url";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/octet-stream",
];

export function ValidatorForm({ samples }: { samples: SampleUrl[] }) {
  const [tab, setTab] = useState<Tab>("upload");

  // URL-tab state (unchanged from v0.1)
  const [url, setUrl] = useState("");
  const [downloadBytes, setDownloadBytes] = useState(false);
  const [cdnUrl, setCdnUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Upload-tab state
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ValidateResponse | null>(null);

  const submitUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await callValidateUrl({
        url: url.trim(),
        downloadBytes: downloadBytes ? 1024 * 1024 : undefined,
        cdnUrl: cdnUrl.trim() || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const submitFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await callValidateFile(file);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = files[0];

    if (picked.size > MAX_FILE_BYTES) {
      setError(
        `File is ${Math.round(picked.size / 1024 / 1024)}MB — max is ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB. Use the CLI for larger files.`,
      );
      setFile(null);
      return;
    }

    setError(null);
    setFile(picked);
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div className="rounded-xl border border-ink-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        {/* Tab strip */}
        <div className="mb-5 flex items-center gap-1 border-b border-ink-200">
          <TabButton
            active={tab === "upload"}
            onClick={() => setTab("upload")}
            label="Upload file"
            sublabel="MP4 · MOV · WebM · JPG · PNG"
          />
          <TabButton
            active={tab === "url"}
            onClick={() => setTab("url")}
            label="Paste URL"
            sublabel="TikTok · YouTube"
          />
        </div>

        {tab === "upload" ? (
          <div>
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
                dragActive
                  ? "border-accent bg-accent/5"
                  : file
                    ? "border-ink-300 bg-ink-50"
                    : "border-ink-300 bg-white hover:border-ink-400 hover:bg-ink-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {file ? (
                <div className="text-left">
                  <div className="font-mono text-[11px] uppercase tracking-widest text-ink-500">
                    Ready to validate
                  </div>
                  <div className="mt-1 text-sm font-medium text-ink-900">
                    {file.name}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "unknown type"}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-3 text-xs text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline"
                  >
                    Choose a different file
                  </button>
                </div>
              ) : (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Drop a video or image here
                  </div>
                  <div className="mt-2 text-sm text-ink-700">
                    or <span className="text-accent underline">click to browse</span>
                  </div>
                  <div className="mt-3 text-xs text-ink-500">
                    MP4 · MOV · WebM · JPG · PNG &mdash; up to 50&nbsp;MB
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={submitFile}
              disabled={loading || !file}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Validating…" : "Validate file"}
            </button>

            <p className="mt-3 text-xs text-ink-500">
              Your file is sent to this server, validated against the CAI
              reference implementation, and then deleted. Nothing is stored.
            </p>
          </div>
        ) : (
          <form onSubmit={submitUrl}>
            <label
              htmlFor="url"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-ink-500"
            >
              Video URL
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@creator/video/123..."
                className="flex-1 rounded-md border border-ink-300 bg-white px-3 py-2.5 font-mono text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="inline-flex items-center justify-center rounded-md bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Validating…" : "Validate"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <label className="inline-flex select-none items-center gap-2 text-ink-700">
                <input
                  type="checkbox"
                  checked={downloadBytes}
                  onChange={(e) => setDownloadBytes(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-accent focus:ring-accent"
                />
                Download first 1&nbsp;MB of CDN stream and scan for embedded C2PA
              </label>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="ml-auto text-xs text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline"
              >
                {showAdvanced ? "Hide advanced" : "Advanced"}
              </button>
            </div>

            {showAdvanced ? (
              <div className="mt-3 border-t border-ink-200 pt-3">
                <label
                  htmlFor="cdnUrl"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-ink-500"
                >
                  CDN URL override (optional)
                </label>
                <input
                  id="cdnUrl"
                  type="url"
                  value={cdnUrl}
                  onChange={(e) => setCdnUrl(e.target.value)}
                  placeholder="https://…signed-mp4-url"
                  className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 font-mono text-xs text-ink-900 placeholder:text-ink-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1.5 text-xs text-ink-500">
                  Use when the platform page is gated and you already have a
                  direct MP4 URL. Only used when &ldquo;download first 1&nbsp;MB&rdquo;
                  is enabled.
                </p>
              </div>
            ) : null}

            {samples.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Try
                </span>
                {samples.map((s) => (
                  <button
                    key={s.url}
                    type="button"
                    onClick={() => setUrl(s.url)}
                    title={s.note}
                    className="rounded-md border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs text-ink-700 transition hover:border-ink-300 hover:bg-white"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : null}
          </form>
        )}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-error/30 bg-error-soft p-4 text-sm text-error"
        >
          <div className="font-mono text-[10px] uppercase tracking-widest">
            Error
          </div>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="mt-6 rounded-lg border border-ink-200 bg-white p-5">
          <div className="flex items-center gap-3 text-sm text-ink-600">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
            {tab === "upload"
              ? "Uploading, parsing with CAI, running rules…"
              : "Resolving URL, fetching oEmbed, and running rules…"}
          </div>
        </div>
      ) : null}

      {data ? <ReportPanel data={data} /> : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  sublabel,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex flex-col items-start border-b-2 px-4 pb-2.5 pt-1 text-left transition ${
        active
          ? "border-accent text-ink-900"
          : "border-transparent text-ink-500 hover:text-ink-800"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
        {sublabel}
      </span>
    </button>
  );
}
