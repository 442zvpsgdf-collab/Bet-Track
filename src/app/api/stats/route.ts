import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import {
  calculateBankroll,
  calculateStats,
  groupStatsBy,
  findBestWorst,
} from "@/lib/calculations";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [bets, transactions] = await Promise.all([
    prisma.bet.findMany({
      where: { userId },
      include: { sport: true, sportsbook: true },
      orderBy: { eventDate: "asc" },
    }),
    prisma.bankrollTransaction.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    }),
  ]);

  const betsForCalc = bets.map((b) => ({
    status: b.status,
    stake: Number(b.stake),
    odds: Number(b.odds),
  }));

  const settledBets = betsForCalc.filter((b) => b.status === "WON" || b.status === "LOST");

  const overallStats = calculateStats(betsForCalc);
  const bankrollInfo = calculateBankroll(
    transactions.map((t) => ({ type: t.type, amount: Number(t.amount) })),
    settledBets
  );

  // Ganancia del mes actual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthBets = bets
    .filter((b) => b.eventDate >= startOfMonth && (b.status === "WON" || b.status === "LOST"))
    .map((b) => ({ status: b.status, stake: Number(b.stake), odds: Number(b.odds) }));
  const monthStats = calculateStats(monthBets);

  // Mejor/peor deporte y casa
  const bySport = groupStatsBy(
    bets.map((b) => ({ status: b.status, stake: Number(b.stake), odds: Number(b.odds), _key: b.sport.name })),
    (b) => b._key
  );
  const bySportsbook = groupStatsBy(
    bets.map((b) => ({ status: b.status, stake: Number(b.stake), odds: Number(b.odds), _key: b.sportsbook.name })),
    (b) => b._key
  );
  const sportBestWorst = findBestWorst(bySport);
  const sportsbookBestWorst = findBestWorst(bySportsbook);

  // Historial de bankroll y profit acumulado a lo largo del tiempo
  // Combina eventos de bankroll (tx) y apuestas resueltas, ordenados cronológicamente.
  type TimelineEvent = { date: Date; deltaCents: number };
  const events: TimelineEvent[] = [];

  for (const t of transactions) {
    const amountCents = Math.round(Number(t.amount) * 100);
    const delta =
      t.type === "WITHDRAWAL" ? -amountCents : t.type === "ADJUSTMENT" ? amountCents : amountCents;
    events.push({ date: t.date, deltaCents: delta });
  }

  const profitHistory: { date: string; profit: number; cumulativeProfit: number }[] = [];
  let cumulativeProfitCents = 0;
  for (const b of bets) {
    if (b.status !== "WON" && b.status !== "LOST") continue;
    const stake = Number(b.stake);
    const odds = Number(b.odds);
    const profit = b.status === "WON" ? stake * (odds - 1) : -stake;
    const profitCents = Math.round(profit * 100);
    cumulativeProfitCents += profitCents;
    events.push({ date: b.settledAt ?? b.eventDate, deltaCents: profitCents });
    profitHistory.push({
      date: (b.settledAt ?? b.eventDate).toISOString().slice(0, 10),
      profit: profit,
      cumulativeProfit: cumulativeProfitCents / 100,
    });
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  let runningBankrollCents = 0;
  const bankrollHistory: { date: string; bankroll: number }[] = [];
  for (const e of events) {
    runningBankrollCents += e.deltaCents;
    bankrollHistory.push({
      date: e.date.toISOString().slice(0, 10),
      bankroll: runningBankrollCents / 100,
    });
  }

  return NextResponse.json({
    bankroll: bankrollInfo.bankroll,
    bettingProfit: bankrollInfo.bettingProfit,
    totalDeposited: bankrollInfo.totalDeposited,
    totalWithdrawn: bankrollInfo.totalWithdrawn,
    totalBonuses: bankrollInfo.totalBonuses,
    totalProfit: overallStats.totalProfit,
    monthProfit: monthStats.totalProfit,
    roi: overallStats.roi,
    winRate: overallStats.winRate,
    betCount: overallStats.betCount,
    settledCount: overallStats.settledCount,
    pendingCount: overallStats.pendingCount,
    averageStake: overallStats.averageStake,
    bestSport: sportBestWorst.best
      ? { name: sportBestWorst.best, profit: bySport[sportBestWorst.best].totalProfit }
      : null,
    worstSport: sportBestWorst.worst
      ? { name: sportBestWorst.worst, profit: bySport[sportBestWorst.worst].totalProfit }
      : null,
    bestSportsbook: sportsbookBestWorst.best
      ? { name: sportsbookBestWorst.best, profit: bySportsbook[sportsbookBestWorst.best].totalProfit }
      : null,
    worstSportsbook: sportsbookBestWorst.worst
      ? { name: sportsbookBestWorst.worst, profit: bySportsbook[sportsbookBestWorst.worst].totalProfit }
      : null,
    bankrollHistory,
    profitHistory,
  });
}
