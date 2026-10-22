import { getEventSlug } from "./event-scope";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

/**
 * Auth token held in memory only. The server also sets an httpOnly cookie, but
 * the app runs inside a sandboxed cross-origin iframe where cookies may be
 * dropped, so the token is echoed back in the response body and sent as a
 * bearer header. Trade-off: a hard refresh signs the admin out.
 */
let authToken: string | null = null;

const TOKEN_KEY = "rsvp_host_token";

export function setAuthToken(token: string | null) {
  authToken = token;
  // Platform hosts survive a refresh. Leah's original admin stays memory-only.
  try {
    if (!getEventSlug()) return;
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sandboxed contexts can block storage */
  }
}

export function restoreAuthToken() {
  if (authToken || !getEventSlug()) return;
  try {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) authToken = saved;
  } catch {
    /* ignore */
  }
}

export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const slug = getEventSlug();
  if (slug) headers["X-Event-Slug"] = slug;
  return headers;
}

export function getAuthToken() {
  return authToken;
}

export async function api<T = any>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders() };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return data as T;
}

export function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}
