import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Devuelve el id del usuario autenticado o null.
 * Usar en API routes y Server Components para verificar autenticación/autorización.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}
