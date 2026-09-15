"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BetDTO,
  BetType,
  BetStatus,
  BET_TYPE_LABELS,
  BET_STATUS_LABELS,
  SportsbookDTO,
  SportDTO,
  LeagueDTO,
} from "@/types";
import { formatDateTimeInput } from "@/lib/format";

interface BetFormProps {
  mode: "create" | "edit";
  bet?: BetDTO;
}

export function BetForm({ mode, bet }: BetFormProps) {
  const router = useRouter();
  const [sportsbooks, setSportsbooks] = useState<SportsbookDTO[]>([]);
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [leagues, setLeagues] = useState<LeagueDTO[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    sportsbookId: bet?.sportsbookId ?? "",
    sportId: bet?.sportId ?? "",
    leagueId: bet?.leagueId ?? "",
    event: bet?.event ?? "",
    betType: (bet?.betType ?? "MONEYLINE") as BetType,
    selection: bet?.selection ?? "",
    odds: bet?.odds?.toString() ?? "",
    stake: bet?.stake?.toString() ?? "",
    eventDate: bet ? formatDateTimeInput(new Date(bet.eventDate)) : formatDateTimeInput(),
    status: (bet?.status ?? "PENDING") as BetStatus,
    notes: bet?.notes ?? "",
  });

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        setSportsbooks(data.sportsbooks);
        setSports(data.sports);
        setLeagues(data.leagues);
      })
      .finally(() => setLoadingCatalog(false));
  }, []);

  const filteredLeagues = leagues.filter((l) => l.sportId === form.sportId);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.sportsbookId || !form.sportId || !form.event || !form.selection || !form.odds || !form.stake) {
      setError("Completa todos los campos requeridos");
      return;
    }

    setSubmitting(true);

    const payload = {
      sportsbookId: form.sportsbookId,
      sportId: form.sportId,
      leagueId: form.leagueId || null,
      event: form.event,
      betType: form.betType,
      selection: form.selection,
      odds: Number(form.odds),
      stake: Number(form.stake),
      eventDate: new Date(form.eventDate).toISOString(),
      status: form.status,
      notes: form.notes || null,
    };

    const url = mode === "create" ? "/api/bets" : `/api/bets/${bet!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar la apuesta");
      return;
    }

    router.push("/bets");
    router.refresh();
  }

  if (loadingCatalog) {
    return <div className="h-96 bg-surface rounded-2xl animate-pulse" />;
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <div className="text-sm text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Casa de apuestas *</label>
          <select
            className="input"
            value={form.sportsbookId}
            onChange={(e) => update("sportsbookId", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {sportsbooks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Deporte *</label>
          <select
            className="input"
            value={form.sportId}
            onChange={(e) => {
              update("sportId", e.target.value);
              update("leagueId", "");
            }}
          >
            <option value="">Selecciona...</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Liga (opcional)</label>
        <select
          className="input"
          value={form.leagueId}
          onChange={(e) => update("leagueId", e.target.value)}
          disabled={!form.sportId}
        >
          <option value="">Sin liga específica</option>
          {filteredLeagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Evento/partido *</label>
        <input
          type="text"
          className="input"
          placeholder="Ej. Broncos vs Chiefs"
          value={form.event}
          onChange={(e) => update("event", e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo de apuesta</label>
          <select
            className="input"
            value={form.betType}
            onChange={(e) => update("betType", e.target.value as BetType)}
          >
            {Object.entries(BET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Selección *</label>
          <input
            type="text"
            className="input"
            placeholder="Ej. Broncos +3.5"
            value={form.selection}
            onChange={(e) => update("selection", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cuota *</label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            className="input"
            placeholder="1.90"
            value={form.odds}
            onChange={(e) => update("odds", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Monto (MXN) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="input"
            placeholder="500"
            value={form.stake}
            onChange={(e) => update("stake", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha y hora</label>
          <input
            type="datetime-local"
            className="input"
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Resultado</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => update("status", e.target.value as BetStatus)}
          >
            {Object.entries(BET_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Notas (opcional)</label>
        <textarea
          className="input"
          rows={2}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Guardando..." : mode === "create" ? "Guardar apuesta" : "Actualizar apuesta"}
      </button>
    </form>
  );
}
