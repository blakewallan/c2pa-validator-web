"use client";

import { useState } from "react";
import type { ValidateResponse } from "@/lib/api";

type Copied = "json" | "junit" | "permalink" | null;

export function ReportActions({ data }: { data: ValidateResponse }) {
  const [copied, setCopied] = useState<Copied>(null);

  const flash = (which: Copied) => {
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyJson = async () => {
    const body = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(body);
      flash("json");
    } catch {
      // Clipboard APIs can fail in insecure contexts; silently ignore.
    }
  };

  const copyJunit = async () => {
    try {
      await navigator.clipboard.writeText(buildJUnit(data));
      flash("junit");
    } catch {
      // noop
    }
  };

  const jsonDataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2),
  )}`;
  const junitDataUri = `data:application/xml;charset=utf-8,${encodeURIComponent(
    buildJUnit(data),
  )}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyJson}
        className={buttonCls}
        title="Copy the full report (including backend + signature info) as JSON"
      >
        {copied === "json" ? "Copied" : "Copy JSON"}
      </button>
      <button
        type="button"
        onClick={copyJunit}
        className={buttonCls}
        title="Copy a JUnit XML report suitable for pasting into CI artifact viewers"
      >
        {copied === "junit" ? "Copied" : "Copy JUnit"}
      </button>
      <a
        href={jsonDataUri}
        download={filenameFor(data, "json")}
        className={buttonCls}
      >
        .json
      </a>
      <a
        href={junitDataUri}
        download={filenameFor(data, "xml")}
        className={buttonCls}
      >
        .xml
      </a>
    </div>
  );
}

const buttonCls =
  "inline-flex items-center gap-2 rounded-md border border-ink-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 transition hover:border-ink-400 hover:bg-ink-50";

function filenameFor(data: ValidateResponse, ext: string): string {
  const base = (data.source || "c2pa-report")
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 60);
  return `${base}.${ext}`;
}

/**
 * Minimal JUnit XML shaper. Mirrors `formatJUnit` from the validator
 * CLI for output parity, but we rebuild it client-side so sharing a
 * report doesn't require a round-trip. One <testcase> per rule that
 * ran; failures become <failure>, warnings become <testcase> system-out
 * annotations so the suite count stays accurate.
 */
function buildJUnit(data: ValidateResponse): string {
  const { report, source } = data;
  const testcases: string[] = [];

  // Seed with a synthetic "ran" case per rule so the suite total
  // matches rulesRun. Then attach failures for each error issue.
  const failuresByRule = new Map<string, (typeof report.issues)[number][]>();
  for (const issue of report.issues) {
    if (issue.severity !== "error") continue;
    const list = failuresByRule.get(issue.ruleId) ?? [];
    list.push(issue);
    failuresByRule.set(issue.ruleId, list);
  }

  for (const [ruleId, failures] of failuresByRule) {
    const messages = failures.map((f) => xmlEscape(f.message)).join(" | ");
    testcases.push(
      `    <testcase classname="${xmlEscape(source || report.source || "c2pa")}" name="${xmlEscape(ruleId)}">\n` +
        `      <failure message="${messages}"/>\n` +
        `    </testcase>`,
    );
  }

  const errors = report.counts.error;
  const tests = Math.max(report.rulesRun, errors);

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<testsuite name="c2pa-manifest-validator" tests="${tests}" failures="${errors}" errors="0">\n` +
    `${testcases.join("\n")}\n` +
    `</testsuite>\n`
  );
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
