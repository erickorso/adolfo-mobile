import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { api, type TokenResponse, type User } from "./api";
import { applyServerScope, syncScopeFromServer } from "./scope";

const TOKEN_KEY = "adolfo_mobile_token";

async function saveToken(token: string | null) {
  if (Platform.OS === "web") {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

async function loadToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  lastIngest: TokenResponse["ingest"];
  lastIngestError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastIngest, setLastIngest] = useState<TokenResponse["ingest"]>(null);
  const [lastIngestError, setLastIngestError] = useState<string | null>(null);

  const applyAuth = useCallback(async (res: TokenResponse) => {
    await saveToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setLastIngest(res.ingest ?? null);
    setLastIngestError(res.ingest_error ?? null);
    await applyServerScope(res.scope);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadToken();
        if (!stored || cancelled) {
          return;
        }
        const me = await api.me(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(me);
        await syncScopeFromServer(stored);
      } catch {
        await saveToken(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      await applyAuth(res);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await api.register(email, password, name);
      await applyAuth(res);
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    await saveToken(null);
    setToken(null);
    setUser(null);
    setLastIngest(null);
    setLastIngestError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      lastIngest,
      lastIngestError,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      loading,
      lastIngest,
      lastIngestError,
      login,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
