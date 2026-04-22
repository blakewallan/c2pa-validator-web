import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C2PA Manifest Validator",
  description:
    "Paste a TikTok or YouTube URL and check whether the video carries machine-readable AI-disclosure signals (C2PA, IPTC) or only hashtags.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
