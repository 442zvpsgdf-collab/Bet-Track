export type BetStatus = "PENDING" | "WON" | "LOST" | "VOID";
export type BetType =
  | "MONEYLINE"
  | "SPREAD"
  | "OVER_UNDER"
  | "PARLAY"
  | "PROP"
  | "FUTURES"
  | "OTHER";
export type BankrollTxType = "DEPOSIT" | "WITHDRAWAL" | "BONUS" | "ADJUSTMENT";

export interface BetDTO {
  id: string;
  sportsbookId: string;
  sportsbookName: string;
  sportId: string;
  sportName: string;
  leagueId: string | null;
  leagueName: string | null;
  event: string;
  betType: BetType;
  selection: string;
  odds: number;
  stake: number;
  currency: string;
  status: BetStatus;
  profit: number;
  eventDate: string;
  settledAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SportsbookDTO {
  id: string;
  name: string;
  slug: string;
}

export interface SportDTO {
  id: string;
  name: string;
  slug: string;
}

export interface LeagueDTO {
  id: string;
  name: string;
  sportId: string;
}

export interface DashboardStatsDTO {
  bankroll: number;
  bettingProfit: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalBonuses: number;
  totalProfit: number;
  monthProfit: number;
  roi: number;
  winRate: number;
  betCount: number;
  settledCount: number;
  pendingCount: number;
  averageStake: number;
  bestSport: { name: string; profit: number } | null;
  worstSport: { name: string; profit: number } | null;
  bestSportsbook: { name: string; profit: number } | null;
  worstSportsbook: { name: string; profit: number } | null;
  bankrollHistory: { date: string; bankroll: number }[];
  profitHistory: { date: string; profit: number; cumulativeProfit: number }[];
}

export const BET_TYPE_LABELS: Record<BetType, string> = {
  MONEYLINE: "Moneyline",
  SPREAD: "Spread/Handicap",
  OVER_UNDER: "Over/Under",
  PARLAY: "Parlay/Combinada",
  PROP: "Prop bet",
  FUTURES: "Futuros",
  OTHER: "Otro",
};

export const BET_STATUS_LABELS: Record<BetStatus, string> = {
  PENDING: "Pendiente",
  WON: "Ganada",
  LOST: "Perdida",
  VOID: "Anulada",
};

export const BANKROLL_TX_LABELS: Record<BankrollTxType, string> = {
  DEPOSIT: "Depósito",
  WITHDRAWAL: "Retiro",
  BONUS: "Bono",
  ADJUSTMENT: "Ajuste",
};
