"use client";

import { useState } from "react";
import type { ValidateResponse } from "@/lib/api";

export function ReportActions({ data }: { data: ValidateResponse }) {
  const [copied, setCopied] = useState<"json" | null>(null);

  const copyJson = async () => {
    const body = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(body);
      setCopied("json");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard APIs can fail in insecure contexts; silently ignore.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyJson}
        className="inline-flex items-center gap-2 rounded-md border border-ink-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 transition hover:border-ink-400 hover:bg-ink-50"
      >
        {copied === "json" ? "Copied" : "Copy JSON"}
      </button>
      <a
        href={`data:application/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2),
        )}`}
        download="c2pa-report.json"
        className="inline-flex items-center gap-2 rounded-md border border-ink-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 transition hover:border-ink-400 hover:bg-ink-50"
      >
        Download .json
      </a>
    </div>
  );
}
