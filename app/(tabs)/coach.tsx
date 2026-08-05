import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  api,
  type CoachChatMessage,
  type CoachCourseRef,
  type CoachJobRef,
} from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";

type UiMessage = CoachChatMessage & {
  id: string;
  refs?: {
    jobs: CoachJobRef[];
    courses: CoachCourseRef[];
  };
};

const SUGGESTIONS = [
  "¿Qué me falta para las vacantes actuales?",
  "Armame un plan de 2 semanas",
  "¿Cuál es la mejor vacante para mí y por qué?",
];

export default function CoachScreen() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<UiMessage>>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setDraft("");
  }, []);

  const send = async (text?: string) => {
    if (!token) return;
    const content = (text ?? draftRef.current).trim();
    if (!content || busy) return;

    Keyboard.dismiss();
    setDraft("");
    setError(null);
    setBusy(true);

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);

    try {
      const history = nextHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(0, -1)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.coachChat({ message: content, history }, token);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          refs: res.refs,
        },
      ]);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coach falló");
    } finally {
      setBusy(false);
    }
  };

  if (!token || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Career Coach</Text>
        <Text style={styles.emptyBody}>
          Iniciá sesión en Auth para chatear con IA sobre tus jobs y courses
          (según tu Scope).
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Career Coach</Text>
        <Pressable
          onPress={reset}
          accessibilityRole="button"
          accessibilityLabel="Nueva conversación"
          hitSlop={8}
        >
          <Text style={styles.toolbarAction}>Nueva</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={styles.suggestions}>
              <Text style={styles.hint}>Probá una pregunta:</Text>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={styles.chip}
                  onPress={() => void send(s)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant,
            ]}
          >
            <Text
              style={
                item.role === "user" ? styles.bubbleUserText : styles.bubbleText
              }
            >
              {item.content}
            </Text>
            {item.refs &&
            (item.refs.jobs.length > 0 || item.refs.courses.length > 0) ? (
              <View style={styles.refs}>
                {item.refs.jobs.slice(0, 4).map((j) => (
                  <Pressable
                    key={j.id}
                    style={styles.refChip}
                    onPress={() => void Linking.openURL(j.url)}
                    accessibilityRole="link"
                  >
                    <Text style={styles.refChipLabel}>Job</Text>
                    <Text style={styles.refChipText} numberOfLines={1}>
                      {j.title}
                    </Text>
                  </Pressable>
                ))}
                {item.refs.courses.slice(0, 4).map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.refChipCourse}
                    onPress={() => void Linking.openURL(c.url)}
                    accessibilityRole="link"
                  >
                    <Text style={styles.refChipLabel}>Course</Text>
                    <Text style={styles.refChipText} numberOfLines={1}>
                      {c.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={
          busy ? (
            <View style={styles.thinking}>
              <ActivityIndicator color="#0f172a" />
              <Text style={styles.hint}>Pensando con tu scope…</Text>
            </View>
          ) : null
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Preguntale al coach…"
          placeholderTextColor="#94a3b8"
          editable={!busy}
          multiline
          maxLength={2000}
          accessibilityLabel="Mensaje al coach"
        />
        <Pressable
          style={[styles.sendBtn, (busy || !draft.trim()) && styles.sendDisabled]}
          onPress={() => void send()}
          disabled={busy || !draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          hitSlop={8}
        >
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  emptyBody: { marginTop: 8, fontSize: 15, color: "#64748b", lineHeight: 22 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  toolbarTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  toolbarAction: { fontSize: 14, fontWeight: "600", color: "#0369a1" },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 10, paddingBottom: 24 },
  suggestions: { gap: 8, marginBottom: 8 },
  hint: { fontSize: 13, color: "#64748b" },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipText: { fontSize: 14, color: "#0f172a" },
  bubble: {
    borderRadius: 14,
    padding: 12,
    maxWidth: "92%",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#0f172a",
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleText: { fontSize: 15, color: "#0f172a", lineHeight: 21 },
  bubbleUserText: { fontSize: 15, color: "#f8fafc", lineHeight: 21 },
  refs: { marginTop: 10, gap: 6 },
  refChip: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  refChipCourse: {
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  refChipLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  refChipText: { fontSize: 13, color: "#0f172a", marginTop: 2 },
  thinking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  error: { color: "#b91c1c", paddingHorizontal: 16, paddingBottom: 6 },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  sendBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: "#f8fafc", fontWeight: "600" },
});
