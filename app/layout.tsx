import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "c2pa-validator // AI-disclosure compliance auditor",
  description:
    "Drop a video or paste a TikTok / YouTube URL. Get a regulation-level pass / fail against EU AI Act Art. 50 and California SB-942.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
