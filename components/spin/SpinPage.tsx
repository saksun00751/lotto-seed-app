"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CompleteProfileModal from "@/components/profile/CompleteProfileModal";
import { spinWheelAction } from "@/lib/actions";
import type { AuthUser } from "@/lib/session/auth";
import type { getBanks } from "@/lib/db/users";

type BankOption = Awaited<ReturnType<typeof getBanks>>[number];

const NUM_SEGMENTS = 10;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;
const PRIZES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const COLORS = [
  "#FFC107", "#FF5722", "#4CAF50", "#2196F3", "#9C27B0",
  "#E91E63", "#00BCD4", "#795548", "#607D8B", "#F44336",
];

const CX = 160, CY = 160, R = 148;

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : phone;
}

function polarToXY(angleDeg: number, radius = R) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function slicePath(startDeg: number, endDeg: number) {
  const s = polarToXY(startDeg);
  const e = polarToXY(endDeg);
  return `M${CX},${CY} L${s.x},${s.y} A${R},${R},0,0,1,${e.x},${e.y} Z`;
}

export default function SpinPage({ user, banks }: { user: AuthUser; banks: BankOption[] }) {
  const displayName = user.displayName ?? "สมาชิก";
  const phone = formatPhone(user.phone);
  const needsProfile = !user.bankAccount;

  const [rotation, setRotation]   = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [diamond, setDiamond]     = useState(user.diamond);
  const [error, setError]         = useState<string | null>(null);

  const handleSpin = async () => {
    if (isSpinning || diamond < 1) return;
    setIsSpinning(true);
    setWinnerIndex(null);
    setError(null);

    // คำนวณองศาก่อน แล้วค่อย call server action พร้อมกัน
    const index = Math.floor(Math.random() * NUM_SEGMENTS);
    const targetPos = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const needed = (360 - targetPos) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let extra = (needed - currentMod + 360) % 360;
    if (extra === 0) extra = 360;
    const newRotation = rotation + 5 * 360 + extra;
    setRotation(newRotation);

    // call server action พร้อมกับหมุน
    const result = await spinWheelAction();

    setTimeout(() => {
      setIsSpinning(false);
      if (result.error) {
        setError(result.error);
      } else {
        setWinnerIndex(index);
        if (result.diamond !== undefined) setDiamond(result.diamond);
      }
    }, 4500);
  };

  return (
    <>
      <CompleteProfileModal open={needsProfile} firstname={user.firstname} lastname={user.lastname} banks={banks} />
      <Navbar balance={user.balance} diamond={diamond} userName={displayName} userPhone={phone} />
      <main className="min-h-screen bg-ap-bg flex flex-col items-center justify-center p-5 pt-6 pb-24 sm:pb-8">
        <div className="w-full max-w-md">

          <div className="text-center mb-6">
            <h1 className="text-[24px] font-bold text-ap-primary tracking-tight">วงล้อแห่งโชคลาภ</h1>
            <p className="text-[14px] text-ap-secondary mt-1">หมุนเพื่อลุ้นรับรางวัล</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card-xl border border-ap-border p-6 flex flex-col items-center gap-5">

            <div className="w-full flex items-center justify-between">
              <Link href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ap-bg border border-ap-border text-ap-secondary text-[13px] hover:bg-ap-blue/5 transition-colors">
                ← กลับหน้าหลัก
              </Link>
              {/* Diamond counter */}
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
                <span className="text-[16px]">💎</span>
                <span className="text-[14px] font-bold text-ap-blue tabular-nums">{diamond}</span>
                <span className="text-[11px] text-ap-secondary">Diamond</span>
              </div>
            </div>

            {/* Wheel + pointer */}
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
                <svg width="22" height="30" viewBox="0 0 22 30">
                  <polygon points="11,30 0,6 22,6" fill="#EF4444" />
                  <circle cx="11" cy="6" r="4" fill="white" stroke="#EF4444" strokeWidth="2" />
                </svg>
              </div>

              <div className="rounded-full p-1.5 bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl">
                <svg
                  width="320" height="320" viewBox="0 0 320 320"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 1)" : "none",
                  }}
                >
                  {PRIZES.map((prize, i) => {
                    const start   = i * SEGMENT_ANGLE;
                    const end     = (i + 1) * SEGMENT_ANGLE;
                    const mid     = start + SEGMENT_ANGLE / 2;
                    const textPos = polarToXY(mid, R * 0.65);
                    return (
                      <g key={i}>
                        <path d={slicePath(start, end)} fill={COLORS[i]} stroke="white" strokeWidth="1.5" />
                        <text
                          x={textPos.x} y={textPos.y} dy="0.35em"
                          textAnchor="middle"
                          fill="white" fontSize="13" fontWeight="bold"
                          fontFamily="Arial, sans-serif"
                          transform={`rotate(${mid}, ${textPos.x}, ${textPos.y})`}
                          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}
                        >
                          {`\u0E3F${prize}`}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx={CX} cy={CY} r="26" fill="white" stroke="#3B82F6" strokeWidth="3" />
                  <text x={CX} y={CY} dy="0.35em"
                    textAnchor="middle"
                    fontSize="10" fontWeight="bold" fill="#3B82F6"
                    fontFamily="Arial, sans-serif">
                    SPIN
                  </text>
                </svg>
              </div>
            </div>

            {/* Result */}
            {winnerIndex !== null && !isSpinning && (
              <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <div className="text-[28px] mb-1">🎉</div>
                <p className="text-[16px] font-bold text-green-700">ยินดีด้วย!</p>
                <p className="text-[13px] text-ap-secondary mt-0.5">
                  คุณได้รับ{" "}
                  <span className="font-bold text-ap-primary text-[16px]">
                    ฿{PRIZES[winnerIndex].toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3 text-center text-[13px] text-red-600 font-medium">
                {error}
              </div>
            )}

            <button
              onClick={handleSpin}
              disabled={isSpinning || diamond < 1}
              className="w-full bg-ap-blue text-white font-bold py-3 rounded-xl text-[15px] disabled:opacity-50 hover:bg-ap-blue-h transition-colors active:scale-[0.98]"
            >
              {isSpinning ? "กำลังหมุน..." : diamond < 1 ? "💎 ไม่มี Diamond" : "หมุนเลย! 🎰 (1 💎)"}
            </button>

          </div>
        </div>
      </main>
    </>
  );
}
