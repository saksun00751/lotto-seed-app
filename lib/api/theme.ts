export interface Theme {
  "ap-bg": string;
  "ap-card": string;
  "ap-blue": string;
  "ap-blue-h": string;
  "ap-primary": string;
  "ap-secondary": string;
  "ap-tertiary": string;
  "ap-border": string;
  "ap-red": string;
  "ap-green": string;
  "ap-orange": string;
  "page-bg": string;
  "navbar-bg": string;
  "balance-card-bg": string;
}

const DEFAULT_THEME: Theme = {
  "ap-bg": "#edf1f6",
  "ap-card": "#ffffff",
  "ap-blue": "#0071e3",
  "ap-blue-h": "#0077ed",
  "ap-primary": "#0f172a",
  "ap-secondary": "#334155",
  "ap-tertiary": "#64748b",
  "ap-border": "rgba(15, 23, 42, 0.14)",
  "ap-red": "#ff3b30",
  "ap-green": "#34c759",
  "ap-orange": "#ff9500",
  "page-bg": "#edf1f6",
  "navbar-bg": "rgba(255,255,255,0.96)",
  "balance-card-bg": "#0071e3",
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;

const TOKEN_TO_THEME: Record<string, (keyof Theme)[]> = {
  "surface-subtle": ["ap-bg"],
  "surface-card": ["ap-card"],
  "surface-page": ["page-bg"],
  "surface-navbar": ["navbar-bg"],
  "surface-highlight": ["balance-card-bg"],
  "brand-primary": ["ap-blue"],
  "brand-primary-hover": ["ap-blue-h"],
  "text-strong": ["ap-primary"],
  "text-default": ["ap-secondary"],
  "text-muted": ["ap-tertiary"],
  "border-default": ["ap-border"],
  "status-error": ["ap-red"],
  "status-success": ["ap-green"],
  "status-warning": ["ap-orange"],
};

function mapTokens(tokens: unknown): Theme | null {
  if (!tokens || typeof tokens !== "object") return null;
  const source = tokens as Record<string, unknown>;
  const result: Partial<Theme> = {};
  for (const [tokenKey, themeKeys] of Object.entries(TOKEN_TO_THEME)) {
    const v = source[tokenKey];
    if (typeof v !== "string" || v.length === 0) return null;
    for (const themeKey of themeKeys) {
      result[themeKey] = v;
    }
  }
  return { ...DEFAULT_THEME, ...result };
}

export async function getTheme(): Promise<Theme> {
  try {
    const res = await fetch(`${API_BASE}/theme`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      redirect: "manual",
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_THEME;

    const payload = (await res.json()) as unknown;
    if (!payload || typeof payload !== "object") return DEFAULT_THEME;

    const data = (payload as { data?: { tokens?: unknown } }).data;
    const mapped = mapTokens(data?.tokens);
    return mapped ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function themeToCssVars(theme: Theme): Record<string, string> {
  return Object.fromEntries(
    Object.entries(theme).map(([k, v]) => [`--${k}`, v])
  );
}
