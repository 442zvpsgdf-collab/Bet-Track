import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { createBetSchema } from "@/lib/validations";
import { calculateBetProfit } from "@/lib/calculations";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sportId = searchParams.get("sportId");
  const leagueId = searchParams.get("leagueId");
  const sportsbookId = searchParams.get("sportsbookId");
  const status = searchParams.get("status");
  const betType = searchParams.get("betType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Prisma.BetWhereInput = { userId };
  if (sportId) where.sportId = sportId;
  if (leagueId) where.leagueId = leagueId;
  if (sportsbookId) where.sportsbookId = sportsbookId;
  if (status) where.status = status as never;
  if (betType) where.betType = betType as never;
  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) (where.eventDate as Prisma.DateTimeFilter).gte = new Date(dateFrom);
    if (dateTo) (where.eventDate as Prisma.DateTimeFilter).lte = new Date(dateTo);
  }

  const bets = await prisma.bet.findMany({
    where,
    include: { sportsbook: true, sport: true, league: true },
    orderBy: { eventDate: "desc" },
  });

  const dto = bets.map((b) => ({
    id: b.id,
    sportsbookId: b.sportsbookId,
    sportsbookName: b.sportsbook.name,
    sportId: b.sportId,
    sportName: b.sport.name,
    leagueId: b.leagueId,
    leagueName: b.league?.name ?? null,
    event: b.event,
    betType: b.betType,
    selection: b.selection,
    odds: Number(b.odds),
    stake: Number(b.stake),
    currency: b.currency,
    status: b.status,
    profit: Number(b.profit),
    eventDate: b.eventDate.toISOString(),
    settledAt: b.settledAt?.toISOString() ?? null,
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
  }));

  return NextResponse.json({ bets: dto });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createBetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verifica que sportsbook/sport/league existan (evita FK inválidas silenciosas)
    const [sportsbook, sport] = await Promise.all([
      prisma.sportsbook.findUnique({ where: { id: data.sportsbookId } }),
      prisma.sport.findUnique({ where: { id: data.sportId } }),
    ]);
    if (!sportsbook) return NextResponse.json({ error: "Casa de apuestas inválida" }, { status: 400 });
    if (!sport) return NextResponse.json({ error: "Deporte inválido" }, { status: 400 });

    const status = data.status ?? "PENDING";
    const profit = calculateBetProfit({ status, stake: data.stake, odds: data.odds });

    const bet = await prisma.bet.create({
      data: {
        userId,
        sportsbookId: data.sportsbookId,
        sportId: data.sportId,
        leagueId: data.leagueId || null,
        event: data.event,
        betType: data.betType,
        selection: data.selection,
        odds: data.odds,
        stake: data.stake,
        status,
        profit,
        eventDate: data.eventDate,
        settledAt: status !== "PENDING" ? new Date() : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ bet }, { status: 201 });
  } catch (error) {
    console.error("Error creando apuesta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
