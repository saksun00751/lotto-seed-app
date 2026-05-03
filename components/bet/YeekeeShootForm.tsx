"use client";

import { useState } from "react";
import { toast } from "sonner";

const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];
const MAX_DIGITS = 5;

export default function YeekeeShootForm({ roundId }: { roundId: number }) {
  const [inputBuf, setInputBuf] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async () => {
    if (inputBuf.length !== MAX_DIGITS || loading) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: inputBuf }),
      });
      const json = await res.json().catch(() => ({ success: false }));
      if (res.ok && (json as { success?: boolean })?.success !== false) {
        toast.success(`ยิงเลข ${inputBuf} สำเร็จ`);
        window.dispatchEvent(new CustomEvent("yeekee-shoot-submitted"));
        setInputBuf("");
      }
    } finally {
      setLoading(false);
    }
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
                  onClick={pressRandom}
                  className="py-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-700 text-[14px] font-bold shadow-sm hover:bg-emerald-100 active:scale-95 transition-all"
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
                  onClick={pressBackspace}
                  className="py-3.5 rounded-xl bg-yellow-50 border-2 border-yellow-500 text-yellow-700 text-[14px] font-bold shadow-sm hover:bg-yellow-100 active:scale-95 transition-all"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => pressDigit(key)}
                className="py-3.5 rounded-xl bg-white border-2 border-ap-blue text-[20px] font-extrabold text-ap-primary shadow-sm hover:bg-blue-50 active:scale-95 active:bg-ap-blue active:text-white transition-all"
              >
                {key}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={inputBuf.length !== MAX_DIGITS || loading}
          className="mt-4 w-full rounded-2xl bg-ap-blue px-6 py-3 text-[15px] font-extrabold text-white shadow-sm hover:bg-ap-blue-h active:scale-[0.98] transition-all disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {loading ? "กำลังยิงเลข..." : "ยิงเลข"}
        </button>
      </div>
    </section>
  );
}
