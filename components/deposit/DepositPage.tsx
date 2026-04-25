"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import HScrollRow from "@/components/ui/HScrollRow";
import Toast from "@/components/ui/Toast";

type DepositT = ReturnType<typeof useTranslation<"deposit">>;

interface Props {
  displayName:  string;
  bankName:     string | null;
  bankLogo:     string | null;
  bankAccount:  string | null;
  balance:      number;
  selectedPromotion?: ActivePromotion | null;
}

interface LoadBankAccount {
  acc_no:      string;
  acc_name:    string;
  bank_name:   string;
  bank_pic:    string;
  qr_pic:      string;
  qrcode:      boolean;
  code:        number;
  deposit_min: string;
  remark:      string;
}

interface PaymentOption {
  id:          string;
  name:        string;
  min_deposit: number;
  payment_url: string;
  remark:      string;
}

interface LoadBankApiPayload {
  success?: boolean;
  message?: string;
  bank?: LoadBankAccount[] | Record<string, Partial<LoadBankAccount>>;
  data?: {
    bank?: LoadBankAccount[];
    items?: LoadBankAccount[];
    accounts?: LoadBankAccount[];
  } | LoadBankAccount[];
}

interface PaymentApiPayload {
  success?: boolean;
  message?: string;
  bank?: Record<string, Partial<PaymentOption>>;
}

interface PromotionItem {
  code: number;
  id?: string;
  name_th: string;
  filepic: string;
  sort?: number;
  bonus_percent?: string;
  bonus_max?: string;
  amount_min?: string;
}

interface PromotionApiPayload {
  success?: boolean;
  message?: string;
  data?: {
    promotions?: PromotionItem[];
    getpro?: boolean;
  };
}

interface PromotionActionResponse {
  success?: boolean;
  message?: string;
}

interface ActivePromotion {
  select: boolean;
  name: string;
  min: string;
}

const PROMO_ID_LABELS: Record<string, string> = {
  pro_cashback: "โปรโมชั่น Cashback",
  pro_ic: "โปรโมชั่น IC",
  pro_faststart: "โปรโมชั่น Fast Start",
  pro_spin: "โปรโมชั่น Spin",
  pro_coupon: "โปรโมชั่น Coupon",
};

const HIDE_PROMO_BUTTON_IDS = new Set([
  "pro_cashback",
  "pro_ic",
  "pro_faststart",
  "pro_spin",
  "pro_coupon",
]);

interface QrCodeData {
  request_id: string;
  txid: string;
  status: string;
  amount: number;
  payamount: number;
  qrcode: string;
  qr_string: string;
  expired_date: string;
  member: {
    user_name: string;
    name: string;
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickRequestId(payload: unknown): string | null {
  const rec = asRecord(payload);
  if (!rec) return null;

  const rootRequestId =
    (typeof rec.request_id === "string" ? rec.request_id.trim() : "")
    || (typeof rec.requestId === "string" ? rec.requestId.trim() : "");
  if (rootRequestId) return rootRequestId;

  const dataRec = asRecord(rec.data);
  const dataRequestId =
    (typeof dataRec?.request_id === "string" ? dataRec.request_id.trim() : "")
    || (typeof dataRec?.requestId === "string" ? dataRec.requestId.trim() : "");
  if (dataRequestId) return dataRequestId;

  const url =
    (typeof rec.url === "string" ? rec.url.trim() : "")
    || (typeof dataRec?.url === "string" ? dataRec.url.trim() : "");
  if (!url) return null;

  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).pop() ?? "";
    return last || null;
  } catch {
    const last = url.split("/").filter(Boolean).pop() ?? "";
    return last || null;
  }
}

function normalizeQrData(payload: unknown): QrCodeData | null {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  if (!data) return null;

  const request_id = typeof data.request_id === "string" ? data.request_id : "";
  const txid = typeof data.txid === "string" ? data.txid : "";
  const status = typeof data.status === "string" ? data.status : "";
  const qrcode = typeof data.qrcode === "string" ? data.qrcode : "";
  if (!request_id || !qrcode) return null;

  const amountRaw = data.amount;
  const payAmountRaw = data.payamount;
  const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw) || 0;
  const payamount = typeof payAmountRaw === "number" ? payAmountRaw : Number(payAmountRaw) || 0;
  const qr_string = typeof data.qr_string === "string" ? data.qr_string : "";
  const expired_date = typeof data.expired_date === "string" ? data.expired_date : "";
  const memberRec = asRecord(data.member);

  return {
    request_id,
    txid,
    status,
    amount,
    payamount,
    qrcode,
    qr_string,
    expired_date,
    member: {
      user_name: typeof memberRec?.user_name === "string" ? memberRec.user_name : "",
      name: typeof memberRec?.name === "string" ? memberRec.name : "",
    },
  };
}

function parseExpiredDateMs(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;

  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s),
    ).getTime();
  }

  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatCountdown(totalSec: number): string {
  const sec = Math.max(0, totalSec);
  const hh = Math.floor(sec / 3600);
  const mm = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;

  const p2 = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${p2(hh)}:${p2(mm)}:${p2(ss)}` : `${p2(mm)}:${p2(ss)}`;
}

function pickErrorMessage(payload: unknown, fallback: string): string {
  const rec = asRecord(payload);
  if (!rec) return fallback;
  const msg = rec.message ?? rec.msg ?? rec.error;
  return typeof msg === "string" && msg.trim() ? msg : fallback;
}

function isApiSuccessFalse(payload: unknown): boolean {
  const rec = asRecord(payload);
  if (!rec) return false;
  if (rec.success === false) return true;
  const data = asRecord(rec.data);
  if (data?.success === false) return true;
  return false;
}

function pickDepositStatus(payload: unknown): string {
  const rec = asRecord(payload);
  const data = asRecord(rec?.data);
  const candidate =
    data?.status
    ?? rec?.status
    ?? data?.payment_status
    ?? rec?.payment_status
    ?? data?.state
    ?? rec?.state
    ?? "";
  return typeof candidate === "string" ? candidate.trim().toLowerCase() : String(candidate ?? "").trim().toLowerCase();
}

function isPaidLikeStatus(status: string): boolean {
  const words = status.split(/[^a-z]+/).filter(Boolean);
  return words.includes("paid") || words.includes("success") || words.includes("complete");
}

function isExpiredStatus(status: string): boolean {
  const words = status.split(/[^a-z]+/).filter(Boolean);
  return words.includes("expired") || words.includes("expire");
}

function formatBankAccount(account: string): string {
  const digits = account.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return account;
}

function promoDisplayName(raw: string): string {
  const text = raw.trim();
  const key = text.toLowerCase();
  if (PROMO_ID_LABELS[key]) return PROMO_ID_LABELS[key];
  if (key.startsWith("pro_")) return "โปรโมชั่นพิเศษ";
  return text || "โปรโมชั่นพิเศษ";
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true" || v === "y" || v === "yes";
  }
  return false;
}

function extractSelectedPromotion(payload: unknown): ActivePromotion | null {
  const root = asRecord(payload);
  if (!root) return null;

  const data = asRecord(root.data);
  const profile = asRecord(root.profile);
  const candidates = [root.promotion, data?.promotion, profile?.promotion];

  for (const candidate of candidates) {
    const rec = asRecord(candidate);
    if (!rec) continue;
    if (!toBool(rec.select)) continue;

    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    const minRaw = rec.min;
    const min =
      typeof minRaw === "string" ? minRaw.trim()
      : typeof minRaw === "number" ? String(minRaw)
      : "0";

    return {
      select: true,
      name: name || "โปรโมชั่นที่เลือก",
      min: min || "0",
    };
  }

  return null;
}

function normalizePayment(
  id: string,
  p: Partial<PaymentOption> | undefined,
): PaymentOption | null {
  if (!p?.name) return null;
  return {
    id:          p.id ?? id,
    name:        p.name,
    min_deposit: typeof p.min_deposit === "number" ? p.min_deposit : Number(p.min_deposit) || 0,
    payment_url: p.payment_url ?? "",
    remark:      p.remark ?? "",
  };
}

function extractPayments(payload: PaymentApiPayload): PaymentOption[] {
  if (!payload.bank || typeof payload.bank !== "object" || Array.isArray(payload.bank)) return [];
  return Object.entries(payload.bank)
    .map(([k, p]) => normalizePayment(k, p))
    .filter(Boolean) as PaymentOption[];
}

function normalizeAccount(
  account: Partial<LoadBankAccount> | undefined,
  fallbackCode: number
): LoadBankAccount | null {
  if (!account?.acc_no || !account?.acc_name || !account?.bank_name) return null;
  return {
    acc_no: account.acc_no,
    acc_name: account.acc_name,
    bank_name: account.bank_name,
    bank_pic: account.bank_pic ?? "",
    qr_pic: account.qr_pic ?? "",
    qrcode: Boolean(account.qrcode),
    code: typeof account.code === "number" ? account.code : fallbackCode,
    deposit_min: account.deposit_min ?? "0.00",
    remark: account.remark ?? "",
  };
}

interface DepositChannels {
  bank:    number;
  payment: number;
  tw:      number;
  slip:    number;
  sort?: {
    bank:    number | null;
    payment: number | null;
    tw:      number | null;
    slip:    number | null;
  };
}

type ChannelKey = "bank" | "payment" | "tw" | "slip";

const CHANNEL_ICONS: Record<ChannelKey, { icon: string; color: string }> = {
  bank:    { icon: "🏦", color: "ap-blue"  },
  tw:      { icon: "💚", color: "green"    },
  slip:    { icon: "📎", color: "ap-blue"  },
  payment: { icon: "💳", color: "purple"   },
};

function buildChannelMeta(t: DepositT): Record<ChannelKey, { icon: string; title: string; desc: string; color: string }> {
  return {
    bank:    { ...CHANNEL_ICONS.bank,    title: t.chBank,    desc: t.chBankDesc },
    tw:      { ...CHANNEL_ICONS.tw,      title: t.chTw,      desc: t.chTwDesc },
    slip:    { ...CHANNEL_ICONS.slip,    title: t.chSlip,    desc: t.chSlipDesc },
    payment: { ...CHANNEL_ICONS.payment, title: t.chPayment, desc: t.chPaymentDesc },
  };
}

// ─── Bank account card ─────────────────────────────────────────────────────────
function BankCard({
  account,
  selected,
  onClick,
  onCopy,
  t,
}: {
  account: LoadBankAccount;
  selected: boolean;
  onClick: () => void;
  onCopy: (accountNo: string) => void;
  t: DepositT;
}) {
  const minAmt = parseFloat(account.deposit_min) || 0;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        "w-full text-left rounded-2xl border-2 p-4 transition-all cursor-pointer",
        selected
          ? "border-ap-blue bg-ap-blue/5 shadow-sm"
          : "border-ap-border hover:border-ap-blue/40 hover:bg-ap-bg",
      ].join(" ")}
    >
      {/* Header: bank logo + name */}
      <div className="flex items-center gap-3">
        {account.bank_pic ? (
          <img src={account.bank_pic} alt={account.bank_name} className="w-10 h-10 rounded-xl object-contain bg-white border border-ap-border flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-ap-bg border border-ap-border flex items-center justify-center text-[20px] flex-shrink-0">🏦</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-ap-primary truncate">{account.bank_name}</p>
          <p className="text-[13px] text-ap-secondary mt-0.5 truncate">{account.acc_name}</p>
        </div>
        {minAmt > 0 && (
          <span className="hidden sm:inline-block text-[13px] text-ap-tertiary flex-shrink-0">
            {t.min} ฿{minAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {/* Account number + copy button */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-ap-bg/70 border border-ap-border/70 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ap-tertiary uppercase tracking-wide leading-none">{t.accountNo}</p>
          <p className="mt-1 text-[17px] sm:text-[18px] font-mono font-bold text-ap-primary tracking-wider leading-none break-all">
            {account.acc_no}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCopy(account.acc_no);
          }}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-ap-blue text-white text-[12px] font-bold shadow-sm hover:bg-ap-blue-h active:scale-95 transition-all flex-shrink-0"
          aria-label={t.copyAria}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="9" y="9" width="10" height="10" rx="2" />
            <path d="M5 15V7a2 2 0 0 1 2-2h8" />
          </svg>
          {t.copy}
        </button>
      </div>

      {/* Mobile-only: minimum amount row */}
      {minAmt > 0 && (
        <p className="sm:hidden mt-2 text-[13px] text-ap-tertiary">
          {t.min} ฿{minAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}

      {account.remark && (
        <p className="text-[13px] text-amber-600 mt-2 bg-amber-50 rounded-lg px-2 py-1">{account.remark}</p>
      )}
    </div>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function Notes({ t }: { t: DepositT }) {
  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[18px]">⚠️</span>
        <p className="text-[14px] font-bold text-amber-700 uppercase tracking-wide">{t.notesTitle}</p>
      </div>
      <div className="space-y-1.5">
        {[
          { bold: true,  text: t.note1 },
          { bold: false, text: t.note2 },
          { bold: false, text: t.note3 },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-amber-500 text-[14px] mt-0.5 flex-shrink-0">•</span>
            <p className={`text-[14px] text-amber-700 leading-relaxed ${n.bold ? "font-semibold" : ""}`}>
              {n.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DepositPage({ displayName, bankName, bankLogo, bankAccount, balance, selectedPromotion }: Props) {
  const { lang } = useLang();
  const t = useTranslation("deposit");
  const CHANNEL_META = buildChannelMeta(t);

  const [method,      setMethod]      = useState<ChannelKey | null>(null);
  const [showResult,  setShowResult]  = useState(false);

  // ── Deposit channels ────────────────────────────────────────────────────────
  const [channels,        setChannels]        = useState<DepositChannels | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError,   setChannelsError]   = useState<string | null>(null);

  // ── Loadbank (per-method accounts) ─────────────────────────────────────────
  const [bankAccounts,   setBankAccounts]   = useState<LoadBankAccount[]>([]);
  const [bankLoading,    setBankLoading]    = useState(false);
  const [bankError,      setBankError]      = useState<string | null>(null);
  const [selectedBank,   setSelectedBank]   = useState<LoadBankAccount | null>(null);

  // ── Payment options (for "payment" channel) ────────────────────────────────
  const [payments,        setPayments]        = useState<PaymentOption[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentOption | null>(null);
  const [paymentAmount,   setPaymentAmount]   = useState<string>("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [qrCodeData,        setQrCodeData]        = useState<QrCodeData | null>(null);
  const [nowTs,             setNowTs]             = useState<number>(Date.now());
  const [expireDoneTxids,   setExpireDoneTxids]   = useState<Record<string, true>>({});
  const [statusSettledTxids, setStatusSettledTxids] = useState<Record<string, true>>({});
  const [statusModal, setStatusModal] = useState<{ kind: "success" | "expired"; message: string } | null>(null);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [promotionLoading, setPromotionLoading] = useState(true);
  const [promoSubmittingId, setPromoSubmittingId] = useState<string | null>(null);
  const [promoDeselecting, setPromoDeselecting] = useState(false);
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(
    selectedPromotion?.select ? selectedPromotion : null,
  );
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  // ── Slip upload ────────────────────────────────────────────────────────────
  const [slipFile,       setSlipFile]       = useState<File | null>(null);
  const [slipPreview,    setSlipPreview]    = useState<string | null>(null);
  const [slipAmount,     setSlipAmount]     = useState<string>("");
  const [slipSubmitting, setSlipSubmitting] = useState(false);

  function showFeedback(message: string, type: "success" | "error" | "warning") {
    setFeedbackToast({ message, type });
  }

  useEffect(() => {
    setActivePromotion(selectedPromotion?.select ? selectedPromotion : null);
  }, [selectedPromotion]);

  useEffect(() => {
    fetch("/api/deposit/channels")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.deposit) setChannels(data.data.deposit);
        else setChannelsError(data.message ?? t.eLoadChannels);
      })
      .catch(() => setChannelsError(t.eConnect))
      .finally(() => setChannelsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/promotion/list")
      .then((r) => r.json())
      .then((res: PromotionApiPayload) => {
        const list = Array.isArray(res.data?.promotions) ? res.data.promotions : [];
        const sorted = list
          .filter((p) => p && typeof p.name_th === "string" && p.name_th.trim())
          .sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999));
        setPromotions(sorted);
      })
      .catch(() => {
        setPromotions([]);
      })
      .finally(() => setPromotionLoading(false));
  }, []);

  // เรียงช่องทางที่เปิดใช้งานตาม sort order
  const CHANNEL_ORDER: ChannelKey[] = ["bank", "payment", "tw", "slip"];
  const enabledChannels: ChannelKey[] = channels
    ? CHANNEL_ORDER
        .filter((k) => channels[k] === 1)
        .sort((a, b) => {
          const sa = channels.sort?.[a] ?? 999;
          const sb = channels.sort?.[b] ?? 999;
          return sa - sb;
        })
    : [];

  async function handleCopyAccount(accountNo: string) {
    const digits = accountNo.replace(/\s+/g, "");
    try {
      await navigator.clipboard.writeText(digits);
      showFeedback(t.tCopied, "success");
    } catch {
      showFeedback(t.tCopyFailed, "error");
    }
  }

  function extractAccounts(payload: LoadBankApiPayload): LoadBankAccount[] {
    if (Array.isArray(payload.bank)) {
      return payload.bank
        .map((a, i) => normalizeAccount(a, i + 1))
        .filter(Boolean) as LoadBankAccount[];
    }
    if (payload.bank && typeof payload.bank === "object") {
      return Object.entries(payload.bank)
        .map(([k, a], i) => normalizeAccount(a as Partial<LoadBankAccount>, Number(k) || i + 1))
        .filter(Boolean) as LoadBankAccount[];
    }
    if (Array.isArray(payload.data)) {
      return payload.data
        .map((a, i) => normalizeAccount(a, i + 1))
        .filter(Boolean) as LoadBankAccount[];
    }
    if (payload.data && Array.isArray(payload.data.bank)) {
      return payload.data.bank
        .map((a, i) => normalizeAccount(a, i + 1))
        .filter(Boolean) as LoadBankAccount[];
    }
    if (payload.data && Array.isArray(payload.data.items)) {
      return payload.data.items
        .map((a, i) => normalizeAccount(a, i + 1))
        .filter(Boolean) as LoadBankAccount[];
    }
    if (payload.data && Array.isArray(payload.data.accounts)) {
      return payload.data.accounts
        .map((a, i) => normalizeAccount(a, i + 1))
        .filter(Boolean) as LoadBankAccount[];
    }
    return [];
  }

  async function selectMethod(ch: ChannelKey) {
    setMethod(ch);
    setBankAccounts([]);
    setSelectedBank(null);
    setPayments([]);
    setSelectedPayment(null);
    setPaymentAmount("");
    setQrCodeData(null);
    setPaymentSubmitting(false);
    setExpireDoneTxids({});
    setStatusSettledTxids({});
    setStatusModal(null);
    setBankError(null);
    setShowResult(false);
    setSlipFile(null);
    setSlipPreview(null);
    setSlipAmount("");
    setSlipSubmitting(false);
    setBankLoading(true);
    try {
      const res  = await fetch("/api/deposit/loadbank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: ch }),
      });
      const data: LoadBankApiPayload & PaymentApiPayload = await res.json();

      if (ch === "payment") {
        const list = extractPayments(data as PaymentApiPayload);
        if (data.success && list.length > 0) {
          setPayments(list);
          setSelectedPayment(list[0]);
        } else {
          setBankError(data.message ?? t.eLoadPayment);
        }
      } else {
        const accounts = extractAccounts(data as LoadBankApiPayload);
        if (data.success && accounts.length > 0) {
          setBankAccounts(accounts);
          setSelectedBank(accounts[0]);
        } else {
          setBankError(data.message ?? t.eLoadAccounts);
        }
      }
    } catch {
      setBankError(t.eConnect);
    } finally {
      setBankLoading(false);
    }
  }

  async function createPaymentDeposit() {
    if (!selectedPayment) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setPaymentSubmitting(true);
    setQrCodeData(null);
    setExpireDoneTxids({});
    setStatusSettledTxids({});
    setStatusModal(null);
    setBankError(null);

    try {
      const createRes = await fetch("/api/smkpay/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      let createData: unknown;
      try {
        createData = await createRes.json();
      } catch {
        createData = {
          success: false,
          message: t.eResponseNotJson,
          status: createRes.status,
        };
      }

      if (!createRes.ok || isApiSuccessFalse(createData)) {
        setBankError(pickErrorMessage(createData, t.eCreateDeposit));
        return;
      }

      const requestId = pickRequestId(createData);
      if (!requestId) {
        setBankError(t.eNoRequestId);
        return;
      }

      const qrRes = await fetch(`/api/smkpay/qrcode/${encodeURIComponent(requestId)}`, {
        method: "GET",
      });

      let qrData: unknown;
      try {
        qrData = await qrRes.json();
      } catch {
        qrData = {
          success: false,
          message: t.eQrResponseNotJson,
          status: qrRes.status,
        };
      }

      if (!qrRes.ok || isApiSuccessFalse(qrData)) {
        setBankError(pickErrorMessage(qrData, t.eLoadQr));
        return;
      }

      const normalized = normalizeQrData(qrData);
      if (!normalized) {
        setBankError(t.eBadQr);
        return;
      }

      setQrCodeData(normalized);
      setShowResult(true);
    } catch {
      setBankError(t.eConnect);
    } finally {
      setPaymentSubmitting(false);
    }
  }

  const qrImageSrc = qrCodeData
    ? (qrCodeData.qrcode.startsWith("data:image/")
      ? qrCodeData.qrcode
      : `data:image/png;base64,${qrCodeData.qrcode}`)
    : null;
  const expiredTs = qrCodeData ? parseExpiredDateMs(qrCodeData.expired_date) : null;
  const countdownSec = expiredTs ? Math.max(0, Math.floor((expiredTs - nowTs) / 1000)) : null;

  useEffect(() => {
    if (!qrCodeData) return;
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [qrCodeData]);

  useEffect(() => {
    if (method !== "payment" || !showResult) return;
    if (!qrCodeData?.txid || countdownSec === null || countdownSec > 0) return;
    if (expireDoneTxids[qrCodeData.txid]) return;

    const txid = qrCodeData.txid;
    setExpireDoneTxids((prev) => ({ ...prev, [txid]: true }));

    void (async () => {
      try {
        const res = await fetch(`/api/smkpay/deposit/expire/${encodeURIComponent(txid)}`, {
          method: "POST",
        });
        if (!res.ok) {
          console.error("[deposit] expire request failed:", res.status);
        }
      } catch {
        console.error("[deposit] expire request network error");
      }
    })();
  }, [method, showResult, qrCodeData, countdownSec, expireDoneTxids]);

  useEffect(() => {
    const txid = qrCodeData?.txid?.trim() ?? "";
    if (method !== "payment" || !showResult || !txid) return;
    if (statusModal) return;
    if (statusSettledTxids[txid]) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const delayMs = 10000 + Math.floor(Math.random() * 10001);
      timer = setTimeout(pollStatus, delayMs);
    };

    const pollStatus = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/smkpay/deposit/status/${encodeURIComponent(txid)}`, {
          method: "GET",
        });

        let payload: unknown = null;
        try { payload = await res.json(); } catch {}
        if (!res.ok) {
          scheduleNext();
          return;
        }

        const status = pickDepositStatus(payload);
        if (isPaidLikeStatus(status)) {
          setStatusSettledTxids((prev) => ({ ...prev, [txid]: true }));
          setStatusModal({ kind: "success", message: t.paidRedirect });
          return;
        }

        if (isExpiredStatus(status)) {
          setStatusSettledTxids((prev) => ({ ...prev, [txid]: true }));
          setStatusModal({ kind: "expired", message: t.expiredRedirect });
          return;
        }
      } catch {}

      scheduleNext();
    };

    timer = setTimeout(pollStatus, 10000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [method, showResult, qrCodeData?.txid, statusModal, statusSettledTxids]);

  useEffect(() => {
    if (!statusModal) return;
    const timer = setTimeout(() => {
      window.location.href = `/${lang}`;
    }, 2200);
    return () => clearTimeout(timer);
  }, [statusModal, lang]);

  const visiblePromotions = promotions.filter((promo) => {
    const promoId = (promo.id ?? "").trim().toLowerCase();
    return !HIDE_PROMO_BUTTON_IDS.has(promoId);
  });

  async function refreshActivePromotion() {
    try {
      const res = await fetch("/api/member/loadbalance", { method: "GET" });
      let payload: unknown = null;
      try { payload = await res.json(); } catch {}
      if (!res.ok) return false;
      setActivePromotion(extractSelectedPromotion(payload));
      return true;
    } catch {
      return false;
    }
  }

  async function handleSelectPromotion(promotionCode: string) {
    const code = promotionCode.trim();
    if (!code) return;

    setPromoSubmittingId(code);
    try {
      const res = await fetch("/api/promotion/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotion: code }),
      });

      let payload: PromotionActionResponse = {};
      try {
        payload = await res.json();
      } catch {}

      const ok = Boolean(res.ok && payload.success);
      const message = payload.message?.trim() || (ok ? t.tPromoSuccess : t.ePromoFailed);
      if (!ok) {
        showFeedback(message, "error");
        return;
      }

      await refreshActivePromotion();
      showFeedback(message, "success");
    } catch {
      showFeedback(t.eConnect, "error");
    } finally {
      setPromoSubmittingId(null);
    }
  }

  function handleSlipFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showFeedback(t.ePickImage, "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showFeedback(t.eFileSize, "error");
      return;
    }
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSlipPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  function clearSlip() {
    setSlipFile(null);
    setSlipPreview(null);
  }

  async function submitSlip() {
    if (!slipFile) {
      showFeedback(t.eSlipRequired, "error");
      return;
    }
    const amount = Number(slipAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showFeedback(t.eAmountRequired, "error");
      return;
    }

    setSlipSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("slip", slipFile);
      formData.append("amount", String(amount));
      if (selectedBank) {
        formData.append("bank_code", String(selectedBank.code));
      }

      const res = await fetch("/api/deposit/slip", {
        method: "POST",
        body: formData,
      });

      let payload: { success?: boolean; message?: string } = {};
      try { payload = await res.json(); } catch {}

      const ok = Boolean(res.ok && payload.success);
      const message = payload.message?.trim() || (ok ? t.tSlipSuccess : t.eSlipFailed);

      if (!ok) {
        showFeedback(message, "error");
        return;
      }

      showFeedback(message, "success");
      clearSlip();
      setSlipAmount("");
    } catch {
      showFeedback(t.eConnect, "error");
    } finally {
      setSlipSubmitting(false);
    }
  }

  async function handleDeselectPromotion() {
    setPromoDeselecting(true);
    try {
      const res = await fetch("/api/promotion/deselect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      let payload: PromotionActionResponse = {};
      try {
        payload = await res.json();
      } catch {}

      const ok = Boolean(res.ok && payload.success);
      const message = payload.message?.trim() || (ok ? t.tDeselectSuccess : t.eDeselectFailed);
      if (!ok) {
        showFeedback(message, "error");
        return;
      }

      await refreshActivePromotion();
      showFeedback(message, "success");
    } catch {
      showFeedback(t.eConnect, "error");
    } finally {
      setPromoDeselecting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-5 sm:pt-6">

      {/* Balance card */}
      <div className="relative overflow-hidden bg-[linear-gradient(160deg,#ffffff_0%,#f8fbff_100%)] rounded-2xl border border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.12),transparent_42%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
        <p className="relative text-[12px] text-slate-500 uppercase tracking-[0.08em] font-semibold mb-1">{t.balance}</p>
        <p className="relative text-[32px] font-extrabold text-slate-900 tabular-nums leading-tight tracking-tight">
          ฿{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* User bank info card */}
      <div className="relative bg-[linear-gradient(165deg,#ffffff_0%,#f9fbff_100%)] rounded-2xl border border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-5">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-200/70 to-transparent" />
        <p className="text-[12px] text-slate-500 uppercase tracking-[0.08em] font-semibold mb-2">{t.myBank}</p>
        {bankAccount ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                {bankLogo ? (
                  <img src={bankLogo} alt={bankName ?? t.bankAlt} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[16px]" aria-hidden>🏦</span>
                )}
              </div>
              <div>
              <p className="text-[14px] font-semibold text-slate-900">{displayName}</p>
              {bankName && <p className="text-[13px] text-slate-600 mt-0.5">{bankName}</p>}
              </div>
            </div>
            <p className="text-[14px] font-mono font-semibold text-slate-900 tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              {formatBankAccount(bankAccount)}
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-ap-tertiary">{t.noBank}</p>
        )}
      </div>

      {(promotionLoading || visiblePromotions.length > 0) && (
        <div className="relative bg-[linear-gradient(165deg,#ffffff_0%,#f9fbff_100%)] rounded-2xl border border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-5">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-200/70 to-transparent" />
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[14px] text-ap-tertiary uppercase tracking-wide font-medium">{t.promoTitle}</p>
            <Link href={`/${lang}/promotion`} className="text-[12px] font-semibold text-ap-blue hover:text-ap-blue-h transition-colors">
              {t.viewAll}
            </Link>
          </div>

          {promotionLoading ? (
            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-ap-bg animate-pulse" />
              <div className="h-16 rounded-xl bg-ap-bg animate-pulse" />
            </div>
          ) : (
            <HScrollRow itemWidth={248} scrollBy={1}>
              {visiblePromotions.slice(0, 4).map((promo) => {
                const bonusPercent = Number(promo.bonus_percent) || 0;
                const minDeposit = Number(promo.amount_min) || 0;
                const title = promoDisplayName(promo.name_th);
                const promoCode = String(promo.code ?? "");
                return (
                  <div
                    key={promo.code}
                    className="min-w-[236px] sm:min-w-[248px] snap-start rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-shadow"
                  >
                    {promo.filepic ? (
                      <img
                        src={promo.filepic}
                        alt={title}
                        className="w-full h-32 sm:h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 sm:h-36 bg-ap-bg flex items-center justify-center text-[36px]">
                        🎁
                      </div>
                    )}
                    <div className="p-3 flex flex-col">
                      <p className="text-[14px] font-semibold text-ap-primary leading-snug">{title}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {bonusPercent > 0 && (
                          <span className="text-[11px] font-bold text-ap-blue bg-ap-blue/10 rounded-full px-2 py-0.5">
                            {t.bonus} {bonusPercent}%
                          </span>
                        )}
                        {minDeposit > 0 && (
                          <span className="text-[11px] text-ap-tertiary">
                            {t.min} ฿{minDeposit.toLocaleString("en-US")}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => { void handleSelectPromotion(promoCode); }}
                          disabled={!promoCode || promoSubmittingId === promoCode || promoDeselecting}
                          className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-ap-blue text-white text-[12px] font-semibold hover:bg-ap-blue-h transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {promoSubmittingId === promoCode ? t.receivingPromo : t.receivePromo}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </HScrollRow>
          )}
        </div>
      )}

      {activePromotion && (
        <div className="relative bg-[linear-gradient(165deg,#ffffff_0%,#f9fbff_100%)] rounded-2xl border border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-5">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-200/70 to-transparent" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] text-ap-tertiary uppercase tracking-wide font-medium mb-1">{t.activePromo}</p>
              <p className="text-[15px] font-semibold text-ap-primary leading-snug">{activePromotion.name}</p>
              <p className="text-[13px] text-ap-secondary mt-1">
                {t.minTotal} ฿{(Number(activePromotion.min) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { void handleDeselectPromotion(); }}
              disabled={promoDeselecting || !!promoSubmittingId}
              className="px-3 py-2 rounded-full border border-ap-red/30 bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {promoDeselecting ? t.cancelling : t.cancelPromo}
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="relative bg-[linear-gradient(165deg,#ffffff_0%,#f8fbff_100%)] rounded-3xl border border-slate-200 shadow-[0_16px_34px_rgba(15,23,42,0.12)] p-5">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="space-y-3 animate-fade-up">
          <h2 className="text-[17px] font-bold text-slate-900 mb-1">{t.selectMethod}</h2>

          {channelsLoading && (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-ap-blue border-t-transparent animate-spin" />
              <p className="text-[13px] text-ap-secondary">{t.loadingChannels}</p>
            </div>
          )}
          {channelsError && !channelsLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-ap-red">
              {channelsError}
            </div>
          )}
          {!channelsLoading && !channelsError && enabledChannels.length === 0 && (
            <p className="text-[13px] text-ap-tertiary py-2 text-center">{t.noChannels}</p>
          )}

          {!channelsLoading && !channelsError && enabledChannels.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f9ff_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_6px_14px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {enabledChannels.map((ch) => {
                const meta = CHANNEL_META[ch];
                const active = method === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => { void selectMethod(ch); }}
                    className={[
                      "relative overflow-hidden rounded-xl border px-4 py-4 text-left cursor-pointer transition-all duration-200 ease-out active:scale-[0.99]",
                      active
                        ? "border-[#1f63d8] bg-gradient-to-b from-[#3588f4] via-[#2872e6] to-[#1f63d8] ring-2 ring-[#88b7ff]/45 shadow-[0_12px_24px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] -translate-y-[1px]"
                        : "border-slate-200 bg-white shadow-[0_6px_12px_rgba(15,23,42,0.08)] hover:border-blue-300 hover:bg-[#f8fbff] hover:shadow-[0_10px_18px_rgba(37,99,235,0.16)] hover:-translate-y-[1px]",
                    ].join(" ")}
                  >
                    {active && <span className="absolute left-0 right-0 top-0 h-px bg-white/60" aria-hidden />}
                    {active && (
                      <span className="absolute right-2 top-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-blue-600 shadow-sm" aria-hidden>
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                    <div className="flex items-center gap-2.5">
                      <div className={[
                        "w-11 h-11 rounded-lg border flex items-center justify-center text-[22px] flex-shrink-0 transition-all",
                        active ? "bg-white/15 border-white/30 text-white shadow-sm scale-[1.03]" : "bg-white border-slate-300",
                      ].join(" ")}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={["text-[18px] font-extrabold leading-tight tracking-tight", active ? "text-white" : "text-slate-900"].join(" ")}>{meta.title}</p>
                        <p className={["text-[14px] mt-0.5 line-clamp-1 font-medium", active ? "text-blue-100/95" : "text-slate-600"].join(" ")}>{meta.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          )}
        </div>

        {method && !showResult && (
          <div className="mt-5 pt-4 border-t border-slate-200 space-y-4 animate-fade-up">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[20px]">{CHANNEL_META[method].icon}</span>
              <h2 className="text-[16px] font-bold text-ap-primary">{t.channelInfo}</h2>
            </div>

            {bankLoading && (
              <div className="flex items-center gap-2 py-3">
                <div className="w-4 h-4 rounded-full border-2 border-ap-blue border-t-transparent animate-spin" />
                <p className="text-[13px] text-ap-secondary">{t.loadingInfo}</p>
              </div>
            )}

            {bankError && !bankLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-ap-red">
                {bankError}
              </div>
            )}

            {!bankLoading && method !== "payment" && bankAccounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[14px] font-bold text-ap-secondary uppercase tracking-wide">
                  {method === "tw" ? t.transferToNumber : t.transferTo}
                </p>
                {bankAccounts.map((acc) => (
                  <BankCard
                    key={acc.code}
                    account={acc}
                    selected={selectedBank?.code === acc.code}
                    onClick={() => setSelectedBank(acc)}
                    onCopy={handleCopyAccount}
                    t={t}
                  />
                ))}
              </div>
            )}

            {!bankLoading && method === "slip" && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <p className="text-[14px] font-bold text-ap-secondary uppercase tracking-wide">
                  {t.uploadSlipTitle}
                </p>

                <div>
                  <label className="block text-[13px] font-semibold text-ap-secondary mb-1.5">
                    {t.transferAmount}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-ap-tertiary pointer-events-none">฿</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={slipAmount}
                      onChange={(e) => setSlipAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border-2 border-ap-border focus:border-ap-blue outline-none pl-9 pr-4 py-3 text-[16px] font-semibold text-ap-primary bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ap-secondary mb-1.5">
                    {t.slipImage}
                  </label>
                  {slipPreview ? (
                    <div className="relative rounded-2xl border-2 border-ap-border overflow-hidden bg-white">
                      <img
                        src={slipPreview}
                        alt={t.slipAlt}
                        className="w-full max-h-[420px] object-contain bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={clearSlip}
                        className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 text-white text-[12px] font-semibold hover:bg-black/80 transition-colors"
                        aria-label={t.removeSlipAria}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        </svg>
                        {t.remove}
                      </button>
                      <div className="px-3 py-2 bg-white border-t border-ap-border">
                        <p className="text-[12px] text-ap-tertiary truncate">
                          {slipFile?.name}
                          {slipFile && ` • ${(slipFile.size / 1024).toFixed(0)} KB`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-ap-border bg-ap-bg/50 hover:border-ap-blue hover:bg-ap-blue/5 transition-colors py-8 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-ap-blue/10 flex items-center justify-center text-[22px]">
                        📎
                      </div>
                      <p className="text-[14px] font-semibold text-ap-primary">{t.tapUpload}</p>
                      <p className="text-[12px] text-ap-tertiary">{t.uploadHint}</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSlipFileChange}
                      />
                    </label>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { void submitSlip(); }}
                  disabled={
                    !slipFile ||
                    !slipAmount ||
                    Number(slipAmount) <= 0 ||
                    slipSubmitting
                  }
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0a68d8] to-[#1a87ea] text-white text-[14px] font-semibold hover:brightness-105 transition-all disabled:opacity-40 shadow-[0_10px_22px_rgba(37,99,235,0.24)]"
                >
                  {slipSubmitting ? t.submittingSlip : t.confirmDeposit}
                </button>
              </div>
            )}

            {!bankLoading && method === "payment" && payments.length > 0 && (
              <div className="space-y-3">
                <p className="text-[14px] font-bold text-ap-secondary uppercase tracking-wide">
                  {t.selectPayment}
                </p>
                <div className="space-y-2">
                  {payments.map((p) => {
                    const active = selectedPayment?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPayment(p)}
                        className={[
                          "w-full text-left rounded-2xl border p-4 transition-all duration-200",
                          active
                            ? "border-blue-300 bg-blue-50/60 shadow-[0_8px_16px_rgba(37,99,235,0.10)]"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-gradient-to-r hover:from-white hover:to-blue-50/40",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[20px] flex-shrink-0">💳</div>
                            <p className="text-[15px] font-bold text-slate-900">{p.name}</p>
                          </div>
                          {p.min_deposit > 0 && (
                            <span className="text-[12px] text-slate-500">
                              {t.min} ฿{p.min_deposit.toLocaleString("en-US")}
                            </span>
                          )}
                        </div>
                        {p.remark && (
                          <p className="text-[13px] text-amber-600 mt-2 bg-amber-50 rounded-lg px-2 py-1">{p.remark}</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedPayment && (
                  <div className="pt-1 space-y-2">
                    <label className="block text-[14px] font-bold text-ap-secondary uppercase tracking-wide">
                      {t.amount} ({selectedPayment.name})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-ap-tertiary pointer-events-none">฿</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={selectedPayment.min_deposit || 0}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder={String(selectedPayment.min_deposit || 0)}
                        className="w-full rounded-2xl border-2 border-ap-border focus:border-ap-blue outline-none pl-9 pr-4 py-3 text-[16px] font-semibold text-ap-primary bg-white transition-colors"
                      />
                    </div>
                    {selectedPayment.min_deposit > 0 && (
                      <p className="text-[12px] text-ap-tertiary">
                        {t.minDepositLabel} ฿{selectedPayment.min_deposit.toLocaleString("en-US")}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => { void createPaymentDeposit(); }}
                      disabled={
                        paymentSubmitting ||
                        !paymentAmount ||
                        Number(paymentAmount) < (selectedPayment?.min_deposit ?? 0)
                      }
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0a68d8] to-[#1a87ea] text-white text-[14px] font-semibold hover:brightness-105 transition-all disabled:opacity-40 shadow-[0_10px_22px_rgba(37,99,235,0.24)]"
                    >
                      {paymentSubmitting ? t.creatingQr : t.createQr}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showResult && (
          <div className="mt-5 pt-4 border-t border-slate-200 space-y-4 animate-fade-up">
            {method === "payment" && qrCodeData && qrImageSrc ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-ap-blue/20 bg-ap-blue/[0.03] p-4">
                  <p className="text-[16px] font-bold text-ap-primary">{t.scanQr}</p>
                  <p className="text-[13px] text-ap-secondary mt-1">
                    {t.scanQrDesc}
                  </p>
                </div>

                <div className="rounded-2xl border border-ap-border bg-white p-4">
                  <div className="flex justify-center">
                    <img
                      src={qrImageSrc}
                      alt="Deposit QR Code"
                      className="w-full max-w-[320px] rounded-xl border border-ap-border bg-white p-2"
                    />
                  </div>
                  <p className="mt-2 text-center text-[13px] font-semibold text-red-600">
                    {countdownSec === null
                      ? t.noExpire
                      : countdownSec > 0
                        ? `${t.expiresIn} ${formatCountdown(countdownSec)}`
                        : t.expired}
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                    <div className="rounded-xl bg-ap-bg px-3 py-2">
                      <p className="text-ap-tertiary">{t.amountLabel}</p>
                      <p className="font-bold text-ap-primary">
                        ฿{Number(qrCodeData.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-xl bg-ap-bg px-3 py-2">
                      <p className="text-ap-tertiary">{t.expiresAt}</p>
                      <p className="font-semibold text-ap-primary">{qrCodeData.expired_date || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-ap-bg px-3 py-2 sm:col-span-2">
                      <p className="text-ap-tertiary">TXID</p>
                      <p className="font-mono text-[12px] text-ap-primary break-all">{qrCodeData.txid || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-ap-bg px-3 py-2 sm:col-span-2">
                      <p className="text-ap-tertiary">Request ID</p>
                      <p className="font-mono text-[12px] text-ap-primary break-all">{qrCodeData.request_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResult(false);
                  setQrCodeData(null);
                  setStatusModal(null);
                }}
                className="flex-1 py-3 rounded-full border-2 border-ap-border text-[14px] font-semibold text-ap-secondary hover:border-ap-blue/30 transition-colors"
              >
                {t.selectAgain}
              </button>
              <a
                href={`/${lang}/transactions`}
                className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-colors"
              >
                {t.goFinance}
              </a>
            </div>
          </div>
        )}
      </div>

      <Notes t={t} />

      {statusModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-5">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-ap-border shadow-card p-5">
            <p className="text-[17px] font-bold text-ap-primary">
              {statusModal.kind === "success" ? t.depositSuccess : t.txExpired}
            </p>
            <p className="text-[14px] text-ap-secondary mt-2">
              {statusModal.message}
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = `/${lang}`; }}
              className="mt-4 w-full py-3 rounded-2xl bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-colors"
            >
              {t.goHome}
            </button>
          </div>
        </div>
      )}
      {feedbackToast && (
        <Toast
          message={feedbackToast.message}
          type={feedbackToast.type}
          onClose={() => setFeedbackToast(null)}
        />
      )}
    </div>
  );
}
