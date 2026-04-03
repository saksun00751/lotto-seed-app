import { apiGet } from "@/lib/api/client";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";

export interface TxRow {
  id: number;
  label: string;
  amount: number;
  amountRaw: number;
  balanceBefore: number;
  balanceAfter: number;
  date: string;
  status: "สำเร็จ" | "รอดำเนินการ" | "ยกเลิก";
}

type TxStatus = TxRow["status"];

interface HistoryApiItem {
  id?: number | string;
  code?: number | string;
  type?: string;
  title?: string;
  label?: string;
  detail?: string;
  note?: string;
  method?: string;
  status_display?: string;
  date_create?: string;
  amount?: number | string;
  credit?: number | string;
  debit?: number | string;
  balance_before?: number | string;
  balance_after?: number | string;
  status?: string | number;
  status_label?: string;
  created_at?: string;
  date?: string;
}

interface HistoryApiResponse {
  success?: boolean;
  items?: HistoryApiItem[];
  data?:
    | HistoryApiItem[]
    | HistoryApiItem
    | {
        items?: HistoryApiItem[];
        list?: HistoryApiItem[];
        rows?: HistoryApiItem[];
        history?: HistoryApiItem[];
      }
    | null;
  message?: string;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function mapStatus(status: unknown, statusLabel?: string): TxStatus {
  const raw = String(statusLabel ?? status ?? "").toLowerCase();
  if (raw.includes("สำเร็จ") || raw.includes("success") || raw.includes("completed") || raw === "1") return "สำเร็จ";
  if (raw.includes("รอดำเนินการ") || raw.includes("pending") || raw.includes("wait") || raw === "0") return "รอดำเนินการ";
  return "ยกเลิก";
}

function mapHistoryItem(row: HistoryApiItem, idx: number, type: string): TxRow {
  const credit = toNumber(row.credit, 0);
  const debit = toNumber(row.debit, 0);
  const rawAmount = row.amount !== undefined
    ? toNumber(row.amount, 0)
    : (credit > 0 ? credit : debit > 0 ? -debit : 0);

  const date = String(row.created_at ?? row.date_create ?? row.date ?? "");
  const label = String(
    row.status_display ?? row.title ?? row.label ?? row.method ?? row.detail ?? row.note ?? type
  );
  return {
    id: toNumber(row.code ?? row.id, idx + 1),
    label,
    amount: Math.abs(rawAmount),
    amountRaw: rawAmount,
    balanceBefore: toNumber(row.balance_before, 0),
    balanceAfter: toNumber(row.balance_after, 0),
    date,
    status: mapStatus(row.status, row.status_label),
  };
}

interface TxFilter {
  dateStart?: string;
  dateStop?: string;
}

function extractHistoryItems(data: HistoryApiResponse["data"]): HistoryApiItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  if ("list" in data && Array.isArray(data.list)) return data.list;
  if ("rows" in data && Array.isArray(data.rows)) return data.rows;
  if ("history" in data && Array.isArray(data.history)) return data.history;
  return [data as HistoryApiItem];
}

export async function getTransactionsByTab(_userId: string, tabId: string, filter?: TxFilter): Promise<TxRow[]> {
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);
  if (!token) return [];

  const qs = new URLSearchParams();
  if (filter?.dateStart) qs.set("date_start", filter.dateStart);
  if (filter?.dateStop) qs.set("date_stop", filter.dateStop);
  const query = qs.toString();
  const path = `/member/history/${encodeURIComponent(tabId)}${query ? `?${query}` : ""}`;

  try {
    const res = await apiGet<HistoryApiResponse>(path, token, lang);
    const rows = (Array.isArray(res?.items) && res.items.length > 0)
      ? res.items
      : extractHistoryItems(res?.data);
    return rows.map((r, i) => mapHistoryItem(r, i, tabId));
  } catch {
    return [];
  }
}
