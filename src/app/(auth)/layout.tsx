export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <span className="text-2xl font-semibold tracking-tight">
          Bet<span className="text-primary">Track</span> MX
        </span>
        <p className="text-sm text-muted mt-1">Registra. Analiza. Apuesta con cabeza.</p>
      </div>
      <div className="w-full max-w-sm card">{children}</div>
    </div>
  );
}
