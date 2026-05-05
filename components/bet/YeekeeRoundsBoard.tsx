"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PackageModalButton from "@/components/bet/PackageModalButton";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface YeekeeRound {
  market_id: number;
  draw_id: number;
  round_id: number;
  round_no: number;
  bet_open_at: string;
  bet_close_at: string;
  shoot_open_at: string;
  shoot_close_at: string;
  result_compute_at: string;
  status: string;
  is_open_for_play: boolean;
  is_final: boolean;
  server_time?: string;
}

interface YeekeeRoundsResponse {
  success: boolean;
  data?: {
    market_id: number;
    draw_date: string;
    count: number;
    items: YeekeeRound[];
  };
}

interface Props {
  marketId: number;
  marketName: string;
  logo?: string;
  locale: string;
  groupId: number;
}

function bkkToMs(dt: string): number {
  return new Date(dt.replace(" ", "T") + "+07:00").getTime();
}

function hhmm(dt: string): string {
  return dt.slice(11, 16);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function YeekeeRoundsBoard({ marketId, marketName, logo, locale, groupId }: Props) {
  const t = useTranslation("category");
  const [rounds, setRounds] = useState<YeekeeRound[] | null>(null);
  const [drawDate, setDrawDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [selectedRoundNo, setSelectedRoundNo] = useState<number | null>(null);
  const [resultByRound, setResultByRound] = useState<Record<number, { top_3: string; bottom_2: string } | { error: string } | "loading">>({});
  const userPickedRef = useRef(false);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch(`/api/lotto/yeekee/${marketId}/rounds`, { cache: "no-store" });
      const json: YeekeeRoundsResponse = await res.json();
      if (!json.success || !json.data) {
        setError(json && (json as { message?: string }).message ? String((json as { message?: string }).message) : t.yeekeeLoadFailed);
        return;
      }
      setRounds(json.data.items);
      setDrawDate(json.data.draw_date);
      const sv = json.data.items[0]?.server_time;
      if (sv) setNow(bkkToMs(sv));
      setError(null);
    } catch {
      setError(t.yeekeeNetworkFailed);
    } finally {
      setLoading(false);
    }
  }, [marketId, t]);

  useEffect(() => {
    fetchRounds();
    const refresh = setInterval(fetchRounds, 60_000);
    const tick = setInterval(() => setNow((n) => n + 1000), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [fetchRounds]);

  const currentRoundNo = useMemo(() => {
    if (!rounds) return null;
    const live = rounds.find((r) => r.is_open_for_play && bkkToMs(r.bet_close_at) > now);
    if (live) return live.round_no;
    const upcoming = rounds.find((r) => bkkToMs(r.bet_close_at) > now);
    return upcoming?.round_no ?? null;
  }, [rounds, now]);

  // Default selected = current round เมื่อยังไม่ได้เลือกเอง
  useEffect(() => {
    if (!userPickedRef.current && currentRoundNo != null) {
      setSelectedRoundNo(currentRoundNo);
    }
  }, [currentRoundNo]);

const stats = useMemo(() => {
    if (!rounds) return { total: 0, finished: 0, open: 0, upcoming: 0 };
    let finished = 0, open = 0, upcoming = 0;
    for (const r of rounds) {
      if (r.is_final) finished++;
      else if (r.is_open_for_play && bkkToMs(r.bet_close_at) > now) open++;
      else upcoming++;
    }
    return { total: rounds.length, finished, open, upcoming };
  }, [rounds, now]);

  const fetchResultProof = useCallback(async (roundId: number) => {
    setResultByRound((prev) => (prev[roundId] ? prev : { ...prev, [roundId]: "loading" }));
    try {
      const res = await fetch(`/api/v1/lotto/yeekee/rounds/${roundId}/result-proof`, { cache: "no-store" });
      const json = await res.json();
      const payload = json?.data?.proof?.result_payload;
      if (json?.success && payload && (payload.top_3 || payload.bottom_2)) {
        setResultByRound((prev) => ({ ...prev, [roundId]: { top_3: String(payload.top_3 ?? ""), bottom_2: String(payload.bottom_2 ?? "") } }));
      } else {
        const msg = String(json?.message ?? t.yeekeeResultLoadFailed);
        setResultByRound((prev) => ({ ...prev, [roundId]: { error: msg } }));
      }
    } catch {
      setResultByRound((prev) => ({ ...prev, [roundId]: { error: t.yeekeeNetworkFailed } }));
    }
  }, [t]);

  const selectedRound = useMemo(
    () => rounds?.find((r) => r.round_no === selectedRoundNo) ?? null,
    [rounds, selectedRoundNo],
  );

  const selectedInfo = useMemo(() => {
    if (!selectedRound) return null;
    const closeMs = bkkToMs(selectedRound.bet_close_at);
    const isLive = selectedRound.is_open_for_play && closeMs > now;
    const isFinished = selectedRound.is_final || closeMs <= now;
    const remaining = closeMs - now;
    let label = t.yeekeeBadgeWaiting;
    let badgeCls = "bg-ap-bg text-ap-secondary";
    if (isLive) { label = t.yeekeeBadgeOpen; badgeCls = "bg-emerald-100 text-emerald-700"; }
    else if (isFinished) {
      label = selectedRound.status === "voided" ? t.yeekeeBadgeVoided : t.yeekeeBadgeClosed;
      badgeCls = "bg-ap-bg text-ap-tertiary";
    }
    return { closeMs, isLive, isFinished, remaining, label, badgeCls };
  }, [selectedRound, now, t]);

  return (
    <section className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 flex items-center gap-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={marketName} className="w-8 h-8 rounded-lg object-cover bg-white/20" />
        ) : (
          <span className="text-xl">⚡</span>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-white tracking-tight truncate">{marketName}</h2>
          <p className="text-[12px] text-white/80 leading-tight">
            {drawDate || "—"} · {t.yeekeeRoundsCount.replace("{n}", String(stats.total))} · {t.yeekeeRoundInterval}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[14px] font-semibold text-white/90">
          <span className="bg-white/20 rounded-full px-2 py-0.5">{t.yeekeeStatsOpen.replace("{n}", String(stats.open))}</span>
          <span className="bg-white/10 rounded-full px-2 py-0.5">{t.yeekeeStatsUpcoming.replace("{n}", String(stats.upcoming))}</span>
          <span className="bg-black/20 rounded-full px-2 py-0.5">{t.yeekeeStatsFinished.replace("{n}", String(stats.finished))}</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {loading && <div className="h-[92px] flex items-center justify-center text-[13px] text-ap-tertiary">{t.yeekeeLoadingRounds}</div>}
        {error && !loading && <div className="h-[92px] flex items-center justify-center text-[13px] text-ap-red">{error}</div>}

        {!loading && !error && rounds && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
            {rounds.map((r) => {
              const closeMs = bkkToMs(r.bet_close_at);
              const isLive = r.is_open_for_play && closeMs > now;
              const isCurrent = r.round_no === currentRoundNo;
              const isSelected = r.round_no === selectedRoundNo;
              const isFinished = r.is_final || closeMs <= now;
              const isUpcoming = !isLive && !isFinished;
              const isResulted = r.status === "resulted";

              const baseCls =
                "aspect-square w-full rounded-lg border flex items-center justify-center text-[14px] font-bold tabular-nums transition-all";
              let stateCls = "";
              if (isCurrent && isLive) {
                stateCls = "bg-emerald-500 border-emerald-600 text-white shadow-md";
              } else if (isLive) {
                stateCls = "border-emerald-300 text-emerald-700 hover:bg-emerald-50";
              } else if (isUpcoming) {
                stateCls = "border-transparent text-ap-secondary hover:border-ap-blue/40";
              } else if (isResulted) {
                stateCls = "border-violet-400 bg-violet-50 text-violet-700 hover:bg-violet-100";
              } else {
                stateCls = "border-transparent text-ap-tertiary opacity-50 hover:opacity-80";
              }
              const selectedRing = isSelected ? " ring-2 ring-violet-500 ring-offset-1 scale-110" : "";

              const title = `${t.yeekeeRoundShort.replace("{n}", String(r.round_no))} · ${t.yeekeeBetCloseShort.replace("{time}", hhmm(r.bet_close_at))}`;

              return (
                <button
                  key={r.round_id}
                  type="button"
                  data-round={r.round_no}
                  onClick={() => {
                    userPickedRef.current = true;
                    setSelectedRoundNo(r.round_no);
                    if (isFinished && r.status !== "voided" && !resultByRound[r.round_id]) {
                      fetchResultProof(r.round_id);
                    }
                  }}
                  className={baseCls + " " + stateCls + selectedRing + " active:scale-95"}
                  aria-label={title}
                  aria-pressed={isSelected}
                  title={title}
                >
                  {r.round_no}
                </button>
              );
            })}
          </div>
        )}

        {/* กล่องนับถอยหลังของรอบที่เลือก */}
        {selectedRound && selectedInfo && (
          <div className="rounded-xl border border-ap-border bg-gradient-to-br from-violet-50 to-fuchsia-50 px-3 py-3 flex flex-col items-center gap-2">
            <div className="w-full flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-ap-primary">{t.yeekeeRoundFmt.replace("{n}", String(selectedRound.round_no))}</span>
                <span className={`text-[13px] font-semibold rounded-full px-2 py-0.5 ${selectedInfo.badgeCls}`}>
                  {selectedInfo.label}
                </span>
              </div>
              <span className="text-[18px] font-bold text-ap-primary tabular-nums">
                {t.yeekeeBetCloseAt.replace("{time}", hhmm(selectedRound.bet_close_at))}
              </span>
            </div>

            {selectedRound.status !== "resulted" && (
              <div className="text-center">
                <div className="text-[14px] font-semibold text-ap-tertiary leading-none">
                  {selectedInfo.isLive ? t.yeekeeRemaining : selectedInfo.isFinished ? t.yeekeeFinishedShort : t.yeekeeOpensIn}
                </div>
                <div className={`text-[28px] font-extrabold tabular-nums leading-none mt-1 ${
                  selectedInfo.isLive ? "text-emerald-600" : selectedInfo.isFinished ? "text-ap-tertiary" : "text-violet-600"
                }`}>
                  {selectedInfo.isFinished ? "—" : formatCountdown(
                    selectedInfo.isLive
                      ? selectedInfo.remaining
                      : bkkToMs(selectedRound.bet_open_at) - now,
                  )}
                </div>
              </div>
            )}

            {selectedInfo.isFinished && selectedRound.status !== "voided" && (() => {
              const r = resultByRound[selectedRound.round_id];
              if (r === "loading") {
                return <div className="text-[13px] text-ap-tertiary">{t.yeekeeLoadingResult}</div>;
              }
              if (!r) return null;
              if ("error" in r) {
                return <div className="text-[13px] text-ap-red">{r.error}</div>;
              }
              return (
                <div className="w-full space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-ap-border px-3 py-2">
                      <span className="text-[26px] font-extrabold tabular-nums text-emerald-600 leading-none">
                        {r.top_3 || "—"}
                      </span>
                      <span className="mt-1 text-[12px] font-semibold text-slate-500">{t.yeekeeTop3}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-ap-border px-3 py-2">
                      <span className="text-[26px] font-extrabold tabular-nums text-emerald-600 leading-none">
                        {r.bottom_2 || "—"}
                      </span>
                      <span className="mt-1 text-[12px] font-semibold text-slate-500">{t.yeekeeBottom2}</span>
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/bet/yeekee/rounds/${selectedRound.round_id}/result`}
                    className="block w-full max-w-[240px] mx-auto text-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[14px] font-bold px-6 py-2.5 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {t.yeekeeCheckResult}
                  </Link>
                </div>
              );
            })()}

            {selectedInfo.isLive ? (
              <div className="w-full max-w-[200px]">
                <PackageModalButton
                  key={selectedRound.draw_id}
                  groupId={groupId}
                  drawId={selectedRound.draw_id}
                  roundId={selectedRound.round_id}
                  locale={locale}
                  closeAt={new Date(selectedInfo.closeMs).toISOString()}
                  labelPlay={t.yeekeePlayThisRound}
                />
              </div>
            ) : selectedRound.status !== "resulted" && (
              <button
                type="button"
                disabled
                className="max-w-[200px] flex items-center justify-center gap-2 text-[14px] font-bold text-ap-tertiary border border-ap-border rounded-full px-6 py-2.5 cursor-not-allowed"
              >
                {selectedInfo.isFinished ? t.yeekeeAlreadyClosed : t.yeekeeNotYetOpen}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
