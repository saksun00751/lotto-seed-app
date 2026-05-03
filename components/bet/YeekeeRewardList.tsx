"use client";

import { useEffect, useState } from "react";

interface RewardItem {
  position?: number;
  credit_amount?: number;
}

interface RewardStatusResponse {
  success?: boolean;
  message?: string;
  data?: {
    round_id?: number;
    member_id?: number;
    reward_enabled?: boolean;
    reward_count?: number;
    rewarded?: boolean;
    items?: RewardItem[];
  } | null;
}

export default function YeekeeRewardList({ roundId }: { roundId: number }) {
  const [items, setItems] = useState<RewardItem[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/lotto/yeekee/rounds/${roundId}/reward-status`, { cache: "no-store" });
        const json: RewardStatusResponse = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || json?.success === false) {
          setError(json?.message ?? `HTTP ${res.status}`);
        } else {
          setItems(json?.data?.items ?? []);
          setEnabled(json?.data?.reward_enabled ?? true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roundId]);

  const total = items.reduce((s, it) => s + (Number(it.credit_amount) || 0), 0);

  return (
    <section className="rounded-2xl border border-ap-border bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 border-b border-ap-border">
        <h2 className="text-[15px] font-extrabold text-white">รายการผู้ได้รับรางวัลทายเลข</h2>
        <p className="text-[12px] text-white/90 font-medium">
          ทั้งหมด {items.length} รายการ · รวม {total.toLocaleString("th-TH")} เครดิต
        </p>
      </div>

      <div className="max-h-[420px] overflow-auto">
        {loading && (
          <div className="p-6 text-center text-[14px] text-ap-tertiary">กำลังโหลด…</div>
        )}
        {!loading && error && (
          <div className="p-4 text-[14px] text-ap-red font-semibold">{error}</div>
        )}
        {!loading && !error && !enabled && (
          <div className="p-6 text-center text-[14px] text-ap-tertiary">รอบนี้ไม่มีรางวัลทายเลข</div>
        )}
        {!loading && !error && enabled && items.length === 0 && (
          <div className="p-6 text-center text-[14px] text-ap-secondary">ยังไม่มีผู้ได้รับรางวัล</div>
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-ap-border">
            {items.map((it, idx) => (
              <li key={`${it.position ?? idx}`} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-amber-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-[12px] font-extrabold tabular-nums">
                    #{it.position ?? "-"}
                  </div>
                  <p className="text-[14px] font-semibold text-ap-primary">ลำดับยิงเลข</p>
                </div>
                <span className="text-[15px] font-extrabold tabular-nums text-emerald-600">
                  +{(Number(it.credit_amount) || 0).toLocaleString("th-TH")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
