"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BetDTO,
  BetStatus,
  BET_STATUS_LABELS,
  BET_TYPE_LABELS,
  SportDTO,
  SportsbookDTO,
} from "@/types";
import { formatMXN, formatDate } from "@/lib/format";

const STATUS_COLORS: Record<BetStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  WON: "bg-positive/10 text-positive",
  LOST: "bg-negative/10 text-negative",
  VOID: "bg-muted/10 text-muted",
};

export function BetsHistoryClient() {
  const [bets, setBets] = useState<BetDTO[]>([]);
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [sportsbooks, setSportsbooks] = useState<SportsbookDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sportId: "", sportsbookId: "", status: "", betType: "" });
  const [sortDesc, setSortDesc] = useState(true);

  const loadBets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.sportId) params.set("sportId", filters.sportId);
    if (filters.sportsbookId) params.set("sportsbookId", filters.sportsbookId);
    if (filters.status) params.set("status", filters.status);
    if (filters.betType) params.set("betType", filters.betType);

    const res = await fetch(`/api/bets?${params.toString()}`);
    const data = await res.json();
    setBets(data.bets ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        setSports(data.sports);
        setSportsbooks(data.sportsbooks);
      });
  }, []);

  useEffect(() => {
    loadBets();
  }, [loadBets]);

  async function handleStatusChange(id: string, status: BetStatus) {
    setBets((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    await fetch(`/api/bets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadBets();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta apuesta? Esta acción no se puede deshacer.")) return;
    await fetch(`/api/bets/${id}`, { method: "DELETE" });
    setBets((prev) => prev.filter((b) => b.id !== id));
  }

  const sortedBets = [...bets].sort((a, b) => {
    const diff = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    return sortDesc ? -diff : diff;
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card flex flex-wrap gap-3">
        <select
          className="input w-auto flex-1 min-w-[140px]"
          value={filters.sportId}
          onChange={(e) => setFilters((f) => ({ ...f, sportId: e.target.value }))}
        >
          <option value="">Todos los deportes</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="input w-auto flex-1 min-w-[140px]"
          value={filters.sportsbookId}
          onChange={(e) => setFilters((f) => ({ ...f, sportsbookId: e.target.value }))}
        >
          <option value="">Todas las casas</option>
          {sportsbooks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="input w-auto flex-1 min-w-[140px]"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Todos los resultados</option>
          {Object.entries(BET_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="input w-auto flex-1 min-w-[140px]"
          value={filters.betType}
          onChange={(e) => setFilters((f) => ({ ...f, betType: e.target.value }))}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(BET_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortDesc((s) => !s)}
          className="btn-secondary text-xs whitespace-nowrap"
        >
          Fecha {sortDesc ? "↓" : "↑"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sortedBets.length === 0 ? (
        <div className="card text-center py-12 text-muted">
          No hay apuestas con estos filtros.{" "}
          <Link href="/bets/new" className="text-primary hover:underline">
            Registra una nueva
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-2">
          {sortedBets.map((bet) => (
            <div key={bet.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{bet.event}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[bet.status]}`}>
                      {BET_STATUS_LABELS[bet.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {bet.sportsbookName} · {bet.sportName}
                    {bet.leagueName ? ` · ${bet.leagueName}` : ""} · {bet.selection} @ {bet.odds}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{formatDate(bet.eventDate)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatMXN(bet.stake)}</p>
                  {bet.status !== "PENDING" && (
                    <p
                      className={`text-xs font-medium ${
                        bet.profit > 0 ? "text-positive" : bet.profit < 0 ? "text-negative" : "text-muted"
                      }`}
                    >
                      {bet.profit >= 0 ? "+" : ""}
                      {formatMXN(bet.profit)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                {bet.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(bet.id, "WON")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-positive/10 text-positive hover:bg-positive/20 transition"
                    >
                      Marcar ganada
                    </button>
                    <button
                      onClick={() => handleStatusChange(bet.id, "LOST")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-negative/10 text-negative hover:bg-negative/20 transition"
                    >
                      Marcar perdida
                    </button>
                    <button
                      onClick={() => handleStatusChange(bet.id, "VOID")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition"
                    >
                      Anular
                    </button>
                  </>
                )}
                <div className="flex-1" />
                <Link href={`/bets/${bet.id}/edit`} className="text-xs text-primary hover:underline">
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(bet.id)}
                  className="text-xs text-negative hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
