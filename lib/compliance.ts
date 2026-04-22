import type { Issue, ValidationReport } from "c2pa-manifest-validator";
import type { SignatureSummary } from "./api";

/**
 * Per-regulation verdict. "unknown" is the right answer when we
 * genuinely can't tell from the evidence we have — for example we
 * can't score Art. 50(4) on a raw file upload (no visible-label
 * surface to inspect). The UI renders unknown differently from a
 * positive "pass" so users don't read it as green-light.
 */
export type Verdict = "pass" | "fail" | "unknown";

export interface ComplianceCheck {
  id: string;
  regulation: string;
  clause: string;
  question: string;
  verdict: Verdict;
  reason: string;
  /** The rule IDs / status codes that drove this verdict, for drill-down. */
  evidence: string[];
  /** Link to the primary legal / spec text. */
  citation: {
    label: string;
    url: string;
  };
}

export interface ComplianceSummary {
  /** Overall rollup across every check that's not "unknown". */
  overall: Verdict;
  checks: ComplianceCheck[];
}

/**
 * Rule ID / status code tokens we look for when classifying the issue
 * stream. Anchored here so the mapping is testable and auditable, not
 * scattered inline.
 */
const TOKENS = {
  // EU AI Act Art. 50(2): machine-readable disclosure that content is
  // AI-generated / AI-manipulated.
  aiSourceDisclosed: [
    "ai/digital-source-type-disclosed",
    "ai/trained-algorithmic-media-disclosed",
  ],
  aiSourceMissing: [
    "ai/c2pa-created-requires-digital-source-type",
    "assertion.action.malformed",
  ],
  // No manifest at all = no machine-readable disclosure can exist.
  manifestAbsent: [
    "claim.manifestStore.missing",
    "claim.jumbf.missing",
    "manifest/manifest-present",
  ],
  // EU AI Act Art. 50(4): user-visible label. The platform-url rules
  // detect hashtag-only or platform-label-only disclosures (the
  // regulation requires *machine-readable* labels; visible-only
  // disclosures fail 50(2) even when they pass the good-faith 50(4)
  // "accessible to the user" test).
  visibleLabelPresent: [
    "platform-url/visible-ai-disclosure-present",
    "platform-url/platform-proprietary-label-only",
    "platform-url/hashtag-only-ai-disclosure",
    "platform-url/creator-claims-ai-no-standards-disclosure",
  ],
  // California SB-942: covered generators must embed a "latent
  // disclosure" (C2PA manifest with AI source type) AND provide a
  // visible disclosure. We score the C2PA half; the visible-label
  // half overlaps with Art. 50(4).
  validSignature: ["manifest/claim-signature-valid"],
  invalidSignature: [
    "signatureCredential.untrusted",
    "signingCredential.untrusted",
    "signature.invalid",
    "signature.cose.malformed",
  ],
} as const;

/**
 * Run the compliance verdict over a finished report. Pure, synchronous,
 * no I/O — safe to call on every re-render.
 */
export function classifyCompliance(
  report: ValidationReport,
  signature?: SignatureSummary,
): ComplianceSummary {
  const issues = report.issues;

  const checks: ComplianceCheck[] = [
    scoreMachineReadable(issues, signature),
    scoreUserVisible(issues, report.kind),
    scoreSb942LatentDisclosure(issues, signature),
  ];

  const determinative = checks.filter((c) => c.verdict !== "unknown");
  const overall: Verdict =
    determinative.length === 0
      ? "unknown"
      : determinative.every((c) => c.verdict === "pass")
        ? "pass"
        : "fail";

  return { overall, checks };
}

/**
 * EU AI Act Article 50(2) — providers of generative AI systems must
 * mark outputs as artificially generated or manipulated in a
 * machine-readable format. C2PA with a populated `digitalSourceType`
 * is the reference technical implementation.
 */
function scoreMachineReadable(
  issues: Issue[],
  signature: SignatureSummary | undefined,
): ComplianceCheck {
  const hasManifest = signature?.present ?? false;
  const manifestMissing = anyToken(issues, TOKENS.manifestAbsent);
  const aiSourceDisclosed = anyToken(issues, TOKENS.aiSourceDisclosed);
  const aiSourceMissing = anyToken(issues, TOKENS.aiSourceMissing);

  let verdict: Verdict;
  let reason: string;
  const evidence: string[] = [];

  if (manifestMissing || !hasManifest) {
    verdict = "fail";
    reason =
      "No C2PA manifest was found on the asset. There is no machine-readable signal at all — Art. 50(2) cannot be satisfied by caption text or platform-specific labels alone.";
    evidence.push(...findMatching(issues, TOKENS.manifestAbsent));
  } else if (aiSourceDisclosed && !aiSourceMissing) {
    verdict = "pass";
    reason =
      "Manifest carries a `digitalSourceType` or `c2pa.trained_algorithmic_media` assertion that unambiguously signals AI-generated or AI-trained origin.";
    evidence.push(...findMatching(issues, TOKENS.aiSourceDisclosed));
  } else if (aiSourceMissing) {
    verdict = "fail";
    reason =
      "Manifest is present but its `c2pa.created` action omits the required `digitalSourceType`. Per C2PA 2.3 §18.15.2 the field is mandatory; without it a reader cannot classify the content machine-readably.";
    evidence.push(...findMatching(issues, TOKENS.aiSourceMissing));
  } else {
    verdict = "unknown";
    reason =
      "Manifest is present but contains no `c2pa.created` action. The asset may or may not be AI-generated — Art. 50(2) requires the claim to be explicit, not inferred.";
  }

  return {
    id: "eu-ai-act-50-2",
    regulation: "EU AI Act",
    clause: "Article 50(2)",
    question:
      "Is AI-generated origin disclosed in a machine-readable, interoperable format?",
    verdict,
    reason,
    evidence,
    citation: {
      label: "EU AI Act Article 50(2)",
      url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_50",
    },
  };
}

/**
 * EU AI Act Article 50(4) — deployers of deepfake / AI-manipulated
 * content must label it in a clear, distinguishable way no later than
 * first interaction.
 *
 * For uploaded files we can't score this (the "label" is the caption
 * / context around the video on a platform, which the file doesn't
 * carry). For platform URLs, the platform-url rule pack flags
 * hashtag-only and proprietary-label-only disclosures.
 */
function scoreUserVisible(
  issues: Issue[],
  reportKind: ValidationReport["kind"],
): ComplianceCheck {
  // On a bare file upload there's no caption / page to inspect — bow
  // out honestly rather than guess.
  if (reportKind !== "platform-url") {
    return {
      id: "eu-ai-act-50-4",
      regulation: "EU AI Act",
      clause: "Article 50(4)",
      question:
        "Is the AI nature of the content disclosed to viewers in a clear, distinguishable way?",
      verdict: "unknown",
      reason:
        "Can't evaluate user-visible labeling on a standalone file — the label lives on the platform page (caption, overlay, proprietary badge). Submit the platform URL to score this check.",
      evidence: [],
      citation: {
        label: "EU AI Act Article 50(4)",
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_50",
      },
    };
  }

  const visibleLabelIssues = issues.filter((i) =>
    TOKENS.visibleLabelPresent.includes(i.ruleId as never),
  );

  // "visible-ai-disclosure-present" is an info-level rule — its
  // presence means the platform/creator signaled AI in some visible
  // form. "platform-proprietary-label-only" / "hashtag-only" being
  // info/warning flags the weakness: visible but not interoperable.
  const hasAnyVisibleSignal = visibleLabelIssues.length > 0;

  if (!hasAnyVisibleSignal) {
    return {
      id: "eu-ai-act-50-4",
      regulation: "EU AI Act",
      clause: "Article 50(4)",
      question:
        "Is the AI nature of the content disclosed to viewers in a clear, distinguishable way?",
      verdict: "fail",
      reason:
        "No visible AI disclosure was detected on the page — no AI hashtags, no platform label, no creator-asserted AI origin. If the content is AI-generated this violates Art. 50(4).",
      evidence: [],
      citation: {
        label: "EU AI Act Article 50(4)",
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_50",
      },
    };
  }

  // A visible signal is present — flag whether it's the bare minimum
  // (hashtag / platform-proprietary label without machine-readable
  // counterpart) which the ComplianceBanner surfaces as a caveat.
  const hasWeakSignalOnly = visibleLabelIssues.every((i) =>
    ["platform-url/hashtag-only-ai-disclosure", "platform-url/platform-proprietary-label-only"].includes(
      i.ruleId,
    ),
  );

  return {
    id: "eu-ai-act-50-4",
    regulation: "EU AI Act",
    clause: "Article 50(4)",
    question:
      "Is the AI nature of the content disclosed to viewers in a clear, distinguishable way?",
    verdict: "pass",
    reason: hasWeakSignalOnly
      ? "A visible label is present, but via a platform-proprietary or hashtag-only channel. Art. 50(4) is satisfied for users on this platform, but the label does not survive cross-posting — pair with a C2PA machine-readable disclosure for Art. 50(2)."
      : "A visible AI-origin signal is present on the page.",
    evidence: visibleLabelIssues.map((i) => i.ruleId),
    citation: {
      label: "EU AI Act Article 50(4)",
      url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_50",
    },
  };
}

/**
 * California SB-942 (AI Transparency Act, effective 2026) — covered
 * generative AI systems must embed a latent disclosure (interpreted
 * across the industry as a C2PA manifest with an AI `digitalSourceType`)
 * in every output. We score the latent side here; the user-visible
 * side overlaps with the EU Art. 50(4) check above.
 */
function scoreSb942LatentDisclosure(
  issues: Issue[],
  signature: SignatureSummary | undefined,
): ComplianceCheck {
  const hasManifest = signature?.present ?? false;
  const aiSourceDisclosed = anyToken(issues, TOKENS.aiSourceDisclosed);
  const signatureInvalid = anyToken(issues, TOKENS.invalidSignature);

  const evidence: string[] = [];

  if (!hasManifest) {
    return {
      id: "ca-sb-942-latent",
      regulation: "California SB-942",
      clause: "§ 22757.2(a) — Latent disclosure",
      question:
        "Does every output include a latent disclosure (C2PA content credential)?",
      verdict: "fail",
      reason:
        "SB-942 requires a latent (machine-readable, embedded) disclosure on each output from covered generators. No C2PA manifest is present.",
      evidence: [],
      citation: {
        label: "Cal. Bus. & Prof. Code § 22757.2 (SB-942)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB942",
      },
    };
  }

  if (!aiSourceDisclosed) {
    return {
      id: "ca-sb-942-latent",
      regulation: "California SB-942",
      clause: "§ 22757.2(a) — Latent disclosure",
      question:
        "Does every output include a latent disclosure (C2PA content credential)?",
      verdict: "unknown",
      reason:
        "A manifest is present but does not explicitly declare AI origin. SB-942 implementations rely on `digitalSourceType` to distinguish covered AI outputs from ordinary content credentials.",
      evidence: [],
      citation: {
        label: "Cal. Bus. & Prof. Code § 22757.2 (SB-942)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB942",
      },
    };
  }

  evidence.push(...findMatching(issues, TOKENS.aiSourceDisclosed));

  if (signatureInvalid) {
    evidence.push(...findMatching(issues, TOKENS.invalidSignature));
    return {
      id: "ca-sb-942-latent",
      regulation: "California SB-942",
      clause: "§ 22757.2(a) — Latent disclosure",
      question:
        "Does every output include a latent disclosure (C2PA content credential)?",
      verdict: "fail",
      reason:
        "A latent disclosure is present and declares AI origin, but its signature is invalid or untrusted — SB-942 enforcement relies on the disclosure being cryptographically tamper-evident.",
      evidence,
      citation: {
        label: "Cal. Bus. & Prof. Code § 22757.2 (SB-942)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB942",
      },
    };
  }

  return {
    id: "ca-sb-942-latent",
    regulation: "California SB-942",
    clause: "§ 22757.2(a) — Latent disclosure",
    question:
      "Does every output include a latent disclosure (C2PA content credential)?",
    verdict: "pass",
    reason:
      "A signed C2PA manifest is embedded and declares the output as AI-generated via `digitalSourceType`. Meets the latent-disclosure requirement of § 22757.2(a).",
    evidence,
    citation: {
      label: "Cal. Bus. & Prof. Code § 22757.2 (SB-942)",
      url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB942",
    },
  };
}

function anyToken(issues: Issue[], tokens: readonly string[]): boolean {
  return issues.some(
    (i) =>
      tokens.includes(i.ruleId as never) ||
      (i.statusCode !== undefined && tokens.includes(i.statusCode as never)),
  );
}

function findMatching(issues: Issue[], tokens: readonly string[]): string[] {
  const hits = new Set<string>();
  for (const i of issues) {
    if (tokens.includes(i.ruleId as never)) hits.add(i.ruleId);
    if (i.statusCode && tokens.includes(i.statusCode as never)) {
      hits.add(i.statusCode);
    }
  }
  return Array.from(hits);
}
