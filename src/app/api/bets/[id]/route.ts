import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { updateBetSchema } from "@/lib/validations";
import { calculateBetProfit } from "@/lib/calculations";

async function getOwnedBet(id: string, userId: string) {
  const bet = await prisma.bet.findUnique({ where: { id } });
  if (!bet || bet.userId !== userId) return null;
  return bet;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const bet = await getOwnedBet(params.id, userId);
  if (!bet) return NextResponse.json({ error: "Apuesta no encontrada" }, { status: 404 });

  return NextResponse.json({ bet });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await getOwnedBet(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Apuesta no encontrada" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = updateBetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const nextStatus = data.status ?? existing.status;
    const nextStake = data.stake ?? Number(existing.stake);
    const nextOdds = data.odds ?? Number(existing.odds);
    const profit = calculateBetProfit({ status: nextStatus, stake: nextStake, odds: nextOdds });

    const statusChangedToSettled =
      data.status && data.status !== existing.status && data.status !== "PENDING";

    const bet = await prisma.bet.update({
      where: { id: params.id },
      data: {
        ...(data.sportsbookId && { sportsbookId: data.sportsbookId }),
        ...(data.sportId && { sportId: data.sportId }),
        ...(data.leagueId !== undefined && { leagueId: data.leagueId || null }),
        ...(data.event && { event: data.event }),
        ...(data.betType && { betType: data.betType }),
        ...(data.selection && { selection: data.selection }),
        ...(data.odds !== undefined && { odds: data.odds }),
        ...(data.stake !== undefined && { stake: data.stake }),
        ...(data.eventDate && { eventDate: data.eventDate }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        status: nextStatus,
        profit,
        ...(statusChangedToSettled && { settledAt: new Date() }),
        ...(data.status === "PENDING" && { settledAt: null }),
      },
    });

    return NextResponse.json({ bet });
  } catch (error) {
    console.error("Error actualizando apuesta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await getOwnedBet(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Apuesta no encontrada" }, { status: 404 });

  await prisma.bet.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Apuesta eliminada" });
}
