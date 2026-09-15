import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [sportsbooks, sports, leagues] = await Promise.all([
    prisma.sportsbook.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.sport.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.league.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ sportsbooks, sports, leagues });
}
