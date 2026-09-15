import { BetForm } from "@/components/bets/BetForm";

export default function NewBetPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-6">Nueva apuesta</h1>
      <BetForm mode="create" />
    </div>
  );
}
