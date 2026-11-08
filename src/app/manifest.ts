import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TruckPressure – Reifendruck Lkw",
    short_name: "TruckPressure",
    description: "Kaltreifendruck für Mercedes-Benz Lkw aus verifizierten Herstellertabellen (unabhängiges Projekt).",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0c0e11",
    theme_color: "#0c0e11",
    lang: "de",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
