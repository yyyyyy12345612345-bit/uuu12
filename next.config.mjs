import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack needs the correct root to find tailwindcss
  experimental: {
    // Allow longer server actions for video rendering  
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Allow serving video files from renders directory
  async headers() {
    return [
      {
        source: "/renders/:path*",
        headers: [
          { key: "Content-Disposition", value: "attachment" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
