import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaSupport } from "@/components/layout/pwa";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { I18nProvider } from "@/i18n";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruckPressure – Reifendruck für Mercedes-Benz Lkw",
  description:
    "Kaltreifendruck für Mercedes-Benz Actros, Arocs und Atego direkt aus verifizierten Herstellertabellen – je Achse, mit Quellenangabe. Unabhängiges Projekt.",
  applicationName: "TruckPressure",
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: [
      { url: withBasePath("/icons/icon.svg"), type: "image/svg+xml" },
      { url: withBasePath("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: withBasePath("/icons/apple-touch-icon.png"), sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0e11",
};

/** Applies the stored theme before first paint to avoid a flash. */
const themeScript = `try{var t=localStorage.getItem("truckpressure:theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider>
          <SiteHeader />
          <PwaSupport />
          {children}
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
