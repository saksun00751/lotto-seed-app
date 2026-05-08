import { cache } from "react";

export interface Theme {
  "surface-subtle": string;
  "surface-card": string;
  "surface-page": string;
  "surface-navbar": string;
  "surface-highlight": string;
  "brand-primary": string;
  "brand-primary-hover": string;
  "text-strong": string;
  "text-default": string;
  "text-muted": string;
  "border-default": string;
  "status-error": string;
  "status-success": string;
  "status-warning": string;
}

export const THEME_KEYS: ReadonlyArray<keyof Theme> = [
  "surface-subtle",
  "surface-card",
  "surface-page",
  "surface-navbar",
  "surface-highlight",
  "brand-primary",
  "brand-primary-hover",
  "text-strong",
  "text-default",
  "text-muted",
  "border-default",
  "status-error",
  "status-success",
  "status-warning",
];

export const DEFAULT_THEME: Theme = {
  "surface-subtle": "#edf1f6",
  "surface-card": "#ffffff",
  "surface-page": "#edf1f6",
  "surface-navbar": "rgba(255,255,255,0.96)",
  "surface-highlight": "#0071e3",
  "brand-primary": "#0071e3",
  "brand-primary-hover": "#0077ed",
  "text-strong": "#0f172a",
  "text-default": "#334155",
  "text-muted": "#64748b",
  "border-default": "rgba(15, 23, 42, 0.14)",
  "status-error": "#ff3b30",
  "status-success": "#34c759",
  "status-warning": "#ff9500",
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/;

export function isValidColor(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return HEX_RE.test(trimmed) || RGB_RE.test(trimmed);
}

export function isTheme(value: unknown): value is Theme {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  for (const key of THEME_KEYS) {
    if (!isValidColor(candidate[key])) return false;
  }
  return true;
}

export const getTheme = cache(async function getTheme(): Promise<Theme> {
  try {
    const res = await fetch(`${API_BASE}/meta/theme`, {
      method:   "GET",
      headers:  { "Content-Type": "application/json" },
      redirect: "manual",
      next:     { revalidate: 300, tags: ["theme"] },
    });
    if (!res.ok) return DEFAULT_THEME;

    const payload = (await res.json()) as unknown;
    if (isTheme(payload)) return payload;

    if (payload && typeof payload === "object") {
      const maybeData = (payload as { data?: unknown }).data;
      if (isTheme(maybeData)) return maybeData;
    }

    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
});

export function themeToCssVars(theme: Theme): Record<string, string> {
  return Object.fromEntries(
    Object.entries(theme).map(([k, v]) => [`--${k}`, v])
  );
}
