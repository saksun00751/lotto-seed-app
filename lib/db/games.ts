import { prisma } from "./prisma";

export interface GameTypeRow {
  code:    number;
  id:      string;
  title:   string;
  filepic: string;
  icon:    string | null;
  content: string;
}

export interface GameSeamlessRow {
  code:      number;
  id:        string;
  game_type: string;
  name:      string;
  filepic:   string;
  icon:      string;
  sort:      number;
}

export interface GameTypeGroup {
  game_type: string;
  count:     number;
  label:     string;
  emoji:     string;
}

const GAME_TYPE_META: Record<string, { label: string; emoji: string }> = {
  SLOT:      { label: "สล็อต",                      emoji: "🎰" },
  CASINO:    { label: "คาสิโน",                    emoji: "♠️" },
  SPORT:     { label: "กีฬา",                       emoji: "⚽" },
  CARDGROUP: { label: "เกมไพ่ / โป๊กเกอร์ / คีโน่", emoji: "🀄" },
  COCK:      { label: "ไก่ชน",                      emoji: "🐓" },
  FISH:      { label: "ยิงปลา",                     emoji: "🐟" },
};

// types ที่รวมอยู่ใน CARDGROUP
const CARD_GROUP_TYPES = ["CARD", "POKER", "KENO"];

export function getGameTypeMeta(id: string) {
  return GAME_TYPE_META[id] ?? { label: id, emoji: "🎮" };
}

export async function getGameTypeGroups(): Promise<GameTypeGroup[]> {
  const groups = await prisma.games_seamless.groupBy({
    by:    ["game_type"],
    where: { status_open: "Y", enable: "Y" },
    _count: { code: true },
  });

  const order = ["SLOT", "CASINO", "SPORT", "CARDGROUP", "COCK", "FISH"];
  const merged = new Map<string, number>();

  for (const g of groups) {
    const key = CARD_GROUP_TYPES.includes(g.game_type) ? "CARDGROUP" : g.game_type;
    merged.set(key, (merged.get(key) ?? 0) + g._count.code);
  }

  return [...merged.entries()]
    .sort(([a], [b]) => {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([key, count]) => ({ game_type: key, count, ...getGameTypeMeta(key) }));
}

export interface GameGroup {
  game_type: string;
  label:     string;
  emoji:     string;
  games:     GameSeamlessRow[];
}

export async function getAllGamesGrouped(): Promise<GameGroup[]> {
  const rows = await prisma.games_seamless.findMany({
    where:   { status_open: "Y", enable: "Y" },
    orderBy: [{ game_type: "asc" }, { sort: "asc" }],
    select:  { code: true, id: true, game_type: true, name: true, filepic: true, icon: true, sort: true },
  });

  const order = ["SLOT", "CASINO", "SPORT", "CARDGROUP", "COCK", "FISH"];
  const map = new Map<string, GameSeamlessRow[]>();
  for (const r of rows) {
    const key = CARD_GROUP_TYPES.includes(r.game_type) ? "CARDGROUP" : r.game_type;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ code: r.code, id: r.id, game_type: r.game_type, name: r.name, filepic: r.filepic, icon: r.icon, sort: r.sort });
  }

  return [...map.keys()]
    .sort((a, b) => {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map((type) => ({ game_type: type, ...getGameTypeMeta(type), games: map.get(type)! }));
}

export async function getGamesByType(gameType: string): Promise<GameSeamlessRow[]> {
  const types = gameType.toUpperCase() === "CARDGROUP"
    ? CARD_GROUP_TYPES
    : [gameType.toUpperCase()];

  const rows = await prisma.games_seamless.findMany({
    where:   { game_type: { in: types }, status_open: "Y", enable: "Y" },
    orderBy: { sort: "asc" },
    select:  { code: true, id: true, game_type: true, name: true, filepic: true, icon: true, sort: true },
  });
  return rows.map((r) => ({
    code:      r.code,
    id:        r.id,
    game_type: r.game_type,
    name:      r.name,
    filepic:   r.filepic,
    icon:      r.icon,
    sort:      r.sort,
  }));
}
