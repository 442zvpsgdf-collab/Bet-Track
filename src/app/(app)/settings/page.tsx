import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, currency: true, createdAt: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-6">Ajustes</h1>
      <SettingsClient
        user={{
          name: user.name ?? "",
          email: user.email,
          currency: user.currency,
          memberSince: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
