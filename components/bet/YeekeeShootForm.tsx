"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];
const MAX_DIGITS = 5;
const COOLDOWN_SECONDS = 5;

export default function YeekeeShootForm({ roundId }: { roundId: number }) {
  const [inputBuf, setInputBuf] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const apiEndpointPath = `/lotto/yeekee/rounds/${roundId}/shoot`;
  const endpoint = `/api/v1${apiEndpointPath}`;

  const pressDigit = (digit: string) => {
    setInputBuf((prev) => (prev.length >= MAX_DIGITS ? prev : `${prev}${digit}`));
  };

  const pressBackspace = () => {
    setInputBuf((prev) => prev.slice(0, -1));
  };

  const pressRandom = () => {
    const next = Array.from({ length: MAX_DIGITS }, () => Math.floor(Math.random() * 10)).join("");
    setInputBuf(next);
  };

  const submittingRef = useRef(false);
  const handleSubmit = async (numberToSend: string) => {
    if (numberToSend.length !== MAX_DIGITS || submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: numberToSend }),
      });
      const json = await res.json().catch(() => ({ success: false }));
      if (res.ok && (json as { success?: boolean })?.success !== false) {
        toast.success(`ยิงเลข ${numberToSend} สำเร็จ`);
        window.dispatchEvent(new CustomEvent("yeekee-shoot-submitted"));
        setInputBuf("");
        setCooldown(COOLDOWN_SECONDS);
      } else {
        const msg = (json as { message?: string })?.message;
        toast.error(msg || "ยิงเลขไม่สำเร็จ");
        setInputBuf("");
      }
    } catch {
      toast.error("เชื่อมต่อไม่สำเร็จ");
      setInputBuf("");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  useEffect(() => {
    if (inputBuf.length !== MAX_DIGITS || submittingRef.current || cooldown > 0) return;
    const t = setTimeout(() => {
      handleSubmit(inputBuf);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputBuf, cooldown]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const isLocked = loading || cooldown > 0;
  const pressDigitGuarded = (digit: string) => {
    if (isLocked) return;
    pressDigit(digit);
  };
  const pressBackspaceGuarded = () => {
    if (isLocked) return;
    pressBackspace();
  };
  const pressRandomGuarded = () => {
    if (isLocked) return;
    pressRandom();
  };

  return (
    <section className="rounded-2xl border border-ap-border bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-ap-blue to-sky-400 border-b border-ap-border">
        <h2 className="text-[15px] font-extrabold text-white">ส่งเลขยิง</h2>
      </div>

      <div className="p-4">
        <div className="bg-ap-bg/70 rounded-2xl border-2 border-ap-blue p-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {Array.from({ length: MAX_DIGITS }).map((_, i) => (
              <div
                key={i}
                className={[
                  "w-12 h-16 sm:w-14 rounded-xl border-2 border-ap-blue flex items-center justify-center text-[28px] font-extrabold tabular-nums transition-all",
                  inputBuf[i]
                    ? "bg-white text-ap-blue shadow-md"
                    : i === inputBuf.length
                      ? "bg-blue-50 text-ap-tertiary animate-pulse"
                      : "bg-white text-ap-tertiary/30",
                ].join(" ")}
              >
                {inputBuf[i] ?? "·"}
              </div>
            ))}
          </div>
          <p className="text-center text-[14px] text-ap-secondary font-medium">
            ใส่เลขยิง 5 หลัก
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {NUMPAD_KEYS.map((key) => {
            if (key === "clear") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={pressRandomGuarded}
                  disabled={isLocked}
                  className="py-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-700 text-[14px] font-bold shadow-sm hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  สุ่มเลข
                </button>
              );
            }
            if (key === "del") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={pressBackspaceGuarded}
                  disabled={isLocked}
                  className="py-3.5 rounded-xl bg-yellow-50 border-2 border-yellow-500 text-yellow-700 text-[14px] font-bold shadow-sm hover:bg-yellow-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => pressDigitGuarded(key)}
                disabled={isLocked}
                className="py-3.5 rounded-xl bg-white border-2 border-ap-blue text-[20px] font-extrabold text-ap-primary shadow-sm hover:bg-blue-50 active:scale-95 active:bg-ap-blue active:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {key}
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="mt-4 text-center text-[14px] font-bold text-ap-blue">กำลังยิงเลข...</p>
        )}
        {!loading && cooldown > 0 && (
          <p className="mt-4 text-center text-[14px] font-bold text-ap-tertiary tabular-nums">
            ยิงครั้งถัดไปใน {cooldown} วินาที
          </p>
        )}
      </div>
    </section>
  );
}
