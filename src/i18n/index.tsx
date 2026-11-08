"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadPreference, storePreference } from "@/lib/storage";
import { de, type MessageKey } from "./de";
import { en } from "./en";

export type Lang = "de" | "en";
const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { de, en };

export type TFunction = (key: MessageKey, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
  formatPressure: (value: number, decimals: number) => string;
  formatKg: (value: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

export function createTranslator(lang: Lang): TFunction {
  const dict = DICTIONARIES[lang];
  return (key, params) => interpolate(dict[key] ?? de[key] ?? key, params);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    const stored = loadPreference("lang");
    const initial = fromUrl === "en" || fromUrl === "de" ? fromUrl : stored === "en" ? "en" : "de";
    // Reading browser-only state after hydration is intentional here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storePreference("lang", next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const locale = lang === "de" ? "de-DE" : "en-GB";
    return {
      lang,
      setLang,
      t: createTranslator(lang),
      formatPressure: (v, decimals) =>
        v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
      formatKg: (v) => v.toLocaleString(locale, { maximumFractionDigits: 0 }),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
