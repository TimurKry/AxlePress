import type { NextConfig } from "next";
import { normalizeBasePath } from "./src/lib/base-path";

/**
 * Two build modes:
 * - default: regular Next.js server build (`next start`, Vercel)
 * - STATIC_EXPORT=true: fully static site in ./out (GitHub Pages), optionally under
 *   NEXT_PUBLIC_BASE_PATH (e.g. "/AxlePress"). See .github/workflows/pages.yml.
 */
const staticExport = process.env.STATIC_EXPORT === "true";
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(basePath ? { basePath } : {}),
  ...(staticExport
    ? {
        // Static hosting cannot send custom headers – GitHub Pages serves the files as they are.
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {
        async headers() {
          return [
            { source: "/(.*)", headers: securityHeaders },
            {
              source: "/sw.js",
              headers: [
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                { key: "Service-Worker-Allowed", value: "/" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
