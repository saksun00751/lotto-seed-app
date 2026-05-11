"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface RewardItem {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  is_hidden: number;
  is_featured: number;
  priority: number;
  image: string;
  image_url: string;
  images: string[];
  reward_type: string;
  fulfillment_mode: string;
  point_cost: number;
  credit_amount: string | null;
  gem_amount: string | null;
  stock_unlimited: number;
  stock: number | null;
  reserved_stock: number | null;
  stock_remaining: number | null;
  limit_type: string;
  limit_per_user: number | null;
  limit_period: string | null;
  limit_per_period: number | null;
  strict_limit: number;
  limit_total: number | null;
  cooldown_minutes: number | null;
  start_at: string | null;
  end_at: string | null;
}

interface RewardMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface RewardFilters {
  featured_only?: boolean;
  reward_type?: string;
  q?: string;
}

interface RewardListResponse {
  point?: number;
  diamond?: number;
  system?: {
    reward?: boolean;
  };
  rewards?: RewardItem[];
  meta?: Partial<RewardMeta>;
  filters?: RewardFilters;
  success?: boolean;
  message?: string;
}

interface RewardRedeemResponse {
  success?: boolean;
  message?: string;
  point?: number;
  mode?: string;
  redemption_status?: string;
  format?: {
    title?: string;
    msg?: string;
    img?: string;
  };
  redemption_id?: number;
}

interface RewardHistoryItem {
  id: number;
  reward_code_snapshot: string;
  reward_name_snapshot: string;
  point_cost_snapshot: number;
  reward_type_snapshot?: string | null;
  credit_amount_snapshot?: string | number | null;
  gem_amount_snapshot?: string | number | null;
  status: string;
  redeemed_at: string;
}

interface RewardHistoryTimeline {
  date: string;
  count: number;
}

interface RewardHistoryResponse {
  success?: boolean;
  message?: string;
  items?: RewardHistoryItem[];
  timeline?: RewardHistoryTimeline[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
  };
}

interface Props {
  locale: string;
}

type RewardT = Record<string, string>;
interface ConfirmRedeemTarget {
  id: number;
  name: string;
  pointCost: number;
}

type RewardTab = "rewards" | "history";

type RewardStatus =
  | "ready"
  | "inactive"
  | "upcoming"
  | "ended"
  | "out_stock"
  | "point_not_enough";

const DEFAULT_META: RewardMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
};

const DEFAULT_HISTORY_META = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0,
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseApiDateTime(value: string | null | undefined): Date | null {
  if (!value || typeof value !== "string") return null;
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string | null | undefined, locale: string): string {
  const date = parseApiDateTime(value);
  if (!date) return "-";
  return date.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string | null | undefined, locale: string): string {
  if (!value || typeof value !== "string") return "-";
  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(value: string | null | undefined, locale: string): string {
  const date = parseApiDateTime(value);
  if (!date) return "-";
  return date.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function historyItemDateKey(value: string | null | undefined): string {
  const date = parseApiDateTime(value);
  if (!date) return "unknown";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface HistoryGroup {
  key: string;
  items: RewardHistoryItem[];
}

function groupHistoryByDate(items: RewardHistoryItem[]): HistoryGroup[] {
  const map = new Map<string, RewardHistoryItem[]>();
  const order: string[] = [];
  for (const item of items) {
    const key = historyItemDateKey(item.redeemed_at);
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(item);
  }
  return order.map((key) => ({ key, items: map.get(key) ?? [] }));
}

function rewardTypeMarker(type: string | null | undefined): { emoji: string; className: string } {
  const value = (type ?? "").trim().toLowerCase();
  if (value === "wallet_gem") return { emoji: "💎", className: "bg-cyan-50 border-cyan-300 text-cyan-600" };
  if (value === "wallet_credit") return { emoji: "💰", className: "bg-emerald-50 border-emerald-300 text-ui-status-success" };
  if (value === "external") return { emoji: "🎁", className: "bg-amber-50 border-amber-300 text-ui-status-warning" };
  return { emoji: "🎁", className: "bg-surface-subtle border-ui-border text-ui-text-soft" };
}

function formatDecimal(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function rewardTypeLabel(type: string, t: RewardT): string {
  if (type === "wallet_credit") return t.typeWalletCredit;
  if (type === "gem") return t.typeGem;
  if (type === "coupon") return t.typeCoupon;
  return t.typeOther;
}

function historyRewardTypeLabel(type: string | null | undefined, t: RewardT): string {
  const value = (type ?? "").trim().toLowerCase();
  if (value === "wallet_credit") return t.historyTypeWalletCredit ?? t.typeWalletCredit ?? "เครดิตกระเป๋า";
  if (value === "wallet_gem") return t.historyTypeWalletGem ?? "เพชรกระเป๋า";
  if (value === "external") return t.historyTypeExternal ?? "ภายนอก";
  return value || "-";
}

function historyActionLabel(type: string | null | undefined, t: RewardT): string {
  const value = (type ?? "").trim().toLowerCase();
  if (value === "wallet_gem") return t.historyActionWalletGem ?? "แลกเพชรเข้ากระเป๋า";
  if (value === "wallet_credit") return t.historyActionWalletCredit ?? "แลกเครดิตเข้ากระเป๋า";
  if (value === "external") return t.historyActionExternal ?? "แลกรางวัลภายนอก";
  return t.historyActionDefault ?? "แลกรางวัล";
}

function formatHistoryAmount(value: string | number | null | undefined, mode: "credit" | "gem"): string {
  if (value === null || value === undefined || value === "") return "-";
  const n = toNumber(value, 0);
  if (mode === "credit") {
    return `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const hasDecimal = Number.isFinite(n) && !Number.isInteger(n);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: hasDecimal ? 2 : 0,
  });
}

function historyReceivedValue(item: RewardHistoryItem): { value: string; className: string } {
  const rewardType = (item.reward_type_snapshot ?? "").trim().toLowerCase();

  if (rewardType === "wallet_gem") {
    return {
      value: `💎 ${formatHistoryAmount(item.gem_amount_snapshot, "gem")}`,
      className: "text-cyan-600",
    };
  }
  if (rewardType === "wallet_credit") {
    return {
      value: formatHistoryAmount(item.credit_amount_snapshot, "credit"),
      className: "text-ui-status-success",
    };
  }

  if (item.credit_amount_snapshot !== null && item.credit_amount_snapshot !== undefined && item.credit_amount_snapshot !== "") {
    return {
      value: formatHistoryAmount(item.credit_amount_snapshot, "credit"),
      className: "text-ui-status-success",
    };
  }
  if (item.gem_amount_snapshot !== null && item.gem_amount_snapshot !== undefined && item.gem_amount_snapshot !== "") {
    return {
      value: `💎 ${formatHistoryAmount(item.gem_amount_snapshot, "gem")}`,
      className: "text-cyan-600",
    };
  }
  return { value: "-", className: "text-ui-text-muted" };
}

function getRewardStatus(item: RewardItem, userPoint: number): RewardStatus {
  const now = new Date();
  const start = parseApiDateTime(item.start_at);
  const end = parseApiDateTime(item.end_at);
  const isActiveStatus = String(item.status).toLowerCase() === "active";
  const remaining = toNumber(item.stock_remaining, 0);
  const isUnlimited = Number(item.stock_unlimited) === 1;
  const hasPointEnough = userPoint >= toNumber(item.point_cost, 0);

  if (!isActiveStatus) return "inactive";
  if (start && now < start) return "upcoming";
  if (end && now > end) return "ended";
  if (!isUnlimited && remaining <= 0) return "out_stock";
  if (!hasPointEnough) return "point_not_enough";
  return "ready";
}

function statusLabel(status: RewardStatus, t: RewardT): string {
  if (status === "inactive") return t.statusInactive;
  if (status === "upcoming") return t.statusUpcoming;
  if (status === "ended") return t.statusEnded;
  if (status === "out_stock") return t.statusOutOfStock;
  if (status === "point_not_enough") return t.statusPointNotEnough;
  return t.statusReady;
}

function statusClass(status: RewardStatus): string {
  if (status === "ready") return "bg-ui-status-success/12 text-ui-status-success border-emerald-500/35";
  if (status === "point_not_enough") return "bg-ui-status-warning/14 text-ui-status-warning border-amber-500/35";
  return "bg-surface-subtle text-ui-text-muted border-ui-border";
}

function historyStatusClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "fulfilled") return "bg-ui-status-success/12 text-ui-status-success border-emerald-500/35";
  if (normalized === "pending") return "bg-ui-status-warning/12 text-ui-status-warning border-amber-500/35";
  if (normalized === "failed" || normalized === "cancelled" || normalized === "rejected") {
    return "bg-ui-status-error/10 text-ui-status-error border-red-500/30";
  }
  return "bg-surface-subtle text-ui-text-muted border-ui-border";
}

function historyStatusLabel(status: string, t: RewardT): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "fulfilled") return t.historyStatusFulfilled;
  if (normalized === "approved") return t.historyStatusApproved ?? t.historyStatusFulfilled;
  if (normalized === "pending") return t.historyStatusPending;
  if (normalized === "failed") return t.historyStatusFailed;
  if (normalized === "cancelled") return t.historyStatusCancelled;
  if (normalized === "rejected") return t.historyStatusRejected;
  return status || "-";
}

function RewardCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ui-border bg-surface-card shadow-card overflow-hidden animate-pulse">
      <div className="h-28 bg-surface-subtle" />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded bg-surface-subtle w-3/4" />
        <div className="h-3 rounded bg-surface-subtle w-full" />
        <div className="h-3 rounded bg-surface-subtle w-5/6" />
        <div className="h-9 rounded-xl bg-surface-subtle w-full" />
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: RewardT }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/70 shadow-[0_18px_48px_rgba(194,130,16,0.22)]">
      <div className="absolute inset-0 [background:var(--ui-reward-bg-strong)]" />
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/20 blur-sm" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-amber-200/25 blur-md" />
      <div className="relative px-4 py-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/25 border border-white/40 backdrop-blur-sm flex items-center justify-center mb-4">
          <span className="emoji-font text-[28px]">🎁</span>
        </div>
        <p className="text-[20px] font-extrabold text-ui-text-inverse [text-shadow:0_1px_2px_rgba(0,0,0,0.18)]">{t.emptyTitle}</p>
        <p className="text-[13px] text-ui-text-inverse/90 mt-2">{t.emptyDesc}</p>
      </div>
    </div>
  );
}

function SystemDisabledCard({ t }: { t: RewardT }) {
  return (
    <div className="rounded-2xl border border-ui-border bg-surface-card shadow-card px-5 py-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 text-ui-status-error border border-red-100 flex items-center justify-center text-[22px]">
        ⛔
      </div>
      <p className="mt-3 text-[16px] font-bold text-ui-text">{t.systemDisabledTitle}</p>
      <p className="mt-1 text-[12px] text-ui-text-muted">{t.systemDisabledDesc}</p>
    </div>
  );
}

function RedeemConfirmModal({
  t,
  target,
  pending,
  onCancel,
  onConfirm,
}: {
  t: RewardT;
  target: ConfirmRedeemTarget | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.confirmModalCancel}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-amber-300/80 shadow-[0_26px_65px_rgba(75,49,6,0.45)] bg-surface-card animate-pop-in">
        <div className="[background:var(--ui-reward-bg-strong)] px-4 py-3 border-b border-amber-700/20">
          <p className="text-[18px] font-extrabold text-ui-reward-text">{t.confirmModalTitle}</p>
          <p className="text-[12px] text-ui-reward-text/85 mt-0.5">{t.confirmModalSubtitle}</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-2xl border border-ui-border bg-surface-subtle px-3 py-3">
            <p className="text-[12px] text-ui-text-muted">{target.name}</p>
            <p className="text-[22px] font-extrabold text-ui-status-info tabular-nums mt-1">
              {target.pointCost.toLocaleString("en-US")} {t.pointSuffix}
            </p>
            <p className="text-[11px] text-ui-text-muted mt-1">{t.confirmModalPointLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="h-10 rounded-xl border border-ui-border bg-surface-card text-ui-text-soft text-[13px] font-semibold hover:bg-surface-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.confirmModalCancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="h-10 rounded-xl bg-ui-button-primary text-ui-text-inverse text-[13px] font-bold hover:bg-ui-button-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? t.buttonRedeeming : t.confirmModalConfirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RewardPage({ locale }: Props) {
  const t = useTranslation("reward") as RewardT;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [point, setPoint] = useState(0);
  const [diamond, setDiamond] = useState(0);
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<RewardTab>("rewards");
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [meta, setMeta] = useState<RewardMeta>(DEFAULT_META);
  const [historyItems, setHistoryItems] = useState<RewardHistoryItem[]>([]);
  const [historyTimeline, setHistoryTimeline] = useState<RewardHistoryTimeline[]>([]);
  const [historyMeta, setHistoryMeta] = useState(DEFAULT_HISTORY_META);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearchInput, setHistorySearchInput] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");
  const [historyRewardTypeFilter, setHistoryRewardTypeFilter] = useState("");
  const [historyModeFilter, setHistoryModeFilter] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmRedeemTarget | null>(null);

  const fetchRewards = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "20");
      if (featuredOnly) params.set("featured_only", "1");
      if (searchTerm.trim()) params.set("q", searchTerm.trim());

      const query = params.toString();
      const url = `/api/reward/list${query ? `?${query}` : ""}`;

      const res = await fetch(url, { cache: "no-store", signal });
      const payload = (await res.json()) as RewardListResponse;

      if (!res.ok || payload.success === false) {
        setRewards([]);
        setError(payload.message?.trim() || t.listError);
        return;
      }

      const list = Array.isArray(payload.rewards) ? payload.rewards : [];
      setRewards(list);
      setPoint(toNumber(payload.point));
      setDiamond(toNumber(payload.diamond));
      setSystemEnabled(Boolean(payload.system?.reward ?? true));
      setMeta({
        current_page: toNumber(payload.meta?.current_page, 1),
        last_page: toNumber(payload.meta?.last_page, 1),
        per_page: toNumber(payload.meta?.per_page, 20),
        total: toNumber(payload.meta?.total, list.length),
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setRewards([]);
      setError(t.listError);
    } finally {
      setLoading(false);
    }
  }, [featuredOnly, page, searchTerm, t.listError]);

  const fetchHistory = useCallback(async (signal?: AbortSignal) => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(historyPage));
      params.set("per_page", "20");
      // NOTE: keep history filters disabled for now
      // if (historySearchTerm.trim()) params.set("q", historySearchTerm.trim());
      // if (historyStatusFilter) params.set("status", historyStatusFilter);
      // if (historyRewardTypeFilter) params.set("reward_type", historyRewardTypeFilter);
      // if (historyModeFilter) params.set("mode", historyModeFilter);
      const query = params.toString();
      const url = `/api/reward/history${query ? `?${query}` : ""}`;

      const res = await fetch(url, { cache: "no-store", signal });
      const payload = (await res.json()) as RewardHistoryResponse;

      if (!res.ok || payload.success === false) {
        setHistoryItems([]);
        setHistoryTimeline([]);
        setHistoryMeta(DEFAULT_HISTORY_META);
        setHistoryError(payload.message?.trim() || t.historyLoadError);
        return;
      }

      const items = Array.isArray(payload.items) ? payload.items : [];
      setHistoryItems(items);
      setHistoryTimeline(Array.isArray(payload.timeline) ? payload.timeline : []);
      setHistoryMeta({
        current_page: toNumber(payload.meta?.current_page, historyPage),
        last_page: toNumber(payload.meta?.last_page, 1),
        per_page: toNumber(payload.meta?.per_page, 20),
        total: toNumber(payload.meta?.total, items.length),
        from: toNumber(payload.meta?.from, items.length > 0 ? 1 : 0),
        to: toNumber(payload.meta?.to, items.length),
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setHistoryItems([]);
      setHistoryTimeline([]);
      setHistoryMeta(DEFAULT_HISTORY_META);
      setHistoryError(t.historyLoadError);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, t.historyLoadError]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchRewards(controller.signal);
    return () => controller.abort();
  }, [fetchRewards]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const controller = new AbortController();
    void fetchHistory(controller.signal);
    return () => controller.abort();
  }, [activeTab, fetchHistory]);

  useEffect(() => {
    if (!confirmTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && redeemingId === null) {
        setConfirmTarget(null);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [confirmTarget, redeemingId]);

  const handleRedeem = useCallback(async (rewardId: number) => {
    if (rewardId <= 0 || redeemingId !== null) return;

    setRedeemingId(rewardId);
    try {
      const res = await fetch("/api/reward/redeem", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_id: rewardId }),
      });
      const payload = (await res.json()) as RewardRedeemResponse;

      const ok = Boolean(res.ok && payload.success);
      if (!ok) {
        toast.error(payload.message?.trim() || t.redeemFailed);
        return;
      }

      if (typeof payload.point === "number" && Number.isFinite(payload.point)) {
        setPoint(payload.point);
      }

      const title = payload.format?.title?.trim() || payload.message?.trim() || t.redeemSuccessTitle;
      const msg = payload.format?.msg?.trim();

      if (msg) {
        toast.success(title, { description: msg });
      } else {
        toast.success(title);
      }

      await fetchRewards();
      await fetchHistory();
    } catch {
      toast.error(t.networkError);
    } finally {
      setRedeemingId(null);
    }
  }, [fetchHistory, fetchRewards, redeemingId, t.networkError, t.redeemFailed, t.redeemSuccessTitle]);

  const totalPages = useMemo(() => Math.max(1, meta.last_page), [meta.last_page]);
  const historyTotalPages = useMemo(() => Math.max(1, historyMeta.last_page), [historyMeta.last_page]);
  const historyStatusOptions = useMemo(() => ([
    { value: "", label: t.historyFilterAllStatus ?? "ทุกสถานะ" },
    { value: "fulfilled", label: t.historyStatusFulfilled ?? "สำเร็จ" },
    { value: "approved", label: t.historyStatusApproved ?? "อนุมัติ" },
    { value: "pending", label: t.historyStatusPending ?? "รอดำเนินการ" },
  ]), [t.historyFilterAllStatus, t.historyStatusApproved, t.historyStatusFulfilled, t.historyStatusPending]);
  const historyRewardTypeOptions = useMemo(() => ([
    { value: "", label: t.historyFilterAllRewardType ?? "ทุกประเภทรางวัล" },
    { value: "wallet_credit", label: t.historyTypeWalletCredit ?? "เครดิตกระเป๋า" },
    { value: "wallet_gem", label: t.historyTypeWalletGem ?? "เพชรกระเป๋า" },
    { value: "external", label: t.historyTypeExternal ?? "ภายนอก" },
  ]), [t.historyFilterAllRewardType, t.historyTypeExternal, t.historyTypeWalletCredit, t.historyTypeWalletGem]);
  const historyModeOptions = useMemo(() => ([
    { value: "", label: t.historyFilterAllMode ?? "ทุกโหมด" },
    { value: "auto", label: t.historyModeAuto ?? "อัตโนมัติ" },
    { value: "manual", label: t.historyModeManual ?? "แมนนวล" },
    { value: "approval", label: t.historyModeApproval ?? "รออนุมัติ" },
  ]), [t.historyFilterAllMode, t.historyModeApproval, t.historyModeAuto, t.historyModeManual]);

  async function confirmRedeem() {
    if (!confirmTarget) return;
    const { id } = confirmTarget;
    setConfirmTarget(null);
    await handleRedeem(id);
  }

  return (
    <div className="min-h-screen bg-surface-subtle pb-20 sm:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-5 space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dashboard`}
            className="w-8 h-8 rounded-xl bg-surface-card border border-ui-border flex items-center justify-center shadow-sm hover:bg-surface-subtle transition-colors"
          >
            <svg className="w-4 h-4 text-ui-text-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-ui-text leading-tight">{t.title}</h1>
            <p className="text-[12px] text-ui-text-muted">{t.subtitle}</p>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border border-amber-300/80 shadow-[0_20px_52px_rgba(236,153,28,0.30)]">
          <div className="[background:var(--ui-reward-bg-strong)] px-4 py-3 flex items-center">
            <p className="text-[20px] font-bold text-ui-reward-text">{t.title}</p>
          </div>

          <div className="[background:var(--ui-category-default)] px-4 py-4 border-t border-white/15 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("rewards")}
                className={[
                  "h-8 rounded-full px-3 text-[12px] font-semibold transition-colors border",
                  activeTab === "rewards"
                    ? "[background:var(--ui-reward-bg)] border-amber-200 text-ui-reward-text shadow-[0_6px_16px_rgba(245,182,42,0.40)]"
                    : "bg-white/14 border-white/25 text-ui-text-inverse/80 hover:bg-white/18",
                ].join(" ")}
              >
                {t.tabRewards}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={[
                  "h-8 rounded-full px-3 text-[12px] font-semibold transition-colors border",
                  activeTab === "history"
                    ? "[background:var(--ui-reward-bg)] border-amber-200 text-ui-reward-text shadow-[0_6px_16px_rgba(245,182,42,0.40)]"
                    : "bg-white/14 border-white/25 text-ui-text-inverse/80 hover:bg-white/18",
                ].join(" ")}
              >
                {t.tabHistory}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/20 bg-white/[0.12] px-3 py-2">
                <p className="text-[11px] text-ui-text-inverse/75">{t.pointLabel}</p>
                <p className="text-[20px] font-extrabold text-amber-200 tabular-nums">
                  {point.toLocaleString("en-US")}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/[0.12] px-3 py-2">
                <p className="text-[11px] text-ui-text-inverse/75">{t.diamondLabel}</p>
                <p className="text-[20px] font-extrabold text-cyan-200 tabular-nums">
                  {diamond.toLocaleString("en-US")}
                </p>
              </div>
            </div>

            {activeTab === "rewards" ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPage(1);
                        setSearchTerm(searchInput);
                      }
                    }}
                    placeholder={t.searchPlaceholder}
                    className="flex-1 h-9 rounded-lg border border-white/20 bg-ui-button-primary/55 px-3 text-[13px] text-ui-text-inverse placeholder:text-ui-text-inverse/50 outline-none focus:border-amber-200/70"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSearchInput("");
                      setSearchTerm("");
                    }}
                    className="h-9 rounded-lg border border-white/25 bg-white/16 px-3 text-[12px] font-semibold text-ui-text-inverse hover:bg-white/22 transition-colors"
                  >
                    {t.clear}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSearchTerm(searchInput);
                    }}
                    className="h-9 rounded-lg [background:var(--ui-reward-bg)] border border-amber-200 px-3 text-[12px] font-bold text-ui-reward-text hover:brightness-105 transition-all shadow-[0_6px_16px_rgba(245,182,42,0.35)]"
                  >
                    {t.search}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPage(1);
                        setFeaturedOnly(false);
                      }}
                      className={[
                        "h-8 rounded-full px-3 text-[12px] font-semibold transition-colors border",
                        featuredOnly ? "bg-white/14 border-white/25 text-ui-text-inverse/80 hover:bg-white/18" : "[background:var(--ui-reward-bg)] border-amber-200 text-ui-reward-text shadow-[0_6px_16px_rgba(245,182,42,0.35)]",
                      ].join(" ")}
                    >
                      {t.filterAll}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPage(1);
                        setFeaturedOnly(true);
                      }}
                      className={[
                        "h-8 rounded-full px-3 text-[12px] font-semibold transition-colors border",
                        featuredOnly ? "[background:var(--ui-reward-bg)] border-amber-200 text-ui-reward-text shadow-[0_6px_16px_rgba(245,182,42,0.35)]" : "bg-white/14 border-white/25 text-ui-text-inverse/80 hover:bg-white/18",
                      ].join(" ")}
                    >
                      {t.filterFeatured}
                    </button>
                  </div>
                  <p className="text-[11px] text-ui-text-inverse/65">
                    {t.showing} {meta.total.toLocaleString("en-US")} {t.items}
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-ui-text-inverse/85">{t.historyTitle}</p>
                  <p className="text-[11px] text-ui-text-inverse/65">
                    {t.showing} {historyMeta.total.toLocaleString("en-US")} {t.items}
                  </p>
                </div>

                {/* NOTE: keep history filters disabled for now */}
              </div>
            )}
          </div>
        </div>

        {activeTab === "rewards" ? (
          <>
            {!systemEnabled && !loading && !error && <SystemDisabledCard t={t} />}

            {error && !loading && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-ui-status-error">
                {error}
              </div>
            )}

            {!error && systemEnabled && (
              <div className="space-y-3">
                {loading ? (
                  <>
                    <p className="text-[12px] text-ui-text-muted">{t.loadingList}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <RewardCardSkeleton />
                      <RewardCardSkeleton />
                      <RewardCardSkeleton />
                    </div>
                  </>
                ) : rewards.length === 0 ? (
                  <EmptyState t={t} />
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rewards.map((reward) => {
                        const status = getRewardStatus(reward, point);
                        const isReady = status === "ready";
                        const isRedeeming = redeemingId === reward.id;
                        const pointCost = toNumber(reward.point_cost, 0);
                        const credit = toNumber(reward.credit_amount, 0);
                        const remaining = toNumber(reward.stock_remaining, 0);
                        const isUnlimited = Number(reward.stock_unlimited) === 1;
                        const image = reward.image_url || reward.image || "";

                        const isFeatured = Number(reward.is_featured) === 1;
                        return (
                          <div
                            key={reward.id}
                            className={[
                              "group relative rounded-2xl bg-surface-card shadow-card overflow-hidden transition-all",
                              "hover:shadow-card-hover hover:-translate-y-[2px]",
                              isFeatured
                                ? "border border-amber-300/80 shadow-[0_14px_36px_rgba(236,153,28,0.22)]"
                                : "border border-ui-border",
                            ].join(" ")}
                          >
                            {image ? (
                              <div className="relative h-28 w-full bg-surface-subtle">
                                <img src={image} alt={reward.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                                {isFeatured && (
                                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full [background:var(--ui-reward-bg)] text-ui-reward-text text-[10px] font-bold px-2 py-1 border border-amber-200 shadow-[0_6px_14px_rgba(245,182,42,0.4)]">
                                    <span className="emoji-font leading-none">⭐</span>
                                    {t.filterFeatured}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="relative h-28 w-full overflow-hidden text-ui-text-inverse flex items-center justify-center">
                                <div className="absolute inset-0 [background:var(--ui-category-default)]" />
                                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-sm" />
                                <span className="relative emoji-font text-[36px] [text-shadow:0_2px_6px_rgba(0,0,0,0.35)]">🎁</span>
                                {isFeatured && (
                                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full [background:var(--ui-reward-bg)] text-ui-reward-text text-[10px] font-bold px-2 py-1 border border-amber-200 shadow-[0_6px_14px_rgba(245,182,42,0.4)]">
                                    <span className="emoji-font leading-none">⭐</span>
                                    {t.filterFeatured}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h2 className="text-[17px] sm:text-[18px] font-extrabold text-ui-text leading-tight line-clamp-2">
                                  {reward.name || reward.code}
                                </h2>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${statusClass(status)}`}>
                                  {statusLabel(status, t)}
                                </span>
                              </div>

                              <div className="relative rounded-xl border border-ui-border bg-surface-subtle/60 px-3 py-2">
                                <span
                                  aria-hidden
                                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full [background:var(--ui-reward-bg-strong)]"
                                />
                                <p className="text-[12px] text-ui-text-soft leading-relaxed min-h-9 line-clamp-2 pl-2">
                                  {reward.description?.trim() || "-"}
                                </p>
                              </div>

                              {(() => {
                                const rewardType = (reward.reward_type ?? "").trim().toLowerCase();
                                const gemAmount = toNumber(reward.gem_amount, 0);
                                let receivedText = "-";
                                let receivedClass = "text-ui-reward-text";
                                if (rewardType === "gem" || gemAmount > 0) {
                                  receivedText = `💎 ${gemAmount.toLocaleString("en-US")}`;
                                  receivedClass = "text-cyan-700";
                                } else if (credit > 0) {
                                  receivedText = `+฿${formatDecimal(credit)}`;
                                  receivedClass = "text-ui-status-success";
                                } else {
                                  receivedText = t.typeOther ?? "-";
                                }
                                return (
                                  <div className="relative rounded-2xl overflow-hidden border border-amber-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                                    <div className="absolute inset-0 bg-[var(--ui-alert-warning-bg)]" />
                                    <div className="relative px-3 pt-2.5">
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 border border-amber-300/70 px-2.5 py-1 text-[13px] font-bold text-amber-900">
                                        <span aria-hidden className="emoji-font leading-none text-[14px]">🎯</span>
                                        {historyActionLabel(reward.reward_type, t)}
                                      </span>
                                    </div>
                                    <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pt-1.5 pb-2.5">
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-semibold text-amber-800/80 uppercase tracking-wide">
                                          {t.historyPointUsed ?? "ใช้"}
                                        </p>
                                        <p className="text-[18px] sm:text-[20px] font-extrabold text-ui-reward-text tabular-nums leading-tight whitespace-nowrap [text-shadow:0_1px_0_rgba(255,255,255,0.6)]">
                                          {pointCost.toLocaleString("en-US")}
                                          <span className="text-[11px] font-bold text-amber-800/80 ml-1">{t.pointSuffix}</span>
                                        </p>
                                      </div>
                                      <span aria-hidden className="text-ui-status-warning/70 text-[16px] font-extrabold">→</span>
                                      <div className="text-right min-w-0">
                                        <p className="text-[10px] font-semibold text-amber-800/80 uppercase tracking-wide">
                                          {t.historyReceivedLabel ?? "ได้รับ"}
                                        </p>
                                        <p className={`text-[18px] sm:text-[20px] font-extrabold tabular-nums leading-tight whitespace-nowrap ${receivedClass}`}>
                                          {receivedText}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={[
                                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold",
                                    isUnlimited
                                      ? "border-emerald-200 bg-emerald-50 text-ui-status-success"
                                      : remaining <= 0
                                      ? "border-red-200 bg-red-50 text-ui-status-error"
                                      : "border-sky-200 bg-sky-50 text-sky-700",
                                  ].join(" ")}
                                >
                                  <span aria-hidden className="emoji-font leading-none text-[14px]">📦</span>
                                  {isUnlimited ? t.unlimited : `${t.stockLeft} ${remaining.toLocaleString("en-US")}`}
                                </span>
                                {(reward.start_at || reward.end_at) && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 px-2.5 py-1 text-[12px] font-semibold">
                                    <span aria-hidden className="emoji-font leading-none text-[14px]">⏱️</span>
                                    {formatDateTime(reward.start_at, locale)} - {formatDateTime(reward.end_at, locale)}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!isReady || redeemingId !== null) return;
                                  setConfirmTarget({
                                    id: reward.id,
                                    name: reward.name || reward.code,
                                    pointCost,
                                  });
                                }}
                                disabled={!isReady || redeemingId !== null}
                                className={[
                                  "w-full h-10 rounded-xl text-[12px] font-extrabold transition-all active:scale-[0.98]",
                                  isReady && redeemingId === null
                                    ? "[background:var(--ui-reward-bg)] text-ui-reward-text border border-amber-200 shadow-[0_8px_18px_rgba(245,182,42,0.35)] hover:brightness-105"
                                    : "bg-surface-subtle text-ui-text-muted border border-ui-border cursor-not-allowed",
                                ].join(" ")}
                              >
                                {isRedeeming ? t.buttonRedeeming : isReady ? t.buttonRedeem : t.buttonUnavailable}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {meta.total > meta.per_page && (
                      <div className="bg-surface-card rounded-2xl border border-ui-border shadow-card px-4 py-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          disabled={page <= 1}
                          className="h-9 px-3 rounded-xl border border-ui-border bg-surface-card text-[12px] font-semibold text-ui-text-soft hover:bg-surface-subtle transition-colors disabled:opacity-40 disabled:hover:bg-surface-card"
                        >
                          {t.pagePrev}
                        </button>
                        <span className="text-[12px] text-ui-text-soft tabular-nums px-2">
                          {t.pageOf.replace("{cur}", String(page)).replace("{total}", String(totalPages))}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={page >= totalPages}
                          className="h-9 px-3 rounded-xl border border-amber-200 [background:var(--ui-reward-bg)] text-[12px] font-bold text-ui-reward-text shadow-[0_6px_14px_rgba(245,182,42,0.30)] hover:brightness-105 transition-all disabled:opacity-40 disabled:shadow-none"
                        >
                          {t.pageNext}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="bg-surface-card rounded-2xl border border-ui-border shadow-card p-4 space-y-3 animate-pulse">
                <div className="h-4 rounded bg-surface-subtle w-48" />
                <div className="h-14 rounded-xl bg-surface-subtle" />
                <div className="h-14 rounded-xl bg-surface-subtle" />
              </div>
            ) : historyError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-ui-status-error">
                {historyError}
              </div>
            ) : historyItems.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border border-amber-300/70 shadow-[0_18px_48px_rgba(194,130,16,0.18)]">
                <div className="absolute inset-0 [background:var(--ui-reward-bg-strong)]" />
                <div className="relative py-14 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white/25 border border-white/40 backdrop-blur-sm flex items-center justify-center mb-3">
                    <span className="emoji-font text-[26px]">🧾</span>
                  </div>
                  <p className="text-[18px] font-extrabold text-ui-text-inverse [text-shadow:0_1px_2px_rgba(0,0,0,0.18)]">{t.historyEmptyTitle}</p>
                  <p className="text-[16px] text-ui-text-inverse/90 mt-1">{t.historyEmptyDesc}</p>
                </div>
              </div>
            ) : (
              <>
                {(() => {
                  const groups = groupHistoryByDate(historyItems);
                  const timelineCounts = new Map(historyTimeline.map((entry) => [entry.date, entry.count]));
                  return (
                    <div className="rounded-2xl border border-ui-border bg-surface-card shadow-card px-4 sm:px-5 py-4">
                      <div className="relative">
                        <div
                          aria-hidden
                          className="absolute left-[11px] top-1 bottom-1 w-px bg-gradient-to-b from-amber-400/60 via-ui-border to-transparent"
                        />

                        <ol className="space-y-5">
                          {groups.map((group) => {
                            const groupCount = timelineCounts.get(group.key) ?? group.items.length;
                            return (
                              <li key={group.key} className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="relative z-10 w-6 h-6 flex items-center justify-center">
                                    <span className="w-3 h-3 rounded-full [background:var(--ui-reward-bg)] ring-4 ring-white shadow-[0_0_0_1px_rgba(194,130,16,0.30)]" />
                                  </div>
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-[14px] font-bold text-ui-text">
                                      {formatDateOnly(group.key, locale)}
                                    </span>
                                    <span className="text-[14px] font-bold text-ui-reward-text tabular-nums bg-[var(--ui-alert-warning-bg)] border border-amber-200 rounded-full px-2.5 py-0.5">
                                      {groupCount.toLocaleString("en-US")} {t.items}
                                    </span>
                                  </div>
                                </div>

                                <ul className="space-y-3 pl-9">
                                  {group.items.map((item) => {
                                    const received = historyReceivedValue(item);
                                    const pointUsedText = `${toNumber(item.point_cost_snapshot, 0).toLocaleString("en-US")} ${t.pointSuffix}`;
                                    const marker = rewardTypeMarker(item.reward_type_snapshot);
                                    return (
                                      <li key={item.id} className="relative">
                                        <span
                                          aria-hidden
                                          className="absolute -left-[22px] top-4 h-px w-5 bg-ui-border"
                                        />
                                        <span
                                          aria-hidden
                                          className={`absolute -left-[32px] top-2 w-6 h-6 rounded-full border flex items-center justify-center text-[14px] bg-surface-card ${marker.className}`}
                                        >
                                          <span className="emoji-font leading-none">{marker.emoji}</span>
                                        </span>

                                        <div className="rounded-2xl border border-ui-border bg-surface-card hover:border-amber-300/70 hover:shadow-card transition-all px-3.5 py-3">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <p className="text-[16px] font-bold text-ui-text leading-snug truncate">
                                                {item.reward_name_snapshot}
                                              </p>
                                            </div>
                                            <span className={`shrink-0 text-[14px] font-bold px-2.5 py-1 rounded-full border ${historyStatusClass(item.status)}`}>
                                              {historyStatusLabel(item.status, t)}
                                            </span>
                                          </div>

                                          <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 px-2.5 py-1 text-[14px] font-semibold">
                                              <span aria-hidden className="emoji-font leading-none text-[14px]">🎯</span>
                                              {historyActionLabel(item.reward_type_snapshot, t)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[14px] text-ui-text-muted">
                                              <span aria-hidden className="emoji-font leading-none">🕒</span>
                                              {formatTimeOnly(item.redeemed_at, locale)}
                                            </span>
                                          </div>

                                          <div className="mt-2.5 grid grid-cols-2 gap-2">
                                            <div className="rounded-xl bg-surface-subtle border border-ui-border px-3 py-2">
                                              <p className="text-[14px] text-ui-text-muted">{t.historyPointUsed ?? "แต้มที่ใช้"}</p>
                                              <p className="text-[16px] font-bold text-ui-text mt-0.5 tabular-nums">
                                                {pointUsedText}
                                              </p>
                                            </div>
                                            <div className="rounded-xl bg-surface-subtle border border-ui-border px-3 py-2">
                                              <p className="text-[14px] text-ui-text-muted">{t.historyReceivedLabel ?? "จำนวนที่ได้รับ"}</p>
                                              <p className={`text-[16px] font-bold mt-0.5 tabular-nums ${received.className}`}>
                                                {received.value}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    </div>
                  );
                })()}

                {historyMeta.total > historyMeta.per_page && (
                  <div className="bg-surface-card rounded-2xl border border-ui-border shadow-card px-4 py-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={historyPage <= 1}
                      className="h-9 px-3 rounded-xl border border-ui-border bg-surface-card text-[12px] font-semibold text-ui-text-soft hover:bg-surface-subtle transition-colors disabled:opacity-40 disabled:hover:bg-surface-card"
                    >
                      {t.pagePrev}
                    </button>
                    <span className="text-[12px] text-ui-text-soft tabular-nums px-2">
                      {t.pageOf.replace("{cur}", String(historyPage)).replace("{total}", String(historyTotalPages))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                      disabled={historyPage >= historyTotalPages}
                      className="h-9 px-3 rounded-xl border border-amber-200 [background:var(--ui-reward-bg)] text-[12px] font-bold text-ui-reward-text shadow-[0_6px_14px_rgba(245,182,42,0.30)] hover:brightness-105 transition-all disabled:opacity-40 disabled:shadow-none"
                    >
                      {t.pageNext}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <RedeemConfirmModal
        t={t}
        target={confirmTarget}
        pending={redeemingId !== null}
        onCancel={() => {
          if (redeemingId !== null) return;
          setConfirmTarget(null);
        }}
        onConfirm={() => { void confirmRedeem(); }}
      />
    </div>
  );
}
