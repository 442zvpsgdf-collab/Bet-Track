import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { userLimitsSchema } from "@/lib/validations";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const limits = await prisma.userLimits.findUnique({ where: { userId } });

  // Calcula el estado actual del usuario respecto a sus límites (si los tiene)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dayBets, weekBets, monthBets] = await Promise.all([
    prisma.bet.findMany({ where: { userId, eventDate: { gte: startOfDay } } }),
    prisma.bet.findMany({ where: { userId, eventDate: { gte: startOfWeek } } }),
    prisma.bet.findMany({ where: { userId, eventDate: { gte: startOfMonth } } }),
  ]);

  const sumStake = (bets: { stake: unknown }[]) =>
    bets.reduce((acc, b) => acc + Number(b.stake), 0);

  const monthLosses = monthBets
    .filter((b) => b.status === "LOST")
    .reduce((acc, b) => acc + Number(b.stake), 0);

  return NextResponse.json({
    limits,
    usage: {
      dailyStaked: sumStake(dayBets),
      weeklyStaked: sumStake(weekBets),
      monthlyStaked: sumStake(monthBets),
      betsToday: dayBets.length,
      monthlyLosses: monthLosses,
    },
  });
}

export async function PUT(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = userLimitsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const limits = await prisma.userLimits.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return NextResponse.json({ limits });
  } catch (error) {
    console.error("Error actualizando límites:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
