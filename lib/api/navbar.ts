import { cache } from "react";

export interface NavbarItem {
  key:          string;
  item_type:    "normal" | "center_cta";
  icon_type:    string;
  icon:         string;
  label:        string;
  label_i18n:   Record<string, string>;
  action_type:  string;
  action_value: string;
  sort_order:   number;
}

export interface NavbarConfigResponse {
  success: boolean;
  data: {
    language: string;
    navbar: {
      code:              string;
      published_version: number;
      items:             NavbarItem[];
    };
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;

function buildHeaders(token?: string, lang?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (lang) {
    headers["X-Language"] = lang;
    headers.language = lang;
    headers.lang = lang;
    headers.locale = lang;
  }
  return headers;
}

export const getNavbarConfig = cache(async (token?: string, lang?: string): Promise<NavbarItem[] | null> => {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/lotto/navbar-config`, {
      method: "GET",
      headers: buildHeaders(token, lang),
      redirect: "manual",
      next: { revalidate: 300, tags: ["navbar-config"] },
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as NavbarConfigResponse;
    const items = payload?.data?.navbar?.items;
    if (!Array.isArray(items)) return null;

    return [...items].sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return null;
  }
});
