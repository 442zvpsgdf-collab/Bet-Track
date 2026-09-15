"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { DashboardStatsDTO } from "@/types";
import { formatMXN, formatPercent } from "@/lib/format";

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface-alt rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted">No se pudieron cargar las estadísticas.</p>;
  }

  if (stats.betCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
        <span className="text-4xl">🎯</span>
        <h2 className="text-lg font-semibold">Aún no tienes apuestas registradas</h2>
        <p className="text-sm text-muted max-w-sm">
          Empieza registrando tu primera apuesta para ver tu bankroll, ROI y estadísticas aquí.
        </p>
        <Link href="/bets/new" className="btn-primary">
          Registrar mi primera apuesta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href="/bets/new" className="btn-primary text-sm">
          + Nueva apuesta
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Bankroll actual" value={formatMXN(stats.bankroll)} />
        <StatCard
          label="Ganancia/pérdida total"
          value={formatMXN(stats.totalProfit)}
          tone={stats.totalProfit >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Ganancia/pérdida del mes"
          value={formatMXN(stats.monthProfit)}
          tone={stats.monthProfit >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="ROI"
          value={formatPercent(stats.roi)}
          tone={stats.roi >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Win rate" value={formatPercent(stats.winRate)} />
        <StatCard label="Número de apuestas" value={String(stats.betCount)} sublabel={`${stats.pendingCount} pendientes`} />
        <StatCard label="Apuesta promedio" value={formatMXN(stats.averageStake)} />
        <StatCard
          label="Mejor deporte"
          value={stats.bestSport?.name ?? "—"}
          sublabel={stats.bestSport ? formatMXN(stats.bestSport.profit) : undefined}
          tone="positive"
        />
        <StatCard
          label="Peor deporte"
          value={stats.worstSport?.name ?? "—"}
          sublabel={stats.worstSport ? formatMXN(stats.worstSport.profit) : undefined}
          tone="negative"
        />
        <StatCard
          label="Mejor casa"
          value={stats.bestSportsbook?.name ?? "—"}
          sublabel={stats.bestSportsbook ? formatMXN(stats.bestSportsbook.profit) : undefined}
          tone="positive"
        />
        <StatCard
          label="Peor casa"
          value={stats.worstSportsbook?.name ?? "—"}
          sublabel={stats.worstSportsbook ? formatMXN(stats.worstSportsbook.profit) : undefined}
          tone="negative"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-medium mb-4">Evolución del bankroll</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.bankrollHistory}>
              <defs>
                <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8891A5" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8891A5" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: "#1A1F2B", border: "1px solid #232838", borderRadius: 12 }}
                labelStyle={{ color: "#8891A5" }}
                formatter={(value: number) => [formatMXN(value), "Bankroll"]}
              />
              <Area type="monotone" dataKey="bankroll" stroke="#3B82F6" fill="url(#bankrollGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="text-sm font-medium mb-4">Ganancia/pérdida acumulada</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.profitHistory}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8891A5" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8891A5" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: "#1A1F2B", border: "1px solid #232838", borderRadius: 12 }}
                labelStyle={{ color: "#8891A5" }}
                formatter={(value: number) => [formatMXN(value), "Ganancia acumulada"]}
              />
              <Area
                type="monotone"
                dataKey="cumulativeProfit"
                stroke="#22C55E"
                fill="url(#profitGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
