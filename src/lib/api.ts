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
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }

  return (await res.json()) as T;
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
  coachChat: (
    body: { message: string; history?: CoachChatMessage[] },
    token: string,
  ) =>
    request<CoachChatResponse>("/api/v1/coach/chat", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  health: () => request<{ ok: boolean; service: string }>("/health"),
};
