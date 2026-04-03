import type { BetTypeId } from "@/components/bet/types";

export interface BettingContextItem {
  payout:       number;
  minBet:       number;
  maxBet:       number;
  maxPerNumber: number;
  discountPercent?: number;
}
export type BettingContext = Partial<Record<BetTypeId, BettingContextItem>>;

export interface BetRateRow {
  id: BetTypeId;
  label: string;
  rate: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface NumberLimitRow {
  number: string;
  betType: string | null;
  maxAmount: number | null;
  isClosed: boolean;
  note: string | null;
}

export interface PastResultRow {
  date: string;
  top3: string;
  bot2: string;
}

export interface BetSlipSummary {
  id: string;
  slipNo: string;
  lotteryName: string;
  totalAmount: number;
  totalPayout: number;
  status: string;
  itemCount: number;
  createdAt: Date;
}

export interface BetItemDetail {
  id: number;
  number: string;
  betType: string;
  betTypeLabel: string;
  amount: number;
  payRate: number;
  payout: number;
  isWin: boolean | null;
  actualPayout: number | null;
}

export interface BetSlipDetail extends BetSlipSummary {
  note: string | null;
  confirmedAt: Date | null;
  items: BetItemDetail[];
}
