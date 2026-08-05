import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "../../src/i18n/I18nProvider";
import { api, type Job } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import { loadScope, saveScope } from "../../src/lib/scope";

export default function JobsScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const load = useCallback(async (kw: string[], search: string) => {
    setError(null);
    try {
      const data = await api.jobs({
        q: search || undefined,
        keywords: kw.length ? kw : undefined,
      });
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("jobs.loadError"));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setBooting(true);
      void (async () => {
        try {
          const scope = await loadScope();
          if (cancelled) return;
          setKeywords(scope.jobKeywords);
          setQ(scope.jobQuery);
          setDraft(scope.jobQuery);
          await load(scope.jobKeywords, scope.jobQuery);
        } finally {
          if (!cancelled) setBooting(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const applySearch = async () => {
    const trimmed = draftRef.current.trim();
    Keyboard.dismiss();
    setQ(trimmed);
    setDraft(trimmed);
    setSearching(true);
    setError(null);

    const kw = keywords.length
      ? keywords
      : (await loadScope()).jobKeywords;

    // Buscar ya; persistir scope no debe bloquear el listado.
    try {
      await load(kw, trimmed);
    } finally {
      setSearching(false);
      setRefreshing(false);
    }

    void (async () => {
      try {
        const scope = await loadScope();
        await saveScope(
          {
            ...scope,
            jobQuery: trimmed,
            jobKeywords: kw,
          },
          token,
        );
      } catch {
        /* ignore persist errors on search */
      }
    })();
  };

  if (booting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={jobs}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void (async () => {
              await load(keywords, q);
              setRefreshing(false);
            })();
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.search}
              value={draft}
              onChangeText={setDraft}
              placeholder={t("jobs.searchPlaceholder")}
              placeholderTextColor="#94a3b8"
              returnKeyType="search"
              blurOnSubmit
              onSubmitEditing={() => void applySearch()}
              accessibilityLabel={t("jobs.searchA11y")}
            />
            <Pressable
              style={[styles.searchBtn, searching && styles.searchBtnDisabled]}
              onPress={() => void applySearch()}
              disabled={searching}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("jobs.applyA11y")}
            >
              {searching ? (
                <ActivityIndicator color="#f8fafc" />
              ) : (
                <Text style={styles.searchBtnText}>{t("jobs.search")}</Text>
              )}
            </Pressable>
          </View>
          {q ? (
            <Text style={styles.filterHint}>
              {t("jobs.filterQuery", { q, count: jobs.length })}
            </Text>
          ) : (
            <Text style={styles.filterHint}>
              {t("jobs.filterCount", { count: jobs.length })}
            </Text>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        !error ? (
          <Text style={styles.muted}>
            {q ? t("jobs.emptyQuery", { q }) : t("jobs.empty")}
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => void Linking.openURL(item.url)}
          accessibilityRole="link"
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.company}
            {item.location ? ` · ${item.location}` : ""}
            {item.remote ? ` · ${t("jobs.remote")}` : ""}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  header: { gap: 8, marginBottom: 4 },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  search: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  searchBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnDisabled: { opacity: 0.7 },
  searchBtnText: { color: "#f8fafc", fontWeight: "600", fontSize: 14 },
  filterHint: { fontSize: 12, color: "#64748b" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  meta: { marginTop: 4, fontSize: 13, color: "#64748b" },
  error: { color: "#b91c1c", marginBottom: 4 },
  muted: { color: "#64748b", textAlign: "center", marginTop: 24 },
});
