
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

export interface User {
  email: string;
  name: string;
  role: UserRole;
  department: 'COMERCIAL' | 'COMPRAS' | 'FINANCEIRO' | 'LOGISTICA' | 'ESTOQUE' | 'PLANEJAMENTO' | 'ENGENHARIA' | 'ADMIN';
  lastLogin?: string;
  password?: string;
  passwordChangedAt?: string;
}

export interface SLAConfig {
  estoque: number; // Horas Úteis
  compras: number; // Dias
  financeiro: number; // Dias
  logistica: number; // Dias
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  contato?: string;
  email?: string;
}

export interface AuditTrailEvent {
  id: string;
  at: number; // timestamp
  atISO: string;
  by: string;
  department: string;
  type: 'STAGE_SAVE' | 'DOC_UPLOAD' | 'STATUS_UPDATE' | 'ENGINEERING_REVIEW' | 'PAYMENT_PLAN' | 'PAYMENT_DONE' | 'STAGE_REOPEN' | 'READONLY_OVERRIDE';
  stage: 'COMERCIAL' | 'ESTOQUE' | 'PLANEJAMENTO' | 'COMPRAS' | 'ENGENHARIA' | 'FINANCEIRO' | 'LOGISTICA';
  summary: string;
  meta?: any;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  stage: string;
  base64?: string;
  link?: string;
}

export interface PaymentPlanItem {
  id: string;
  supplierName?: string;
  type: 'ADIANTAMENTO' | 'COMPLEMENTO' | 'TOTAL' | 'REEMBOLSO' | 'OUTRO';
  dueDate: string; // ISO
  amount: number;
  currency: 'BRL' | 'USD' | 'EUR';
  status: 'AGENDADO' | 'PAGO';
  paidAt?: string;
  paidBy?: string;
}

export interface PaymentRequest {
  id: string;
  createdAt: string;
  createdBy: string;
  note: string;
  status: 'ABERTO' | 'EM_TRATAMENTO' | 'CONCLUIDO';
}

export interface PVItem {
  id: string;
  codigo: string;
  itemCliente?: string;
  tag?: string; // NM/TAG
  descricao: string;
  quantidade: string;
  estoqueDisponivel?: string;
  necessidadeCompra?: string;
  stockObservation?: string;
  valorUnitario: string; 
  valorUnitarioCompra?: string; // Preço negociado pelo Compras
  moeda: 'USD' | 'BRL' | 'EUR';
  fornecedor: string;
  statusFabricacao?: string;
  prazoFabricacao?: string; // Prazo individual por item (Dias)
  // Campos Engenharia
  engineeringReviewedAt?: string;
  engineeringReviewedBy?: string;
  engineeringReviewAcknowledgedAt?: string;
  engineeringObservation?: string;
  engineeringRevisionNumber?: number;
}

export interface SupplierPaymentEntry {
  supplierName: string;
  paidAmount: string;
  paymentDate: string;
}

export interface ImportRecord {
  id: string;
  PV: string;
  Cliente: string;
  Data_PV: string;
  Data_Lancamento_PV: string; // ISO
  Prazo_Contrato: string; 
  PO_Cliente?: string; 
  
  // Auditoria e Histórico
  auditTrail: AuditTrailEvent[];
  attachments: Attachment[];
  paymentRequests: PaymentRequest[];
  paymentPlan: PaymentPlanItem[];
  pagamentosFornecedores: SupplierPaymentEntry[];

  // Estoque (Gate)
  Status_Estoque?: 'PENDENTE' | 'CONCLUIDO';
  Data_Entrada_Estoque?: string;
  Data_Conclusao_Estoque?: string;
  Responsavel_Estoque?: string;
  Observacoes_Estoque?: string;

  // Planejamento
  SC: string;
  Data_SC?: string;
  Responsavel_Planejamento?: string;

  // Compras & Suprimentos
  Data_Entrada_Compras?: string;
  PO?: string;
  Data_PO?: string;
  PC?: string; 
  Data_PC?: string;
  Fornecedor_PO?: string;
  Condicao_Pagamento?: string;
  Condicao_Pagamento_Detalhe?: string;

  // Financeiro
  Data_Entrada_Financeiro?: string;
  Status_Pagamento?: 'PENDENTE' | 'AGUARDANDO FINANCEIRO' | 'PARCIAL' | 'PAGO';
  Valor_Numerarios?: string;
  Valor_Frete_Internacional?: string;
  Valor_Frete_Nacional?: string;
  Valor_adiantamento?: string;
  Data_Adiantamento?: string;
  Valor_Complemento?: string;
  Valor_Reembolso?: string;
  
  // Produção
  Status_Fabricacao?: string;
  Status_Geral_Producao?: string; // NOVO: Para controle consolidado
  Inicio_Fabricacao?: string;
  Previsao_Conclusao?: string;
  
  // Logística
  Modal?: string;
  ETA?: string;
  ETD?: string;
  Coleta_Agendada?: string;

  // Aduaneiro & Custos
  DI?: string;
  Canal?: string;
  Valor_FOB_USD?: string;
  Frete_Internacional_USD?: string;

  // KPIs & Auditoria Geral
  Status_Geral?: string;
  Usuário_Ult_Alteracao: string;
  Data_Ult_Alteracao: string;

  // Itens Detalhados
  itensPV: PVItem[];
  Itens_PV?: string;
  Status_Escopo?: 'INTEGRAL' | 'PARCIAL';

  // Gestão de Crise (Intervenção Super Admin)
  Intervencao_Admin?: boolean;
  Data_Intervencao?: string;
  Motivo_Intervencao?: string;
  Etapa_Reaberta?: string;
  reopenedAt?: string;
}

export type ViewType = 'DASHBOARD' | 'COMERCIAL' | 'ESTOQUE' | 'PLANEJAMENTO' | 'COMPRAS' | 'ENGENHARIA' | 'FINANCEIRO' | 'LOGISTICA' | 'ADMIN' | 'SLA_CONFIG' | 'FORNECEDORES' | 'SUPER_ADMIN_PANEL' | 'ESTOQUE_TV';
