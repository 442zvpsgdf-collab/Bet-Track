import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tx = await prisma.bankrollTransaction.findUnique({ where: { id: params.id } });
  if (!tx || tx.userId !== userId) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  await prisma.bankrollTransaction.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Transacción eliminada" });
}
