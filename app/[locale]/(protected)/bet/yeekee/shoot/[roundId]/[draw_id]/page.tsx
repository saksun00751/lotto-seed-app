import type { Metadata } from "next";
import { notFound } from "next/navigation";
import YeekeeShootForm from "@/components/bet/YeekeeShootForm";
import YeekeeShootsList from "@/components/bet/YeekeeShootsList";
import BackButton from "@/components/ui/BackButton";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { apiGet } from "@/lib/api/client";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface DrawDetailResponse {
  success: boolean;
  data?: {
    id?: number;
    draw_id?: number;
    round_id?: number;
    draw_date?: string;
    close_at?: string;
    status?: string;
    status_label?: string;
    result_mode?: string;
    round_no?: number;
    formula_label?: string;
    bet_open_at?: string;
    bet_close_at?: string;
    shoot_open_at?: string;
    shoot_close_at?: string;
    result_compute_at?: string;
    market?: {
      id?: number | string;
      name?: string;
      group_code?: string;
      group_name?: string;
      logo?: string;
      icon?: string;
    } | null;
  } | null;
}

interface Props {
  params: Promise<{ locale: string; roundId: string; draw_id: string }>;
}

function bkkToIso(dt?: string): string | undefined {
  if (!dt) return undefined;
  return new Date(dt.replace(" ", "T") + "+07:00").toISOString();
}

function formatDate(value?: string, locale = "th-TH") {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isYeekeeDraw(draw: NonNullable<DrawDetailResponse["data"]>) {
  const groupCode = (draw.market?.group_code ?? "").toLowerCase();
  const groupName = (draw.market?.group_name ?? "").toLowerCase();
  return draw.result_mode === "yeekee" || groupCode.includes("yeekee") || groupName.includes("yeekee") || groupName.includes("ยี่กี");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "bet") };
}

export default async function YeekeeShootPage({ params }: Props) {
  const { locale, roundId: roundIdParam, draw_id: drawIdParam } = await params;
  const roundId = Number(roundIdParam);
  if (!Number.isFinite(roundId)) notFound();
  const numericDrawId = drawIdParam ? Number(drawIdParam) : undefined;

  const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);
  let draw: DrawDetailResponse["data"] | null = null;

  if (Number.isFinite(numericDrawId)) {
    try {
      const res = await apiGet<DrawDetailResponse>(`/lotto/draws/${numericDrawId}`, apiToken ?? undefined, lang);
      draw = res?.data ?? null;
    } catch {}
  }

  if (draw && (!isYeekeeDraw(draw) || (draw.round_id != null && draw.round_id !== roundId))) notFound();

  const marketName = draw?.market?.name ?? `Yeekee #${roundId}`;
  const marketLogo = draw?.market?.logo ?? draw?.market?.icon;
  const shootCloseAt = bkkToIso(draw?.shoot_close_at);

  const detailRows = [
    { label: "งวดวันที่", value: draw?.draw_date ? formatDate(draw.draw_date) : "-" },
    { label: "รอบ", value: draw?.round_no != null ? `รอบที่ ${draw.round_no}` : `รอบ #${roundId}` },
    { label: "สถานะ", value: draw?.status_label ?? draw?.status ?? "-" },
    { label: "ปิดยิงเลข", value: formatTime(shootCloseAt) },
  ];

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-6xl mx-auto px-5 pt-6 space-y-5">
        <div className="flex items-center gap-3">
          <BackButton
            fallbackHref={`/${locale}/bet`}
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors"
          >
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </BackButton>
          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold text-ap-primary leading-tight">ยิงเลขยี่กี</h1>
            <p className="text-[14px] text-ap-secondary font-medium mt-0.5">รายละเอียดรอบก่อนส่งเลข</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-ap-border bg-white shadow-card">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              {marketLogo ? (
                <img src={marketLogo} alt={marketName} className="w-11 h-11 rounded-2xl object-cover bg-white/15 border border-white/25" />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-[22px]">⚡</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-extrabold leading-tight truncate">{marketName}</p>
                <p className="text-[14px] text-white/75 mt-0.5">{draw?.market?.group_name ?? "Yeekee"}</p>
              </div>
              {shootCloseAt && (
                <div className="shrink-0 text-right">
                  <p className="text-[14px] text-white/70 font-semibold">ปิดยิงเลขใน</p>
                  <CountdownTimer
                    closeAt={shootCloseAt}
                    className="text-[15px] font-extrabold tabular-nums text-ap-red"
                    expiredClassName="text-[15px] font-extrabold text-ap-red"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-50/60">
            {detailRows.map((row) => (
              <div key={row.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[14px] font-semibold text-ap-tertiary">{row.label}</p>
                <p className="mt-1 text-[14px] font-bold text-ap-primary truncate">{row.value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <YeekeeShootForm roundId={roundId} />
          </div>
          <div className="lg:col-span-1">
            <YeekeeShootsList roundId={roundId} />
          </div>
        </div>
      </div>
    </div>
  );
}
