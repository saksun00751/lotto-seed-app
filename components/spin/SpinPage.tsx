"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";
import type { AuthUser } from "@/lib/session/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WheelSegment {
  code:     number;
  prize:    number;
  label:    string;
  imageUrl: string;
  color:    string;
  name:     string;
  types:    string;
}

interface SpinResult {
  error?:   string;
  point?:   number;
  diamond?: number;
  title?:   string;
  msg?:     string;
  img?:     string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpinPage({
  user,
  segments,
  wheelEnabled,
}: {
  user:         AuthUser;
  segments:     WheelSegment[];
  wheelEnabled: boolean;
}) {
  const t            = useTranslation("spin");
  const { lang }     = useLang();

  const wheelRef = useRef<any>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [diamond, setDiamond]       = useState(user.diamond);

  useEffect(() => {
    if (segments.length === 0) return;

    let cancelled = false;

    const preloadImages = (urls: string[]) =>
      Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((resolve) => {
              if (!url) { resolve(); return; }
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            }),
        ),
      );

    const initWheel = async () => {
      if (cancelled) return;
      const W = (window as any).Winwheel;
      if (!W) return;

      await preloadImages(segments.map((s) => s.imageUrl));
      if (cancelled) return;

      wheelRef.current = new W({
        canvasId:       "spin-canvas",
        numSegments:    segments.length,
        drawMode:       "segmentImage",
        imageDirection: "N",
        outerRadius:    170,
        innerRadius:    0,
        strokeStyle:    "white",
        lineWidth:      2,
        segments:       segments.map((seg) => ({
          fillStyle: seg.color,
          image:     seg.imageUrl,
        })),
        animation: {
          type:     "spinToStop",
          duration: 5,
          spins:    8,
        },
      });

      // Redraw after a tick to ensure Winwheel's internal image objects are ready
      setTimeout(() => {
        if (!cancelled) wheelRef.current?.draw();
      }, 100);
    };

    const loadWheel = () => {
      if ((window as any).Winwheel) { initWheel(); return; }
      const existing = document.querySelector('script[data-winwheel-script="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", initWheel, { once: true });
        return;
      }

      const s  = document.createElement("script");
      s.src    = "/Winwheel.min.js";
      s.dataset.winwheelScript = "true";
      s.onload = initWheel;
      document.body.appendChild(s);
    };

    if ((window as any).TweenMax) {
      loadWheel();
    } else {
      const existing = document.querySelector('script[data-tweenmax-script="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", loadWheel, { once: true });
      } else {
        const s  = document.createElement("script");
        s.src    = "/TweenMax.min.js";
        s.dataset.tweenmaxScript = "true";
        s.onload = loadWheel;
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [segments]);

  const handleSpin = async () => {
    if (isSpinning || diamond < 1 || !wheelEnabled || !wheelRef.current) return;
    setIsSpinning(true);

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    wheelRef.current.stopAnimation(false);
    wheelRef.current.rotationAngle = 0;
    wheelRef.current.animation.stopAngle = undefined;
    wheelRef.current.animation.callbackFinished = undefined;
    wheelRef.current.draw();

    let result: SpinResult;
    try {
      const res = await fetch("/api/wheel/spin", {
        method:      "POST",
        cache:       "no-store",
        credentials: "same-origin",
      });
      result = await res.json();
      if (!res.ok) {
        result = { error: result.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่" };
      }
    } catch {
      result = { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
    }

    if (result.error) {
      toast.error(result.error);
      setIsSpinning(false);
      return;
    }

    const stopAngle = typeof result.point === "number" ? result.point : undefined;

    if (typeof stopAngle !== "number") {
      toast.error("ไม่สามารถระบุตำแหน่งวงล้อได้");
      setIsSpinning(false);
      return;
    }

    wheelRef.current.animation.stopAngle = stopAngle;
    const animDuration = (wheelRef.current.animation.duration ?? 5) * 1000;
    let shown = false;
    const showResult = () => {
      if (shown) return;
      shown = true;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      toast.success(result.title ?? "ยินดีด้วย!", {
        description: result.msg,
        duration:    5000,
      });
      if (result.diamond !== undefined) setDiamond(result.diamond);
      setIsSpinning(false);
    };

    wheelRef.current.animation.callbackFinished = showResult;
    wheelRef.current.startAnimation();

    // Fallback กรณี Winwheel callback ไม่ถูกเรียก
    fallbackTimerRef.current = setTimeout(() => {
      wheelRef.current?.stopAnimation(false);
      showResult();
    }, animDuration + 800);
  };

  return (
    <>
      <main className="min-h-screen bg-ap-bg flex flex-col items-center justify-center p-5 pt-6 pb-24 sm:pb-8">
        <div className="w-full max-w-md">

          <div className="text-center mb-6">
            <h1 className="text-[24px] font-bold text-ap-primary tracking-tight">{t.title}</h1>
            <p className="text-[14px] text-ap-secondary mt-1">{t.subtitle}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card-xl border border-ap-border p-6 flex flex-col items-center gap-5">

            {/* Top bar */}
            <div className="mb-6 w-full flex items-center justify-between">
              <Link href={`/${lang}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ap-bg border border-ap-border text-ap-secondary text-[13px] hover:bg-ap-blue/5 transition-colors">
                {t.back}
              </Link>
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
                <span className="text-[16px]">💎</span>
                <span className="text-[14px] font-bold text-ap-blue tabular-nums">{diamond}</span>
                <span className="text-[11px] text-ap-secondary">{t.diamond}</span>
              </div>
            </div>

            {/* Wheel */}
            <div className="rng-canvas-container">
              <img src="/wheel_back.png" alt="" className="rng-canvas-bg" />
              <div className="rng-canvas-pointer">
                <svg width="22" height="30" viewBox="0 0 22 30">
                  {/* <polygon points="11,30 0,6 22,6" fill="#EF4444" /> */}
                  <circle cx="11" cy="6" r="4" fill="white" stroke="#EF4444" strokeWidth="2" />
                </svg>
              </div>
              <canvas id="spin-canvas" className="rng-canvas-canvas" width="400" height="400" />
            </div>
<br /> <br />
            <button
              onClick={handleSpin}
              disabled={isSpinning || diamond < 1 || !wheelEnabled}
              className="w-full bg-ap-blue text-white font-bold py-3 rounded-xl text-[15px] disabled:opacity-50 hover:bg-ap-blue-h transition-colors active:scale-[0.98]"
            >
              {isSpinning
                ? t.spinning
                : !wheelEnabled
                ? t.disabled
                : diamond < 1
                ? t.noDiamond
                : t.spinBtn}
            </button>

            <Link href={`/${lang}/spin/history`}
              className="w-full text-center py-2 rounded-xl border border-ap-border text-[13px] text-ap-secondary hover:bg-ap-bg transition-colors">
              {t.history}
            </Link>

          </div>
        </div>
      </main>
    </>
  );
}
