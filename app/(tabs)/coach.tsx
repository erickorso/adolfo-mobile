import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "../../src/i18n/I18nProvider";
import {
  ApiError,
  api,
  type CoachChatMessage,
  type CoachConversation,
  type CoachCourseRef,
  type CoachJobRef,
} from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import {
  formatCoachShare,
  shareCoachCopy,
  shareCoachEmail,
  shareCoachWhatsApp,
} from "../../src/lib/coach-share";
import {
  clearGeminiApiKey,
  getAiQuotaHit,
  getGeminiApiKey,
  hasGeminiApiKey,
  maskGeminiKey,
  setAiQuotaHit,
  setGeminiApiKey,
} from "../../src/lib/gemini-key";
import { GeminiKeyInfoButton } from "../../src/lib/gemini-key-info-button";

type UiMessage = CoachChatMessage & {
  id: string;
  refs?: {
    jobs: CoachJobRef[];
    courses: CoachCourseRef[];
  };
};

function findQuestionForAssistant(
  messages: UiMessage[],
  assistantIndex: number,
): string | null {
  for (let i = assistantIndex - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      return messages[i].content;
    }
  }
  return null;
}

export default function CoachScreen() {
  const { t, i18n } = useTranslation();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuotaBanner, setShowQuotaBanner] = useState(false);
  const [usingByok, setUsingByok] = useState(false);
  const [keyModal, setKeyModal] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [keySaving, setKeySaving] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const listRef = useRef<FlatList<UiMessage>>(null);
  const draftRef = useRef(draft);
  const conversationIdRef = useRef<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  draftRef.current = draft;
  conversationIdRef.current = conversationId;

  const suggestions = useMemo(
    () => [t("coach.s1"), t("coach.s2"), t("coach.s3")],
    [t],
  );

  const shareLabels = useMemo(
    () => ({
      title: t("coach.shareTitle"),
      question: t("coach.shareQuestion"),
      answer: t("coach.shareAnswer"),
      refs: t("coach.shareRefs"),
      job: t("coach.shareJob"),
      course: t("coach.shareCourse"),
      footer: t("coach.shareFooter"),
      emailSubject: t("coach.shareEmailSubject"),
    }),
    [t],
  );

  const refreshKeyState = useCallback(async () => {
    const [hasKey, quotaHit] = await Promise.all([
      hasGeminiApiKey(),
      getAiQuotaHit(),
    ]);
    setUsingByok(hasKey);
    setShowQuotaBanner(quotaHit && !hasKey);
  }, []);

  useEffect(() => {
    void refreshKeyState();
  }, [refreshKeyState]);

  const reset = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setDraft("");
    setCopiedId(null);
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = null;
    }
  }, []);

  const openHistory = async () => {
    if (!token) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    setError(null);
    try {
      setConversations(await api.coachConversations(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("coach.historyFailed"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const openConversation = async (id: string) => {
    if (!token) return;
    setHistoryLoading(true);
    setError(null);
    try {
      const detail = await api.coachConversation(id, token);
      setConversationId(detail.id);
      setMessages(
        detail.messages.map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          refs: m.refs ?? undefined,
        })),
      );
      setHistoryOpen(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: false });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("coach.historyFailed"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteCoachConversation(id, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationIdRef.current === id) {
        reset();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("coach.deleteFailed"));
    }
  };

  const openKeyModal = async () => {
    const existing = await getGeminiApiKey();
    setKeyDraft(existing ?? "");
    setKeyModal(true);
  };

  const saveKeyFromModal = async () => {
    setKeySaving(true);
    setError(null);
    try {
      await setGeminiApiKey(keyDraft);
      setKeyModal(false);
      await refreshKeyState();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("coach.keySaveFailed"));
    } finally {
      setKeySaving(false);
    }
  };

  const removeKey = async () => {
    await clearGeminiApiKey();
    setKeyDraft("");
    setKeyModal(false);
    await refreshKeyState();
  };

  const shareTextFor = useCallback(
    (item: UiMessage, index: number) =>
      formatCoachShare({
        question: findQuestionForAssistant(messages, index),
        answer: item.content,
        refs: item.refs,
        labels: shareLabels,
      }),
    [messages, shareLabels],
  );

  const onCopy = async (item: UiMessage, index: number) => {
    try {
      await shareCoachCopy(shareTextFor(item, index));
      setCopiedId(item.id);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("coach.copyFailed"));
    }
  };

  const onWhatsApp = async (item: UiMessage, index: number) => {
    try {
      await shareCoachWhatsApp(shareTextFor(item, index));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("coach.whatsappFailed"));
    }
  };

  const onEmail = async (item: UiMessage, index: number) => {
    try {
      await shareCoachEmail(
        shareTextFor(item, index),
        t("coach.shareEmailSubject"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("coach.mailFailed"));
    }
  };

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

      const locale = i18n.language?.startsWith("es") ? "es" : "en";
      const res = await api.coachChat(
        {
          message: content,
          history,
          locale,
          conversation_id: conversationIdRef.current,
        },
        token,
      );
      setConversationId(res.conversation_id);
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
      if (e instanceof ApiError && e.code === "AI_QUOTA") {
        await setAiQuotaHit(true);
        setShowQuotaBanner(true);
        setError(e.message || t("coach.quotaError"));
      } else {
        setError(e instanceof Error ? e.message : t("coach.failed"));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!token || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>{t("coach.needAuthTitle")}</Text>
        <Text style={styles.emptyBody}>{t("coach.needAuthBody")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>{t("tabs.coachHeader")}</Text>
        <View style={styles.toolbarRight}>
          <Pressable
            onPress={() => void openHistory()}
            accessibilityRole="button"
            accessibilityLabel={t("coach.history")}
            hitSlop={8}
          >
            <Text style={styles.toolbarAction}>{t("coach.history")}</Text>
          </Pressable>
          <Pressable
            onPress={() => void openKeyModal()}
            accessibilityRole="button"
            accessibilityLabel={t("coach.configureGemini")}
            hitSlop={8}
          >
            <Text style={styles.toolbarAction}>
              {usingByok ? t("coach.myGemini") : t("coach.gemini")}
            </Text>
          </Pressable>
          <Pressable
            onPress={reset}
            accessibilityRole="button"
            accessibilityLabel={t("coach.newChat")}
            hitSlop={8}
          >
            <Text style={styles.toolbarAction}>{t("coach.newChat")}</Text>
          </Pressable>
        </View>
      </View>

      {showQuotaBanner ? (
        <View style={styles.banner} accessibilityRole="alert">
          <View style={styles.bannerTitleRow}>
            <Text style={styles.bannerText}>{t("coach.quotaBanner")}</Text>
            <GeminiKeyInfoButton color="#c2410c" />
          </View>
          <Pressable
            onPress={() => void openKeyModal()}
            accessibilityRole="button"
            accessibilityLabel={t("coach.addGemini")}
          >
            <Text style={styles.bannerCta}>{t("coach.addGemini")}</Text>
          </Pressable>
        </View>
      ) : null}

      {usingByok ? (
        <Text style={styles.byokHint}>{t("coach.usingByok")}</Text>
      ) : null}

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
              <Text style={styles.hint}>{t("coach.tryPrompt")}</Text>
              {suggestions.map((s) => (
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
        renderItem={({ item, index }) => (
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
                    <Text style={styles.refChipLabel}>{t("coach.shareJob")}</Text>
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
                    <Text style={styles.refChipLabel}>
                      {t("coach.shareCourse")}
                    </Text>
                    <Text style={styles.refChipText} numberOfLines={1}>
                      {c.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {item.role === "assistant" ? (
              <View style={styles.shareRow}>
                <Pressable
                  onPress={() => void onCopy(item, index)}
                  accessibilityRole="button"
                  accessibilityLabel={t("coach.copy")}
                  hitSlop={6}
                >
                  <Text style={styles.shareAction}>
                    {copiedId === item.id ? t("coach.copied") : t("coach.copy")}
                  </Text>
                </Pressable>
                <Text style={styles.shareSep}>·</Text>
                <Pressable
                  onPress={() => void onWhatsApp(item, index)}
                  accessibilityRole="button"
                  accessibilityLabel={t("coach.whatsapp")}
                  hitSlop={6}
                >
                  <Text style={styles.shareAction}>{t("coach.whatsapp")}</Text>
                </Pressable>
                <Text style={styles.shareSep}>·</Text>
                <Pressable
                  onPress={() => void onEmail(item, index)}
                  accessibilityRole="button"
                  accessibilityLabel={t("coach.mail")}
                  hitSlop={6}
                >
                  <Text style={styles.shareAction}>{t("coach.mail")}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={
          busy ? (
            <View style={styles.thinking}>
              <ActivityIndicator color="#0f172a" />
              <Text style={styles.hint}>{t("coach.thinking")}</Text>
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
          placeholder={t("coach.placeholder")}
          placeholderTextColor="#94a3b8"
          editable={!busy}
          multiline
          maxLength={2000}
          accessibilityLabel={t("coach.placeholder")}
        />
        <Pressable
          style={[styles.sendBtn, (busy || !draft.trim()) && styles.sendDisabled]}
          onPress={() => void send()}
          disabled={busy || !draft.trim()}
          accessibilityRole="button"
          accessibilityLabel={t("coach.send")}
          hitSlop={8}
        >
          <Text style={styles.sendText}>{t("coach.send")}</Text>
        </Pressable>
      </View>

      <Modal
        visible={historyOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setHistoryOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{t("coach.history")}</Text>
          <Text style={styles.modalBody}>{t("coach.historyHint")}</Text>
          {historyLoading ? (
            <ActivityIndicator color="#0f172a" />
          ) : conversations.length === 0 ? (
            <Text style={styles.hint}>{t("coach.historyEmpty")}</Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              style={styles.historyList}
              renderItem={({ item }) => (
                <View style={styles.historyRow}>
                  <Pressable
                    style={styles.historyMain}
                    onPress={() => void openConversation(item.id)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.hint}>
                      {item.message_count} ·{" "}
                      {new Date(item.updated_at).toLocaleString()}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void deleteConversation(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.remove")}
                    hitSlop={8}
                  >
                    <Text style={styles.dangerAction}>{t("common.remove")}</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
          <Pressable
            style={[styles.sendBtn, { alignSelf: "flex-end", marginTop: 8 }]}
            onPress={() => {
              reset();
              setHistoryOpen(false);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.sendText}>{t("coach.newChat")}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={keyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setKeyModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setKeyModal(false)}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalTitle}>{t("coach.modalTitle")}</Text>
            <GeminiKeyInfoButton />
          </View>
          <Text style={styles.modalBody}>{t("coach.modalBody")}</Text>
          <TextInput
            style={styles.modalInput}
            value={keyDraft}
            onChangeText={setKeyDraft}
            placeholder={t("scope.geminiPlaceholder")}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            accessibilityLabel={t("coach.modalTitle")}
          />
          {keyDraft.trim() ? (
            <Text style={styles.hint}>
              {t("coach.modalPreview", { masked: maskGeminiKey(keyDraft) })}
            </Text>
          ) : null}
          <View style={styles.modalActions}>
            <Pressable
              onPress={() => setKeyModal(false)}
              accessibilityRole="button"
            >
              <Text style={styles.toolbarAction}>{t("common.later")}</Text>
            </Pressable>
            {usingByok || keyDraft.trim() ? (
              <Pressable onPress={() => void removeKey()} accessibilityRole="button">
                <Text style={styles.dangerAction}>{t("common.remove")}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.sendBtn, keySaving && styles.sendDisabled]}
              onPress={() => void saveKeyFromModal()}
              disabled={keySaving}
              accessibilityRole="button"
              accessibilityLabel={t("common.save")}
            >
              <Text style={styles.sendText}>
                {keySaving ? "…" : t("common.save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  toolbarRight: { flexDirection: "row", gap: 16, alignItems: "center" },
  toolbarTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  toolbarAction: { fontSize: 14, fontWeight: "600", color: "#0369a1" },
  banner: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    gap: 8,
  },
  bannerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bannerText: { flex: 1, fontSize: 13, color: "#9a3412", lineHeight: 18 },
  bannerCta: { fontSize: 14, fontWeight: "700", color: "#c2410c" },
  byokHint: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 12,
    color: "#047857",
    fontWeight: "600",
  },
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
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  shareAction: { fontSize: 13, fontWeight: "600", color: "#0369a1" },
  shareSep: { fontSize: 13, color: "#94a3b8" },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 10,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", flex: 1 },
  modalBody: { fontSize: 14, color: "#64748b", lineHeight: 20 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 8,
  },
  dangerAction: { fontSize: 14, fontWeight: "600", color: "#b91c1c" },
  historyList: { maxHeight: 320 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  historyMain: { flex: 1, gap: 2 },
  historyTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
});
