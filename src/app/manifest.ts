import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";

// Required for `output: "export"` (GitHub Pages); the manifest is static anyway.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TruckPressure – Reifendruck Lkw",
    short_name: "TruckPressure",
    description: "Kaltreifendruck für Mercedes-Benz Lkw aus verifizierten Herstellertabellen (unabhängiges Projekt).",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#0c0e11",
    theme_color: "#0c0e11",
    lang: "de",
    icons: [
      { src: withBasePath("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: withBasePath("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: withBasePath("/icons/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: withBasePath("/icons/icon.svg"), sizes: "any", type: "image/svg+xml" },
    ],
  };
}
