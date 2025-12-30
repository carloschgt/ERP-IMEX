import { useMemo } from "react";
import type { PVUnified, SLAConfig, TrafficLight } from "../../../shared/types/types-new";

/**
 * Função pura: calcula o semáforo do PV baseado no SLA configurado.
 */
export function calcSLA(pv: PVUnified, config: SLAConfig): { light: TrafficLight } {
  const steps = Array.isArray(pv.steps) ? pv.steps : [];
  const owner = (pv.currentOwnerDept || "DEFAULT").toUpperCase().trim();

  const step =
    steps.find((s) => String(s.stepKey || "").toUpperCase().trim() === owner) ??
    steps[steps.length - 1];

  const stepKey = String(step?.stepKey || owner || "DEFAULT").toUpperCase().trim() || "DEFAULT";

  const targetDays =
    (config?.targetDaysByStep as any)?.[stepKey] ??
    (config?.targetDaysByStep as any)?.DEFAULT ??
    30;

  const warningWindowDays = Math.max(0, Number(config?.warningWindowDays ?? 1));

  const updatedAtISO =
    (step as any)?.updatedAtISO ??
    (pv as any)?.updatedAtISO ??
    pv.createdAtISO ??
    new Date().toISOString();

  const updatedAt = new Date(updatedAtISO);
  const ms = isNaN(updatedAt.getTime()) ? 0 : Date.now() - updatedAt.getTime();
  const elapsedDays = ms / (1000 * 60 * 60 * 24);

  if (elapsedDays >= targetDays) return { light: "RED" };
  if (elapsedDays >= Math.max(0, targetDays - warningWindowDays)) return { light: "YELLOW" };
  return { light: "GREEN" };
}

export function useSLA(pv: PVUnified, config: SLAConfig) {
  return useMemo(() => calcSLA(pv, config), [pv, config]);
}
