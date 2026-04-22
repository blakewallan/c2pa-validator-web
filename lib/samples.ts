export interface SampleUrl {
  label: string;
  url: string;
  note: string;
}

export const SAMPLE_URLS: SampleUrl[] = [
  {
    label: "TikTok · AI with visible label only",
    url: "https://www.tiktok.com/@zvsmdmf/video/7617513225063566623",
    note:
      "Platform shows a visible 'AI-generated' badge but no machine-readable C2PA — visualizes the EU AI Act Art. 50(2) vs 50(4) gap.",
  },
  {
    label: "TikTok · AI hashtags only",
    url: "https://www.tiktok.com/@lulumelontv/video/7614364582382963981",
    note:
      "Creator tagged #ai in the caption but the video has no embedded manifest. Fails Art. 50(2); barely satisfies 50(4).",
  },
  {
    label: "YouTube · human-produced baseline",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    note:
      "Expect no AI signals of any kind — useful to confirm the validator does not false-positive.",
  },
];
