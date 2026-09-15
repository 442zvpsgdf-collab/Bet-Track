"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    setSent(true);
    if (data.devToken) {
      setDevLink(`/reset-password?token=${data.devToken}`);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-lg font-semibold">Revisa tu email</h1>
        <p className="text-sm text-muted">
          Si el email existe en nuestro sistema, enviamos instrucciones para recuperar tu
          contraseña.
        </p>
        {devLink && (
          <div className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-xl px-3 py-2 text-left">
            Modo desarrollo (no hay servicio de email configurado):{" "}
            <Link href={devLink} className="underline">
              Abrir link de recuperación
            </Link>
          </div>
        )}
        <Link href="/login" className="text-primary text-sm hover:underline block">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold">Recupera tu contraseña</h1>
      <p className="text-sm text-muted">
        Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
      </p>
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Enviando..." : "Enviar instrucciones"}
      </button>
      <Link href="/login" className="text-primary text-sm hover:underline block text-center">
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
