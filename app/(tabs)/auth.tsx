import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "../../src/i18n/I18nProvider";
import { LanguageSwitcher } from "../../src/i18n/language-switcher";
import { API_URL } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";

export default function AuthScreen() {
  const { t } = useTranslation();
  const { user, loading, login, register, logout, lastIngest, lastIngestError } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim() || undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.failed"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <LanguageSwitcher />
        <Text style={styles.heading}>{t("auth.sessionActive")}</Text>
        <Text style={styles.meta}>{user.name || t("auth.noName")}</Text>
        <Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>{t("auth.role", { role: user.role })}</Text>
        <Text style={styles.api}>{t("auth.api", { url: API_URL })}</Text>
        {lastIngest ? (
          <Text style={styles.ok}>
            {t("auth.ingestLogin", { count: lastIngest.ingested })}
          </Text>
        ) : null}
        {lastIngestError ? (
          <Text style={styles.error}>
            {t("auth.ingestError", { error: lastIngestError })}
          </Text>
        ) : null}
        <Pressable
          style={[styles.button, styles.secondary]}
          onPress={() => void logout()}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>{t("auth.logout")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LanguageSwitcher />
      <Text style={styles.heading}>
        {mode === "login" ? t("auth.login") : t("auth.register")}
      </Text>
      <Text style={styles.api}>{t("auth.api", { url: API_URL })}</Text>
      {mode === "register" ? (
        <TextInput
          style={styles.input}
          placeholder={t("auth.name")}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      ) : null}
      <TextInput
        style={styles.input}
        placeholder={t("auth.email")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder={t("auth.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={() => void onSubmit()}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
          </Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => setMode(mode === "login" ? "register" : "login")}
        accessibilityRole="button"
      >
        <Text style={styles.switch}>
          {mode === "login"
            ? t("auth.switchToRegister")
            : t("auth.switchToLogin")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: "#f8fafc" },
  heading: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  meta: { fontSize: 15, color: "#334155" },
  api: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#0f172a",
    marginTop: 16,
  },
  secondaryText: { color: "#0f172a", fontWeight: "600", fontSize: 16 },
  switch: { textAlign: "center", color: "#0369a1", marginTop: 8 },
  error: { color: "#b91c1c" },
  ok: { color: "#15803d", fontSize: 14 },
});
