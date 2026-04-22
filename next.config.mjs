/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep the validator and its transitive CJS deps out of Next's bundling
    // pipeline — they're ESM-safe and only imported from the Node API route.
    serverComponentsExternalPackages: [
      "c2pa-manifest-validator",
      "m3u8-parser",
      "mpd-parser",
    ],
  },
};

export default nextConfig;
