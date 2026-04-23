import { cache } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;

export interface ContactChannel {
  code: number;
  type: string;
  label: string;
  link: string;
  sort: number;
}

interface ContactChannelsResponse {
  success?: boolean;
  data?: { contact_channels?: ContactChannel[] };
}

function buildHeaders(lang?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (lang) {
    headers["X-Language"] = lang;
    headers.language = lang;
    headers.lang = lang;
    headers.locale = lang;
  }
  return headers;
}

export const getContactChannels = cache(async (lang?: string): Promise<ContactChannel[]> => {
  try {
    const res = await fetch(`${API_BASE}/meta/contact-channels`, {
      method: "GET",
      headers: buildHeaders(lang),
      redirect: "manual",
      next: { revalidate: 600, tags: ["contact-channels"] },
    });
    if (!res.ok) return [];

    const payload = (await res.json()) as ContactChannelsResponse;
    const channels = payload?.data?.contact_channels;
    if (!Array.isArray(channels)) return [];

    return [...channels].sort((a, b) => a.sort - b.sort);
  } catch {
    return [];
  }
});
