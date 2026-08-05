import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";

import en from "./locales/en.json";
import es from "./locales/es.json";

export const LOCALE_STORE_KEY = "adolfo.locale";
export type AppLocale = "en" | "es";

type Dict = Record<string, unknown>;

const catalogs: Record<AppLocale, Dict> = {
  en: en as Dict,
  es: es as Dict,
};

let currentLocale: AppLocale = "en";
let readyPromise: Promise<AppLocale> | null = null;
const listeners = new Set<() => void>();

function deviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  return code === "es" ? "es" : "en";
}

function getByPath(obj: Dict, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Dict)) {
      return (acc as Dict)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? `{{${key}}}` : String(v);
  });
}

export function t(
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = getByPath(catalogs[currentLocale], key);
  const fallback = getByPath(catalogs.en, key);
  const raw =
    typeof primary === "string"
      ? primary
      : typeof fallback === "string"
        ? fallback
        : key;
  return interpolate(raw, vars);
}

export function getAppLocale(): AppLocale {
  return currentLocale;
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const l of listeners) l();
}

export async function ensureI18n(): Promise<AppLocale> {
  if (!readyPromise) {
    readyPromise = (async () => {
      let stored: string | null = null;
      try {
        stored = await SecureStore.getItemAsync(LOCALE_STORE_KEY);
      } catch {
        /* ignore */
      }
      currentLocale =
        stored === "en" || stored === "es" ? stored : deviceLocale();
      return currentLocale;
    })();
  }
  return readyPromise;
}

export async function setAppLocale(locale: AppLocale): Promise<void> {
  await ensureI18n();
  currentLocale = locale;
  try {
    await SecureStore.setItemAsync(LOCALE_STORE_KEY, locale);
  } catch {
    /* ignore */
  }
  notify();
}

/** Shape compatible with previous react-i18next usage. */
export type I18nLike = {
  language: string;
};

export function getI18nLike(): I18nLike {
  return { language: currentLocale };
}
