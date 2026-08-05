import * as SecureStore from "expo-secure-store";

const KEY_STORE = "adolfo.gemini_api_key";
const QUOTA_FLAG = "adolfo.ai_quota_hit";

export const GEMINI_KEY_HELP_URL = "https://aistudio.google.com/apikey";

export async function getGeminiApiKey(): Promise<string | null> {
  try {
    const v = await SecureStore.getItemAsync(KEY_STORE);
    return v?.trim() || null;
  } catch {
    return null;
  }
}

export async function setGeminiApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    await clearGeminiApiKey();
    return;
  }
  await SecureStore.setItemAsync(KEY_STORE, trimmed);
  await clearAiQuotaHit();
}

export async function clearGeminiApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY_STORE);
  } catch {
    /* ignore */
  }
}

export async function hasGeminiApiKey(): Promise<boolean> {
  return Boolean(await getGeminiApiKey());
}

export async function setAiQuotaHit(hit = true): Promise<void> {
  try {
    if (hit) {
      await SecureStore.setItemAsync(QUOTA_FLAG, "1");
    } else {
      await SecureStore.deleteItemAsync(QUOTA_FLAG);
    }
  } catch {
    /* ignore */
  }
}

export async function clearAiQuotaHit(): Promise<void> {
  await setAiQuotaHit(false);
}

export async function getAiQuotaHit(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(QUOTA_FLAG)) === "1";
  } catch {
    return false;
  }
}

export function maskGeminiKey(key: string): string {
  const t = key.trim();
  if (t.length <= 8) return "••••";
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}
