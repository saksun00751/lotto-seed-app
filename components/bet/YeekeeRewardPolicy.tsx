export interface RewardPolicyItem {
  position?: number;
  label?: string;
  credit_amount?: number;
}

export default function YeekeeRewardPolicy({
  policy = [],
  currency,
}: {
  policy?: RewardPolicyItem[];
  currency?: string;
}) {
  if (!policy.length) return null;
  const total = policy.reduce((s, it) => s + (Number(it.credit_amount) || 0), 0);
  const cur = currency ?? "";

  return (
    <section className="rounded-2xl border border-ap-border bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-sky-500 to-cyan-400 border-b border-ap-border">
        <h2 className="text-[15px] font-extrabold text-white">รายละเอียดรางวัลที่จะได้รับ</h2>
        <p className="text-[12px] text-white/90 font-medium">
          ทั้งหมด {policy.length} รางวัล · รวม {total.toLocaleString("th-TH")} เครดิต{cur ? ` (${cur})` : ""}
        </p>
      </div>

      <ul className="divide-y divide-ap-border">
        {policy.map((p, idx) => (
          <li key={`${p.position ?? idx}`} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-sky-50/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center text-[12px] font-extrabold tabular-nums">
                #{p.position ?? "-"}
              </div>
              <p className="text-[14px] font-bold text-ap-primary truncate">
                {p.label ?? `รางวัลยิงเลขลำดับที่ ${p.position ?? "-"}`}
              </p>
            </div>
            <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-emerald-600">
              +{(Number(p.credit_amount) || 0).toLocaleString("th-TH")}{cur ? ` ${cur}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
