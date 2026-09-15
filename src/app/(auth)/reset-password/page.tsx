"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo restablecer la contraseña");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return <p className="text-sm text-negative">Link inválido. Solicita uno nuevo.</p>;
  }

  if (success) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-positive">Contraseña actualizada. Redirigiendo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold">Nueva contraseña</h1>
      {error && (
        <div className="text-sm text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      <div>
        <label className="label">Nueva contraseña</label>
        <input
          type="password"
          required
          minLength={8}
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Guardando..." : "Restablecer contraseña"}
      </button>
      <Link href="/login" className="text-primary text-sm hover:underline block text-center">
        Volver a iniciar sesión
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Cargando...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
