import type { Category, SubItem } from "@/lib/categories";

type MarketLang = "th" | "en" | "kh" | "la";

// ─── API Types ────────────────────────────────────────────────────────────────
interface ApiDraw {
  draw_id:        number;
  draw_date:      string | null;
  open_at:        string | null;
  close_at:       string | null;
  result_at:      string | null;
  status:         string;
  status_label:   string;
  is_open_bet:    boolean;
  result_top_3:   string;
  result_bottom_2: string;
}

interface ApiMarket {
  market_id:   number;
  market_name: string;
  market_logo: string;
  market_icon: string;
  is_enabled:  boolean;
  latest_draw: ApiDraw;
}

interface ApiGroup {
  group_id:    number;
  group_code:  string;
  group_name:  string;
  group_logo?: string;
  description?: string;
  markets:     ApiMarket[];
}

export interface MarketsLatestResponse {
  success: boolean;
  data: {
    language: string;
    groups:   ApiGroup[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapDrawStatus(status: string, isOpenBet: boolean): SubItem["drawStatus"] {
  if (status === "resulted")                    return "resulted";
  if (status === "closed")                      return "closed";
  if (status === "open" || isOpenBet)           return "open";
  if (status === "draft" || status === "pending") return "pending";
  return "pending";
}

// "2026-03-25 14:00:00" (Bangkok) → ISO UTC string
function bkkToIso(dt: string | null): string | undefined {
  if (!dt) return undefined;
  return new Date(dt.replace(" ", "T") + "+07:00").toISOString();
}

function normalizeLang(lang?: string): MarketLang {
  return lang === "en" || lang === "kh" || lang === "la" ? lang : "th";
}

function formatCloseTime(dt: string | null, lang?: string): string {
  if (!dt) return "";
  const time = dt.slice(11, 16);
  switch (normalizeLang(lang)) {
    case "en":
      return `Closes ${time}`;
    case "kh":
      return `បិទ ${time}`;
    case "la":
      return `ປິດ ${time}`;
    case "th":
    default:
      return `ปิด ${time} น.`;
  }
}

function formatDrawDate(date: string | null, lang?: string): string | undefined {
  if (!date) return undefined;
  const localeByLang: Record<MarketLang, string> = {
    th: "th-TH",
    en: "en-US",
    kh: "km-KH",
    la: "lo-LA",
  };
  return new Date(date).toLocaleDateString(localeByLang[normalizeLang(lang)], {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ─── Mapper ───────────────────────────────────────────────────────────────────
export function mapMarketsToCategories(groups: ApiGroup[], lang?: string): Category[] {
  return groups.map((group): Category => {
    const meta = {
      emoji: "🎯",
      gradient: "from-gray-600 to-gray-400",
      badge: group.group_name,
      barClass: "from-gray-600 to-gray-400",
    };

    const items: SubItem[] = group.markets
      .filter((m) => m.is_enabled)
      .map((market): SubItem => {
        const draw       = market.latest_draw;
        const drawStatus = mapDrawStatus(draw.status, draw.is_open_bet);
        const isOpen     = drawStatus === "open";
        const resulted   = drawStatus === "resulted";

        return {
          id:         String(market.market_id),
          name:       market.market_name,
          flag:       meta.emoji,
          logo:       market.market_logo || undefined,
          sub:        formatCloseTime(draw.close_at, lang),
          isOpen,
          closeAt:    isOpen ? bkkToIso(draw.close_at) : undefined,
          result:     resulted && draw.result_top_3 && draw.result_bottom_2
                        ? { top3: draw.result_top_3, bot2: draw.result_bottom_2 }
                        : undefined,
          drawStatus,
          statusLabel: draw.status_label,
          drawDate:   formatDrawDate(draw.draw_date, lang),
          drawId:     draw.draw_id,
          barClass:   meta.barClass,
          href:       isOpen ? `/bet/${draw.draw_id}` : "",
          
        };
      });

    return {
      id:       group.group_code,
      code:     group.group_code,
      groupId:  group.group_id,
      groupLogo: group.group_logo || undefined,
      label:    group.group_name,
      emoji:    meta.emoji,
      gradient: meta.gradient,
      badge:    meta.badge,
      items,
      description: group.description,
    };
  });
}
