interface SiteMeta {
  logo: string;
  title: string;
  name: string;
  description: string;
  header_code?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;

function isSiteMeta(value: unknown): value is SiteMeta {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.logo === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.description === "string" &&
    (candidate.header_code === undefined ||
      candidate.header_code === null ||
      typeof candidate.header_code === "string")
  );
}

export async function getSiteMeta(): Promise<SiteMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/meta/site`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      redirect: "manual",
      cache: "no-store",
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as unknown;
    if (isSiteMeta(payload)) return payload;

    if (payload && typeof payload === "object") {
      const maybeData = (payload as { data?: unknown }).data;
      if (isSiteMeta(maybeData)) return maybeData;
    }

    return null;
  } catch {
    return null;
  }
}

export function getLogoUrl(logo: string): string {
  const base = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";
  return `${base}${logo}`;
}
