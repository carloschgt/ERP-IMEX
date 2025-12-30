import type { SLAConfig } from "../types/types-new";

/**
 * Lê SLAConfig do localStorage de forma tolerante.
 * Se não achar, retorna null (pra caller aplicar fallback).
 */
export function loadSLAConfigFromLocalStorage(): SLAConfig | null {
  const keysToTry = [
    "slaConfig",
    "sla_config",
    "imex_sla",
    "IMEX_SLA",
    "erp_imex_sla",
    "ERP_IMEX_SLA",
    "slaTargets",
  ];

  for (const key of keysToTry) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      // Alguns menus salvam envelopado: { config: {...} } ou { data: {...} }
      const cfg = (parsed?.config ?? parsed?.data ?? parsed) as SLAConfig;

      if (!cfg || typeof cfg !== "object") continue;
      if (!cfg.targetDaysByStep || typeof cfg.targetDaysByStep !== "object") continue;

      // warningWindowDays pode vir faltando; deixamos o caller completar
      return cfg;
    } catch {
      // ignora e tenta próxima
    }
  }

  return null;
}

export default loadSLAConfigFromLocalStorage;