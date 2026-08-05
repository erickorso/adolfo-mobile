import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/lib/auth-context";
import { I18nProvider } from "../src/i18n/I18nProvider";

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </I18nProvider>
  );
}
