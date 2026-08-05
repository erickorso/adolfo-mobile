import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "../../src/i18n/I18nProvider";
import { LanguageSwitcher } from "../../src/i18n/language-switcher";
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  hasGeminiApiKey,
  maskGeminiKey,
  setGeminiApiKey,
} from "../../src/lib/gemini-key";
import { GeminiKeyInfoButton } from "../../src/lib/gemini-key-info-button";
import {
  DEFAULT_SCOPE,
  fromApiScope,
  loadScope,
  parseKeywords,
  saveScope,
  type SearchScope,
} from "../../src/lib/scope";

export default function ScopeScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [keywordsText, setKeywordsText] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geminiDraft, setGeminiDraft] = useState("");
  const [hasGemini, setHasGemini] = useState(false);
  const [geminiSaving, setGeminiSaving] = useState(false);

  const applyToForm = useCallback((scope: SearchScope) => {
    setKeywordsText(scope.jobKeywords.join(", "));
    setJobQuery(scope.jobQuery);
    setCourseQuery(scope.courseQuery);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let scope = await loadScope();
        if (token) {
          try {
            scope = fromApiScope(await api.getScope(token));
            await saveScope(scope, null);
          } catch {
            /* keep local */
          }
        }
        const key = await getGeminiApiKey();
        if (!cancelled) {
          applyToForm(scope);
          setHasGemini(Boolean(key));
          setGeminiDraft(key ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, applyToForm]);

  const currentScope = useCallback((): SearchScope => {
    const jobKeywords = parseKeywords(keywordsText);
    return {
      jobKeywords: jobKeywords.length ? jobKeywords : DEFAULT_SCOPE.jobKeywords,
      jobQuery: jobQuery.trim(),
      courseQuery: courseQuery.trim(),
    };
  }, [keywordsText, jobQuery, courseQuery]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const scope = await saveScope(currentScope(), token);
      applyToForm(scope);
      setStatus(
        token ? t("scope.savedAccount") : t("scope.savedLocal"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("scope.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const onSaveGemini = async () => {
    setGeminiSaving(true);
    setError(null);
    try {
      await setGeminiApiKey(geminiDraft);
      const has = await hasGeminiApiKey();
      setHasGemini(has);
      setStatus(has ? t("scope.geminiSaved") : t("scope.geminiCleared"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("scope.geminiSaveFailed"));
    } finally {
      setGeminiSaving(false);
    }
  };

  const onClearGemini = async () => {
    await clearGeminiApiKey();
    setGeminiDraft("");
    setHasGemini(false);
    setStatus(t("scope.geminiCleared"));
  };

  const onIngest = async () => {
    setRunning(true);
    setError(null);
    setStatus(null);
    try {
      const scope = await saveScope(currentScope(), token);
      const result = await api.ingestJobs({
        keywords: scope.jobKeywords,
        remoteOnly: true,
      });
      setStatus(
        t("scope.ingestOk", {
          count: result.ingested,
          keywords: (result.query?.keywords ?? scope.jobKeywords)
            .slice(0, 6)
            .join(", "),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("scope.ingestFailed"));
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <LanguageSwitcher />
      <Text style={styles.label}>{t("scope.keywordsLabel")}</Text>
      <Text style={styles.hint}>{t("scope.keywordsHint")}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={keywordsText}
        onChangeText={setKeywordsText}
        multiline
        placeholder={t("scope.keywordsPlaceholder")}
        placeholderTextColor="#94a3b8"
        accessibilityLabel={t("scope.keywordsLabel")}
      />

      <Text style={styles.label}>{t("scope.jobSearchLabel")}</Text>
      <Text style={styles.hint}>{t("scope.jobSearchHint")}</Text>
      <TextInput
        style={styles.input}
        value={jobQuery}
        onChangeText={setJobQuery}
        placeholder={t("scope.jobSearchPlaceholder")}
        placeholderTextColor="#94a3b8"
        accessibilityLabel={t("scope.jobSearchLabel")}
      />

      <Text style={styles.label}>{t("scope.courseSearchLabel")}</Text>
      <Text style={styles.hint}>{t("scope.courseSearchHint")}</Text>
      <TextInput
        style={styles.input}
        value={courseQuery}
        onChangeText={setCourseQuery}
        placeholder={t("scope.courseSearchPlaceholder")}
        placeholderTextColor="#94a3b8"
        accessibilityLabel={t("scope.courseSearchLabel")}
      />

      <Pressable
        style={[styles.btn, styles.btnSecondary]}
        onPress={() => void onSave()}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={styles.btnSecondaryText}>
          {saving ? t("scope.saving") : t("scope.saveScope")}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnPrimary, running && styles.btnDisabled]}
        onPress={() => void onIngest()}
        disabled={running}
        accessibilityRole="button"
        accessibilityLabel={t("scope.runIngest")}
      >
        <Text style={styles.btnPrimaryText}>
          {running ? t("scope.ingesting") : t("scope.runIngest")}
        </Text>
      </Pressable>

      <View style={styles.labelRow}>
        <Text style={styles.label}>{t("scope.geminiLabel")}</Text>
        <GeminiKeyInfoButton />
      </View>
      <Text style={styles.hint}>{t("scope.geminiHint")}</Text>
      <TextInput
        style={styles.input}
        value={geminiDraft}
        onChangeText={setGeminiDraft}
        placeholder={t("scope.geminiPlaceholder")}
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        accessibilityLabel={t("coach.modalTitle")}
      />
      {hasGemini && geminiDraft.trim() ? (
        <Text style={styles.hint}>
          {t("scope.geminiMasked", { masked: maskGeminiKey(geminiDraft) })}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.btnSecondary, styles.rowBtn]}
          onPress={() => void onSaveGemini()}
          disabled={geminiSaving}
          accessibilityRole="button"
        >
          <Text style={styles.btnSecondaryText}>
            {geminiSaving ? "…" : t("scope.geminiSave")}
          </Text>
        </Pressable>
        {hasGemini ? (
          <Pressable
            style={[styles.btn, styles.btnSecondary, styles.rowBtn]}
            onPress={() => void onClearGemini()}
            accessibilityRole="button"
            accessibilityLabel={t("common.remove")}
          >
            <Text style={styles.dangerText}>{t("common.remove")}</Text>
          </Pressable>
        ) : null}
      </View>

      {status ? <Text style={styles.ok}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.footer}>{t("scope.footer")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 16, gap: 10 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  label: { fontSize: 15, fontWeight: "600", color: "#0f172a", flex: 1 },
  hint: { fontSize: 13, color: "#64748b", marginTop: -4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  btnPrimary: { backgroundColor: "#0f172a" },
  btnSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: "#f8fafc", fontWeight: "600", fontSize: 15 },
  btnSecondaryText: { color: "#0f172a", fontWeight: "600", fontSize: 15 },
  row: { flexDirection: "row", gap: 8 },
  rowBtn: { flex: 1 },
  dangerText: { color: "#b91c1c", fontWeight: "600", fontSize: 15 },
  ok: { color: "#15803d", marginTop: 8 },
  error: { color: "#b91c1c", marginTop: 8 },
  footer: { marginTop: 16, fontSize: 12, color: "#94a3b8" },
});
