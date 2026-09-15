"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMXN } from "@/lib/format";

interface Limits {
  dailyStakeLimit: number | null;
  weeklyStakeLimit: number | null;
  monthlyStakeLimit: number | null;
  maxBetsPerDay: number | null;
  lossLimitAlert: number | null;
}

interface Usage {
  dailyStaked: number;
  weeklyStaked: number;
  monthlyStaked: number;
  betsToday: number;
  monthlyLosses: number;
}

export function ResponsibleGamblingClient() {
  const [limits, setLimits] = useState<Limits | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    dailyStakeLimit: "",
    weeklyStakeLimit: "",
    monthlyStakeLimit: "",
    maxBetsPerDay: "",
    lossLimitAlert: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/limits");
    const data = await res.json();
    setLimits(data.limits);
    setUsage(data.usage);
    if (data.limits) {
      setForm({
        dailyStakeLimit: data.limits.dailyStakeLimit?.toString() ?? "",
        weeklyStakeLimit: data.limits.weeklyStakeLimit?.toString() ?? "",
        monthlyStakeLimit: data.limits.monthlyStakeLimit?.toString() ?? "",
        maxBetsPerDay: data.limits.maxBetsPerDay?.toString() ?? "",
        lossLimitAlert: data.limits.lossLimitAlert?.toString() ?? "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const payload = {
      dailyStakeLimit: form.dailyStakeLimit ? Number(form.dailyStakeLimit) : null,
      weeklyStakeLimit: form.weeklyStakeLimit ? Number(form.weeklyStakeLimit) : null,
      monthlyStakeLimit: form.monthlyStakeLimit ? Number(form.monthlyStakeLimit) : null,
      maxBetsPerDay: form.maxBetsPerDay ? Number(form.maxBetsPerDay) : null,
      lossLimitAlert: form.lossLimitAlert ? Number(form.lossLimitAlert) : null,
    };

    await fetch("/api/limits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setSaved(true);
    load();
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return <div className="h-64 bg-surface rounded-2xl animate-pulse" />;
  }

  const warnings: string[] = [];
  if (limits?.dailyStakeLimit && usage && usage.dailyStaked >= Number(limits.dailyStakeLimit)) {
    warnings.push(`Ya alcanzaste tu límite diario de apuesta (${formatMXN(Number(limits.dailyStakeLimit))}).`);
  }
  if (limits?.weeklyStakeLimit && usage && usage.weeklyStaked >= Number(limits.weeklyStakeLimit)) {
    warnings.push(`Ya alcanzaste tu límite semanal de apuesta (${formatMXN(Number(limits.weeklyStakeLimit))}).`);
  }
  if (limits?.monthlyStakeLimit && usage && usage.monthlyStaked >= Number(limits.monthlyStakeLimit)) {
    warnings.push(`Ya alcanzaste tu límite mensual de apuesta (${formatMXN(Number(limits.monthlyStakeLimit))}).`);
  }
  if (limits?.maxBetsPerDay && usage && usage.betsToday >= limits.maxBetsPerDay) {
    warnings.push(`Ya registraste ${usage.betsToday} apuestas hoy, tu límite es ${limits.maxBetsPerDay}.`);
  }
  if (limits?.lossLimitAlert && usage && usage.monthlyLosses >= Number(limits.lossLimitAlert)) {
    warnings.push(
      `Tus pérdidas este mes (${formatMXN(usage.monthlyLosses)}) superan tu límite de alerta (${formatMXN(
        Number(limits.lossLimitAlert)
      )}). Considera tomar un descanso.`
    );
  }

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="card border-warning/30 bg-warning/5 space-y-2">
          {warnings.map((w, i) => (
            <p key={i} className="text-sm text-warning flex gap-2">
              <span>⚠️</span> {w}
            </p>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-muted mb-3">Tu actividad reciente</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card">
            <p className="text-xs text-muted mb-1">Apostado hoy</p>
            <p className="text-lg font-semibold">{usage ? formatMXN(usage.dailyStaked) : "—"}</p>
          </div>
          <div className="card">
            <p className="text-xs text-muted mb-1">Apostado esta semana</p>
            <p className="text-lg font-semibold">{usage ? formatMXN(usage.weeklyStaked) : "—"}</p>
          </div>
          <div className="card">
            <p className="text-xs text-muted mb-1">Apostado este mes</p>
            <p className="text-lg font-semibold">{usage ? formatMXN(usage.monthlyStaked) : "—"}</p>
          </div>
          <div className="card">
            <p className="text-xs text-muted mb-1">Pérdidas este mes</p>
            <p className="text-lg font-semibold text-negative">{usage ? formatMXN(usage.monthlyLosses) : "—"}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="text-sm font-medium">Configura tus límites</h2>
        <p className="text-xs text-muted -mt-2">
          Déjalos vacíos si no quieres establecer un límite. Estos límites son informativos: te
          avisamos cuando los superas, pero la decisión final siempre es tuya.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Límite diario de apuesta (MXN)</label>
            <input
              type="number"
              className="input"
              value={form.dailyStakeLimit}
              onChange={(e) => setForm((f) => ({ ...f, dailyStakeLimit: e.target.value }))}
              placeholder="Sin límite"
            />
          </div>
          <div>
            <label className="label">Límite semanal de apuesta (MXN)</label>
            <input
              type="number"
              className="input"
              value={form.weeklyStakeLimit}
              onChange={(e) => setForm((f) => ({ ...f, weeklyStakeLimit: e.target.value }))}
              placeholder="Sin límite"
            />
          </div>
          <div>
            <label className="label">Límite mensual de apuesta (MXN)</label>
            <input
              type="number"
              className="input"
              value={form.monthlyStakeLimit}
              onChange={(e) => setForm((f) => ({ ...f, monthlyStakeLimit: e.target.value }))}
              placeholder="Sin límite"
            />
          </div>
          <div>
            <label className="label">Máx. apuestas por día</label>
            <input
              type="number"
              className="input"
              value={form.maxBetsPerDay}
              onChange={(e) => setForm((f) => ({ ...f, maxBetsPerDay: e.target.value }))}
              placeholder="Sin límite"
            />
          </div>
        </div>

        <div>
          <label className="label">Avisarme si mis pérdidas del mes superan (MXN)</label>
          <input
            type="number"
            className="input"
            value={form.lossLimitAlert}
            onChange={(e) => setForm((f) => ({ ...f, lossLimitAlert: e.target.value }))}
            placeholder="Sin límite"
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar límites"}
        </button>
      </form>

      <div className="card">
        <h2 className="text-sm font-medium mb-2">¿Necesitas ayuda?</h2>
        <p className="text-sm text-muted">
          Si sientes que el juego está afectando tu vida, en México puedes buscar apoyo con
          instituciones especializadas en juego responsable y atención a las adicciones. Hablar con
          alguien de confianza es un buen primer paso.
        </p>
      </div>
    </div>
  );
}
