import { getGeminiApiKey } from "./gemini-key";

/** Base URL del BFF FastAPI (adolfo/services/mobile-api). */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:4002";

export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
};

export type SearchScopeApi = {
  job_keywords: string[];
  job_query: string;
  course_query: string;
};

export type IngestResult = {
  ingested: number;
  sources?: string[];
  query?: { keywords?: string[]; remoteOnly?: boolean };
  imagen_semana?: unknown;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
  scope?: SearchScopeApi | null;
  ingest?: IngestResult | null;
  ingest_error?: string | null;
};

export type Job = {
  id: string;
  source: string;
  company: string;
  title: string;
  location: string | null;
  remote: boolean;
  url: string;
  posted_at: string | null;
};

export type Course = {
  id: string;
  title: string;
  provider: string;
  url: string;
  hours: number;
  modality: string;
  sector: string | null;
  location: string | null;
  target_audience: string | null;
  free: boolean;
};

export type CoachChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachJobRef = {
  id: string;
  title: string;
  company: string;
  url: string;
};

export type CoachCourseRef = {
  id: string;
  title: string;
  provider: string;
  hours: number;
  url: string;
};

export type CoachChatResponse = {
  reply: string;
  refs: {
    jobs: CoachJobRef[];
    courses: CoachCourseRef[];
  };
  provider?: string | null;
  conversation_id: string;
};

export type CoachConversation = {
  id: string;
  title: string;
  locale: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

export type CoachMessageStored = {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  created_at: string;
  refs?: {
    jobs: CoachJobRef[];
    courses: CoachCourseRef[];
  } | null;
  provider?: string | null;
};

export type CoachConversationDetail = {
  id: string;
  title: string;
  locale: string;
  created_at: string;
  updated_at: string;
  messages: CoachMessageStored[];
};

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSec?: number;

  constructor(
    status: number,
    message: string,
    opts?: { code?: string; retryAfterSec?: number },
  ) {
    super(message);
    this.status = status;
    this.code = opts?.code;
    this.retryAfterSec = opts?.retryAfterSec;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    let code: string | undefined;
    let retryAfterSec: number | undefined;
    try {
      const body = (await res.json()) as {
        detail?: unknown;
        error?: string;
        code?: string;
        retryAfterSec?: number;
      };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (body.detail && typeof body.detail === "object") {
        const d = body.detail as {
          message?: string;
          code?: string;
          retryAfterSec?: number;
        };
        detail = d.message || detail;
        code = d.code;
        retryAfterSec = d.retryAfterSec;
      } else if (typeof body.error === "string") {
        detail = body.error;
      }
      if (typeof body.code === "string") code = body.code;
      if (typeof body.retryAfterSec === "number") {
        retryAfterSec = body.retryAfterSec;
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail, { code, retryAfterSec });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name?: string) =>
    request<TokenResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  me: (token: string) => request<User>("/api/v1/auth/me", { token }),
  getScope: (token: string) =>
    request<SearchScopeApi>("/api/v1/me/scope", { token }),
  putScope: (
    body: {
      job_keywords?: string[];
      job_query?: string;
      course_query?: string;
    },
    token: string,
  ) =>
    request<SearchScopeApi>("/api/v1/me/scope", {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),
  jobs: (opts: { limit?: number; q?: string; keywords?: string[] } = {}) => {
    const { limit = 30, q, keywords } = opts;
    return request<Job[]>(
      `/api/v1/jobs${qs({
        limit,
        q,
        keywords: keywords?.length ? keywords.join(",") : undefined,
      })}`,
    );
  },
  courses: (opts: { limit?: number; q?: string } = {}) => {
    const { limit = 30, q } = opts;
    return request<Course[]>(`/api/v1/courses${qs({ limit, q })}`);
  },
  ingestJobs: (opts: { keywords?: string[]; remoteOnly?: boolean } = {}) =>
    request<IngestResult>("/api/v1/jobs/ingest", {
      method: "POST",
      body: JSON.stringify({
        keywords: opts.keywords,
        remote_only: opts.remoteOnly,
      }),
    }),
  coachChat: async (
    body: {
      message: string;
      history?: CoachChatMessage[];
      locale?: string;
      conversation_id?: string | null;
    },
    token: string,
  ) => {
    const userKey = await getGeminiApiKey();
    return request<CoachChatResponse>("/api/v1/coach/chat", {
      method: "POST",
      token,
      headers: userKey ? { "X-User-Gemini-Key": userKey } : undefined,
      body: JSON.stringify(body),
    });
  },
  coachConversations: (token: string) =>
    request<CoachConversation[]>("/api/v1/coach/conversations", { token }),
  coachConversation: (id: string, token: string) =>
    request<CoachConversationDetail>(`/api/v1/coach/conversations/${id}`, {
      token,
    }),
  createCoachConversation: (token: string, locale?: string) =>
    request<CoachConversation>(
      `/api/v1/coach/conversations${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`,
      { method: "POST", token },
    ),
  deleteCoachConversation: (id: string, token: string) =>
    request<void>(`/api/v1/coach/conversations/${id}`, {
      method: "DELETE",
      token,
    }),
  health: () => request<{ ok: boolean; service: string }>("/health"),
};
