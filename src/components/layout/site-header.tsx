"use client";

import { Gauge, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n, type Lang } from "@/i18n";
import { loadPreference, storePreference } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0c0e11" : "#eef0f3");
}

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = loadPreference("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "light") setTheme("light");
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    storePreference("theme", next);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <a href="#top" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid size-9 place-items-center rounded-xl border border-border-strong bg-surface-2 text-accent">
            <Gauge aria-hidden className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">{t("app.name")}</span>
            <span className="hidden text-[11px] text-subtle sm:block">Mercedes-Benz · Actros · Arocs · Atego</span>
          </span>
        </a>
        <div className="flex items-center gap-2">
          <div role="group" aria-label={t("header.language")} className="flex rounded-xl border border-border bg-surface-2 p-0.5">
            {(["de", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={lang === l}
                data-testid={`lang-${l}`}
                onClick={() => setLang(l)}
                className={cn(
                  "h-9 min-w-11 rounded-lg px-2.5 text-sm font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  lang === l ? "bg-surface-3 text-text" : "text-subtle hover:text-text",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`${t("header.theme")}: ${theme === "dark" ? t("header.themeLight") : t("header.themeDark")}`}
            title={theme === "dark" ? t("header.themeLight") : t("header.themeDark")}
            className="grid size-10 place-items-center rounded-xl border border-border bg-surface-2 text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {theme === "dark" ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
          </button>
        </div>
      </div>
      <div aria-hidden className="metal-line h-px w-full" />
    </header>
  );
}
