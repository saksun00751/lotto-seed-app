const API_BASE = process.env.API_BASE_URL ?? "http://api.1168lot.com/api/v1";
const API_ERROR_EVENT = "app:api-error";

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

function buildHeaders(token?: string, lang?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (lang) {
    headers["X-Language"] = lang;
    headers["language"]   = lang;
    headers["lang"]       = lang;
    headers["locale"]     = lang;
  }
  return headers;
}

function emitApiError(message: string, status?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: { message, status } }));
}

async function parseResponse<T>(res: Response, token?: string, lang?: string): Promise<T> {
  // Follow redirects manually so Authorization header is preserved
  if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
    const location = res.headers.get("location");
    if (location) {
      const redirected = await fetch(location, {
        method:  "GET",
        headers: buildHeaders(token, lang),
        cache:   "no-store",
      });
      return parseResponse<T>(redirected, token, lang);
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let payload: unknown;
    try {
      const err = await res.json();
      payload = err;
      let raw: unknown = err.message ?? err.error ?? message;
      // If the message itself is a JSON string, try to unwrap it
      if (typeof raw === "string") {
        try {
          const nested = JSON.parse(raw);
          if (nested && typeof nested === "object") {
            raw = (nested as Record<string, unknown>).message
              ?? (nested as Record<string, unknown>).error
              ?? message;
            // Also merge nested errors into payload so field parsing works
            if (!payload || typeof payload !== "object") payload = nested;
            else if (!(payload as Record<string, unknown>).errors && (nested as Record<string, unknown>).errors) {
              (payload as Record<string, unknown>).errors = (nested as Record<string, unknown>).errors;
            }
          }
        } catch {}
      }
      message = typeof raw === "string" ? raw : String(raw ?? message);
    } catch {}
    emitApiError(message, res.status);
    throw new ApiError(res.status, message, payload);
  }

  const json = await res.json() as Record<string, unknown>;

  // Handle standard { success: false, message: "..." } response
  if (json.success === false) {
    const message = String(json.message ?? "Request failed");
    emitApiError(message, res.status);
    throw new ApiError(res.status, message, json);
  }

  return json as T;
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  token?: string,
  lang?: string,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:   "POST",
    headers:  buildHeaders(token, lang),
    body:     JSON.stringify(body),
    cache:    "no-store",
    redirect: "manual",
  });
  return parseResponse<T>(res, token, lang);
}

export async function apiGet<T = unknown>(
  path: string,
  token?: string,
  lang?: string,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:   "GET",
    headers:  buildHeaders(token, lang),
    cache:    "no-store",
    redirect: "manual",
  });
  return parseResponse<T>(res, token, lang);
}
