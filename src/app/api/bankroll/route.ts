import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { createBankrollTxSchema } from "@/lib/validations";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const transactions = await prisma.bankrollTransaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createBankrollTxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Para ADJUSTMENT permitimos monto negativo (correcciones); para el resto,
    // el monto siempre debe ser positivo, el signo lo determina el 'type'.
    if (data.type !== "ADJUSTMENT" && data.amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const transaction = await prisma.bankrollTransaction.create({
      data: {
        userId,
        type: data.type,
        amount: data.amount,
        note: data.note || null,
        date: data.date ?? new Date(),
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creando transacción de bankroll:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
