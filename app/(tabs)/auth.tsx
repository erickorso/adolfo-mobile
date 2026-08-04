import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_URL } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";

export default function AuthScreen() {
  const { user, loading, login, register, logout } = useAuth();
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
      setError(e instanceof Error ? e.message : "Auth falló");
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
        <Text style={styles.heading}>Sesión activa</Text>
        <Text style={styles.meta}>{user.name || "Sin nombre"}</Text>
        <Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>Rol: {user.role}</Text>
        <Text style={styles.api}>API: {API_URL}</Text>
        <Pressable
          style={[styles.button, styles.secondary]}
          onPress={() => void logout()}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {mode === "login" ? "Ingresar" : "Crear cuenta"}
      </Text>
      <Text style={styles.api}>API: {API_URL}</Text>
      {mode === "register" ? (
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (mín. 8 en register)"
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
            {mode === "login" ? "Login" : "Register"}
          </Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => setMode(mode === "login" ? "register" : "login")}
        accessibilityRole="button"
      >
        <Text style={styles.switch}>
          {mode === "login"
            ? "¿No tenés cuenta? Registrate"
            : "¿Ya tenés cuenta? Ingresá"}
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
});
