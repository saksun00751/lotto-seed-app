"use client";

import { useCallback, useEffect, useState } from "react";

interface ShootItem {
  position?: number;
  number_text?: string;
  number_text_masked?: string;
  submitted_at?: string;
}

interface ShootsResponse {
  success?: boolean;
  message?: string;
  data?: {
    round_id?: number;
    limit?: number;
    count?: number;
    items?: ShootItem[];
  } | null;
}

const SHOOT_EVENT = "yeekee-shoot-submitted";

function formatTime(value?: string) {
  if (!value) return "-";
  const iso = value.replace(" ", "T") + "+07:00";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function YeekeeShootsList({ roundId, autoRefresh = true }: { roundId: number; autoRefresh?: boolean }) {
  const [items, setItems] = useState<ShootItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = `/api/v1/lotto/yeekee/rounds/${roundId}/shoots?limit=50`;

  const fetchShoots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const json: ShootsResponse = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        setError(json?.message ?? `HTTP ${res.status}`);
      } else {
        setItems(json?.data?.items ?? []);
        setCount(json?.data?.count ?? json?.data?.items?.length ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchShoots();
    if (!autoRefresh) return;
    const id = setInterval(fetchShoots, 8000);
    const onShot = () => fetchShoots();
    window.addEventListener(SHOOT_EVENT, onShot);
    return () => {
      clearInterval(id);
      window.removeEventListener(SHOOT_EVENT, onShot);
    };
  }, [fetchShoots, autoRefresh]);

  return (
    <section className="rounded-2xl border border-ap-border bg-white shadow-card overflow-hidden lg:sticky lg:top-4">
      <div className="px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 border-b border-ap-border">
        <h2 className="text-[15px] font-extrabold text-white">รายการผู้ทายเลข</h2>
        <p className="text-[12px] text-white/80 font-medium">ทั้งหมด {count} รายการ</p>
      </div>

      <div className="max-h-[520px] overflow-auto">
        {error && (
          <div className="p-4 text-[14px] text-ap-red font-semibold">{error}</div>
        )}
        {!error && items.length === 0 && !loading && (
          <div className="p-6 text-center text-[14px] text-ap-secondary">ยังไม่มีรายการยิงเลข</div>
        )}
        {!error && items.length > 0 && (
          <ul className="divide-y divide-ap-border">
            {items.map((it, idx) => (
              <li key={`${it.position ?? idx}-${it.submitted_at ?? idx}`} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center text-[12px] font-extrabold tabular-nums">
                    #{it.position ?? "-"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-extrabold text-ap-primary tabular-nums tracking-wider leading-tight">
                      {it.number_text_masked ?? it.number_text ?? "-----"}
                    </p>
                    <p className="text-[12px] text-ap-tertiary mt-0.5">{formatTime(it.submitted_at)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
