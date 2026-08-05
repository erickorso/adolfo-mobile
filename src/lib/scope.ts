import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { api, type SearchScopeApi } from "./api";

const SCOPE_KEY = "adolfo.scope.v1";

export type SearchScope = {
  /** Keywords CSV-friendly para ingest + listado jobs. */
  jobKeywords: string[];
  /** Última búsqueda libre en Jobs. */
  jobQuery: string;
  /** Query default / última en Courses. */
  courseQuery: string;
};

export const DEFAULT_SCOPE: SearchScope = {
  jobKeywords: [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node",
    "frontend",
    "full stack",
  ],
  jobQuery: "",
  courseQuery: "",
};

export function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function fromApiScope(scope: SearchScopeApi): SearchScope {
  return {
    jobKeywords:
      scope.job_keywords?.length > 0
        ? scope.job_keywords
        : DEFAULT_SCOPE.jobKeywords,
    jobQuery: scope.job_query ?? "",
    courseQuery: scope.course_query ?? "",
  };
}

async function readLocal(): Promise<SearchScope> {
  try {
    const raw =
      Platform.OS === "web"
        ? localStorage.getItem(SCOPE_KEY)
        : await SecureStore.getItemAsync(SCOPE_KEY);
    if (!raw) return { ...DEFAULT_SCOPE };
    const parsed = JSON.parse(raw) as Partial<SearchScope>;
    return {
      jobKeywords:
        Array.isArray(parsed.jobKeywords) && parsed.jobKeywords.length > 0
          ? parsed.jobKeywords.map(String)
          : DEFAULT_SCOPE.jobKeywords,
      jobQuery:
        typeof parsed.jobQuery === "string"
          ? parsed.jobQuery
          : DEFAULT_SCOPE.jobQuery,
      courseQuery:
        typeof parsed.courseQuery === "string"
          ? parsed.courseQuery
          : DEFAULT_SCOPE.courseQuery,
    };
  } catch {
    return { ...DEFAULT_SCOPE };
  }
}

async function writeLocal(scope: SearchScope): Promise<void> {
  const payload = JSON.stringify(scope);
  if (Platform.OS === "web") {
    localStorage.setItem(SCOPE_KEY, payload);
    return;
  }
  await SecureStore.setItemAsync(SCOPE_KEY, payload);
}

/** Cache local (offline). Preferí syncWithServer cuando hay token. */
export async function loadScope(): Promise<SearchScope> {
  return readLocal();
}

export async function saveScope(
  scope: SearchScope,
  token?: string | null,
): Promise<SearchScope> {
  await writeLocal(scope);
  if (!token) return scope;
  const saved = await api.putScope(
    {
      job_keywords: scope.jobKeywords,
      job_query: scope.jobQuery,
      course_query: scope.courseQuery,
    },
    token,
  );
  const next = fromApiScope(saved);
  await writeLocal(next);
  return next;
}

/** Tras login: aplica scope del server al cache local. */
export async function applyServerScope(
  apiScope: SearchScopeApi | null | undefined,
): Promise<SearchScope> {
  if (!apiScope) return readLocal();
  const next = fromApiScope(apiScope);
  await writeLocal(next);
  return next;
}

/** Carga scope del usuario autenticado (server → local). */
export async function syncScopeFromServer(
  token: string,
): Promise<SearchScope> {
  const remote = await api.getScope(token);
  return applyServerScope(remote);
}
