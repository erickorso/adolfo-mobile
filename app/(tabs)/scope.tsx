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
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import {
  DEFAULT_SCOPE,
  fromApiScope,
  loadScope,
  parseKeywords,
  saveScope,
  type SearchScope,
} from "../../src/lib/scope";

export default function ScopeScreen() {
  const { token } = useAuth();
  const [keywordsText, setKeywordsText] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) applyToForm(scope);
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
        token
          ? "Scope guardado en tu cuenta."
          : "Scope local. Logueate para sincronizar.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
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
        `Ingest OK: ${result.ingested} jobs. Scope: ${(result.query?.keywords ?? scope.jobKeywords).slice(0, 6).join(", ")}…`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingest falló");
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
      <Text style={styles.label}>Job keywords (CSV)</Text>
      <Text style={styles.hint}>
        Alimentan ingest al login y el listado. Ej: react, python, laravel
      </Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={keywordsText}
        onChangeText={setKeywordsText}
        multiline
        placeholder="react, typescript, node…"
        placeholderTextColor="#94a3b8"
        accessibilityLabel="Keywords de jobs"
      />

      <Text style={styles.label}>Job search</Text>
      <Text style={styles.hint}>Última búsqueda libre en Jobs.</Text>
      <TextInput
        style={styles.input}
        value={jobQuery}
        onChangeText={setJobQuery}
        placeholder="empresa, senior…"
        placeholderTextColor="#94a3b8"
        accessibilityLabel="Búsqueda jobs"
      />

      <Text style={styles.label}>Course search</Text>
      <Text style={styles.hint}>Query default / última en Courses.</Text>
      <TextInput
        style={styles.input}
        value={courseQuery}
        onChangeText={setCourseQuery}
        placeholder="frontend, python…"
        placeholderTextColor="#94a3b8"
        accessibilityLabel="Búsqueda default de cursos"
      />

      <Pressable
        style={[styles.btn, styles.btnSecondary]}
        onPress={() => void onSave()}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={styles.btnSecondaryText}>
          {saving ? "Guardando…" : "Guardar scope"}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnPrimary, running && styles.btnDisabled]}
        onPress={() => void onIngest()}
        disabled={running}
        accessibilityRole="button"
        accessibilityLabel="Correr ingest ahora"
      >
        <Text style={styles.btnPrimaryText}>
          {running ? "Ingestando…" : "Run ingest now"}
        </Text>
      </Pressable>

      {status ? <Text style={styles.ok}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.footer}>
        Al login se corre ingest con tus keywords guardadas.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 16, gap: 10 },
  label: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginTop: 8 },
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
  ok: { color: "#15803d", marginTop: 8 },
  error: { color: "#b91c1c", marginTop: 8 },
  footer: { marginTop: 16, fontSize: 12, color: "#94a3b8" },
});
