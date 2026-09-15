/**
 * Módulo de cálculos financieros de BetTrack MX.
 *
 * Reglas:
 * - Todo el dinero se maneja en centavos (enteros) internamente para evitar
 *   errores de redondeo de punto flotante, y se convierte a pesos solo para mostrar.
 * - Las apuestas PENDING no cuentan para profit/ROI/winrate.
 * - Las apuestas VOID no cuentan para profit/ROI/winrate (se consideran "no jugadas"),
 *   pero sí devuelven el stake al bankroll (profit = 0, no pérdida).
 */

export type BetStatus = "PENDING" | "WON" | "LOST" | "VOID";

export interface BetForCalc {
  status: BetStatus;
  stake: number; // en pesos (unidad decimal), ej 500.00
  odds: number; // cuota decimal, ej 1.90
}

const toCents = (n: number) => Math.round(n * 100);
const toPesos = (cents: number) => cents / 100;

/**
 * Calcula la ganancia/pérdida de UNA apuesta ya resuelta.
 * - WON:  profit = stake * (odds - 1)
 * - LOST: profit = -stake
 * - VOID: profit = 0 (stake se devuelve, no cuenta como ganancia ni pérdida)
 * - PENDING: profit = 0 (aún no se sabe)
 */
export function calculateBetProfit(bet: BetForCalc): number {
  const stakeCents = toCents(bet.stake);

  switch (bet.status) {
    case "WON": {
      // profit = stake * (odds - 1), calculado en centavos para precisión
      const profitCents = Math.round(stakeCents * (bet.odds - 1));
      return toPesos(profitCents);
    }
    case "LOST":
      return toPesos(-stakeCents);
    case "VOID":
    case "PENDING":
    default:
      return 0;
  }
}

export interface StatsInput {
  bets: BetForCalc[];
}

export interface StatsResult {
  totalProfit: number;
  totalStaked: number; // solo apuestas resueltas (WON/LOST), VOID no cuenta como "arriesgado" realmente jugado
  totalStakedAll: number; // incluye pendientes, útil para exposición actual
  roi: number; // porcentaje
  winRate: number; // porcentaje, sobre apuestas resueltas (WON/LOST), excluye VOID/PENDING
  betCount: number;
  settledCount: number;
  pendingCount: number;
  voidCount: number;
  wonCount: number;
  lostCount: number;
  averageStake: number;
}

/**
 * Calcula estadísticas agregadas sobre un conjunto de apuestas.
 * Todas las apuestas deben venir con su 'profit' ya calculado (via calculateBetProfit)
 * o se recalcula aquí si no viene incluido.
 */
export function calculateStats(bets: BetForCalc[]): StatsResult {
  let totalProfitCents = 0;
  let totalStakedCents = 0; // solo WON+LOST
  let totalStakedAllCents = 0;
  let wonCount = 0;
  let lostCount = 0;
  let voidCount = 0;
  let pendingCount = 0;

  for (const bet of bets) {
    const stakeCents = toCents(bet.stake);
    totalStakedAllCents += stakeCents;

    if (bet.status === "WON" || bet.status === "LOST") {
      totalStakedCents += stakeCents;
    }

    const profit = calculateBetProfit(bet);
    totalProfitCents += toCents(profit);

    if (bet.status === "WON") wonCount++;
    else if (bet.status === "LOST") lostCount++;
    else if (bet.status === "VOID") voidCount++;
    else pendingCount++;
  }

  const settledCount = wonCount + lostCount;
  const roi = totalStakedCents > 0 ? (totalProfitCents / totalStakedCents) * 100 : 0;
  const winRate = settledCount > 0 ? (wonCount / settledCount) * 100 : 0;
  const averageStakeCents = bets.length > 0 ? totalStakedAllCents / bets.length : 0;

  return {
    totalProfit: toPesos(totalProfitCents),
    totalStaked: toPesos(totalStakedCents),
    totalStakedAll: toPesos(totalStakedAllCents),
    roi: Math.round(roi * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    betCount: bets.length,
    settledCount,
    pendingCount,
    voidCount,
    wonCount,
    lostCount,
    averageStake: Math.round(toPesos(averageStakeCents) * 100) / 100,
  };
}

/**
 * Calcula el bankroll actual = suma de transacciones de bankroll (depósitos +,
 * retiros -, bonos +, ajustes +/-) + profit acumulado de apuestas resueltas.
 *
 * Esta es la ÚNICA fuente de verdad del bankroll — nunca se guarda como
 * campo mutable en la base de datos para evitar inconsistencias.
 */
export interface BankrollTxForCalc {
  type: "DEPOSIT" | "WITHDRAWAL" | "BONUS" | "ADJUSTMENT";
  amount: number; // siempre positivo, el signo lo da 'type'. ADJUSTMENT puede ser negativo.
}

export function calculateBankroll(
  transactions: BankrollTxForCalc[],
  settledBets: BetForCalc[]
): { bankroll: number; totalDeposited: number; totalWithdrawn: number; totalBonuses: number; bettingProfit: number } {
  let bankrollCents = 0;
  let depositedCents = 0;
  let withdrawnCents = 0;
  let bonusesCents = 0;

  for (const tx of transactions) {
    const amountCents = toCents(tx.amount);
    switch (tx.type) {
      case "DEPOSIT":
        bankrollCents += amountCents;
        depositedCents += amountCents;
        break;
      case "WITHDRAWAL":
        bankrollCents -= amountCents;
        withdrawnCents += amountCents;
        break;
      case "BONUS":
        bankrollCents += amountCents;
        bonusesCents += amountCents;
        break;
      case "ADJUSTMENT":
        // El ajuste puede ser negativo (amount ya trae el signo en este caso)
        bankrollCents += amountCents;
        break;
    }
  }

  const bettingProfitCents = settledBets.reduce(
    (acc, bet) => acc + toCents(calculateBetProfit(bet)),
    0
  );

  bankrollCents += bettingProfitCents;

  return {
    bankroll: toPesos(bankrollCents),
    totalDeposited: toPesos(depositedCents),
    totalWithdrawn: toPesos(withdrawnCents),
    totalBonuses: toPesos(bonusesCents),
    bettingProfit: toPesos(bettingProfitCents),
  };
}

/** Agrupa apuestas por una clave (deporte, casa, etc.) y calcula stats por grupo. */
export function groupStatsBy<T extends BetForCalc>(
  bets: T[],
  keyFn: (bet: T) => string
): Record<string, StatsResult> {
  const groups: Record<string, T[]> = {};
  for (const bet of bets) {
    const key = keyFn(bet);
    if (!groups[key]) groups[key] = [];
    groups[key].push(bet);
  }
  const result: Record<string, StatsResult> = {};
  for (const key of Object.keys(groups)) {
    result[key] = calculateStats(groups[key]);
  }
  return result;
}

/** Encuentra el mejor y peor grupo (por profit total) de un conjunto de stats agrupadas. */
export function findBestWorst(
  grouped: Record<string, StatsResult>
): { best: string | null; worst: string | null } {
  const entries = Object.entries(grouped).filter(([, s]) => s.settledCount > 0);
  if (entries.length === 0) return { best: null, worst: null };

  let best = entries[0];
  let worst = entries[0];
  for (const entry of entries) {
    if (entry[1].totalProfit > best[1].totalProfit) best = entry;
    if (entry[1].totalProfit < worst[1].totalProfit) worst = entry;
  }
  return { best: best[0], worst: worst[0] };
}
