import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta genérica siempre, exista o no el usuario, para no filtrar
    // qué emails están registrados.
    const genericResponse = NextResponse.json({
      message: "Si el email existe, se enviaron instrucciones de recuperación.",
    });

    if (!user) return genericResponse;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    // NOTA: no hay servicio de email configurado en este MVP.
    // En producción, aquí se enviaría un correo con el link:
    //   `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    // Por ahora, en desarrollo, lo devolvemos en la respuesta para poder probar el flujo.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Link de recuperación para ${email}: /reset-password?token=${token}`);
      return NextResponse.json({
        message: "Si el email existe, se enviaron instrucciones de recuperación.",
        devToken: token,
      });
    }

    return genericResponse;
  } catch (error) {
    console.error("Error en password-reset/request:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
