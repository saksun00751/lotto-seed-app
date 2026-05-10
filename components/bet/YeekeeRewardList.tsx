"use client";

interface ShootInfo {
  number_text?: string;
  number_text_masked?: string;
  number_text_revealed?: string;
  is_number_revealed?: boolean;
  submitted_at?: string;
}

export interface RewardWinner {
  position?: number;
  label?: string;
  credit_amount?: number;
  member_name_prefix_masked?: string;
  member_name_masked?: string;
  winner_credit_status?: string;
  shoot?: ShootInfo;
}

function formatTime(value?: string) {
  if (!value) return "-";
  const iso = value.replace(" ", "T") + "+07:00";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function YeekeeRewardList({
  winners = [],
  rewardEnabled = true,
}: {
  winners?: RewardWinner[];
  rewardEnabled?: boolean;
}) {
  const total = winners.reduce((s, it) => s + (Number(it.credit_amount) || 0), 0);

  return (
    <section className="rounded-2xl border border-ap-border bg-ap-card shadow-card overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 border-b border-ap-border">
        <h2 className="text-[15px] font-extrabold text-white">รายการผู้ได้รับรางวัลทายเลข</h2>
        <p className="text-[12px] text-white/90 font-medium">
          ทั้งหมด {winners.length} รายการ · รวม {total.toLocaleString("th-TH")} เครดิต
        </p>
      </div>

      <div className="max-h-[420px] overflow-auto">
        {!rewardEnabled && (
          <div className="p-6 text-center text-[14px] text-ap-tertiary">รอบนี้ไม่มีรางวัลทายเลข</div>
        )}
        {rewardEnabled && winners.length === 0 && (
          <div className="p-6 text-center text-[14px] text-ap-secondary">ยังไม่มีผู้ได้รับรางวัล</div>
        )}
        {rewardEnabled && winners.length > 0 && (
          <ul className="divide-y divide-ap-border">
            {winners.map((it, idx) => {
              const shoot = it.shoot;
              const isRevealed = shoot?.is_number_revealed ?? false;
              const numberDisplay = isRevealed
                ? (shoot?.number_text_revealed ?? shoot?.number_text ?? "-----")
                : (shoot?.number_text_masked ?? shoot?.number_text ?? "-----");
              const memberName = it.member_name_prefix_masked || it.member_name_masked || "ไม่ระบุชื่อ";
              return (
                <li key={`${it.position ?? idx}`} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-amber-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-[12px] font-extrabold tabular-nums">
                      #{it.position ?? "-"}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[18px] font-extrabold tabular-nums tracking-wider leading-tight ${isRevealed ? "text-emerald-600" : "text-ap-primary"}`}>
                        {numberDisplay}
                      </p>
                      <p className="text-[12px] text-ap-tertiary mt-0.5 truncate flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21v-1a7 7 0 0114 0v1" strokeLinecap="round" />
                        </svg>
                        <span className="truncate">{memberName}</span>
                        {shoot?.submitted_at && (
                          <span className="shrink-0 tabular-nums">· {formatTime(shoot.submitted_at)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-emerald-600">
                    +{(Number(it.credit_amount) || 0).toLocaleString("th-TH")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
