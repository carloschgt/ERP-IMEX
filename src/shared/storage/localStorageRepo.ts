import type { PVUnified, PVStepAudit } from "../types/types-new";

/**
 * Converte datas comuns para ISO.
 */
function toISO(value: unknown): string | undefined {
  if (!value) return undefined;

  // já é Date
  if (value instanceof Date) return value.toISOString();

  // número timestamp
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  // string
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return undefined;

    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();

    // tenta "dd/mm/yyyy" ou "dd/mm/yyyy hh:mm"
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      const [, dd, mm, yyyy, HH = "00", MI = "00", SS = "00"] = m;
      const d2 = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(HH),
        Number(MI),
        Number(SS)
      );
      return isNaN(d2.getTime()) ? undefined : d2.toISOString();
    }
  }

  return undefined;
}

function normalizeStep(step: any): PVStepAudit | null {
  if (!step || typeof step !== "object") return null;

  const stepKeyRaw =
    step.stepKey ??
    step.step ??
    step.dept ??
    step.departamento ??
    step.setor ??
    step.area ??
    step.etapa;

  const stepKey = String(stepKeyRaw ?? "DEFAULT").toUpperCase().trim() || "DEFAULT";

  const updatedAtISO =
    step.updatedAtISO ??
    toISO(step.updatedAt) ??
    toISO(step.lastUpdate) ??
    toISO(step.dataAtualizacao) ??
    toISO(step.data) ??
    toISO(step.timestamp);

  return {
    stepKey: stepKey as any,
    status: String(step.status ?? step.situacao ?? "Pendente"),
    updatedAtISO: updatedAtISO ?? new Date().toISOString(),
  };
}

function normalizePV(raw: any): PVUnified | null {
  if (!raw || typeof raw !== "object") return null;

  const pvNumberRaw =
    raw.pvNumber ??
    raw.pv ??
    raw.PV ??
    raw.numeroPV ??
    raw.numero_pv ??
    raw.numPV ??
    raw.pedidoVenda ??
    raw.id ??
    raw.codigo ??
    raw.code;

  const pvNumber = String(pvNumberRaw ?? "").trim();
  if (!pvNumber) return null;

  const deptRaw =
    raw.currentOwnerDept ??
    raw.ownerDept ??
    raw.dept ??
    raw.departamento ??
    raw.setor ??
    raw.area ??
    raw.etapaAtual ??
    raw.statusDept;

  const currentOwnerDept = String(deptRaw ?? "").toUpperCase().trim();

  const createdAtISO =
    raw.createdAtISO ??
    toISO(raw.createdAt) ??
    toISO(raw.dataCadastro) ??
    toISO(raw.dataCriacao);

  const updatedAtISO =
    raw.updatedAtISO ??
    toISO(raw.updatedAt) ??
    toISO(raw.lastUpdate) ??
    toISO(raw.dataAtualizacao) ??
    toISO(raw.dataAlteracao) ??
    toISO(raw.timestamp);

  const steps: PVStepAudit[] = Array.isArray(raw.steps)
    ? raw.steps.map(normalizeStep).filter(Boolean) as PVStepAudit[]
    : [];

  // Se não veio steps, cria um mínimo para o SLA funcionar
  if (steps.length === 0) {
    steps.push({
      stepKey: (currentOwnerDept || "DEFAULT") as any,
      status: "Pendente",
      updatedAtISO: updatedAtISO ?? createdAtISO ?? new Date().toISOString(),
    });
  }

  return {
    pvNumber,
    createdAtISO: createdAtISO ?? new Date().toISOString(),
    currentOwnerDept: currentOwnerDept || (steps[steps.length - 1]?.stepKey as any) || "DEFAULT",
    steps,
  };
}

/**
 * Lê PVs do localStorage de forma tolerante:
 * - tenta várias chaves
 * - aceita array diretamente ou objeto com .records/.items/.data
 * - normaliza para PVUnified
 * - se não achar nada válido, retorna []
 */
export function loadPVUnifiedFromLocalStorage(): PVUnified[] {
  const keysToTry = [
    "records",
    "pvs",
    "pvRecords",
    "imex_records",
    "erp_imex_records",
    "ERP_IMEX_RECORDS",
  ];

  for (const key of keysToTry) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      const arr =
        Array.isArray(parsed) ? parsed :
        Array.isArray(parsed?.records) ? parsed.records :
        Array.isArray(parsed?.items) ? parsed.items :
        Array.isArray(parsed?.data) ? parsed.data :
        null;

      if (!arr) continue;

      const normalized = (arr as any[])
        .map(normalizePV)
        .filter(Boolean) as PVUnified[];

      // Só retorna se tiver pelo menos 1 PV válido com número
      if (normalized.length > 0) return normalized;
    } catch {
      // ignora e tenta próxima chave
    }
  }

  return [];
}

// opcional: se alguém estiver importando default, mantém compatível
export default loadPVUnifiedFromLocalStorage;
