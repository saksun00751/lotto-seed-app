import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import YeekeeShootsList from "@/components/bet/YeekeeShootsList";
import YeekeeRewardList, { type RewardWinner } from "@/components/bet/YeekeeRewardList";
import YeekeeRewardPolicy, { type RewardPolicyItem } from "@/components/bet/YeekeeRewardPolicy";
import { apiGet } from "@/lib/api/client";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface ResultProofResponse {
  success: boolean;
  data?: {
    round_id: number;
    round_no?: number;
    draw_id: number;
    draw_date?: string | null;
    submitted_at?: string | null;
    status: string;
    is_revealed: boolean;
    shoot_summary?: {
      shoot_sum?: string;
      shoot_count?: number;
      shoot_source?: string;
    };
    shoot_rewards?: {
      policy?: RewardPolicyItem[];
      policy_meta?: {
        reward_enabled?: boolean;
        currency?: string;
      };
      winners?: RewardWinner[];
    };
    proof?: {
      formula_label?: string;
      precommit_signature?: string;
      proof_signature?: string;
      external_seed_reference?: string;
      result_payload?: {
        raw_result?: string;
        top_3?: string;
        bottom_2?: string;
      };
    };
    server_time?: string;
  };
  message?: string;
}

interface Props {
  params: Promise<{ locale: string; roundId: string }>;
  searchParams: Promise<{ round_no?: string; market_name?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "checkResult") };
}

export default async function YeekeeRoundResultPage({ params, searchParams }: Props) {
  const { locale, roundId } = await params;
  const { round_no: roundNoParam, market_name: marketNameParam } = await searchParams;
  const roundNoFromQuery = roundNoParam ? Number(roundNoParam) : undefined;
  const marketName = marketNameParam ?? "";
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let data: ResultProofResponse["data"] | undefined;
  try {
    const res = await apiGet<ResultProofResponse>(
      `/lotto/yeekee/rounds/${roundId}/result-proof`,
      token ?? undefined,
      lang,
    );
    if (res?.success) data = res.data;
  } catch {}

  if (!data) notFound();

  const proof = data.proof;
  const payload = proof?.result_payload;
  const isResulted = data.status === "resulted" && data.is_revealed;

  return (
    <div className="min-h-screen bg-surface-subtle pb-20 sm:pb-8">
      <div className="bg-surface-card border-b border-ap-border px-4 py-2.5 flex items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 text-[14px] min-w-0 w-full">
          <Link href={`/${locale}/dashboard`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">หน้าหลัก</Link>
          <span className="text-ap-tertiary shrink-0">›</span>
          <Link href={`/${locale}/bet`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">แทงหวย</Link>
          <span className="text-ap-tertiary shrink-0">›</span>
          <Link href={`/${locale}/category/lotto-yeekee`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">หวยยี่กี่</Link>
          {marketName && (
            <>
              <span className="text-ap-tertiary shrink-0">›</span>
              <span className="text-ap-secondary shrink-0 truncate">{marketName}</span>
            </>
          )}
          <span className="text-ap-tertiary shrink-0">›</span>
          <span className="font-bold text-ap-primary truncate min-w-0">
            รอบที่ {data.round_no ?? roundNoFromQuery ?? "—"}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <BackButton fallbackHref={`/${locale}/dashboard`}>
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </BackButton>
          <h1 className="text-[18px] font-bold text-ap-primary">เช็คผลรางวัล</h1>
        </div>

        <section className="rounded-2xl border border-ap-border bg-surface-card shadow-card overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3">
            {marketName && <p className="text-[13px] font-semibold text-white/90">{marketName}</p>}
            <h2 className="text-[15px] font-extrabold text-white">รอบที่ {data.round_no ?? roundNoFromQuery ?? "—"}</h2>
            <p className="text-[12px] text-white/80">งวดวันที่ {data.server_time ? data.server_time.slice(0, 10) : "—"}</p>
          </div>

          <div className="p-4 space-y-4">
            {!isResulted ? (
              <div className="text-center text-[14px] text-ap-tertiary py-6">ยังไม่มีผลรางวัล</div>
            ) : (
              <>
                {data.shoot_summary?.shoot_sum && (
                  <div className="rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 px-4 py-3">
                    <p className="text-center text-[12px] font-semibold text-ap-tertiary tracking-wide">
                      ผลรวมเลขยิง{typeof data.shoot_summary?.shoot_count === "number" ? ` (${data.shoot_summary.shoot_count} รายการ)` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                      {data.shoot_summary.shoot_sum.split("").map((digit, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 rounded-xl bg-surface-card border-2 border-violet-400 flex items-center justify-center text-[24px] font-extrabold tabular-nums text-violet-700 shadow-sm"
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                    <span className="text-[36px] font-extrabold tabular-nums text-ap-green leading-none">
                      {payload?.top_3 || "—"}
                    </span>
                    <span className="mt-2 text-[13px] font-semibold text-slate-600">3 ตัวบน</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                    <span className="text-[36px] font-extrabold tabular-nums text-ap-green leading-none">
                      {payload?.bottom_2 || "—"}
                    </span>
                    <span className="mt-2 text-[13px] font-semibold text-slate-600">2 ตัวล่าง</span>
                  </div>
                </div>

{payload?.raw_result && (
                  <div className="rounded-xl bg-surface-subtle/70 border border-ap-border px-3 py-2.5 text-[13px] text-ap-secondary break-all">
                    <span className="font-semibold">ผลดิบ:</span> {payload.raw_result}
                  </div>
                )}

                {(proof?.precommit_signature || proof?.proof_signature || proof?.external_seed_reference) && (
                  <details className="rounded-xl bg-surface-subtle/70 border border-ap-border px-3 py-2.5 text-[12px] text-ap-tertiary">
                    <summary className="cursor-pointer font-semibold text-ap-secondary">หลักฐาน (proof)</summary>
                    <div className="mt-2 space-y-1.5 break-all">
                      {proof?.precommit_signature && <div><span className="font-semibold">precommit:</span> {proof.precommit_signature}</div>}
                      {proof?.proof_signature && <div><span className="font-semibold">proof:</span> {proof.proof_signature}</div>}
                      {proof?.external_seed_reference && <div><span className="font-semibold">seed:</span> {proof.external_seed_reference}</div>}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        </section>

        <YeekeeRewardList
          winners={data.shoot_rewards?.winners ?? []}
          rewardEnabled={data.shoot_rewards?.policy_meta?.reward_enabled ?? true}
        />

        <YeekeeShootsList roundId={Number(roundId)} autoRefresh={false} />

        <YeekeeRewardPolicy
          policy={data.shoot_rewards?.policy ?? []}
          currency={data.shoot_rewards?.policy_meta?.currency}
        />

        <Link
          href={`/${locale}/history`}
          className="block w-full text-center rounded-full bg-ap-blue text-white text-[14px] font-bold px-6 py-3 shadow-sm hover:bg-ap-blue-h active:scale-[0.98] transition-all"
        >
          ดูรายการแทงของฉัน →
        </Link>
      </div>
    </div>
  );
}
