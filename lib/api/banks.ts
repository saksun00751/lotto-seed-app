import { cache } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;

export interface ApiBankItem {
  code: number;
  name_th: string;
  shortcode: string;
  image_url: string;
}

interface BanksResponse {
  data?: { banks?: ApiBankItem[] };
}

export const getBanks = cache(async (): Promise<ApiBankItem[]> => {
  try {
    const res = await fetch(`${API_BASE}/auth/register/banks`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      redirect: "manual",
      next: { revalidate: 3600, tags: ["banks"] },
    });
    if (!res.ok) return [];

    const payload = (await res.json()) as BanksResponse;
    return Array.isArray(payload?.data?.banks) ? payload.data.banks : [];
  } catch {
    return [];
  }
});
