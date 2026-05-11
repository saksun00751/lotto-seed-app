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

function mapTokens(tokens: unknown): Theme {
  if (!tokens || typeof tokens !== "object") return DEFAULT_THEME;
  const source = tokens as Record<string, unknown>;
  const result: Partial<Theme> = {};
  for (const [tokenKey, themeKeys] of Object.entries(TOKEN_TO_THEME)) {
    const v = source[tokenKey];
    if (typeof v !== "string" || v.length === 0) continue;
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
    return mapTokens(data?.tokens);
  } catch {
    return DEFAULT_THEME;
  }
}

export function themeToCssVars(theme: Theme): Record<string, string> {
  const raw = Object.fromEntries(
    Object.entries(theme).map(([k, v]) => [`--${k}`, v])
  );

  const mix = (color: string, amount: number, base = "transparent") =>
    `color-mix(in srgb, ${color} ${amount}%, ${base})`;
  const gradient = (from: string, to: string) => `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

  const paletteSources: Record<string, string> = {
    slate: theme["ap-primary"],
    gray: theme["ap-tertiary"],
    zinc: theme["ap-tertiary"],
    neutral: theme["ap-tertiary"],
    stone: theme["ap-tertiary"],
    red: theme["ap-red"],
    rose: theme["ap-red"],
    orange: theme["ap-orange"],
    amber: theme["ap-orange"],
    yellow: theme["ap-orange"],
    green: theme["ap-green"],
    emerald: theme["ap-green"],
    lime: theme["ap-green"],
    teal: theme["ap-green"],
    blue: theme["ap-blue"],
    sky: theme["ap-blue"],
    cyan: theme["ap-blue"],
    indigo: theme["ap-blue"],
    violet: theme["ap-blue"],
    purple: theme["ap-blue"],
    fuchsia: theme["ap-blue"],
    pink: theme["ap-red"],
  };
  const shadeMix: Record<string, [number, string]> = {
    "50": [8, theme["ap-card"]],
    "100": [14, theme["ap-card"]],
    "200": [24, theme["ap-card"]],
    "300": [38, theme["ap-card"]],
    "400": [58, theme["ap-card"]],
    "500": [82, theme["ap-card"]],
    "600": [100, "transparent"],
    "700": [86, theme["ap-primary"]],
    "800": [72, theme["ap-primary"]],
    "900": [58, theme["ap-primary"]],
  };
  const palette = Object.fromEntries(
    Object.entries(paletteSources).flatMap(([name, source]) =>
      Object.entries(shadeMix).map(([shade, [amount, base]]) => [
        `--ui-${name}-${shade}`,
        mix(source, amount, base),
      ])
    )
  );

  const semantic = {
    "--ui-page-bg": theme["page-bg"],
    "--ui-surface": theme["ap-card"],
    "--ui-surface-muted": theme["ap-bg"],
    "--ui-surface-raised": mix(theme["ap-card"], 86, theme["ap-bg"]),
    "--ui-surface-overlay": mix(theme["ap-primary"], 42),
    "--ui-border": theme["ap-border"],
    "--ui-border-strong": mix(theme["ap-primary"], 26),
    "--ui-text": theme["ap-primary"],
    "--ui-text-muted": theme["ap-tertiary"],
    "--ui-text-soft": theme["ap-secondary"],
    "--ui-text-inverse": theme["ap-card"],
    "--ui-header-bg": theme["navbar-bg"],
    "--ui-header-text": theme["ap-primary"],
    "--ui-button-primary-bg": theme["ap-blue"],
    "--ui-button-primary-bg-hover": theme["ap-blue-h"],
    "--ui-button-primary-text": theme["ap-card"],
    "--ui-button-danger-bg": theme["ap-red"],
    "--ui-button-danger-text": theme["ap-card"],
    "--ui-button-secondary-bg": theme["ap-bg"],
    "--ui-button-secondary-text": theme["ap-primary"],
    "--ui-selected-bg": mix(theme["ap-blue"], 14, theme["ap-card"]),
    "--ui-selected-border": mix(theme["ap-blue"], 48, theme["ap-card"]),
    "--ui-disabled-bg": mix(theme["ap-tertiary"], 14, theme["ap-card"]),
    "--ui-disabled-text": theme["ap-tertiary"],
    "--ui-status-success-bg": mix(theme["ap-green"], 14, theme["ap-card"]),
    "--ui-status-success-border": mix(theme["ap-green"], 34, theme["ap-card"]),
    "--ui-status-success-text": theme["ap-green"],
    "--ui-status-warning-bg": mix(theme["ap-orange"], 14, theme["ap-card"]),
    "--ui-status-warning-border": mix(theme["ap-orange"], 34, theme["ap-card"]),
    "--ui-status-warning-text": theme["ap-orange"],
    "--ui-status-error-bg": mix(theme["ap-red"], 12, theme["ap-card"]),
    "--ui-status-error-border": mix(theme["ap-red"], 32, theme["ap-card"]),
    "--ui-status-error-text": theme["ap-red"],
    "--ui-status-info-bg": mix(theme["ap-blue"], 12, theme["ap-card"]),
    "--ui-status-info-border": mix(theme["ap-blue"], 30, theme["ap-card"]),
    "--ui-status-info-text": theme["ap-blue"],
    "--ui-alert-warning-bg": mix(theme["ap-orange"], 10, theme["ap-card"]),
    "--ui-alert-warning-border": mix(theme["ap-orange"], 28, theme["ap-card"]),
    "--ui-alert-warning-text": mix(theme["ap-orange"], 86, theme["ap-primary"]),
    "--ui-alert-error-bg": mix(theme["ap-red"], 10, theme["ap-card"]),
    "--ui-alert-error-border": mix(theme["ap-red"], 26, theme["ap-card"]),
    "--ui-alert-error-text": theme["ap-red"],
    "--ui-alert-info-bg": mix(theme["ap-blue"], 10, theme["ap-card"]),
    "--ui-alert-info-border": mix(theme["ap-blue"], 26, theme["ap-card"]),
    "--ui-alert-info-text": mix(theme["ap-blue"], 86, theme["ap-primary"]),
    "--ui-reward-bg": gradient(mix(theme["ap-orange"], 34, theme["ap-card"]), mix(theme["ap-orange"], 78, theme["ap-card"])),
    "--ui-reward-bg-strong": gradient(mix(theme["ap-orange"], 86, theme["ap-card"]), theme["ap-orange"]),
    "--ui-reward-text": mix(theme["ap-orange"], 80, theme["ap-primary"]),
    "--ui-reward-border": mix(theme["ap-orange"], 40, theme["ap-card"]),
    "--ui-contact-line": theme["ap-green"],
    "--ui-contact-telegram": theme["ap-blue"],
    "--ui-contact-default": theme["ap-blue"],
    "--ui-category-slot": gradient(theme["ap-red"], theme["ap-orange"]),
    "--ui-category-casino": gradient(theme["ap-orange"], theme["ap-blue"]),
    "--ui-category-sport": gradient(theme["ap-green"], theme["ap-blue"]),
    "--ui-category-card": gradient(theme["ap-blue"], theme["ap-red"]),
    "--ui-category-cock": gradient(theme["ap-orange"], theme["ap-red"]),
    "--ui-category-fish": gradient(theme["ap-blue"], theme["ap-green"]),
    "--ui-category-default": gradient(theme["ap-blue"], theme["ap-tertiary"]),
    "--ui-balance-text": theme["ap-card"],
    "--ui-balance-muted": mix(theme["ap-card"], 72, theme["balance-card-bg"]),
  };

  return { ...raw, ...palette, ...semantic };
}
