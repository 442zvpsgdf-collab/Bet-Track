import { ResponsibleGamblingClient } from "@/components/responsible/ResponsibleGamblingClient";

export default function ResponsibleGamblingPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Juego responsable</h1>
      <p className="text-sm text-muted mb-6 max-w-lg">
        Estas herramientas te ayudan a entender tu comportamiento de apuesta y mantenerte dentro
        de tus propios límites. BetTrack MX no te anima a apostar más.
      </p>
      <ResponsibleGamblingClient />
    </div>
  );
}
