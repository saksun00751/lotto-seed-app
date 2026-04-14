"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/context";
import HScrollRow from "@/components/ui/HScrollRow";
import { toast } from "sonner";

interface Props {
  displayName:  string;
  bankName:     string | null;
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
  sort: {
    bank:    number | null;
    payment: number | null;
    tw:      number | null;
    slip:    number | null;
  };
}

type ChannelKey = "bank" | "payment" | "tw" | "slip";
type Phase      = "method" | "account" | "done";

const CHANNEL_META: Record<ChannelKey, { icon: string; title: string; desc: string; color: string }> = {
  bank:    { icon: "🏦", title: "โอนผ่านเลขบัญชี",  desc: "โอนผ่านธนาคาร / Mobile Banking",    color: "ap-blue"  },
  payment: { icon: "💳", title: "โอนผ่าน Payment",  desc: "ชำระผ่านช่องทาง Payment Gateway",    color: "purple"   },
  tw:      { icon: "💚", title: "TrueWallet",        desc: "ฝากผ่าน TrueWallet",                color: "green"    },
  slip:    { icon: "📎", title: "อัพโหลดสลิป",       desc: "อัพโหลดสลิปโดยตรง",                color: "ap-blue"  },
};

const STEP_LABELS: Record<Phase, number> = { method: 1, account: 2, done: 3 };

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ phase }: { phase: Phase }) {
  const steps = ["เลือกวิธี", "เลขบัญชี", "เสร็จสิ้น"];
  const current = STEP_LABELS[phase];
  return (
    <div className="flex items-center mb-7">
      {steps.map((label, i) => {
        const n      = i + 1;
        const done   = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300",
                done   ? "bg-ap-green text-white shadow-sm"
                : active ? "bg-ap-blue text-white shadow-sm"
                :          "bg-ap-border text-ap-tertiary",
              ].join(" ")}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : n}
              </div>
              <span className={[
                "text-[14px] font-medium whitespace-nowrap",
                active ? "text-ap-blue" : done ? "text-ap-green" : "text-ap-tertiary",
              ].join(" ")}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={[
                "flex-1 h-0.5 mx-1.5 mb-4 rounded-full transition-all duration-300",
                current > n ? "bg-ap-green" : "bg-ap-border",
              ].join(" ")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Bank account card ─────────────────────────────────────────────────────────
function BankCard({
  account,
  selected,
  onClick,
}: {
  account: LoadBankAccount;
  selected: boolean;
  onClick: () => void;
}) {
  const minAmt = parseFloat(account.deposit_min) || 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl border-2 p-4 transition-all",
        selected
          ? "border-ap-blue bg-ap-blue/5 shadow-sm"
          : "border-ap-border hover:border-ap-blue/40 hover:bg-ap-bg",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {account.bank_pic ? (
          <img src={account.bank_pic} alt={account.bank_name} className="w-10 h-10 rounded-xl object-contain bg-white border border-ap-border flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-ap-bg border border-ap-border flex items-center justify-center text-[20px] flex-shrink-0">🏦</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-ap-primary">{account.bank_name}</p>
          <p className="text-[13px] text-ap-secondary mt-0.5">{account.acc_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <p className="text-[16px] sm:text-[18px] font-mono font-bold text-ap-primary tracking-wider leading-none">
            {account.acc_no}
          </p>
          {minAmt > 0 && (
            <span className="text-[14px] text-ap-tertiary">ขั้นต่ำ ฿{minAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          )}
        </div>
      </div>
      {account.remark && (
        <p className="text-[14px] text-amber-600 mt-2 bg-amber-50 rounded-lg px-2 py-1">{account.remark}</p>
      )}
    </button>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function Notes() {
  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[18px]">⚠️</span>
        <p className="text-[14px] font-bold text-amber-700 uppercase tracking-wide">หมายเหตุสำคัญ</p>
      </div>
      <div className="space-y-1.5">
        {[
          { bold: true,  text: "ใช้บัญชีที่ลงทะเบียนไว้ในการฝากเงินเท่านั้น !!!!" },
          { bold: false, text: "หลังจากฝากเงินสำเร็จ รอไม่เกิน 1–3 นาที" },
          { bold: false, text: "หากพบปัญหาติดต่อฝ่ายบริการลูกค้า" },
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
export default function DepositPage({ displayName, bankName, bankAccount, balance, selectedPromotion }: Props) {
  const { lang } = useLang();

  const [phase,       setPhase]       = useState<Phase>("method");
  const [method,      setMethod]      = useState<ChannelKey | null>(null);

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

  useEffect(() => {
    setActivePromotion(selectedPromotion?.select ? selectedPromotion : null);
  }, [selectedPromotion]);

  useEffect(() => {
    fetch("/api/deposit/channels")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.deposit) setChannels(data.data.deposit);
        else setChannelsError(data.message ?? "ไม่สามารถโหลดช่องทางฝากเงินได้");
      })
      .catch(() => setChannelsError("ไม่สามารถเชื่อมต่อระบบได้"))
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
  const enabledChannels: ChannelKey[] = channels
    ? (Object.keys(CHANNEL_META) as ChannelKey[])
        .filter((k) => channels[k] === 1)
        .sort((a, b) => {
          const sa = channels.sort[a] ?? 999;
          const sb = channels.sort[b] ?? 999;
          return sa - sb;
        })
    : [];

  function maskAccount(acc: string) {
    return acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc;
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
    setPhase("account");
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
          setBankError(data.message ?? "ไม่สามารถโหลดข้อมูลช่องทาง Payment ได้");
        }
      } else {
        const accounts = extractAccounts(data as LoadBankApiPayload);
        if (data.success && accounts.length > 0) {
          setBankAccounts(accounts);
          setSelectedBank(accounts[0]);
        } else {
          setBankError(data.message ?? "ไม่สามารถโหลดข้อมูลบัญชีได้");
        }
      }
    } catch {
      setBankError("ไม่สามารถเชื่อมต่อระบบได้");
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
          message: "ไม่สามารถอ่านข้อมูล response ได้ (ไม่ใช่ JSON)",
          status: createRes.status,
        };
      }

      if (!createRes.ok || isApiSuccessFalse(createData)) {
        setBankError(pickErrorMessage(createData, "ไม่สามารถสร้างรายการฝากเงินได้"));
        return;
      }

      const requestId = pickRequestId(createData);
      if (!requestId) {
        setBankError("ไม่พบ request_id จากขั้นตอน create");
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
          message: "ไม่สามารถอ่านข้อมูล QR response ได้ (ไม่ใช่ JSON)",
          status: qrRes.status,
        };
      }

      if (!qrRes.ok || isApiSuccessFalse(qrData)) {
        setBankError(pickErrorMessage(qrData, "ไม่สามารถโหลด QR Code ได้"));
        return;
      }

      const normalized = normalizeQrData(qrData);
      if (!normalized) {
        setBankError("รูปแบบข้อมูล QR ไม่ถูกต้อง หรือไม่มี qrcode");
        return;
      }

      setQrCodeData(normalized);
      setPhase("done");
    } catch {
      setBankError("ไม่สามารถเชื่อมต่อระบบได้");
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
    if (method !== "payment" || phase !== "done") return;
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
  }, [method, phase, qrCodeData, countdownSec, expireDoneTxids]);

  useEffect(() => {
    const txid = qrCodeData?.txid?.trim() ?? "";
    if (method !== "payment" || phase !== "done" || !txid) return;
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
          setStatusModal({ kind: "success", message: "ชำระเงินสำเร็จ กำลังพากลับหน้าแรก..." });
          return;
        }

        if (isExpiredStatus(status)) {
          setStatusSettledTxids((prev) => ({ ...prev, [txid]: true }));
          setStatusModal({ kind: "expired", message: "รายการหมดอายุ กำลังพากลับหน้าแรก..." });
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
  }, [method, phase, qrCodeData?.txid, statusModal, statusSettledTxids]);

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
      const message = payload.message?.trim() || (ok ? "รับโปรโมชั่นสำเร็จ" : "ไม่สามารถรับโปรโมชั่นได้");
      if (!ok) {
        toast.error(message);
        return;
      }

      await refreshActivePromotion();
      toast.success(message);
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setPromoSubmittingId(null);
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
      const message = payload.message?.trim() || (ok ? "ยกเลิกโปรโมชั่นสำเร็จ" : "ไม่สามารถยกเลิกโปรโมชั่นได้");
      if (!ok) {
        toast.error(message);
        return;
      }

      await refreshActivePromotion();
      toast.success(message);
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setPromoDeselecting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6">

      {/* Balance card */}
      <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-3">
        <p className="text-[14px] text-ap-tertiary uppercase tracking-wide font-medium mb-0.5">ยอดคงเหลือ</p>
        <p className="text-[30px] font-bold text-ap-primary tabular-nums leading-tight">
          ฿{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* User bank info card */}
      <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-5">
        <p className="text-[14px] text-ap-tertiary uppercase tracking-wide font-medium mb-1.5">บัญชีธนาคารของฉัน</p>
        {bankAccount ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-ap-primary">{displayName}</p>
              {bankName && <p className="text-[14px] text-ap-secondary mt-0.5">{bankName}</p>}
            </div>
            <p className="text-[14px] font-mono font-semibold text-ap-primary tracking-wider">
              {maskAccount(bankAccount)}
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-ap-tertiary">ยังไม่ได้ผูกบัญชีธนาคาร</p>
        )}
      </div>

      {(promotionLoading || visiblePromotions.length > 0) && (
        <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[14px] text-ap-tertiary uppercase tracking-wide font-medium">รายการโปรโมชั่น</p>
            <Link href={`/${lang}/promotion`} className="text-[12px] font-semibold text-ap-blue hover:text-ap-blue-h transition-colors">
              ดูทั้งหมด
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
                    className="min-w-[236px] sm:min-w-[248px] snap-start rounded-xl border border-ap-border bg-white overflow-hidden"
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
                            โบนัส {bonusPercent}%
                          </span>
                        )}
                        {minDeposit > 0 && (
                          <span className="text-[11px] text-ap-tertiary">
                            ขั้นต่ำ ฿{minDeposit.toLocaleString("en-US")}
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
                          {promoSubmittingId === promoCode ? "กำลังรับ..." : "รับโปร"}
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
        <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] text-ap-tertiary uppercase tracking-wide font-medium mb-1">โปรโมชั่นที่รับอยู่</p>
              <p className="text-[15px] font-semibold text-ap-primary leading-snug">{activePromotion.name}</p>
              <p className="text-[13px] text-ap-secondary mt-1">
                ยอดขั้นต่ำ ฿{(Number(activePromotion.min) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { void handleDeselectPromotion(); }}
              disabled={promoDeselecting || !!promoSubmittingId}
              className="px-3 py-2 rounded-full border border-ap-red/30 bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {promoDeselecting ? "กำลังยกเลิก..." : "ยกเลิกโปร"}
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-3xl border border-ap-border shadow-card p-5">
        <StepBar phase={phase} />

        {/* ── Phase: method ────────────────────────────────────────────────── */}
        {phase === "method" && (
          <div className="space-y-3 animate-fade-up">
            <h2 className="text-[17px] font-bold text-ap-primary mb-4">เลือกวิธีฝากเงิน</h2>

            {channelsLoading && (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 rounded-full border-2 border-ap-blue border-t-transparent animate-spin" />
                <p className="text-[13px] text-ap-secondary">กำลังโหลดช่องทางฝากเงิน...</p>
              </div>
            )}
            {channelsError && !channelsLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-ap-red">
                {channelsError}
              </div>
            )}
            {!channelsLoading && !channelsError && enabledChannels.length === 0 && (
              <p className="text-[13px] text-ap-tertiary py-4 text-center">ไม่มีช่องทางฝากเงินที่เปิดใช้งาน</p>
            )}

            {enabledChannels.map((ch) => {
              const meta = CHANNEL_META[ch];
              return (
                <button
                  key={ch}
                  onClick={() => selectMethod(ch)}
                  disabled={channelsLoading || !!channelsError}
                  className="w-full flex items-center gap-4 border-2 border-ap-border rounded-2xl px-5 py-4 text-left hover:border-ap-blue/50 hover:bg-ap-blue/[0.02] transition-all active:scale-[0.99] group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-2xl bg-ap-bg flex items-center justify-center text-[24px] flex-shrink-0 group-hover:bg-ap-blue/5 transition-colors">
                    {meta.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-ap-primary">{meta.title}</p>
                    <p className="text-[14px] text-ap-tertiary mt-0.5">{meta.desc}</p>
                  </div>
                  <svg className="w-5 h-5 text-ap-tertiary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Phase: account ────────────────────────────────────────────────── */}
        {phase === "account" && method && (
          <div className="space-y-4 animate-fade-up">

            {/* Channel header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[20px]">{CHANNEL_META[method].icon}</span>
              <h2 className="text-[16px] font-bold text-ap-primary">เลขบัญชีสำหรับโอนเงิน</h2>
            </div>

            {/* Loading bank accounts */}
            {bankLoading && (
              <div className="flex items-center gap-2 py-3">
                <div className="w-4 h-4 rounded-full border-2 border-ap-blue border-t-transparent animate-spin" />
                <p className="text-[13px] text-ap-secondary">กำลังโหลดข้อมูลช่องทาง...</p>
              </div>
            )}

            {/* Error */}
            {bankError && !bankLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-ap-red">
                {bankError}
              </div>
            )}

            {/* Bank account list */}
            {!bankLoading && method !== "payment" && bankAccounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[14px] font-bold text-ap-secondary uppercase tracking-wide">
                  {method === "tw" ? "โอนมาที่หมายเลขนี้" : "โอนเงินมาที่บัญชีนี้"}
                </p>
                {bankAccounts.map((acc) => (
                  <BankCard
                    key={acc.code}
                    account={acc}
                    selected={selectedBank?.code === acc.code}
                    onClick={() => setSelectedBank(acc)}
                  />
                ))}
              </div>
            )}

            {/* Payment option list + amount input */}
            {!bankLoading && method === "payment" && payments.length > 0 && (
              <div className="space-y-3">
                <p className="text-[14px] font-bold text-ap-secondary uppercase tracking-wide">
                  เลือกช่องทาง Payment
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
                          "w-full text-left rounded-2xl border-2 p-4 transition-all",
                          active
                            ? "border-ap-blue bg-ap-blue/5 shadow-sm"
                            : "border-ap-border hover:border-ap-blue/40 hover:bg-ap-bg",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-ap-bg border border-ap-border flex items-center justify-center text-[20px] flex-shrink-0">💳</div>
                            <p className="text-[15px] font-bold text-ap-primary">{p.name}</p>
                          </div>
                          {p.min_deposit > 0 && (
                            <span className="text-[13px] text-ap-tertiary">
                              ขั้นต่ำ ฿{p.min_deposit.toLocaleString("en-US")}
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
                  <div className="pt-1">
                    <label className="block text-[14px] font-bold text-ap-secondary uppercase tracking-wide mb-1.5">
                      จำนวนเงิน ({selectedPayment.name})
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
                      <p className="text-[12px] text-ap-tertiary mt-1.5">
                        ยอดฝากขั้นต่ำ ฿{selectedPayment.min_deposit.toLocaleString("en-US")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setPhase("method");
                  setQrCodeData(null);
                  setStatusModal(null);
                }}
                className="flex-1 py-3 rounded-full border-2 border-ap-border text-[14px] font-semibold text-ap-secondary hover:border-ap-blue/30 transition-colors"
              >
                ← ย้อนกลับ
              </button>
              <button
                onClick={() => {
                  if (method === "payment") {
                    void createPaymentDeposit();
                    return;
                  }
                  setPhase("done");
                }}
                disabled={
                  bankLoading ||
                  paymentSubmitting ||
                  !!bankError ||
                  (method === "payment"
                    ? !selectedPayment ||
                      !paymentAmount ||
                      Number(paymentAmount) < (selectedPayment?.min_deposit ?? 0)
                    : !selectedBank)
                }
                className="flex-1 py-3 rounded-2xl bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-all disabled:opacity-40"
              >
                {method === "payment" && paymentSubmitting ? "กำลังส่ง..." : "ถัดไป"}
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: done ───────────────────────────────────────────────────── */}
        {phase === "done" && (
          <div className="space-y-4 animate-fade-up">
            {method === "payment" && qrCodeData && qrImageSrc ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-ap-blue/20 bg-ap-blue/[0.03] p-4">
                  <p className="text-[16px] font-bold text-ap-primary">สแกน QR เพื่อชำระเงิน</p>
                  <p className="text-[13px] text-ap-secondary mt-1">
                    กรุณาชำระภายในเวลาที่กำหนด และรอระบบตรวจสอบอัตโนมัติ
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
                      ? "ไม่พบเวลาหมดอายุ"
                      : countdownSec > 0
                        ? `หมดเวลาใน ${formatCountdown(countdownSec)}`
                        : "QR หมดอายุแล้ว"}
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                    <div className="rounded-xl bg-ap-bg px-3 py-2">
                      <p className="text-ap-tertiary">Amount</p>
                      <p className="font-bold text-ap-primary">
                        ฿{Number(qrCodeData.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                      <div className="rounded-xl bg-ap-bg px-3 py-2">
                      <p className="text-ap-tertiary">หมดอายุ</p>
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
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[16px] font-bold text-amber-700">รอ 1–3 นาที</p>
                <p className="text-[13px] text-amber-700 mt-1">
                  ระบบกำลังตรวจสอบรายการฝากเงินของคุณ
                </p>
              </div>
            )}
            <a
              href={`/${lang}/transactions`}
              className="w-full flex items-center justify-center py-3 rounded-2xl bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-colors"
            >
              ไปหน้า การเงิน
            </a>

          </div>
        )}
      </div>

      <Notes />

      {statusModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-5">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-ap-border shadow-card p-5">
            <p className="text-[17px] font-bold text-ap-primary">
              {statusModal.kind === "success" ? "ฝากเงินสำเร็จ" : "รายการหมดอายุ"}
            </p>
            <p className="text-[14px] text-ap-secondary mt-2">
              {statusModal.message}
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = `/${lang}`; }}
              className="mt-4 w-full py-3 rounded-2xl bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-colors"
            >
              ไปหน้าแรก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
