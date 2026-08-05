import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { GEMINI_KEY_HELP_URL } from "./gemini-key";

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Icono info → Google AI Studio (crear API key Gemini). */
export function GeminiKeyInfoButton({
  size = 20,
  color = "#0369a1",
  style,
}: Props) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(GEMINI_KEY_HELP_URL)}
      accessibilityRole="link"
      accessibilityLabel="Cómo obtener una API key de Gemini en Google AI Studio"
      hitSlop={10}
      style={[styles.hit, style]}
    >
      <Ionicons name="information-circle-outline" size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { padding: 2 },
});
