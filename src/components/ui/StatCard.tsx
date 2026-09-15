interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "neutral" | "positive" | "negative";
}

export function StatCard({ label, value, sublabel, tone = "neutral" }: StatCardProps) {
  const toneClass =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-white";

  return (
    <div className="card">
      <p className="text-xs text-muted font-medium mb-1.5">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
      {sublabel && <p className="text-xs text-muted mt-1">{sublabel}</p>}
    </div>
  );
}
