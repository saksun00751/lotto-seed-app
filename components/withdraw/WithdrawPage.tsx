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

interface Props {
  displayName:         string;
  bankName:            string | null;
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
}

const COOLDOWN_MIN = 5;

function maskAccount(acc: string) {
  return acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Notes({ withdrawMin, withdrawMax, withdrawMaxDay, withdrawSumToday, withdrawRemainToday, withdrawLimitAmount }: {
  withdrawMin:         number;
  withdrawMax:         number;
  withdrawMaxDay:      number;
  withdrawSumToday:    number;
  withdrawRemainToday: number;
  withdrawLimitAmount: number;
}) {
  const tw = useTranslation("withdraw");
  const notes = [
    {
      bold: false,
      highlight: true,
      text: tw.noteTodaySum.replace("{sum}", fmt(withdrawSumToday)).replace("{remain}", fmt(withdrawRemainToday)),
    },
    { bold: false, highlight: false, text: t1(tw.noteMin, fmt(withdrawMin)) },
    { bold: false, highlight: false, text: t1(tw.noteMax, fmt(withdrawMax)) },
    { bold: false, highlight: false, text: t1(tw.noteMaxDay, fmt(withdrawMaxDay)) },
    ...(withdrawLimitAmount > 0 ? [{
      bold: false,
      highlight: false,
      text: t1(tw.noteLimitAmount, fmt(withdrawLimitAmount)),
    }] : []),
    {
      bold: true,
      highlight: false,
      text: t1(tw.noteCooldown, COOLDOWN_MIN),
    },
  ];

  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[18px]">⚠️</span>
        <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wide">{tw.noteTitle}</p>
      </div>
      <div className="space-y-2">
        {notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-amber-500 text-[12px] mt-0.5 flex-shrink-0">•</span>
            <p className={[
              "text-[12px] leading-relaxed",
              n.bold      ? "font-semibold text-amber-800" : "text-amber-700",
              n.highlight ? "font-medium"                  : "",
            ].join(" ")}>
              {n.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WithdrawPage({
  displayName, bankName, bankAccount, balance,
  withdrawMin, withdrawMax, withdrawMaxDay,
  withdrawSumToday, withdrawRemainToday, withdrawLimitAmount,
  canWithdraw, notice,
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
  const isValid    = amountNum >= withdrawMin && amountNum <= maxAllowed && canWithdraw && !!bankAccount;

  const quickAmounts = [
    { label: fmt(withdrawMin),     value: withdrawMin },
    { label: fmt(withdrawMin * 3), value: withdrawMin * 3 },
    { label: fmt(withdrawMin * 5), value: withdrawMin * 5 },
    { label: tw.all,               value: balance },
  ];

  function getAmountError(): string | null {
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
      <div className="max-w-5xl mx-auto px-5 pt-6">
        <div className="bg-white rounded-3xl border border-ap-border shadow-card p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-ap-primary">{tw.successTitle}</h2>
          <p className="text-[13px] text-ap-secondary mt-1.5">
            {t1(tw.successDesc, COOLDOWN_MIN)}
          </p>

          <div className="mt-5 bg-ap-bg rounded-2xl p-4 text-left space-y-2.5">
            {[
              { label: tw.rowAmount, value: `฿${fmt(amountNum)}`, blue: true },
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
            className="mt-5 flex items-center justify-center w-full bg-ap-blue text-white rounded-full py-3.5 text-[15px] font-semibold hover:bg-ap-blue-h transition-colors"
          >
            {tw.backProfile}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6">

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* System notice */}
      {notice && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-[13px] text-yellow-800 font-medium">
          {notice}
        </div>
      )}

      {/* Withdraw disabled */}
      {!canWithdraw && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-[13px] text-red-700 font-medium">
          {tw.systemClosed}
        </div>
      )}

      {/* Balance card */}
      <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-3">
        <p className="text-[11px] text-ap-tertiary uppercase tracking-wide font-medium mb-0.5">{tw.balance}</p>
        <p className="text-[30px] font-bold text-ap-primary tabular-nums leading-tight">
          ฿{fmt(balance)}
        </p>
      </div>

      {/* Bank info card */}
      <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-5">
        <p className="text-[11px] text-ap-tertiary uppercase tracking-wide font-medium mb-1.5">{tw.myAccount}</p>
        {bankAccount ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-ap-primary">{displayName}</p>
              <p className="text-[12px] text-ap-secondary mt-0.5">{bankName}</p>
            </div>
            <p className="text-[14px] font-mono font-semibold text-ap-primary tracking-wider">
              {maskAccount(bankAccount)}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-ap-tertiary">{tw.noBank}</p>
            <a href={`/${lang}/profile`} className="text-[12px] text-ap-blue font-semibold">{tw.setup}</a>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-ap-red/10 flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-ap-primary text-center mb-1">{tw.confirmTitle}</h3>
            <p className="text-[12px] text-ap-tertiary text-center mb-5">{tw.confirmDesc}</p>

            <div className="bg-ap-bg rounded-2xl p-4 space-y-3 mb-5">
              {[
                { label: tw.rowAmount, value: `฿${fmt(amountNum)}`, highlight: true },
                { label: tw.rowBank,   value: bankName ?? "-" },
                { label: tw.rowAccNo,  value: bankAccount ? maskAccount(bankAccount) : "-" },
                { label: tw.rowName,   value: displayName },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-ap-secondary">{row.label}</span>
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
                className="flex-1 py-3 rounded-full border border-ap-border text-[14px] font-semibold text-ap-secondary hover:bg-ap-bg transition-colors"
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
      <input type="hidden" name="amount" value={amount} />
      <div className="bg-white rounded-3xl border border-ap-border shadow-card p-5 space-y-5">
        <h2 className="text-[17px] font-bold text-ap-primary">{tw.enterAmount}</h2>

        {/* Quick-amount buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((q) => {
            const isAll    = q.label === tw.all;
            const selected = isAll
              ? parseFloat(amount) === balance
              : amount === String(q.value);
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => setAmount(String(q.value))}
                className={[
                  "py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95",
                  selected
                    ? "bg-ap-blue border-ap-blue text-white shadow-sm"
                    : "bg-white border-ap-border text-ap-primary hover:border-ap-blue/40",
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t1(tw.placeholder, fmt(withdrawMin))}
              className={[
                "w-full border-2 rounded-2xl pl-9 pr-4 py-3 text-[15px] font-semibold text-ap-primary outline-none transition-all",
                amountError
                  ? "border-ap-red bg-ap-red/[0.03] focus:ring-2 focus:ring-ap-red/10"
                  : "border-ap-border focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
              ].join(" ")}
            />
          </div>
          {amountError && (
            <p className="text-[12px] text-ap-red mt-1.5 pl-1">{amountError}</p>
          )}
        </div>

        {/* Summary row */}
        {isValid && (
          <div className="bg-ap-bg rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in">
            <span className="text-[12px] text-ap-secondary">{tw.transferTo}</span>
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
          className="w-full py-3.5 rounded-full bg-ap-red text-white text-[15px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 active:scale-[0.99]"
        >
          {pending         ? tw.btnProcessing
           : !bankAccount  ? tw.btnNoBank
           : !canWithdraw  ? tw.btnClosed
           : t1(tw.btnConfirm, isValid ? fmt(amountNum) : "–")}
        </button>
      </div>
      </form>

      <Notes
        withdrawMin={withdrawMin}
        withdrawMax={withdrawMax}
        withdrawMaxDay={withdrawMaxDay}
        withdrawSumToday={withdrawSumToday}
        withdrawRemainToday={withdrawRemainToday}
        withdrawLimitAmount={withdrawLimitAmount}
      />
    </div>
  );
}
