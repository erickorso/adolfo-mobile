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

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
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
  me: (token: string) =>
    request<User>("/api/v1/auth/me", { token }),
  jobs: (limit = 30) =>
    request<Job[]>(`/api/v1/jobs?limit=${limit}`),
  courses: (limit = 30) =>
    request<Course[]>(`/api/v1/courses?limit=${limit}`),
  health: () => request<{ ok: boolean; service: string }>("/health"),
};
