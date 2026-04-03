// ─── Sub-category item ─────────────────────────────────────────────────────────
export interface SubItem {
  id: string;
  name: string;
  flag: string;
  logo?: string;
  sub: string;
  isOpen: boolean;
  closeAt?: string;     // ISO 8601 string — ใช้แทน countdown string
  countdown?: string;   // fallback สำหรับ hardcode data
  result?: { top3: string; bot2: string };
  drawStatus?: "resulted" | "open" | "closed" | "pending";
  drawDate?: string;
  drawId?: number;
  barClass: string;
  href: string;
}

// ─── Main category ─────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  code?: string;
  groupId?: number;
  groupLogo?: string;
  label: string;
  emoji: string;
  gradient: string; // Tailwind bg-gradient-to-br classes
  badge: string;
  items: SubItem[];
  description?: string;
}
