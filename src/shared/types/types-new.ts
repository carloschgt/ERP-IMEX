// src/shared/types/types-new.ts

export type StepStatus = "Autorizado" | "Pendente" | "Recusado";
export type TrafficLight = "GREEN" | "YELLOW" | "RED";

export interface PVStepAudit {
  stepKey: string;
  status: StepStatus;
  updatedAtISO: string;
  updatedBy?: string;
  note?: string;
}

export interface PVUnified {
  pvNumber: string;
  createdAtISO: string;
  steps: PVStepAudit[];
  currentOwnerDept?: "COMERCIAL" | "ESTOQUE" | "COMPRAS" | "FINANCEIRO" | "ENGENHARIA" | "EXPEDICAO";
}

export interface SLAConfig {
  warningWindowDays: number; // janela de 15 dias
  targetDaysByStep: Record<string, number>;
}

export interface SLAResult {
  light: TrafficLight;
  agingHours: number;
  remainingHours?: number;
}

export interface StockCheckLine {
  itemCode: string;
  requestedQty: number;
  availableQty: number;
  toBuyQty: number;
}

export interface StockCheckResult {
  pvNumber: string;
  lines: StockCheckLine[];
  createdAtISO: string;
}

export interface CashFlowEntry {
  id: string;
  pvNumber: string;
  type: "PAGAR" | "RECEBER";
  amount: number;
  currency: "BRL" | "USD" | "EUR";
  dueDateISO: string;
  paidAtISO?: string;
  status: "ABERTO" | "PAGO" | "VENCIDO";
}
