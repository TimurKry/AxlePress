/**
 * Path prefix under which the app is served.
 * - "" for a root deployment (local dev, `next start`, Vercel, custom domain)
 * - "/AxlePress" for a GitHub Pages project site (https://<user>.github.io/AxlePress/)
 *
 * Set at build time via NEXT_PUBLIC_BASE_PATH (the Pages workflow takes it from
 * actions/configure-pages). Next.js prefixes its own assets and <Link>s automatically;
 * plain URLs (icons, manifest, service worker) must use withBasePath().
 */
export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export function normalizeBasePath(value: string | undefined): string {
  const trimmed = (value ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
