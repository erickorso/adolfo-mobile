import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ActivityIndicator, View } from "react-native";

import {
  ensureI18n,
  getAppLocale,
  getI18nLike,
  subscribeLocale,
  t as translate,
  type AppLocale,
  type I18nLike,
} from "./index";

type I18nContextValue = {
  locale: AppLocale;
  t: typeof translate;
  i18n: I18nLike;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const locale = useSyncExternalStore(
    subscribeLocale,
    getAppLocale,
    getAppLocale,
  );

  useEffect(() => {
    let cancelled = false;
    void ensureI18n().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(key, vars),
    // locale in deps so t identity updates on language change
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t,
      i18n: getI18nLike(),
    }),
    [locale, t],
  );

  if (!ready) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return ctx;
}
