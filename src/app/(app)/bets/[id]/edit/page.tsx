import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { BetForm } from "@/components/bets/BetForm";
import { BetDTO } from "@/types";

export default async function EditBetPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const bet = await prisma.bet.findUnique({
    where: { id: params.id },
    include: { sportsbook: true, sport: true, league: true },
  });

  if (!bet || bet.userId !== userId) notFound();

  const dto: BetDTO = {
    id: bet.id,
    sportsbookId: bet.sportsbookId,
    sportsbookName: bet.sportsbook.name,
    sportId: bet.sportId,
    sportName: bet.sport.name,
    leagueId: bet.leagueId,
    leagueName: bet.league?.name ?? null,
    event: bet.event,
    betType: bet.betType,
    selection: bet.selection,
    odds: Number(bet.odds),
    stake: Number(bet.stake),
    currency: bet.currency,
    status: bet.status,
    profit: Number(bet.profit),
    eventDate: bet.eventDate.toISOString(),
    settledAt: bet.settledAt?.toISOString() ?? null,
    notes: bet.notes,
    createdAt: bet.createdAt.toISOString(),
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-6">Editar apuesta</h1>
      <BetForm mode="edit" bet={dto} />
    </div>
  );
}
