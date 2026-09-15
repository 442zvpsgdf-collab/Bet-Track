import { BetsHistoryClient } from "@/components/bets/BetsHistoryClient";

export default function BetsHistoryPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Historial de apuestas</h1>
      <BetsHistoryClient />
    </div>
  );
}
