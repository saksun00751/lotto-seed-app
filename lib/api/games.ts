import { apiGet } from "./client";

// ── API response shapes ────────────────────────────────────────────────────

interface ApiGameType {
  id:          string;
  name:        string;
  status_open: string;
}

interface ApiProvider {
  provider:     string;
  providerName: string;
  logoURL?:     string;
  status?:      string;
}

interface ApiProvidersResponse {
  success: boolean;
  data?: ApiProvider[] | { providers?: ApiProvider[] };
}

// ── Public types ───────────────────────────────────────────────────────────

export interface GameProviderItem {
  id:        string;
  name:      string;
  filepic:   string;
  game_type: string;
}

export interface GameGroup {
  game_type: string;
  label:     string;
  emoji:     string;
  providers: GameProviderItem[];
}

// ── Meta ───────────────────────────────────────────────────────────────────

const GAME_TYPE_META: Record<string, { label: string; emoji: string }> = {
  SLOT:      { label: "สล็อต",                      emoji: "🎰" },
  CASINO:    { label: "คาสิโน",                    emoji: "♠️" },
  SPORT:     { label: "กีฬา",                       emoji: "⚽" },
  CARDGROUP: { label: "เกมไพ่ / โป๊กเกอร์ / คีโน่", emoji: "🀄" },
  COCK:      { label: "ไก่ชน",                      emoji: "🐓" },
  FISH:      { label: "ยิงปลา",                     emoji: "🐟" },
};

// card, poker, keno → merged into CARDGROUP
const CARD_GROUP_IDS = ["card", "poker", "keno"];
const TYPE_ORDER     = ["SLOT", "CASINO", "SPORT", "CARDGROUP", "COCK", "FISH"];

function isCardGroupType(id: string) {
  return id.toLowerCase() === "cardgroup";
}

function isCardGroupMember(id: string) {
  return CARD_GROUP_IDS.includes(id.toLowerCase());
}

export function getGameTypeMeta(id: string) {
  const key = isCardGroupMember(id) ? "CARDGROUP" : id.toUpperCase();
  return GAME_TYPE_META[key] ?? { label: id, emoji: "🎮" };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractProviders(data: ApiProvidersResponse["data"]): ApiProvider[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.providers ?? [];
}

// ── Fetchers ───────────────────────────────────────────────────────────────

export async function getAllGamesGroupedFromApi(
  token?: string,
  lang?: string
): Promise<GameGroup[]> {
  // 1. ดึงประเภทเกม — data เป็น array โดยตรง
  const typesRes = await apiGet<{ success: boolean; data?: ApiGameType[] }>("/games/types", token, lang);
  const allTypes: ApiGameType[] = (Array.isArray(typesRes?.data) ? typesRes.data : [])
    .filter((t) => t.status_open === "Y");

  if (allTypes.length === 0) return [];

  // 2. ดึง providers ของแต่ละ type พร้อมกัน
  const results = await Promise.allSettled(
    allTypes.map((t) =>
      apiGet<ApiProvidersResponse>(`/games/providers/${t.id}`, token, lang).then((res) => ({
        typeId:    t.id,
        providers: extractProviders(res?.data),
      }))
    )
  );

  // 3. รวม card/poker/keno เข้า CARDGROUP, type อื่นแยกกลุ่ม
  const merged = new Map<string, GameProviderItem[]>();

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { typeId, providers } = r.value;
    const groupKey = isCardGroupMember(typeId) ? "CARDGROUP" : typeId.toUpperCase();
    if (!merged.has(groupKey)) merged.set(groupKey, []);
    merged.get(groupKey)!.push(
      ...providers
        .filter((p) => !p.status || p.status === "ACTIVE")
        .map((p) => ({
          id:        p.provider,
          name:      p.providerName,
          filepic:   p.logoURL ?? "",
          game_type: typeId,
        }))
    );
  }

  // 4. แปลงเป็น GameGroup[] แล้วเรียง
  const groups: GameGroup[] = [...merged.entries()]
    .filter(([, providers]) => providers.length > 0)
    .map(([key, providers]) => {
      const meta = GAME_TYPE_META[key] ?? { label: key, emoji: "🎮" };
      return { game_type: key, label: meta.label, emoji: meta.emoji, providers };
    })
    .sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a.game_type);
      const bi = TYPE_ORDER.indexOf(b.game_type);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  return groups;
}

export async function getProvidersByTypeFromApi(
  gameType: string,
  token?: string,
  lang?: string
): Promise<GameProviderItem[]> {
  const typeId = gameType.toLowerCase();

  if (isCardGroupType(typeId)) {
    const results = await Promise.allSettled(
      CARD_GROUP_IDS.map((id) =>
        apiGet<ApiProvidersResponse>(`/games/providers/${id}`, token, lang).then((res) => ({
          typeId: id,
          providers: extractProviders(res?.data),
        }))
      )
    );

    return results.flatMap((r) => {
      if (r.status !== "fulfilled") return [];
      return r.value.providers
        .filter((p) => !p.status || p.status === "ACTIVE")
        .map((p) => ({
          id:        p.provider,
          name:      p.providerName,
          filepic:   p.logoURL ?? "",
          game_type: r.value.typeId,
        }));
    });
  }

  const res = await apiGet<ApiProvidersResponse>(`/games/providers/${typeId}`, token, lang);
  return extractProviders(res?.data)
    .filter((p) => !p.status || p.status === "ACTIVE")
    .map((p) => ({
      id:        p.provider,
      name:      p.providerName,
      filepic:   p.logoURL ?? "",
      game_type: typeId,
    }));
}
