const API_BASE = process.env.API_BASE_URL ?? "http://api.1168lot.com/api/v1";

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function buildApiHeaders(token?: string, lang?: string, extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (lang) {
    headers["X-Language"] = lang;
    headers.language = lang;
    headers.lang = lang;
    headers.locale = lang;
  }

  if (extra) {
    const normalized = new Headers(extra);
    normalized.forEach((value, key) => {
      headers[key] = value;
    });
  }

  return headers;
}
