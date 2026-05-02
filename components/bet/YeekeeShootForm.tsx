"use client";

import { useState } from "react";

const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];
const MAX_DIGITS = 5;

export default function YeekeeShootForm({ roundId }: { roundId: number }) {
  const [inputBuf, setInputBuf] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseJson, setResponseJson] = useState<unknown>(null);
  const apiEndpointPath = `/lotto/yeekee/rounds/${roundId}/shoot`;
  const endpoint = `/api/v1${apiEndpointPath}`;
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const endpointFullUrl = apiBaseUrl ? `${apiBaseUrl}${apiEndpointPath}` : endpoint;

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
    setResponseJson(null);
    const payload = { number: inputBuf };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ success: false, message: `HTTP ${res.status}` }));
      setResponseJson({ method: "POST", endpoint: endpointFullUrl, payload, response: json });
    } catch (error) {
      setResponseJson({
        method: "POST",
        endpoint: endpointFullUrl,
        payload,
        success: false,
        message: error instanceof Error ? error.message : "ยิงเลขไม่สำเร็จ",
      });
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
        <div className="bg-ap-bg/70 rounded-2xl border border-ap-border p-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {Array.from({ length: MAX_DIGITS }).map((_, i) => (
              <div
                key={i}
                className={[
                  "w-12 h-16 sm:w-14 rounded-xl border-2 flex items-center justify-center text-[28px] font-extrabold tabular-nums transition-all",
                  inputBuf[i]
                    ? "border-ap-blue bg-white text-ap-blue shadow-md"
                    : i === inputBuf.length
                      ? "border-ap-blue/50 bg-blue-50/50 text-ap-tertiary animate-pulse"
                      : "border-ap-border bg-white text-ap-tertiary/30",
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
                  className="py-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-[14px] font-bold hover:bg-emerald-100 active:scale-95 transition-all"
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
                  className="py-3.5 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-700 text-[14px] font-bold hover:bg-yellow-100 active:scale-95 transition-all"
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
                className="py-3.5 rounded-xl bg-white border-2 border-ap-border text-[20px] font-extrabold text-ap-primary hover:border-ap-blue hover:bg-blue-50 active:scale-95 active:bg-ap-blue active:text-white transition-all shadow-sm"
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

        {responseJson != null && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10 text-[14px] font-bold text-slate-200">
              POST {endpointFullUrl}
            </div>
            <pre className="max-h-[280px] overflow-auto p-4 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(responseJson, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
