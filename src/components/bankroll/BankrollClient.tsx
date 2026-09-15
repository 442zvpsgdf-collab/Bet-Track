"use client";

import { useEffect, useState, useCallback } from "react";
import { BankrollTxType, BANKROLL_TX_LABELS, DashboardStatsDTO } from "@/types";
import { formatMXN, formatDate } from "@/lib/format";

interface BankrollTx {
  id: string;
  type: BankrollTxType;
  amount: number;
  note: string | null;
  date: string;
}

const TYPE_COLORS: Record<BankrollTxType, string> = {
  DEPOSIT: "text-positive",
  WITHDRAWAL: "text-negative",
  BONUS: "text-primary",
  ADJUSTMENT: "text-warning",
};

export function BankrollClient() {
  const [transactions, setTransactions] = useState<BankrollTx[]>([]);
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "DEPOSIT" as BankrollTxType,
    amount: "",
    note: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [txRes, statsRes] = await Promise.all([fetch("/api/bankroll"), fetch("/api/stats")]);
    const txData = await txRes.json();
    const statsData = await statsRes.json();
    setTransactions(txData.transactions ?? []);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = Number(form.amount);
    if (!amountNum || (form.type !== "ADJUSTMENT" && amountNum <= 0)) {
      setError("Ingresa un monto válido");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/bankroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        amount: amountNum,
        note: form.note || null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al registrar la transacción");
      return;
    }

    setForm({ type: "DEPOSIT", amount: "", note: "" });
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta transacción?")) return;
    await fetch(`/api/bankroll/${id}`, { method: "DELETE" });
    loadData();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-xs text-muted mb-1">Bankroll disponible</p>
          <p className="text-xl font-semibold">{stats ? formatMXN(stats.bankroll) : "—"}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted mb-1">Ganancia por apuestas</p>
          <p className={`text-xl font-semibold ${stats && stats.bettingProfit >= 0 ? "text-positive" : "text-negative"}`}>
            {stats ? formatMXN(stats.bettingProfit) : "—"}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-muted mb-1">Total depositado</p>
          <p className="text-xl font-semibold">{stats ? formatMXN(stats.totalDeposited) : "—"}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted mb-1">Total retirado</p>
          <p className="text-xl font-semibold">{stats ? formatMXN(stats.totalWithdrawn) : "—"}</p>
        </div>
      </div>
      <p className="text-xs text-muted -mt-2">
        &quot;Ganancia por apuestas&quot; es el resultado neto de tus apuestas resueltas.
        &quot;Bankroll disponible&quot; es el dinero real: depósitos + bonos − retiros ± ajustes + esa ganancia.
      </p>

      <div className="flex justify-end">
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm">
          {showForm ? "Cancelar" : "+ Registrar movimiento"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          {error && (
            <div className="text-sm text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BankrollTxType }))}
              >
                {Object.entries(BANKROLL_TX_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                Monto (MXN) {form.type === "ADJUSTMENT" && "— puede ser negativo"}
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="1000"
              />
            </div>
          </div>
          <div>
            <label className="label">Nota (opcional)</label>
            <input
              type="text"
              className="input"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Ej. Depósito vía SPEI"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Guardando..." : "Guardar movimiento"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-10 text-muted">Aún no has registrado movimientos de bankroll.</div>
      ) : (
        <div className="card divide-y divide-border">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">
                  {BANKROLL_TX_LABELS[tx.type]}
                  {tx.note && <span className="text-muted font-normal"> · {tx.note}</span>}
                </p>
                <p className="text-xs text-muted">{formatDate(tx.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${TYPE_COLORS[tx.type]}`}>
                  {tx.type === "WITHDRAWAL" ? "-" : "+"}
                  {formatMXN(Math.abs(tx.amount))}
                </span>
                <button onClick={() => handleDelete(tx.id)} className="text-xs text-negative hover:underline">
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
