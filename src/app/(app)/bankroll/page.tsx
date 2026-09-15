import { BankrollClient } from "@/components/bankroll/BankrollClient";

export default function BankrollPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Bankroll</h1>
      <BankrollClient />
    </div>
  );
}
