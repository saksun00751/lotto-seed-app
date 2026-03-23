import { prisma } from "./prisma";
import type { Category, SubItem } from "@/lib/categories";
import type { BetTypeId } from "@/components/bet/types";

// DB stores Bangkok time (UTC+7), Prisma reads as UTC → subtract 7h to get correct UTC
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
const toUtcIso = (d: Date) => new Date(d.getTime() - BKK_OFFSET_MS).toISOString();

// ─── UI metadata (emoji/gradient/flag etc. not stored in DB) ─────────────────
const GROUP_META: Record<string, { emoji: string; gradient: string; badge: string }> = {
  "lotto-thai":    { emoji: "🇹🇭", gradient: "from-blue-700 to-red-600",      badge: "รัฐบาล · ออมสิน · ธ.ก.ส." },
  "lotto-foreign": { emoji: "🌏",  gradient: "from-emerald-600 to-teal-400",  badge: "ฮานอย · ลาว · มาเลย์" },
  "lotto-stock":   { emoji: "📈",  gradient: "from-sky-600 to-cyan-400",      badge: "SET · นิเคอิ · ดาวโจนส์" },
  "lotto-daily":   { emoji: "⚡",  gradient: "from-yellow-500 to-orange-500", badge: "หวยรายวัน" },
};

const MARKET_META: Record<string, { flag: string; barClass: string; sub: string }> = {
  thai_gov:      { flag: "🇹🇭", barClass: "from-blue-700 to-red-600",              sub: "หวยรัฐบาล" },
  thai_ออมสิน:  { flag: "💰",  barClass: "from-green-600 to-emerald-400",          sub: "หวยออมสิน" },
  thai_baac:     { flag: "🌾",  barClass: "from-yellow-600 to-lime-400",            sub: "หวย ธ.ก.ส." },
  hanoi_special: { flag: "🇻🇳", barClass: "from-red-700 to-yellow-400",            sub: "ออกผล 12:00" },
  hanoi_1700:    { flag: "🇻🇳", barClass: "from-red-600 to-yellow-400",            sub: "ออกผล 17:00" },
  hanoi_vip:     { flag: "🇻🇳", barClass: "from-red-500 to-orange-400",            sub: "ออกผล 18:10" },
  hanoi_extra:   { flag: "🇻🇳", barClass: "from-rose-600 to-yellow-500",           sub: "ออกผล 21:00" },
  laos_gov:      { flag: "🇱🇦", barClass: "from-red-600 via-blue-700 to-green-500",sub: "ออกผล 20:20 น." },
  laos_vip:      { flag: "🇱🇦", barClass: "from-red-500 to-blue-500",              sub: "ออกผล 20:45 น." },
  laos_star:     { flag: "🇱🇦", barClass: "from-blue-700 to-red-500",              sub: "ออกผล 21:30 น." },
  malay:         { flag: "🇲🇾", barClass: "from-red-600 to-blue-800",              sub: "ออกผล 19:00 น." },
  set_morn:      { flag: "📈",  barClass: "from-blue-600 to-cyan-400",             sub: "ตลาดเช้า 11:00" },
  set_aft:       { flag: "📊",  barClass: "from-cyan-600 to-blue-500",             sub: "ตลาดบ่าย 14:30" },
  set_close:     { flag: "📉",  barClass: "from-blue-500 to-indigo-500",           sub: "ตลาดปิด 16:30" },
  nikkei_morn:   { flag: "🇯🇵", barClass: "from-red-500 to-white",                sub: "ตลาดญี่ปุ่น 09:00" },
  nikkei_aft:    { flag: "🇯🇵", barClass: "from-white to-red-500",                sub: "ตลาดญี่ปุ่น 14:00" },
  china_morn:    { flag: "🇨🇳", barClass: "from-red-600 to-yellow-400",           sub: "ตลาดจีน 10:00" },
  china_aft:     { flag: "🇨🇳", barClass: "from-yellow-400 to-red-600",           sub: "ตลาดจีน 14:00" },
  hangseng_morn: { flag: "🇭🇰", barClass: "from-red-600 to-gray-700",             sub: "ตลาดฮ่องกง 10:00" },
  hangseng_aft:  { flag: "🇭🇰", barClass: "from-gray-700 to-red-600",             sub: "ตลาดฮ่องกง 14:30" },
  dowjones:      { flag: "🇺🇸", barClass: "from-blue-700 to-red-600",             sub: "ตลาดอเมริกา" },
  sg:            { flag: "🇸🇬", barClass: "from-red-600 to-white",                sub: "ตลาดสิงคโปร์" },
  yeekee:        { flag: "⚡",  barClass: "from-yellow-500 to-orange-400",         sub: "รอบ 5 นาที" },
  yeekee_s2:     { flag: "⚡",  barClass: "from-orange-500 to-yellow-400",         sub: "รอบ 5 นาที" },
  yeekee_s3:     { flag: "⚡",  barClass: "from-amber-500 to-orange-500",          sub: "รอบ 5 นาที" },
  yeekee_vip:    { flag: "🎰",  barClass: "from-purple-600 to-pink-400",           sub: "รอบ 15 นาที" },
  yeekee_star:   { flag: "⭐",  barClass: "from-yellow-500 to-orange-400",         sub: "รอบ 5 นาที พิเศษ" },
};

// ─── Parse result_number (stored as JSON or plain string) ─────────────────────
function parseResult(raw: string | null): { top3: string; bot2: string } | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (j?.top3 && j?.bot2) return { top3: String(j.top3), bot2: String(j.bot2) };
  } catch {}
  const m = raw.match(/(\d{3}).*?(\d{2})/);
  if (m) return { top3: m[1], bot2: m[2] };
  return null;
}

type DrawRow = {
  id: bigint;
  market_id: bigint;
  close_at: Date;
  status: string;
  result_number: string | null;
};
type MarketRow = { id: bigint; code: string; name: string };

function buildSubItem(market: MarketRow, draw: DrawRow | null): SubItem {
  const isOpen   = draw?.status === "open";
  const resulted = draw?.status === "resulted";
  const mMeta    = MARKET_META[market.code] ?? { flag: "🎯", barClass: "from-gray-600 to-gray-400", sub: "" };

  type DS = SubItem["drawStatus"];
  const drawStatus: DS = !draw ? "pending"
    : draw.status === "resulted" ? "resulted"
    : draw.status === "closed"   ? "closed"
    : draw.status === "open"     ? "open"
    : "pending";

  return {
    id:         market.code,
    name:       market.name,
    flag:       mMeta.flag,
    sub:        mMeta.sub,
    barClass:   mMeta.barClass,
    href:       `/bet?lottery=${market.code}`,
    isOpen,
    closeAt:    isOpen && draw ? toUtcIso(draw.close_at) : undefined,
    result:     resulted && draw ? (parseResult(draw.result_number) ?? undefined) : undefined,
    drawStatus,
    drawDate:   draw ? draw.close_at.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }) : undefined,
  };
}

// ─── getLotteryCategories ─────────────────────────────────────────────────────
export async function getLotteryCategories(): Promise<Category[]> {
  const groups = await prisma.lotto_groups.findMany({
    where:   { is_enabled: true },
    orderBy: { sort: "asc" },
    include: {
      lotto_markets: { where: { is_enabled: true }, orderBy: { id: "asc" } },
    },
  });

  const marketIds = groups.flatMap((g) => g.lotto_markets.map((m) => m.id));
  const draws: DrawRow[] = marketIds.length
    ? await prisma.lotto_draws.findMany({
        where:   { market_id: { in: marketIds }, status: { in: ["open", "closed", "resulted"] } },
        orderBy: { close_at: "desc" },
        select:  { id: true, market_id: true, close_at: true, status: true, result_number: true },
      })
    : [];

  const latestDraw = new Map<bigint, DrawRow>();
  for (const d of draws) {
    if (!latestDraw.has(d.market_id)) latestDraw.set(d.market_id, d);
  }

  return groups.map((group): Category => {
    const meta = GROUP_META[group.code] ?? { emoji: "🎯", gradient: "from-gray-600 to-gray-400", badge: group.name };
    return {
      id:       group.code,
      label:    group.name,
      emoji:    meta.emoji,
      gradient: meta.gradient,
      badge:    meta.badge,
      items:    group.lotto_markets.map((m) => buildSubItem(m, latestDraw.get(m.id) ?? null)),
    };
  });
}

// ─── getLotteryCategory ───────────────────────────────────────────────────────
export async function getLotteryCategory(id: string): Promise<Category | null> {
  const group = await prisma.lotto_groups.findUnique({
    where:   { code: id },
    include: { lotto_markets: { where: { is_enabled: true }, orderBy: { id: "asc" } } },
  });
  if (!group || !group.is_enabled) return null;

  const marketIds = group.lotto_markets.map((m) => m.id);
  const draws: DrawRow[] = marketIds.length
    ? await prisma.lotto_draws.findMany({
        where:   { market_id: { in: marketIds }, status: { in: ["open", "closed", "resulted"] } },
        orderBy: { close_at: "desc" },
        select:  { id: true, market_id: true, close_at: true, status: true, result_number: true },
      })
    : [];

  const latestDraw = new Map<bigint, DrawRow>();
  for (const d of draws) {
    if (!latestDraw.has(d.market_id)) latestDraw.set(d.market_id, d);
  }

  const meta = GROUP_META[group.code] ?? { emoji: "🎯", gradient: "from-gray-600 to-gray-400", badge: group.name };
  return {
    id:       group.code,
    label:    group.name,
    emoji:    meta.emoji,
    gradient: meta.gradient,
    badge:    meta.badge,
    items:    group.lotto_markets.map((m) => buildSubItem(m, latestDraw.get(m.id) ?? null)),
  };
}

// ─── BetRates ─────────────────────────────────────────────────────────────────
export interface BetRateRow {
  id:        BetTypeId;
  label:     string;
  rate:      string;
  minAmount: number;
  maxAmount: number;
  isActive:  boolean;
}

const DB_TO_BET_TYPE_ID: Record<string, BetTypeId> = {
  top3: "3top", tod3: "3tod", top2: "2top",
  bot2: "2bot", run_top: "run", run_bot: "winlay",
};

// lotto_market_bet_settings.bet_type → lotto_rate_plan_items.bet_type
const SETTINGS_TO_PLAN: Record<string, string> = {
  top3: "top_3", tod3: "tod_3", top2: "top_2", bot2: "bottom_2",
  run_top: "run_top", run_bot: "run_bottom",
};

// lotto_rate_plan_items.bet_type → BetTypeId (fallback when settings are empty)
const PLAN_TO_BET_TYPE_ID: Record<string, BetTypeId> = {
  top_3: "3top", tod_3: "3tod", top_2: "2top", bottom_2: "2bot",
  run_top: "run", run_bottom: "winlay",
};

const BET_TYPE_LABEL: Record<BetTypeId, string> = {
  "3top": "3 ตัวบน", "3tod": "3 ตัวโต๊ด", "2top": "2 ตัวบน",
  "2bot": "2 ตัวล่าง", "run": "วิ่งบน", "winlay": "วิ่งล่าง",
  "6perm": "6กลับ", "19door": "19ประตู", "winnum": "วินเลข",
};

const RATE_ORDER: BetTypeId[] = ["3top", "3tod", "2top", "2bot", "run", "winlay", "6perm", "19door", "winnum"];

export async function getDiscountPct(): Promise<number> {
  return 0;
}

export async function getBetRates(marketCode: string): Promise<BetRateRow[]> {
  const market = await prisma.lotto_markets.findUnique({
    where:   { code: marketCode },
    include: {
      lotto_market_bet_settings: true,
      lotto_groups: {
        include: {
          lotto_rate_plans: {
            where:   { is_enabled: true },
            take:    1,
            include: { lotto_rate_plan_items: true },
          },
        },
      },
    },
  });
  if (!market) return [];

  const ratePlan  = market.lotto_groups.lotto_rate_plans[0];
  const payoutMap = new Map((ratePlan?.lotto_rate_plan_items ?? []).map((r) => [r.bet_type, Number(r.payout)]));

  // When no settings exist, build rates directly from rate plan items
  if (!market.lotto_market_bet_settings.length) {
    if (!ratePlan) return [];
    const mapped: BetRateRow[] = ratePlan.lotto_rate_plan_items
      .map((item) => {
        const id = PLAN_TO_BET_TYPE_ID[item.bet_type];
        if (!id) return null;
        return {
          id,
          label:     BET_TYPE_LABEL[id] ?? id,
          rate:      String(Number(item.payout)),
          minAmount: 1,
          maxAmount: 100000,
          isActive:  true,
        } satisfies BetRateRow;
      })
      .filter(Boolean) as BetRateRow[];
    mapped.sort((a, b) => RATE_ORDER.indexOf(a.id) - RATE_ORDER.indexOf(b.id));
    const rate3top = mapped.find((r) => r.id === "3top");
    const rate2top = mapped.find((r) => r.id === "2top");
    const derived: BetRateRow[] = [
      rate3top && { id: "6perm"  as BetTypeId, label: "6กลับ",   rate: rate3top.rate, minAmount: rate3top.minAmount, maxAmount: rate3top.maxAmount, isActive: true },
      rate2top && { id: "19door" as BetTypeId, label: "19ประตู", rate: rate2top.rate, minAmount: rate2top.minAmount, maxAmount: rate2top.maxAmount, isActive: true },
      rate2top && { id: "winnum" as BetTypeId, label: "วินเลข",  rate: rate2top.rate, minAmount: rate2top.minAmount, maxAmount: rate2top.maxAmount, isActive: true },
    ].filter(Boolean) as BetRateRow[];
    return [...mapped, ...derived];
  }

  const mapped: BetRateRow[] = market.lotto_market_bet_settings
    .filter((s) => s.is_enabled)
    .map((s) => {
      const id = DB_TO_BET_TYPE_ID[s.bet_type];
      if (!id) return null;
      // Map settings bet_type → plan bet_type to look up payout
      const planType = SETTINGS_TO_PLAN[s.bet_type] ?? s.bet_type;
      return {
        id,
        label:     BET_TYPE_LABEL[id] ?? id,
        rate:      String(payoutMap.get(planType) ?? 0),
        minAmount: Number(s.min_bet),
        maxAmount: Number(s.max_bet),
        isActive:  true,
      } satisfies BetRateRow;
    })
    .filter(Boolean) as BetRateRow[];

  mapped.sort((a, b) => RATE_ORDER.indexOf(a.id) - RATE_ORDER.indexOf(b.id));

  const rate3top = mapped.find((r) => r.id === "3top");
  const rate2top = mapped.find((r) => r.id === "2top");
  const derived: BetRateRow[] = [
    rate3top && { id: "6perm"  as BetTypeId, label: "6กลับ",   rate: rate3top.rate, minAmount: rate3top.minAmount, maxAmount: rate3top.maxAmount, isActive: true },
    rate2top && { id: "19door" as BetTypeId, label: "19ประตู", rate: rate2top.rate, minAmount: rate2top.minAmount, maxAmount: rate2top.maxAmount, isActive: true },
    rate2top && { id: "winnum" as BetTypeId, label: "วินเลข",  rate: rate2top.rate, minAmount: rate2top.minAmount, maxAmount: rate2top.maxAmount, isActive: true },
  ].filter(Boolean) as BetRateRow[];

  return [...mapped, ...derived];
}

// ─── Number limits ────────────────────────────────────────────────────────────
export interface NumberLimitRow {
  number:    string;
  betType:   string | null;
  maxAmount: number | null;
  isClosed:  boolean;
  note:      string | null;
}

export async function getNumberLimits(marketCode: string): Promise<NumberLimitRow[]> {
  const draw = await prisma.lotto_draws.findFirst({
    where:   { status: "open", lotto_markets: { code: marketCode } },
    orderBy: { close_at: "asc" },
  });
  if (!draw) return [];

  const blocks = await prisma.lotto_number_blocks.findMany({
    where:   { draw_id: draw.id },
    orderBy: [{ mode: "desc" }, { number: "asc" }],
  });

  return blocks.map((b) => ({
    number:    b.number,
    betType:   b.bet_type,
    maxAmount: null,
    isClosed:  b.mode === "block",
    note:      b.reason ?? null,
  }));
}

// ─── Recent results across all markets ───────────────────────────────────────
export interface RecentResultRow {
  marketCode: string;
  marketName: string;
  flag:       string;
  date:       string;
  top3:       string;
  bot2:       string;
}

export async function getRecentResults(limit = 30): Promise<RecentResultRow[]> {
  const draws = await prisma.lotto_draws.findMany({
    where:   { status: "resulted", result_number: { not: null } },
    orderBy: { close_at: "desc" },
    take:    limit,
    select:  { close_at: true, result_number: true, lotto_markets: { select: { code: true, name: true } } },
  });

  return draws
    .map((d) => {
      const r = parseResult(d.result_number);
      if (!r) return null;
      const code = d.lotto_markets.code;
      const mMeta = MARKET_META[code] ?? { flag: "🎯", barClass: "", sub: "" };
      return {
        marketCode: code,
        marketName: d.lotto_markets.name,
        flag:       mMeta.flag,
        date:       d.close_at.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }),
        top3:       r.top3,
        bot2:       r.bot2,
      };
    })
    .filter(Boolean) as RecentResultRow[];
}

// ─── Past results ─────────────────────────────────────────────────────────────
export interface PastResultRow {
  date: string;
  top3: string;
  bot2: string;
}

export async function getPastResults(marketCode: string, limit = 5): Promise<PastResultRow[]> {
  const draws = await prisma.lotto_draws.findMany({
    where:   { status: "resulted", lotto_markets: { code: marketCode } },
    orderBy: { close_at: "desc" },
    take:    limit,
    select:  { close_at: true, result_number: true },
  });

  return draws
    .map((d) => {
      const r = parseResult(d.result_number);
      if (!r) return null;
      return {
        date: d.close_at.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        top3: r.top3,
        bot2: r.bot2,
      };
    })
    .filter(Boolean) as PastResultRow[];
}
