"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";
import PromotionPanel from "@/components/deposit/PromotionPanel";
import { useLang } from "@/lib/i18n/context";
import { getTranslation } from "@/lib/i18n/getTranslation";

interface PaymentOption {
  id:          string;
  name:        string;
  min_deposit: number;
  payment_url: string;
  remark:      string;
}

interface PaymentApiPayload {
  success?: boolean;
  message?: string;
  bank?: unknown;
  data?: { bank?: unknown; items?: unknown; accounts?: unknown } | unknown[];
}

interface QrCodeData {
  provider_id:  string;
  request_id:  string;
  txid:        string;
  status:      string;
  amount:      number;
  payamount:   number;
  qrcode:      string;
  qr_string:   string;
  expired_date:string;
  member: { user_name: string; name: string };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
function pickRequestId(payload: unknown): string | null {
  const rec = asRecord(payload);
  if (!rec) return null;
  const root = (typeof rec.request_id === "string" ? rec.request_id.trim() : "")
    || (typeof rec.requestId === "string" ? rec.requestId.trim() : "");
  if (root) return root;
  const dataRec = asRecord(rec.data);
  const d = (typeof dataRec?.request_id === "string" ? dataRec.request_id.trim() : "")
    || (typeof dataRec?.requestId === "string" ? dataRec.requestId.trim() : "");
  if (d) return d;
  const url = (typeof rec.url === "string" ? rec.url.trim() : "")
    || (typeof dataRec?.url === "string" ? dataRec.url.trim() : "");
  if (!url) return null;
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
    return last || null;
  } catch {
    const last = url.split("/").filter(Boolean).pop() ?? "";
    return last || null;
  }
}
function normalizeQrData(payload: unknown, providerId: string, fallbackRequestId: string = ""): QrCodeData | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data) || root;
  const request_id =
    (typeof data.request_id === "string" ? data.request_id.trim() : "")
    || (typeof data.requestId === "string" ? data.requestId.trim() : "")
    || fallbackRequestId.trim();
  const txid = typeof data.txid === "string" ? data.txid : "";
  const qrcode = typeof data.qrcode === "string" ? data.qrcode.trim() : "";
  if (!request_id || !qrcode) return null;
  const memberRec = asRecord(data.member);
  return {
    provider_id: providerId,
    request_id,
    txid,
    status: typeof data.status === "string" ? data.status : "",
    amount: typeof data.amount === "number" ? data.amount : Number(data.amount) || 0,
    payamount: typeof data.payamount === "number" ? data.payamount : Number(data.payamount) || 0,
    qrcode,
    qr_string: typeof data.qr_string === "string" ? data.qr_string : "",
    expired_date: typeof data.expired_date === "string" ? data.expired_date : "",
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
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)).getTime();
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
  return data?.success === false;
}
function pickDepositStatus(payload: unknown): string {
  const rec = asRecord(payload);
  const data = asRecord(rec?.data);
  const candidate = data?.status ?? rec?.status ?? data?.payment_status ?? rec?.payment_status ?? data?.state ?? rec?.state ?? "";
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
function normalizePayment(id: string, p: unknown): PaymentOption | null {
  const rec = asRecord(p);
  if (!rec) return null;
  const name = typeof rec.name === "string" ? rec.name.trim() : "";
  if (!name) return null;
  const rawId = rec.id;
  const providerId =
    typeof rawId === "string" ? rawId.trim()
    : typeof rawId === "number" ? String(rawId)
    : id.trim();
  if (!providerId) return null;
  const minDeposit = rec.min_deposit;
  return {
    id:          providerId,
    name,
    min_deposit: typeof minDeposit === "number" ? minDeposit : Number(minDeposit) || 0,
    payment_url: typeof rec.payment_url === "string" ? rec.payment_url : "",
    remark:      typeof rec.remark === "string" ? rec.remark : "",
  };
}
function extractPayments(payload: PaymentApiPayload): PaymentOption[] {
  const dataRec = asRecord(payload.data);
  const source = payload.bank ?? dataRec?.bank ?? dataRec?.items ?? dataRec?.accounts ?? payload.data;
  if (Array.isArray(source)) {
    return source.map((item, i) => normalizePayment(String(i + 1), item)).filter(Boolean) as PaymentOption[];
  }
  const sourceRec = asRecord(source);
  if (!sourceRec) return [];
  if (typeof sourceRec.name === "string") {
    const single = normalizePayment("", sourceRec);
    return single ? [single] : [];
  }
  return Object.entries(sourceRec).map(([k, p]) => normalizePayment(k, p)).filter(Boolean) as PaymentOption[];
}

function formatBankAccount(account: string): string {
  const digits = account.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 12) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return account;
}

interface ActivePromotion {
  select: boolean;
  name: string;
  min: string;
}

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

interface DepositChannels {
  bank:    number;
  payment: number;
  tw:      number;
  slip:    number;
}

interface LoadBankApiPayload {
  success?: boolean;
  message?: string;
  bank?: LoadBankAccount[] | Record<string, Partial<LoadBankAccount>>;
  data?: { bank?: LoadBankAccount[]; items?: LoadBankAccount[]; accounts?: LoadBankAccount[] } | LoadBankAccount[];
}

type Method = "bank" | "tw" | "payment" | "slip";
type Step = "method" | "amount" | "result";

function normalizeAccount(a: Partial<LoadBankAccount> | undefined, fallbackCode: number): LoadBankAccount | null {
  if (!a?.acc_no || !a?.acc_name || !a?.bank_name) return null;
  return {
    acc_no:      a.acc_no,
    acc_name:    a.acc_name,
    bank_name:   a.bank_name,
    bank_pic:    a.bank_pic ?? "",
    qr_pic:      a.qr_pic ?? "",
    qrcode:      Boolean(a.qrcode),
    code:        typeof a.code === "number" ? a.code : fallbackCode,
    deposit_min: a.deposit_min ?? "0.00",
    remark:      a.remark ?? "",
  };
}

function extractAccounts(payload: LoadBankApiPayload): LoadBankAccount[] {
  const map = (arr: Partial<LoadBankAccount>[]) =>
    arr.map((a, i) => normalizeAccount(a, i + 1)).filter(Boolean) as LoadBankAccount[];
  if (Array.isArray(payload.bank)) return map(payload.bank);
  if (payload.bank && typeof payload.bank === "object") {
    const obj = payload.bank as Record<string, unknown>;
    if (typeof obj.acc_no === "string" && typeof obj.acc_name === "string" && typeof obj.bank_name === "string") {
      const single = normalizeAccount(obj as Partial<LoadBankAccount>, 1);
      return single ? [single] : [];
    }
    return Object.entries(obj).map(([k, a], i) =>
      normalizeAccount(a as Partial<LoadBankAccount>, Number(k) || i + 1)
    ).filter(Boolean) as LoadBankAccount[];
  }
  if (Array.isArray(payload.data)) return map(payload.data);
  if (payload.data && Array.isArray(payload.data.bank)) return map(payload.data.bank);
  if (payload.data && Array.isArray(payload.data.items)) return map(payload.data.items);
  if (payload.data && Array.isArray(payload.data.accounts)) return map(payload.data.accounts);
  return [];
}

export default function DepositPageRandom({ displayName, bankName, bankLogo, bankAccount, balance, selectedPromotion }: Props) {
  const { lang } = useLang();
  const t = getTranslation(lang, "deposit");
  const METHOD_META: Record<Method, { icon: string; title: string; desc: string }> = {
    bank:    { icon: "🏦", title: t.chBank,    desc: t.chBankDesc },
    tw:      { icon: "💚", title: t.chTw,      desc: t.chTwDesc },
    payment: { icon: "💳", title: t.chPayment, desc: t.chPaymentDesc },
    slip:    { icon: "📎", title: t.chSlip,    desc: t.chSlipDesc },
  };
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(
    selectedPromotion?.select ? selectedPromotion : null,
  );
  const [step, setStep]                 = useState<Step>("method");
  const [method, setMethod]             = useState<Method | null>(null);
  const [channels, setChannels]         = useState<DepositChannels | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [amount, setAmount]             = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [pickedAccount, setPickedAccount] = useState<LoadBankAccount | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [toast, setToast]               = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [payments, setPayments]                 = useState<PaymentOption[]>([]);
  const [selectedPayment, setSelectedPayment]   = useState<PaymentOption | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [qrCodeData, setQrCodeData]             = useState<QrCodeData | null>(null);
  const [nowTs, setNowTs]                       = useState<number>(() => Date.now());
  const [expireDoneTxids, setExpireDoneTxids]   = useState<Record<string, boolean>>({});
  const [statusSettledTxids, setStatusSettledTxids] = useState<Record<string, boolean>>({});
  const [statusModal, setStatusModal]           = useState<{ kind: "success" | "expired"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/deposit/channels")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.deposit) setChannels(data.data.deposit);
      })
      .catch(() => {})
      .finally(() => setChannelsLoading(false));
  }, []);

  function notify(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
  }

  async function selectMethod(m: Method) {
    setMethod(m);
    setError(null);
    setAmount("");
    setPayments([]);
    setSelectedPayment(null);
    setQrCodeData(null);
    setExpireDoneTxids({});
    setStatusSettledTxids({});
    setStatusModal(null);
    setStep("amount");

    if (m === "payment") {
      setSubmitting(true);
      try {
        const res = await fetch("/api/deposit/loadbank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "payment" }),
        });
        const data: PaymentApiPayload = await res.json();
        const list = extractPayments(data);
        if (data.success && list.length > 0) {
          setPayments(list);
          setSelectedPayment(list[0]);
        } else {
          setError(data.message ?? t.eLoadPayment);
        }
      } catch {
        setError(t.eConnect);
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function createPaymentDeposit() {
    if (!selectedPayment) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (amt < (selectedPayment.min_deposit ?? 0)) {
      setError(`${t.minDepositLabel} ฿${(selectedPayment.min_deposit || 0).toLocaleString("en-US")}`);
      return;
    }
    if (activePromotion?.select) {
      const min = parseFloat(activePromotion.min);
      if (Number.isFinite(min) && amt < min) {
        setError(`${activePromotion.name} ${t.min} ฿${min.toLocaleString("en-US")}`);
        return;
      }
    }

    setPaymentSubmitting(true);
    setQrCodeData(null);
    setExpireDoneTxids({});
    setStatusSettledTxids({});
    setStatusModal(null);
    setError(null);
    try {
      const providerPath = encodeURIComponent(selectedPayment.id.trim());
      const createEndpoint = `/api/payment/${providerPath}/deposit/create`;
      const createRequest = { amount: amt, payment_url: selectedPayment.payment_url };
      const createRes = await fetch(createEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createRequest),
      });
      let createData: unknown;
      try { createData = await createRes.json(); } catch { createData = { success: false, message: t.eResponseNotJson }; }
      if (!createRes.ok || isApiSuccessFalse(createData)) {
        setError(pickErrorMessage(createData, t.eCreateDeposit));
        return;
      }
      const createRec = asRecord(createData);
      const dataRec = asRecord(createRec?.data);
      const target =
        (typeof createRec?.target === "string" ? createRec.target.trim() : "")
        || (typeof dataRec?.target === "string" ? dataRec.target.trim() : "");
      const redirectUrl =
        (typeof createRec?.url === "string" ? createRec.url.trim() : "")
        || (typeof dataRec?.url === "string" ? dataRec.url.trim() : "");
      const redirectMsg =
        (typeof createRec?.msg === "string" ? createRec.msg.trim() : "")
        || (typeof createRec?.message === "string" ? createRec.message.trim() : "")
        || (typeof dataRec?.msg === "string" ? dataRec.msg.trim() : "")
        || (typeof dataRec?.message === "string" ? dataRec.message.trim() : "");
      if (target) {
        if (redirectMsg) {
          notify(redirectMsg, "success");
        }
        if (redirectUrl) {
          const windowTarget = target.startsWith("_") ? target : `_${target}`;
          setTimeout(() => {
            window.open(redirectUrl, windowTarget, "noopener,noreferrer");
          }, 1500);
        }
        return;
      }
      let normalized = normalizeQrData(createData, selectedPayment.id);
      if (normalized) {
        setQrCodeData(normalized);
        setStep("result");
        return;
      }

      const requestId = pickRequestId(createData);
      if (!requestId) { setError(t.eNoRequestId); return; }
      const qrEndpoint = `/api/payment/${providerPath}/qrcode/${encodeURIComponent(requestId)}`;
      const qrRes = await fetch(qrEndpoint, { method: "GET" });
      let qrData: unknown;
      try { qrData = await qrRes.json(); } catch { qrData = { success: false, message: t.eQrResponseNotJson }; }
      if (!qrRes.ok || isApiSuccessFalse(qrData)) {
        setError(pickErrorMessage(qrData, t.eLoadQr));
        return;
      }
      normalized = normalizeQrData(qrData, selectedPayment.id, requestId);
      if (!normalized) { setError(t.eBadQr); return; }
      setQrCodeData(normalized);
      setStep("result");
    } catch {
      setError(t.eConnect);
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function handleNext() {
    if (!method) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError(t.eAmountRequired);
      return;
    }
    if (activePromotion?.select) {
      const min = parseFloat(activePromotion.min);
      if (Number.isFinite(min) && amt < min) {
        setError(`${activePromotion.name} ${t.min} ฿${min.toLocaleString("en-US")}`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/deposit/loadbank/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data: LoadBankApiPayload = await res.json();
      const accounts = extractAccounts(data);
      if (!data.success || accounts.length === 0) {
        setError(data.message ?? t.eLoadAccounts);
        return;
      }
      const picked = accounts[0];
      const min = parseFloat(picked.deposit_min) || 0;
      if (amt < min) {
        setError(`${t.minDepositLabel} ฿${min.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        return;
      }
      setPickedAccount(picked);
      setStep("result");
    } catch {
      setError(t.eConnect);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text.replace(/\s+/g, ""));
      notify(t.tCopied, "success");
    } catch {
      notify(t.tCopyFailed, "error");
    }
  }

  function reset() {
    setStep("method");
    setMethod(null);
    setAmount("");
    setPickedAccount(null);
    setError(null);
    setPayments([]);
    setSelectedPayment(null);
    setQrCodeData(null);
    setExpireDoneTxids({});
    setStatusSettledTxids({});
    setStatusModal(null);
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
    if (method !== "payment" || step !== "result") return;
    if (!qrCodeData?.txid || countdownSec === null || countdownSec > 0) return;
    if (expireDoneTxids[qrCodeData.txid]) return;
    const txid = qrCodeData.txid;
    setExpireDoneTxids((prev) => ({ ...prev, [txid]: true }));
    void (async () => {
      try {
        const providerPath = encodeURIComponent(qrCodeData.provider_id);
        await fetch(`/api/payment/${providerPath}/deposit/expire/${encodeURIComponent(txid)}`, { method: "POST" });
      } catch {}
    })();
  }, [method, step, qrCodeData, countdownSec, expireDoneTxids]);

  useEffect(() => {
    const txid = qrCodeData?.txid?.trim() ?? "";
    const providerId = qrCodeData?.provider_id?.trim() ?? "";
    if (method !== "payment" || step !== "result" || !txid || !providerId) return;
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
        const providerPath = encodeURIComponent(providerId);
        const res = await fetch(`/api/payment/${providerPath}/deposit/status/${encodeURIComponent(txid)}`, { method: "GET" });
        let payload: unknown = null;
        try { payload = await res.json(); } catch {}
        if (!res.ok) { scheduleNext(); return; }
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
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [method, step, qrCodeData?.provider_id, qrCodeData?.txid, statusModal, statusSettledTxids, t.paidRedirect, t.expiredRedirect]);

  useEffect(() => {
    if (!statusModal) return;
    const timer = setTimeout(() => { window.location.href = `/${lang}`; }, 2200);
    return () => clearTimeout(timer);
  }, [statusModal, lang]);

  const methods: Method[] = [];
  if (!channels || channels.bank > 0) methods.push("bank");
  if (!channels || channels.tw > 0) methods.push("tw");
  if (channels && channels.payment > 0) methods.push("payment");
  if (channels && channels.slip > 0) methods.push("slip");

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

      <PromotionPanel
        lang={lang}
        initialActive={selectedPromotion?.select ? selectedPromotion : null}
        onNotify={(message, type) => notify(message, type)}
        onActiveChange={(next) => setActivePromotion(next)}
      />

      <div className="bg-white rounded-2xl border border-ap-border p-5 shadow-sm">
        <h1 className="text-[18px] font-extrabold text-ap-primary">{t.selectMethod}</h1>

        {/* Stepper */}
        <div className="mt-4 flex items-center w-full">
          {(["method", "amount", "result"] as Step[]).map((s, i) => {
            const order = ["method", "amount", "result"];
            const cur   = order.indexOf(step);
            const idx   = order.indexOf(s);
            const done  = idx < cur;
            const active = idx === cur;
            const labels = [t.selectMethod, t.amountLabel, t.channelInfo];
            return (
              <div key={s} className={[i < 2 ? "flex-1" : "", "flex items-center"].join(" ")}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all",
                    active ? "bg-ap-blue text-white" : done ? "bg-ap-blue/15 text-ap-blue" : "bg-ap-bg text-ap-tertiary",
                  ].join(" ")}>
                    {i + 1}
                  </div>
                  <span className={[
                    "text-[11px] font-semibold whitespace-nowrap",
                    active ? "text-ap-blue" : done ? "text-ap-secondary" : "text-ap-tertiary",
                  ].join(" ")}>
                    {labels[i]}
                  </span>
                </div>
                {i < 2 && <div className={["flex-1 h-0.5 mx-2 -mt-4 rounded-full", done ? "bg-ap-blue" : "bg-slate-300"].join(" ")} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Select method */}
        {step === "method" && (
          <div className="mt-5">
            {selectedPromotion?.select && (
              <div className="mb-3 rounded-xl bg-ap-blue/5 border border-ap-blue/20 px-3 py-2">
                <p className="text-[12px] text-ap-tertiary">{t.activePromo}</p>
                <p className="text-[14px] font-bold text-ap-blue">{selectedPromotion.name}</p>
                <p className="text-[12px] text-ap-secondary">
                  {t.min} ฿{(parseFloat(selectedPromotion.min) || 0).toLocaleString("en-US")}
                </p>
              </div>
            )}
            <p className="text-[14px] font-bold text-ap-primary mb-3">{t.selectMethod}</p>
            {channelsLoading ? (
              <p className="text-[13px] text-ap-tertiary">{t.loadingChannels}</p>
            ) : methods.length === 0 ? (
              <p className="text-[13px] text-ap-red">{t.noChannels}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {methods.map((m) => {
                  const meta = METHOD_META[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMethod(m)}
                      className="flex items-center gap-3 p-4 rounded-2xl border-2 border-ap-border hover:border-ap-blue hover:bg-ap-blue/5 active:scale-[0.98] transition-all text-left"
                    >
                      <span className="text-[28px] leading-none">{meta.icon}</span>
                      <div>
                        <p className="text-[15px] font-bold text-ap-primary">{meta.title}</p>
                        <p className="text-[12px] text-ap-tertiary">{meta.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Amount */}
        {step === "amount" && method && method !== "payment" && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[22px] leading-none">{METHOD_META[method].icon}</span>
              <p className="text-[15px] font-bold text-ap-primary">{METHOD_META[method].title}</p>
            </div>

            <label className="block text-[13px] font-semibold text-ap-secondary mb-1.5">{t.amountLabel}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-ap-tertiary">฿</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                className="w-full h-12 pl-9 pr-3 rounded-xl border-2 border-ap-border focus:border-ap-blue focus:outline-none text-[16px] font-bold tabular-nums"
              />
            </div>

            {error && <p className="mt-2 text-[13px] text-ap-red">{error}</p>}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex-1 h-12 rounded-xl border border-ap-border text-[14px] font-bold text-ap-secondary hover:bg-ap-bg transition-colors"
              >
                {"ย้อนกลับ"}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex-1 h-12 rounded-xl bg-ap-blue text-white text-[14px] font-bold shadow-sm hover:bg-ap-blue-h active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? "กำลังสุ่มบัญชี..." : "ถัดไป"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === "amount" && method === "payment" && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[22px] leading-none">{METHOD_META.payment.icon}</span>
              <p className="text-[15px] font-bold text-ap-primary">{METHOD_META.payment.title}</p>
            </div>

            {submitting ? (
              <p className="text-[13px] text-ap-tertiary">{t.loadingChannels}</p>
            ) : payments.length === 0 ? (
              <p className="text-[13px] text-ap-red">{error ?? t.eLoadPayment}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] font-bold text-ap-secondary uppercase tracking-wide">{t.selectPayment}</p>
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
                    <label className="block text-[13px] font-bold text-ap-secondary uppercase tracking-wide">
                      {t.amount} ({selectedPayment.name})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-ap-tertiary pointer-events-none">฿</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={selectedPayment.min_deposit || 0}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={String(selectedPayment.min_deposit || 0)}
                        className="w-full rounded-2xl border-2 border-ap-border focus:border-ap-blue outline-none pl-9 pr-4 py-3 text-[16px] font-semibold text-ap-primary bg-white transition-colors"
                      />
                    </div>
                    {selectedPayment.min_deposit > 0 && (
                      <p className="text-[12px] text-ap-tertiary">
                        {`${t.minDepositLabel} ฿${selectedPayment.min_deposit.toLocaleString("en-US")}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && payments.length > 0 && <p className="mt-2 text-[13px] text-ap-red">{error}</p>}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex-1 h-12 rounded-xl border border-ap-border text-[14px] font-bold text-ap-secondary hover:bg-ap-bg transition-colors"
              >
                {"ย้อนกลับ"}
              </button>
              <button
                type="button"
                onClick={() => { void createPaymentDeposit(); }}
                disabled={
                  paymentSubmitting ||
                  !selectedPayment ||
                  !amount ||
                  Number(amount) < (selectedPayment?.min_deposit ?? 0)
                }
                className="flex-1 h-12 rounded-xl bg-ap-blue text-white text-[14px] font-bold shadow-sm hover:bg-ap-blue-h active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {paymentSubmitting ? t.creatingQr : t.createQr}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result (payment QR) */}
        {step === "result" && method === "payment" && qrCodeData && qrImageSrc && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-ap-blue/20 bg-ap-blue/[0.03] p-4">
              <p className="text-[16px] font-bold text-ap-primary">{t.scanQr}</p>
              <p className="text-[13px] text-ap-secondary mt-1">{t.scanQrDesc}</p>
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
                  <p className="text-ap-tertiary">Amount</p>
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
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

        {/* Step 3: Result (bank/tw) */}
        {step === "result" && method !== "payment" && pickedAccount && (
          <div className="mt-5">
            <div className="rounded-2xl bg-ap-blue/5 border border-ap-blue/20 px-3 py-2 mb-3">
              <p className="text-[12px] text-ap-tertiary">{t.transferAmount}</p>
              <p className="text-[20px] font-extrabold text-ap-blue tabular-nums">
                ฿{Number(amount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="rounded-2xl border-2 border-ap-blue bg-ap-blue/5 p-4">
              <div className="flex items-center gap-3">
                {pickedAccount.bank_pic ? (
                  <img src={pickedAccount.bank_pic} alt={pickedAccount.bank_name} className="w-12 h-12 rounded-xl object-contain bg-white border border-ap-border" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white border border-ap-border flex items-center justify-center text-[22px]">🏦</div>
                )}
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ap-primary truncate">{pickedAccount.bank_name}</p>
                  <p className="text-[13px] text-ap-secondary truncate">{pickedAccount.acc_name}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white border border-ap-border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-ap-tertiary uppercase tracking-wide leading-none">{t.accountNo}</p>
                  <p className="mt-1 text-[18px] font-mono font-bold text-ap-primary tracking-wider leading-none break-all">
                    {pickedAccount.acc_no}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(pickedAccount.acc_no, t.accountNo)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-ap-blue text-white text-[12px] font-bold shadow-sm hover:bg-ap-blue-h active:scale-95 transition-all flex-shrink-0"
                >
                  {t.copy}
                </button>
              </div>

              {pickedAccount.remark && (
                <p className="mt-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                  {pickedAccount.remark}
                </p>
              )}

              {pickedAccount.qrcode && pickedAccount.qr_pic && (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-white border border-ap-border p-3">
                  <p className="text-[12px] font-bold text-ap-tertiary uppercase tracking-wide">{t.scanQr}</p>
                  <img
                    src={pickedAccount.qr_pic}
                    alt="QR Code"
                    className="w-full max-w-[720px] aspect-square object-contain"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-[12px] text-amber-700">
                {"กรุณาโอนตามจำนวนที่ระบุ และใช้บัญชีที่ลงทะเบียนไว้เท่านั้น"}
              </p>
            </div>


            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("amount")}
                className="flex-1 h-12 rounded-xl border border-ap-border text-[14px] font-bold text-ap-secondary hover:bg-ap-bg transition-colors"
              >
                {"ย้อนกลับ"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex-1 h-12 rounded-xl bg-ap-blue text-white text-[14px] font-bold shadow-sm hover:bg-ap-blue-h active:scale-[0.98] transition-all"
              >
                {"โอนเงินสำเร็จ"}
              </button>
            </div>
          </div>
        )}
      </div>

      {statusModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-5">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-ap-border shadow-card p-5">
            <p className="text-[17px] font-bold text-ap-primary">
              {statusModal.kind === "success" ? t.depositSuccess : t.txExpired}
            </p>
            <p className="text-[14px] text-ap-secondary mt-2">{statusModal.message}</p>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
