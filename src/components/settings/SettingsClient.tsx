"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";

interface Props {
  user: { name: string; email: string; currency: string; memberSince: string };
}

export function SettingsClient({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const payload: Record<string, string> = { name };
    if (newPassword) {
      payload.newPassword = newPassword;
      payload.currentPassword = currentPassword;
    }

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Error al guardar");
      return;
    }

    setSuccess("Cambios guardados correctamente");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="text-xs text-muted">Email</p>
        <p className="text-sm font-medium mb-1">{user.email}</p>
        <p className="text-xs text-muted">
          Miembro desde {formatDate(user.memberSince)} · Moneda: {user.currency}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="text-sm text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-positive bg-positive/10 border border-positive/20 rounded-xl px-3 py-2">
            {success}
          </div>
        )}

        <div>
          <label className="label">Nombre</label>
          <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium mb-3">Cambiar contraseña</p>
          <div className="space-y-3">
            <div>
              <label className="label">Contraseña actual</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input
                type="password"
                className="input"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Déjalo vacío si no quieres cambiarla"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
