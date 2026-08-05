import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAppLocale, setAppLocale, type AppLocale } from "./index";
import { useTranslation } from "./I18nProvider";

type Props = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: Props) {
  const { t, i18n } = useTranslation();
  const current: AppLocale = i18n.language?.startsWith("es") ? "es" : "en";

  const select = async (locale: AppLocale) => {
    if (locale === getAppLocale()) return;
    await setAppLocale(locale);
  };

  return (
    <View
      style={[styles.row, compact && styles.rowCompact]}
      accessibilityRole="radiogroup"
      accessibilityLabel={t("common.language")}
    >
      {!compact ? (
        <Text style={styles.label}>{t("common.language")}</Text>
      ) : null}
      <View style={styles.pills}>
        <Pressable
          style={[styles.pill, current === "es" && styles.pillActive]}
          onPress={() => void select("es")}
          accessibilityRole="radio"
          accessibilityState={{ selected: current === "es" }}
          accessibilityLabel={t("common.spanish")}
        >
          <Text
            style={[styles.pillText, current === "es" && styles.pillTextActive]}
          >
            ES
          </Text>
        </Pressable>
        <Pressable
          style={[styles.pill, current === "en" && styles.pillActive]}
          onPress={() => void select("en")}
          accessibilityRole="radio"
          accessibilityState={{ selected: current === "en" }}
          accessibilityLabel={t("common.english")}
        >
          <Text
            style={[styles.pillText, current === "en" && styles.pillTextActive]}
          >
            EN
          </Text>
        </Pressable>
        {compact ? (
          <Ionicons
            name="language-outline"
            size={16}
            color="#64748b"
            style={styles.icon}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginVertical: 8,
  },
  rowCompact: { justifyContent: "flex-end", marginVertical: 0 },
  label: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  pills: { flexDirection: "row", alignItems: "center", gap: 6 },
  pill: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  pillText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  pillTextActive: { color: "#f8fafc" },
  icon: { marginLeft: 4 },
});
