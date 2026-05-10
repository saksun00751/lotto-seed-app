"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { withdrawAction } from "@/lib/actions";
import type { WithdrawState } from "@/types/auth";
import Toast from "@/components/ui/Toast";

function t1(str: string, n: string | number) {
  return str.replace("{n}", String(n));
}

function tVars(str: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    str,
  );
}

type WithdrawT = ReturnType<typeof useTranslation<"withdraw">>;

interface Props {
  displayName:         string;
  bankName:            string | null;
  bankLogo:            string | null;
  bankAccount:         string | null;
  balance:             number;
  withdrawMin:         number;
  withdrawMax:         number;
  withdrawMaxDay:      number;
  withdrawSumToday:    number;
  withdrawRemainToday: number;
  withdrawLimitAmount: number;
  canWithdraw:         boolean;
  notice:              string | null;
  promoActive:         boolean;
  promoName:           string | null;
  promoTurnover:       number;
  promoWithdrawLimit:  number;
}

const COOLDOWN_MIN = 5;

function maskAccount(acc: string) {
  return acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc;
}

function formatBankAccount(account: string) {
  const digits = account.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return account;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Notes({ withdrawMin, withdrawMaxDay, withdrawSumToday, tw }: {
  withdrawMin:      number;
  withdrawMaxDay:   number;
  withdrawSumToday: number;
  tw:               WithdrawT;
}) {
  return (
    <div className="relative overflow-hidden mt-6 rounded-2xl border border-[#e9d9a5] bg-[linear-gradient(160deg,#ffffff_0%,#fff8e6_100%)] shadow-[0_16px_36px_rgba(166,120,20,0.16)] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(212,175,55,0.20),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/80 to-transparent" />

      <div className="relative flex items-center gap-2 mb-3">
        <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#fff1c8] border border-[#e6cd7a] text-[14px]">⚠️</span>
        <p className="text-[13px] font-bold text-[#7a5a00] tracking-wide">{tw.noteTitle}</p>
      </div>

      <div className="relative space-y-2">
        <div className="rounded-xl border border-[#eedeb0] bg-surface-card px-3 py-2.5 text-[14px] font-semibold text-ap-primary">
          {t1(tw.noteMinWithBaht, fmt(withdrawMin))}
        </div>
        <div className="rounded-xl border border-[#eedeb0] bg-surface-card px-3 py-2.5 text-[14px] font-semibold text-ap-primary">
          {tVars(tw.noteMaxDayWithSum, { max: fmt(withdrawMaxDay), sum: fmt(withdrawSumToday) })}
        </div>
      </div>
    </div>
  );
}

function PromoCard({
  name, turnover, withdrawLimit, payoutAmount, requestedAmount, turnoverPassed, shortfall, tw,
}: {
  name:            string | null;
  turnover:        number;
  withdrawLimit:   number;
  payoutAmount:    number;
  requestedAmount: number;
  turnoverPassed:  boolean;
  shortfall:       number;
  tw:              WithdrawT;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ap-border bg-surface-card shadow-[0_10px_22px_rgba(15,23,42,0.08)] px-4 py-3.5 mb-5">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-[15px] flex-shrink-0">👑</span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide leading-none">{tw.promoTitle}</p>
            <p className="text-[16px] font-bold text-ap-primary mt-0.5 truncate">{name || "-"}</p>
          </div>
        </div>
        <span className={`text-[13px] px-2 py-0.5 rounded-full border font-bold whitespace-nowrap ${
          turnoverPassed
            ? "bg-emerald-50 text-ap-green border-emerald-200"
            : "bg-amber-50 text-ap-orange border-amber-200"
        }`}>
          {turnoverPassed ? tw.promoPassed : tw.promoNotPassed}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border border-ap-border bg-surface-subtle px-2.5 py-2">
          <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide leading-none">{tw.promoStatTurn}</p>
          <p className="text-[16px] font-bold text-ap-primary mt-1 tabular-nums">฿{fmt(turnover)}</p>
        </div>
        <div className="rounded-lg border border-ap-border bg-surface-subtle px-2.5 py-2">
          <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide leading-none">{tw.promoStatLimit}</p>
          <p className="text-[16px] font-bold text-ap-red mt-1 tabular-nums">฿{fmt(withdrawLimit)}</p>
        </div>
        <div className="rounded-lg border border-ap-border bg-surface-subtle px-2.5 py-2">
          <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide leading-none">{tw.promoStatPayout}</p>
          <p className="text-[16px] font-bold text-blue-700 mt-1 tabular-nums">฿{fmt(payoutAmount)}</p>
        </div>
        <div className="rounded-lg border border-ap-border bg-surface-subtle px-2.5 py-2">
          <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide leading-none">{tw.promoStatShortfall}</p>
          <p className="text-[16px] font-bold text-ap-orange mt-1 tabular-nums">฿{fmt(shortfall)}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {!turnoverPassed && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[14px] font-semibold text-amber-800">
            {tw.promoTipTurnover}
          </div>
        )}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[14px] font-semibold text-blue-800">
          {tVars(tw.promoCalcNote, { req: fmt(requestedAmount), limit: fmt(withdrawLimit) })}
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[14px] font-semibold text-ap-red">
          {tw.promoForceFull}
        </div>
      </div>
    </div>
  );
}

export default function WithdrawPage({
  displayName, bankName, bankLogo, bankAccount, balance,
  withdrawMin, withdrawMax, withdrawMaxDay,
  withdrawSumToday, withdrawRemainToday, withdrawLimitAmount,
  canWithdraw, notice,
  promoActive, promoName, promoTurnover, promoWithdrawLimit,
}: Props) {
  const { lang } = useLang();
  const tw = useTranslation("withdraw");
  const [amount, setAmount]           = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: "error" | "success" | "warning" } | null>(null);
  const [state, action, pending]      = useActionState<WithdrawState, FormData>(withdrawAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) setToast({ msg: state.error, type: "error" });
  }, [state.error]);

  const amountNum  = parseFloat(amount) || 0;
  const maxAllowed = Math.min(withdrawMax, balance, withdrawRemainToday);
  const forcedAmount = promoActive && promoWithdrawLimit > 0
    ? Math.max(0, Math.min(maxAllowed, promoWithdrawLimit))
    : Math.max(0, maxAllowed);
  const effectiveAmount = promoActive ? forcedAmount : amountNum;
  const turnoverPassed = balance >= promoTurnover;
  const promoShortfall = Math.max(0, promoTurnover - balance);
  const isValid = effectiveAmount >= withdrawMin
    && effectiveAmount <= maxAllowed
    && canWithdraw
    && (!promoActive || turnoverPassed)
    && !!bankAccount;

  useEffect(() => {
    if (!promoActive) return;
    setAmount(forcedAmount > 0 ? String(forcedAmount) : "");
  }, [promoActive, forcedAmount]);

  const quickAmounts = [
    { label: fmt(withdrawMin),     value: withdrawMin },
    { label: fmt(withdrawMin * 3), value: withdrawMin * 3 },
    { label: fmt(withdrawMin * 5), value: withdrawMin * 5 },
    { label: tw.all,               value: balance },
  ];

  function getAmountError(): string | null {
    if (promoActive) return null;
    if (!amount) return null;
    if (amountNum < withdrawMin)         return t1(tw.errMin, fmt(withdrawMin));
    if (amountNum > withdrawMax)         return t1(tw.errMax, fmt(withdrawMax));
    if (amountNum > withdrawRemainToday) return t1(tw.errExceedToday, fmt(withdrawRemainToday));
    if (amountNum > balance)             return tw.errInsufficient;
    return null;
  }

  const amountError = getAmountError();

  if (state.success) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-5 sm:pt-6">
        <div className="relative overflow-hidden bg-surface-card rounded-3xl border border-ap-border shadow-[0_16px_34px_rgba(15,23,42,0.12)] p-6 text-center">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
          <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-ap-primary">{tw.successTitle}</h2>
          <p className="text-[13px] text-ap-secondary mt-1.5">
            {t1(tw.successDesc, COOLDOWN_MIN)}
          </p>

          <div className="mt-5 bg-surface-subtle rounded-2xl border border-ap-border p-4 text-left space-y-2.5">
            {[
              { label: tw.rowAmount, value: `฿${fmt(effectiveAmount)}`, blue: true },
              { label: tw.rowBank,   value: bankName ?? "-" },
              { label: tw.rowAccNo,  value: bankAccount ? maskAccount(bankAccount) : "-" },
              { label: tw.rowName,   value: displayName },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[13px] text-ap-secondary">{row.label}</span>
                <span className={`text-[13px] font-semibold ${row.blue ? "text-ap-blue" : "text-ap-primary"}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <a
            href={`/${lang}/profile`}
            className="mt-5 flex items-center justify-center w-full rounded-2xl bg-gradient-to-r from-[#0a68d8] to-[#1a87ea] text-white py-3.5 text-[15px] font-semibold hover:brightness-105 transition-all shadow-[0_10px_22px_rgba(37,99,235,0.24)]"
          >
            {tw.backProfile}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-5 sm:pt-6">

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* System notice */}
      {notice && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-[13px] text-yellow-800 font-medium shadow-[0_8px_18px_rgba(120,53,15,0.12)]">
          {notice}
        </div>
      )}

      {/* Withdraw disabled */}
      {!canWithdraw && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-[13px] text-ap-red font-medium shadow-[0_8px_18px_rgba(127,29,29,0.14)]">
          {tw.systemClosed}
        </div>
      )}

      {/* Balance card */}
      <div className="relative overflow-hidden bg-surface-card rounded-2xl border border-ap-border shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.12),transparent_42%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
        <p className="relative text-[12px] text-ap-tertiary uppercase tracking-[0.08em] font-semibold mb-1">{tw.balance}</p>
        <p className="relative text-[32px] font-extrabold text-ap-primary tabular-nums leading-tight tracking-tight">
          ฿{fmt(balance)}
        </p>
      </div>

      {/* Bank info card */}
      <div className="relative bg-surface-card rounded-2xl border border-ap-border shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-5">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-200/70 to-transparent" />
        <p className="text-[12px] text-ap-tertiary uppercase tracking-[0.08em] font-semibold mb-2">{tw.myAccount}</p>
        {bankAccount ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-card border border-ap-border overflow-hidden flex items-center justify-center flex-shrink-0">
                {bankLogo ? (
                  <img src={bankLogo} alt={bankName ?? tw.bankAlt} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[16px]" aria-hidden>🏦</span>
                )}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ap-primary">{displayName}</p>
                <p className="text-[13px] text-ap-secondary mt-0.5">{bankName}</p>
              </div>
            </div>
            <p className="text-[14px] font-mono font-semibold text-ap-primary tracking-wider bg-surface-subtle border border-ap-border rounded-lg px-2.5 py-1">
              {formatBankAccount(bankAccount)}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-ap-tertiary">{tw.noBank}</p>
            <a href={`/${lang}/profile`} className="text-[14px] text-ap-blue font-semibold hover:text-ap-blue-h transition-colors">{tw.setup}</a>
          </div>
        )}
      </div>

      {promoActive && (
        <PromoCard
          name={promoName}
          turnover={promoTurnover}
          withdrawLimit={promoWithdrawLimit}
          payoutAmount={effectiveAmount}
          requestedAmount={maxAllowed}
          turnoverPassed={turnoverPassed}
          shortfall={promoShortfall}
          tw={tw}
        />
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-surface-card rounded-3xl border border-ap-border shadow-[0_20px_44px_rgba(15,23,42,0.24)] w-full max-w-sm p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-ap-red/10 flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-ap-primary text-center mb-1">{tw.confirmTitle}</h3>
            <p className="text-[14px] text-ap-tertiary text-center mb-5">{tw.confirmDesc}</p>

            <div className="bg-surface-subtle border border-ap-border rounded-2xl p-4 space-y-3 mb-5">
              {[
                { label: tw.rowAmount, value: `฿${fmt(effectiveAmount)}`, highlight: true },
                { label: tw.rowBank,   value: bankName ?? "-" },
                { label: tw.rowAccNo,  value: bankAccount ? maskAccount(bankAccount) : "-" },
                { label: tw.rowName,   value: displayName },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[14px] text-ap-secondary">{row.label}</span>
                  <span className={`text-[13px] font-bold ${row.highlight ? "text-ap-red" : "text-ap-primary"}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-full border border-ap-border text-[14px] font-semibold text-ap-secondary hover:bg-surface-subtle transition-colors"
              >
                {tw.confirmCancel}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => { setShowConfirm(false); formRef.current?.requestSubmit(); }}
                className="flex-1 py-3 rounded-full bg-ap-red text-white text-[14px] font-bold hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                {pending ? tw.btnProcessing : tw.confirmOk}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form card */}
      <form ref={formRef} action={action}>
      <input type="hidden" name="amount" value={promoActive ? String(forcedAmount) : amount} />
      <div className="relative bg-surface-card rounded-3xl border border-ap-border shadow-[0_16px_34px_rgba(15,23,42,0.12)] p-5 space-y-5">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <h2 className="text-[17px] font-bold text-ap-primary">{tw.enterAmount}</h2>

        {/* Quick-amount buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {quickAmounts.map((q) => {
            const isAll    = q.label === tw.all;
            const selected = isAll
              ? parseFloat(promoActive ? String(forcedAmount) : amount) === balance
              : amount === String(q.value);
            return (
              <button
                key={q.label}
                type="button"
                disabled={promoActive}
                onClick={() => setAmount(String(q.value))}
                className={[
                  "py-3 rounded-xl text-[13px] font-bold border transition-all active:scale-[0.98]",
                  selected
                    ? "border-[#1f63d8] bg-gradient-to-b from-[#3588f4] via-[#2872e6] to-[#1f63d8] text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]"
                    : "bg-surface-card border-ap-border text-ap-primary hover:border-blue-300 hover:bg-[#f8fbff]",
                  promoActive ? "opacity-50 cursor-not-allowed hover:border-ap-border hover:bg-surface-card" : "",
                ].join(" ")}
              >
                {q.label}
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        <div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-ap-secondary select-none">฿</span>
            <input
              type="number"
              inputMode="numeric"
              min={withdrawMin}
              max={maxAllowed}
              value={promoActive ? String(forcedAmount) : amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t1(tw.placeholder, fmt(withdrawMin))}
              disabled={promoActive}
              readOnly={promoActive}
              className={[
                "w-full border-2 rounded-2xl pl-9 pr-4 py-3 text-[16px] font-semibold text-ap-primary outline-none transition-all bg-surface-card",
                amountError
                  ? "border-ap-red bg-ap-red/[0.03] focus:ring-2 focus:ring-ap-red/10"
                  : "border-ap-border focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
                promoActive ? "cursor-not-allowed bg-slate-100 text-ap-tertiary focus:border-ap-border focus:ring-0" : "",
              ].join(" ")}
            />
          </div>
          {promoActive && (
            <p className="text-[13px] text-ap-red mt-1.5 pl-1 font-medium">
              {tw.promoForceInput}
            </p>
          )}
          {amountError && (
            <p className="text-[14px] text-ap-red mt-1.5 pl-1">{amountError}</p>
          )}
        </div>

        {/* Summary row */}
        {isValid && (
          <div className="bg-surface-subtle border border-ap-border rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in">
            <span className="text-[14px] text-ap-secondary">{tw.transferTo}</span>
            <span className="text-[13px] font-semibold text-ap-primary">
              {displayName} · {bankAccount ? maskAccount(bankAccount) : "-"}
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          disabled={!isValid || pending}
          onClick={() => setShowConfirm(true)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d72638] to-[#ef4444] text-white text-[15px] font-semibold hover:brightness-105 transition-all disabled:opacity-40 active:scale-[0.99] shadow-[0_10px_22px_rgba(220,38,38,0.25)]"
        >
          {pending         ? tw.btnProcessing
           : !bankAccount  ? tw.btnNoBank
           : !canWithdraw  ? tw.btnClosed
           : t1(tw.btnConfirm, isValid ? fmt(effectiveAmount) : "–")}
        </button>
      </div>
      </form>

      <Notes
        tw={tw}
        withdrawMin={withdrawMin}
        withdrawMaxDay={withdrawMaxDay}
        withdrawSumToday={withdrawSumToday}
      />
    </div>
  );
}
