export type LoginMethod = "phone" | "social";
export type LoginStep = "input" | "otp" | "success";

export interface LoginState {
  error?: string;
  success?: boolean;
  phone?: string;
}

export interface OtpState {
  error?: string;
  success?: boolean;
}

export interface RegisterState {
  error?: string;
  fieldErrors?: {
    phone?: string;
    password?: string;
    confirmPassword?: string;
  };
  success?: boolean;
  phone?: string;
}

// ─── Betting types ────────────────────────────────────────────────────────────
export type BetType = "3top" | "3tod" | "2top" | "2bot" | "run_top" | "run_bot";
export type LotteryId = "thai_gov" | "hanoi" | "laos" | "malay" | "sg";

export interface BetItem {
  id: string;
  number: string;
  type: BetType;
  amount: number;
  payout: number; // rate per 1 baht
}

export interface LotteryInfo {
  id: LotteryId;
  name: string;
  flag: string;
  closeTime: string;
  countdown: string;
  isOpen: boolean;
  lastResult?: { top3?: string; bot2?: string };
}

export interface PlaceBetState {
  error?: string;
  success?: boolean;
  slipId?: string;
  totalAmount?: number;
}

export interface SessionInfo {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}
