import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.1.8'],
  outputFileTracingIncludes: {
    "/api/render": ["./node_modules/@remotion/renderer/**/*", "./node_modules/@remotion/bundler/**/*", "./node_modules/remotion/**/*"]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  serverExternalPackages: [
    "remotion",
    "@remotion/bundler",
    "@remotion/renderer"
  ],
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
