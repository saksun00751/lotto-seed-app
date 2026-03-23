import { prisma } from "./prisma";

export interface TxRow {
  id:           number;
  label:        string;
  amount:       number;
  amountRaw:    number;  // + deposit, - withdraw
  balanceBefore: number;
  balanceAfter:  number;
  date:         string;
  status:       "สำเร็จ" | "รอดำเนินการ" | "ยกเลิก";
}

const KIND_LABEL: Record<string, string> = {
  DEP:      "ฝากเงิน",
  DEPOSIT:  "ฝากเงิน",
  WD:       "ถอนเงิน",
  WITHDRAW: "ถอนเงิน",
  BONUS:    "โบนัส",
  CB:       "คืนยอดเสีย",
  CASHBACK: "คืนยอดเสีย",
  REBATE:   "คืนยอดเสีย",
  REF:      "ค่าแนะนำ",
  REFER:    "ค่าแนะนำ",
  REFERRAL: "ค่าแนะนำ",
  DOWN:     "ยอดเสียเพื่อน",
  DOWNLINE: "ยอดเสียเพื่อน",
  ADJ:      "ปรับยอด",
  ADJUST:   "ปรับยอด",
  SPIN:     "วงล้อมหาสนุก",
};

function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── members_credit_log (ฝาก / ถอน / ยอดเสีย / ค่าแนะนำ / ปรับยอด / โบนัส) ──
export async function getCreditLog(userId: string, kinds: string[], limit = 50): Promise<TxRow[]> {
  const mc = Number(userId);
  const rows = await prisma.members_credit_log.findMany({
    where:   { member_code: mc, kind: { in: kinds } },
    orderBy: { date_create: "desc" },
    take:    limit,
    select:  { code: true, kind: true, amount: true, credit_type: true, balance_before: true, balance_after: true, date_create: true },
  });
  return rows.map((r) => {
    const amt    = Number(r.amount ?? 0);
    const isCredit = r.credit_type === "D"; // D = deposit (บวก), W = withdraw (ลบ)
    return {
      id:            r.code,
      label:         KIND_LABEL[r.kind?.toUpperCase() ?? ""] ?? (r.kind || "รายการ"),
      amount:        amt,
      amountRaw:     isCredit ? amt : -amt,
      balanceBefore: Number(r.balance_before ?? 0),
      balanceAfter:  Number(r.balance_after  ?? 0),
      date:          fmt(r.date_create),
      status:        "สำเร็จ",
    };
  });
}

// ─── bonus_spin ─────────────────────────────────────────────────────────────
export async function getSpinHistory(userId: string, limit = 50): Promise<TxRow[]> {
  const mc = Number(userId);
  const rows = await prisma.bonus_spin.findMany({
    where:   { member_code: mc },
    orderBy: { date_create: "desc" },
    take:    limit,
    select:  { code: true, bonus_name: true, amount: true, credit_before: true, credit_after: true, date_create: true },
  });
  return rows.map((r) => ({
    id:            r.code,
    label:         r.bonus_name || "วงล้อมหาสนุก",
    amount:        Number(r.amount ?? 0),
    amountRaw:     Number(r.amount ?? 0),
    balanceBefore: Number(r.credit_before ?? 0),
    balanceAfter:  Number(r.credit_after  ?? 0),
    date:          fmt(r.date_create),
    status:        "สำเร็จ" as const,
  }));
}

// ─── bonus table ────────────────────────────────────────────────────────────
export async function getBonusLog(userId: string, limit = 50): Promise<TxRow[]> {
  const mc = Number(userId);
  const rows = await prisma.bonus.findMany({
    where:   { member_code: mc },
    orderBy: { date_create: "desc" },
    take:    limit,
    select:  { code: true, name: true, value: true, status: true, date_create: true },
  });
  return rows.map((r) => {
    const status: TxRow["status"] = r.status === "Y" ? "สำเร็จ" : "รอดำเนินการ";
    return {
      id:            r.code,
      label:         r.name || "โบนัส",
      amount:        Number(r.value ?? 0),
      amountRaw:     Number(r.value ?? 0),
      balanceBefore: 0,
      balanceAfter:  0,
      date:          fmt(r.date_create),
      status,
    };
  });
}
