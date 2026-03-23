export type BetTypeId = "3top" | "3tod" | "2top" | "2bot" | "run" | "winlay" | "6perm" | "19door" | "winnum";
export type TabId     = "quick" | "classic" | "slip";
export type LeftTab   = "3top" | "2top" | "run";

export interface BillRow {
  id:      string;
  slipNo:  string;
  number:  string;
  betType: BetTypeId;
  top:     number;
  bot:     number;
  note:    string;
  time:    string;
}

export const MAX_DIGITS: Record<BetTypeId, number> = {
  "3top": 3, "3tod": 3, "2top": 2, "2bot": 2, "run": 1, "winlay": 1, "6perm": 3, "19door": 1, "winnum": 2,
};

export const BET_TYPE_BTNS: { id: BetTypeId; label: string; rate: string }[] = [
  { id: "3top",   label: "3 ตัวบน",   rate: "900"  },
  { id: "3tod",   label: "3 ตัวโต๊ด", rate: "150"  },
  { id: "2top",   label: "2 ตัวบน",   rate: "95"   },
  { id: "2bot",   label: "2 ตัวล่าง", rate: "95"   },
  { id: "run",    label: "วิ่งบน",     rate: "3.5"  },
  { id: "winlay", label: "วิ่งล่าง",   rate: "4.5"  },
  { id: "6perm",  label: "6กลับ",      rate: "900"  },
  { id: "19door", label: "19ประตู",    rate: "95"   },
  { id: "winnum", label: "วินเลข",     rate: "95"   },
];

export const TABS: { id: TabId; label: string; disabled?: boolean }[] = [
  { id: "quick",   label: "แทงเร็ว"        },
  { id: "classic", label: "แทงแบบคลาสสิค" },
  { id: "slip",    label: "วางโพย"         },
];

export const LEFT_TABS: { id: LeftTab; label: string }[] = [
  { id: "3top", label: "3 ตัว"   },
  { id: "2top", label: "2 ตัว"   },
  { id: "run",  label: "เลขวิ่ง" },
];

export const PAST_RESULTS = [
  { date: "16-03-2026", top3: "257", bot2: "38" },
  { date: "15-03-2026", top3: "828", bot2: "31" },
  { date: "14-03-2026", top3: "762", bot2: "54" },
  { date: "13-03-2026", top3: "557", bot2: "64" },
  { date: "12-03-2026", top3: "074", bot2: "65" },
];

export const BET_RATE: Record<BetTypeId, number> = {
  "3top": 900, "3tod": 150, "2top": 95, "2bot": 95, "run": 3.5, "winlay": 4.5, "6perm": 900, "19door": 95, "winnum": 95,
};

export const DOUBLED = ["00","11","22","33","44","55","66","77","88","99"];
export const TRIPLED = ["000","111","222","333","444","555","666","777","888","999"];

export function genId()     { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
export function genSlipNo() { return `SLP${Date.now().toString(36).toUpperCase()}`; }

export function permutations(str: string): string[] {
  if (str.length <= 1) return [str];
  const result = new Set<string>();
  for (let i = 0; i < str.length; i++) {
    const rest = str.slice(0, i) + str.slice(i + 1);
    for (const p of permutations(rest)) result.add(str[i] + p);
  }
  return [...result].sort();
}

export function nineteenDoor(num: string): string[] {
  // รับ 1 หลัก: สร้างทุกเลข 2 หลักที่มีตัวเลขนั้นอยู่ในตำแหน่งใดก็ได้
  const d = num.length === 1 ? num[0] : num[0];
  const set = new Set<string>();
  for (let i = 0; i <= 9; i++) { set.add(d + String(i)); set.add(String(i) + d); }
  return [...set].sort();
}

export function addUnique(current: string[], next: string[]): string[] {
  const s = new Set(current);
  return [...current, ...next.filter((n) => !s.has(n))];
}

export function betTypeLabel(id: BetTypeId): string {
  return BET_TYPE_BTNS.find((b) => b.id === id)?.label ?? id;
}
