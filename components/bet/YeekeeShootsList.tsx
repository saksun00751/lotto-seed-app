"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ShootItem {
  position?: number;
  number_text?: string;
  number_text_masked?: string;
  number_text_revealed?: string;
  is_number_revealed?: boolean;
  member_name?: string;
  member_username?: string;
  member_display_name?: string;
  username?: string;
  display_name?: string;
  member_name_masked?: string;
  member_name_prefix_masked?: string;
  submitted_at?: string;
}

interface ShootsResponse {
  success?: boolean;
  message?: string;
  data?: {
    round_id?: number;
    display_mode?: string;
    is_number_revealed?: boolean;
    shoot_sum?: string;
    shoot_count?: number;
    limit?: number;
    count?: number;
    items?: ShootItem[];
    pagination?: {
      page?: number;
      limit?: number;
      count?: number;
      total?: number;
      has_more?: boolean;
    };
  } | null;
}

const PAGE_SIZE = 20;

const SHOOT_EVENT = "yeekee-shoot-submitted";

function formatTime(value?: string) {
  if (!value) return "-";
  const iso = value.replace(" ", "T") + "+07:00";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function getShootKey(item: ShootItem, idx: number): string {
  const stableKey = [
    item.submitted_at,
    item.member_username ?? item.username ?? item.member_display_name ?? item.display_name,
    item.number_text_revealed ?? item.number_text_masked ?? item.number_text,
  ].filter(Boolean).join("-");
  return stableKey || `shoot-${idx}`;
}

function ShootsListSkeleton() {
  return (
    <div className="divide-y divide-ap-border" aria-label="กำลังโหลดรายการผู้ทายเลข">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-100 border border-violet-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-24 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </div>
          </div>
          <div className="shrink-0 h-3 w-16 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function YeekeeShootsList({ roundId, autoRefresh = true }: { roundId: number; autoRefresh?: boolean }) {
  const [items, setItems] = useState<ShootItem[]>([]);
  const [count, setCount] = useState(0);
  const [shootSum, setShootSum] = useState<string>("");
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemKeys, setNewItemKeys] = useState<Set<string>>(() => new Set());
  const hasLoadedRef = useRef(false);
  const itemKeysRef = useRef<Set<string>>(new Set());
  const clearNewKeysTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(async (targetPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else if (!hasLoadedRef.current) setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/lotto/yeekee/rounds/${roundId}/shoots?page=${targetPage}&limit=${PAGE_SIZE}`,
        { cache: "no-store" },
      );
      const json: ShootsResponse = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        setError(json?.message ?? `HTTP ${res.status}`);
      } else {
        const next = json?.data?.items ?? [];
        const nextKeys = new Set(next.map((item, idx) => getShootKey(item, idx)));
        if (!append && hasLoadedRef.current) {
          const insertedKeys = [...nextKeys].filter((key) => !itemKeysRef.current.has(key));
          if (insertedKeys.length > 0) {
            setNewItemKeys(new Set(insertedKeys));
            if (clearNewKeysTimerRef.current) clearTimeout(clearNewKeysTimerRef.current);
            clearNewKeysTimerRef.current = setTimeout(() => {
              setNewItemKeys(new Set());
              clearNewKeysTimerRef.current = null;
            }, 1200);
          }
        }
        setItems((prev) => (append ? [...prev, ...next] : next));
        itemKeysRef.current = append
          ? new Set([...itemKeysRef.current, ...nextKeys])
          : nextKeys;
        setCount(json?.data?.pagination?.total ?? json?.data?.shoot_count ?? json?.data?.count ?? next.length);
        setShootSum(json?.data?.shoot_sum ?? "");
        setRevealed(Boolean(json?.data?.is_number_revealed));
        setHasMore(Boolean(json?.data?.pagination?.has_more));
        setPage(json?.data?.pagination?.page ?? targetPage);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (!append) hasLoadedRef.current = true;
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [roundId]);

  const refresh = useCallback(() => fetchPage(1, false), [fetchPage]);
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchPage(page + 1, true);
  }, [fetchPage, page, hasMore, loadingMore]);

  useEffect(() => {
    refresh();
    if (!autoRefresh) return;
    const id = setInterval(refresh, 8000);
    const onShot = () => refresh();
    window.addEventListener(SHOOT_EVENT, onShot);
    return () => {
      clearInterval(id);
      window.removeEventListener(SHOOT_EVENT, onShot);
      if (clearNewKeysTimerRef.current) clearTimeout(clearNewKeysTimerRef.current);
    };
  }, [refresh, autoRefresh]);

  return (
    <section className="rounded-2xl border border-ap-border bg-white shadow-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 border-b border-ap-border">
        <h2 className="text-[15px] font-extrabold text-white">รายการผู้ทายเลข</h2>
        <p className="text-[12px] text-white/80 font-medium">ทั้งหมด {count} รายการ</p>
      </div>

      {revealed && shootSum && (
        <div className="px-4 py-3 bg-gradient-to-br from-violet-50 to-fuchsia-50 border-b border-ap-border">
          <p className="text-center text-[12px] font-semibold text-ap-tertiary tracking-wide">ผลรวมเลขยิง</p>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {shootSum.split("").map((digit, i) => (
              <div
                key={i}
                className="w-10 h-12 rounded-xl bg-white border-2 border-violet-400 flex items-center justify-center text-[24px] font-extrabold tabular-nums text-violet-700 shadow-sm"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 max-h-[420px] overflow-auto">
        {error && (
          <div className="p-4 text-[14px] text-ap-red font-semibold">{error}</div>
        )}
        {!error && loading && items.length === 0 && (
          <ShootsListSkeleton />
        )}
        {!error && items.length === 0 && !loading && (
          <div className="p-6 text-center text-[14px] text-ap-secondary">ยังไม่มีรายการยิงเลข</div>
        )}
        {!error && items.length > 0 && (
          <ul className="divide-y divide-ap-border">
            {items.map((it, idx) => {
              const isRevealed = it.is_number_revealed ?? false;
              const numberDisplay = isRevealed
                ? (it.number_text_revealed ?? it.number_text ?? "-----")
                : (it.number_text_masked ?? it.number_text ?? "-----");
              const memberName = it.member_name_prefix_masked || "";
              const itemKey = getShootKey(it, idx);
              const isNew = newItemKeys.has(itemKey);
              return (
                <li
                  key={itemKey}
                  className={[
                    "px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50",
                    isNew ? "yeekee-shoot-new" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center text-[12px] font-extrabold tabular-nums">
                      #{it.position ?? "-"}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[18px] font-extrabold tabular-nums tracking-wider leading-tight ${isRevealed ? "text-emerald-600" : "text-ap-primary"}`}>
                        {numberDisplay}
                      </p>
                      <p className="text-[12px] text-ap-tertiary mt-0.5 truncate flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21v-1a7 7 0 0114 0v1" strokeLinecap="round" />
                        </svg>
                        <span className="truncate">{memberName || "ไม่ระบุชื่อ"}</span>
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] text-ap-tertiary tabular-nums">
                    {formatTime(it.submitted_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!error && hasMore && (
        <div className="p-3 border-t border-ap-border bg-slate-50/60">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-xl border border-violet-300 bg-white text-violet-700 text-[13px] font-bold py-2 hover:bg-violet-50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingMore ? "กำลังโหลด..." : `ดูเพิ่ม (${Math.max(0, count - items.length)} รายการ)`}
          </button>
        </div>
      )}
    </section>
  );
}
