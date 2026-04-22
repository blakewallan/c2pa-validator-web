export interface SampleUrl {
  label: string;
  url: string;
  note: string;
}

export const SAMPLE_URLS: SampleUrl[] = [
  {
    label: "TikTok — flagged AI, hashtags only",
    url: "https://www.tiktok.com/@lulumelontv/video/7614364582382963981",
    note: "Creator uses #ai hashtags but no machine-readable disclosure.",
  },
  {
    label: "YouTube — classic music video",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    note: "Human-produced baseline; expect no AI signals of any kind.",
  },
];
