"use client";

import { useState, type FormEvent } from "react";
import { callValidate, type ValidateResponse } from "@/lib/api";
import type { SampleUrl } from "@/lib/samples";
import { ReportPanel } from "./ReportPanel";

export function ValidatorForm({ samples }: { samples: SampleUrl[] }) {
  const [url, setUrl] = useState("");
  const [downloadBytes, setDownloadBytes] = useState(false);
  const [cdnUrl, setCdnUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ValidateResponse | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await callValidate({
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

  return (
    <div>
      <form
        onSubmit={submit}
        className="rounded-xl border border-ink-200 bg-white/90 p-5 shadow-sm backdrop-blur"
      >
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
              Use when the platform page is gated and you already have a direct
              MP4 URL. Only used when &ldquo;download first 1&nbsp;MB&rdquo; is
              enabled.
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
            Resolving URL, fetching oEmbed, and running rules…
          </div>
        </div>
      ) : null}

      {data ? <ReportPanel data={data} /> : null}
    </div>
  );
}
