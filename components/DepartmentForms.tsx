import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ImportRecord, User, ViewType, PVItem, Supplier, UserRole, AuditTrailEvent } from '../types';
import { matchWithWildcardPrefix } from '../utils/businessTime';
import { COLORS, ICONS } from '../constants';

interface Props {
  view: ViewType;
  records: ImportRecord[];
  setRecords: (records: ImportRecord[]) => void;
  user: User;
  suppliers?: Supplier[];
}

const SUPER_ADMIN_EMAIL = 'carlos.teixeira@imexsolutions.com.br';
const STORAGE_KEY = 'imex_records';

const STAGES = [
  { id: 'TRIAGEM', label: 'Comercial' },
  { id: 'ESTOQUE', label: 'Estoque' },
  { id: 'PLANEJAMENTO', label: 'Plan.' },
  { id: 'COMPRAS', label: 'Compras' },
  { id: 'ENGENHARIA', label: 'Eng.' },
  { id: 'FINANCEIRO', label: 'Financeiro' },
  { id: 'LOGISTICA', label: 'Logistica' },
  { id: 'FINALIZADO', label: 'Finalizado' }
];

const formatCurrency = (val: string | number, currency: string = 'BRL') => {
  const n = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val;
  if (isNaN(n)) return currency === 'BRL' ? 'R$ 0,00' : (currency === 'USD' ? '$ 0.00' : 'EUR 0.00');
  return n.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency
  });
};

const ProcessTimeline = ({ currentStatus }: { currentStatus?: string }) => {
  const currentIndex = STAGES.findIndex(s => s.id === (currentStatus || 'TRIAGEM'));

  return (
    <div className="w-full py-6 px-4 mb-8 bg-slate-950/40 rounded-3xl border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        <div className="absolute h-0.5 bg-slate-800 left-0 right-0 top-1/2 -translate-y-1/2 z-0"></div>
        <div
          className="absolute h-0.5 bg-emerald-500 transition-all duration-700 ease-in-out left-0 top-1/2 -translate-y-1/2 z-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                isCurrent ? 'bg-slate-900 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-125' :
                'bg-slate-900 border-slate-700 text-slate-600'
              }`}>
                {isDone ? <span className="text-[9px] font-black">OK</span> : <span className="text-[9px] font-black">{idx + 1}</span>}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isCurrent ? 'text-emerald-400' : 'text-slate-500'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  isSelect = false,
  options = [],
  readonly = false,
  className = "",
  required = false,
  hasError = false
}: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${hasError ? 'text-red-500' : 'text-slate-500'}`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>

    {isSelect ? (
      <select
        disabled={disabled || readonly}
        className={`w-full px-3 py-2.5 bg-slate-800 text-white border rounded-xl font-bold text-[11px] focus:ring-1 transition-all ${
          hasError ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700'
        } ${(disabled || readonly) ? 'opacity-50 cursor-not-allowed bg-slate-900/50' : 'hover:border-emerald-500/50'}`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">SELECIONE</option>
        {options.map((opt: any) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        disabled={disabled}
        readOnly={readonly}
        className={`w-full px-3 py-2.5 bg-slate-800 text-white border rounded-xl font-bold text-[11px] focus:ring-1 transition-all placeholder-slate-600 uppercase ${
          hasError ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700'
        } ${(disabled || readonly) ? 'opacity-50 cursor-not-allowed bg-slate-900/50' : 'hover:border-emerald-500/50'} ${readonly ? 'bg-slate-900/80 text-emerald-400 border-none shadow-inner' : ''}`}
        style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any}
        value={value === undefined || value === null ? '' : value}
        placeholder={placeholder}
        onChange={e => {
          const val = type === 'text'
            ? e.target.value.toUpperCase().trimStart().replace(/\s\s+/g, ' ')
            : e.target.value;
          onChange(val);
        }}
      />
    )}
  </div>
);

const DepartmentForms: React.FC<Props> = ({ view, records, setRecords, user, suppliers = [] }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchPV, setSearchPV] = useState('');
  const [form, setForm] = useState<Partial<ImportRecord>>({ itensPV: [] });
  const [errors, setErrors] = useState<string[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const isComercialView = view === 'COMERCIAL';
  const isEstoqueView = view === 'ESTOQUE';
  const isPlanejamentoView = view === 'PLANEJAMENTO';
  const isComprasView = view === 'COMPRAS';
  const isEngenhariaView = view === 'ENGENHARIA';
  const isFinanceiroView = view === 'FINANCEIRO';
  const isLogisticaView = view === 'LOGISTICA';

  const isAdmin =
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN ||
    user.email === SUPER_ADMIN_EMAIL;

  const isViewer = user.role === UserRole.VIEWER;

  const activeRecord = useMemo(() => records.find(r => r.id === selectedId), [selectedId, records]);

  useEffect(() => {
    if (activeRecord) {
      setForm({ ...activeRecord });
      setErrors([]);
    } else {
      resetToNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, activeRecord?.id]);

  const isRecordLocked = useMemo(() => {
    if (!activeRecord) return false;
    if (isAdmin) return false;
    if (activeRecord.Status_Geral === 'FINALIZADO') return true;
    if (isComercialView && activeRecord.Status_Geral && activeRecord.Status_Geral !== 'TRIAGEM') return true;
    if (!isComercialView && view !== activeRecord.Status_Geral) return true;
    return false;
  }, [activeRecord, isAdmin, view, isComercialView]);

  const parseNum = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).replace(/\./g, '').replace(',', '.');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = { USD: 0, BRL: 0, EUR: 0 };
    (form.itensPV || []).forEach(item => {
      const subtotal = parseNum(item.quantidade) * parseNum(item.valorUnitario);
      if (totals[item.moeda] !== undefined) totals[item.moeda] += subtotal;
    });
    return totals;
  }, [form.itensPV]);

  const tableColumnCount = useMemo(() => {
    const base = 8; // Item, TAG, Codigo/Descricao, Qtd, Fornecedor, Moeda, Vlr Unit, Total
    const extraEstoque = isEstoqueView ? 1 : 0;
    const extraEngineering = isEngenhariaView ? 3 : 0; // Revisao, Obs, Aprovar
    const extraAction = (isComercialView && !isRecordLocked) ? 1 : 0;
    return base + extraEstoque + extraEngineering + extraAction;
  }, [isEstoqueView, isEngenhariaView, isComercialView, isRecordLocked]);

  const resetToNew = () => {
    setSelectedId(null);
    setSearchPV('');
    setForm({
      itensPV: [],
      attachments: [],
      auditTrail: [],
      paymentRequests: [],
      paymentPlan: [],
      pagamentosFornecedores: [],
      Data_PV: new Date().toISOString().split('T')[0],
      Status_Geral: 'TRIAGEM',
      Status_Estoque: 'PENDENTE'
    } as any);
    setErrors([]);
  };

  const addItem = () => {
    if (isRecordLocked) return;
    const newItem: PVItem = {
      id: `man-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      codigo: '',
      itemCliente: '',
      tag: '',
      descricao: '',
      quantidade: '1',
      valorUnitario: '0',
      moeda: 'USD',
      fornecedor: '',
    };
    setForm(prev => ({ ...prev, itensPV: [...(prev.itensPV || []), newItem] }));
  };

  const updateItem = (id: string, field: keyof PVItem, value: any) => {
    if (isRecordLocked) return;

    const textFields: (keyof PVItem)[] = [
      'codigo',
      'descricao',
      'tag',
      'itemCliente',
      'fornecedor',
      'statusFabricacao',
      'prazoFabricacao',
      'stockObservation',
      'necessidadeCompra',
      'engineeringObservation'
    ];

    if (textFields.includes(field) && typeof value === 'string') {
      value = value.toUpperCase().trimStart().replace(/\s\s+/g, ' ');
    }

    if (field === 'quantidade' || field === 'estoqueDisponivel') {
      const num = parseFloat(value);
      if (num < 0) return;
    }

    setForm(prev => ({
      ...prev,
      itensPV: (prev.itensPV || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const makeAuditEvent = (type: AuditTrailEvent['type'], stage: AuditTrailEvent['stage'], summary: string, meta?: any): AuditTrailEvent => {
    const at = Date.now();
    return {
      id: `aud-${at}-${Math.random().toString(36).slice(2, 8)}`,
      at,
      atISO: new Date(at).toISOString(),
      by: user.name,
      department: user.department,
      type,
      stage,
      summary,
      meta
    };
  };

  const withAudit = (rec: ImportRecord, ev: AuditTrailEvent): ImportRecord => {
    const trail = Array.isArray((rec as any).auditTrail) ? (rec as any).auditTrail : [];
    return { ...rec, auditTrail: [ev, ...trail] } as any;
  };

  const approveDrawing = (itemId: string) => {
    if (!isEngenhariaView || isRecordLocked) return;

    setForm(prev => {
      let approvedCode = '';
      let nextRev: number | null = null;

      const itens = (prev.itensPV || []).map(it => {
        if (it.id !== itemId) return it;
        approvedCode = it.codigo;

        const current = (it.engineeringRevisionNumber === undefined || it.engineeringRevisionNumber === null)
          ? null
          : Number(it.engineeringRevisionNumber);

        nextRev = (current === null) ? 0 : current + 1;
        return { ...it, engineeringRevisionNumber: nextRev };
      });

      const trail = Array.isArray((prev as any).auditTrail) ? (prev as any).auditTrail : [];
      const ev = makeAuditEvent(
        'ENGINEERING_REVIEW',
        'ENGENHARIA',
        `Desenho aprovado: ${approvedCode} (REV ${nextRev})`,
        { itemId, codigo: approvedCode, revision: nextRev }
      );

      return {
        ...prev,
        itensPV: itens,
        auditTrail: [ev, ...trail]
      };
    });
  };

  const validateForm = () => {
    const errorList: string[] = [];

    if (!form.PV?.trim()) errorList.push("CODIGO PV");
    if (!form.Cliente?.trim()) errorList.push("CLIENTE");
    if (!form.PO_Cliente?.trim()) errorList.push("PO CLIENTE");
    if (!form.Data_PV) errorList.push("DATA PV");

    if (!form.itensPV?.length) {
      errorList.push("LISTA DE ITENS");
    } else {
      form.itensPV.forEach((it, idx) => {
        if (!it.codigo?.trim()) errorList.push(`CODIGO ITEM #${idx + 1}`);
        if (!it.fornecedor?.trim()) errorList.push(`FORNECEDOR ITEM #${idx + 1}`);
        if (parseNum(it.quantidade) <= 0) errorList.push(`QTD INVALIDA ITEM #${idx + 1}`);
      });
    }

    return errorList;
  };

  const handleSave = async () => {
    if (isViewer || (isRecordLocked && !isAdmin)) {
      alert("ATENCAO: PV BLOQUEADO NO FLUXO ATUAL.");
      return;
    }

    const errs = validateForm();
    if (errs.length > 0) {
      setErrors(errs);
      alert(`PENDENCIAS OBRIGATORIAS:\n\n- ${errs.join('\n- ')}`);
      return;
    }

    try {
      const now = new Date();
      const allLatest = (() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const parsed = JSON.parse(raw || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      const recordId = (form.id && String(form.id).trim())
        ? String(form.id)
        : `pv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const prevStatus = ((form.Status_Geral || 'TRIAGEM') as any);
      let nextStatus = prevStatus;
      let nextStatusEstoque = (form.Status_Estoque || 'PENDENTE');

      // Regras por departamento (gate de avanço)
      if (isComercialView && prevStatus === 'TRIAGEM') {
        nextStatus = 'ESTOQUE';
        nextStatusEstoque = 'PENDENTE';
      }

      if (isEstoqueView && prevStatus === 'ESTOQUE') {
        if (window.confirm("Concluir o GATE de ESTOQUE e enviar para PLANEJAMENTO?")) {
          nextStatus = 'PLANEJAMENTO';
          nextStatusEstoque = 'CONCLUIDO';
        }
      }

      if (isPlanejamentoView && prevStatus === 'PLANEJAMENTO') {
        if (!String((form as any).SC || '').trim()) {
          alert('Informe o numero da SC para avancar.');
          return;
        }
        if (window.confirm("Concluir PLANEJAMENTO e enviar para COMPRAS?")) {
          nextStatus = 'COMPRAS';
        }
      }

      if (isComprasView && prevStatus === 'COMPRAS') {
        if (!String((form as any).PO || '').trim()) {
          alert('Informe o numero da PO para avancar.');
          return;
        }
        if (window.confirm("Concluir COMPRAS e enviar para ENGENHARIA (aprovacao de desenho)?")) {
          nextStatus = 'ENGENHARIA';
        }
      }

      if (isEngenhariaView && prevStatus === 'ENGENHARIA') {
        const itens = (form.itensPV || []);
        const pend = itens.filter(it => it.engineeringRevisionNumber === undefined || it.engineeringRevisionNumber === null);
        if (pend.length > 0) {
          alert(`Ainda existem itens sem aprovacao de desenho (revisao nao definida):\n\n- ${pend.map(p => p.codigo).join('\n- ')}`);
          return;
        }
        if (window.confirm("Concluir ENGENHARIA e enviar para FINANCEIRO?")) {
          nextStatus = 'FINANCEIRO';
        }
      }

      if (isFinanceiroView && prevStatus === 'FINANCEIRO') {
        if (!String((form as any).Status_Pagamento || '').trim()) {
          alert('Selecione o Status de Pagamento para avancar.');
          return;
        }
        if (window.confirm("Concluir FINANCEIRO e enviar para LOGISTICA?")) {
          nextStatus = 'LOGISTICA';
        }
      }

      if (isLogisticaView && prevStatus === 'LOGISTICA') {
        if (window.confirm("Concluir LOGISTICA e FINALIZAR o processo?")) {
          nextStatus = 'FINALIZADO';
        }
      }

      const baseRecord: ImportRecord = {
        ...(form as any),
        id: recordId,
        itensPV: form.itensPV || [],
        attachments: (form as any).attachments || [],
        auditTrail: (form as any).auditTrail || [],
        paymentRequests: (form as any).paymentRequests || [],
        paymentPlan: (form as any).paymentPlan || [],
        pagamentosFornecedores: (form as any).pagamentosFornecedores || [],
        Usuario_Ult_Alteracao: user.name,
        Data_Ult_Alteracao: now.toLocaleString(),
        Responsavel_Estoque: isEstoqueView ? user.name : (form as any).Responsavel_Estoque,
        Responsavel_Planejamento: isPlanejamentoView ? user.name : (form as any).Responsavel_Planejamento,
        Data_Conclusao_Estoque: (isEstoqueView && prevStatus === 'ESTOQUE' && nextStatusEstoque === 'CONCLUIDO')
          ? ((form as any).Data_Conclusao_Estoque || now.toISOString())
          : (form as any).Data_Conclusao_Estoque,
        Status_Geral: nextStatus as any,
        Status_Estoque: nextStatusEstoque as any,
        Data_Lancamento_PV: form.Data_Lancamento_PV || now.toISOString(),
      } as any;

      // timestamps de entrada por etapa (quando muda)
      if (prevStatus !== nextStatus) {
        if (nextStatus === 'ESTOQUE') (baseRecord as any).Data_Entrada_Estoque = (baseRecord as any).Data_Entrada_Estoque || now.toISOString();
        if (nextStatus === 'PLANEJAMENTO') (baseRecord as any).Data_Entrada_Planejamento = (baseRecord as any).Data_Entrada_Planejamento || now.toISOString();
        if (nextStatus === 'COMPRAS') (baseRecord as any).Data_Entrada_Compras = (baseRecord as any).Data_Entrada_Compras || now.toISOString();
        if (nextStatus === 'ENGENHARIA') (baseRecord as any).Data_Entrada_Engenharia = (baseRecord as any).Data_Entrada_Engenharia || now.toISOString();
        if (nextStatus === 'FINANCEIRO') (baseRecord as any).Data_Entrada_Financeiro = (baseRecord as any).Data_Entrada_Financeiro || now.toISOString();
        if (nextStatus === 'LOGISTICA') (baseRecord as any).Data_Entrada_Logistica = (baseRecord as any).Data_Entrada_Logistica || now.toISOString();
        if (nextStatus === 'FINALIZADO') (baseRecord as any).Data_Finalizado = (baseRecord as any).Data_Finalizado || now.toISOString();
      }

      const evType: AuditTrailEvent['type'] = prevStatus !== nextStatus ? 'STATUS_UPDATE' : 'STAGE_SAVE';
      const evStage: AuditTrailEvent['stage'] = (view as any) === 'COMERCIAL' ? 'COMERCIAL' : (view as any);

      // Hardening audit summary: sem caracteres que quebram encoding (usa "->")
      const evSummary = prevStatus !== nextStatus
        ? `Fluxo atualizado: ${prevStatus} -> ${nextStatus}`
        : `Registro atualizado no modulo ${view}`;

      const updatedRecord = withAudit(
        baseRecord,
        makeAuditEvent(evType, evStage, evSummary, { prevStatus, nextStatus })
      );

      const finalRecords = allLatest.some((r: any) => r.id === recordId)
        ? allLatest.map((r: any) => r.id === recordId ? updatedRecord : r)
        : [updatedRecord, ...allLatest];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalRecords));
      setRecords(finalRecords);

      alert(`OK - SINCRONIZADO!\nPV: ${form.PV}\nLocalizacao Atual: ${nextStatus}`);
      resetToNew();
    } catch {
      alert("ERRO AO ACESSAR STORAGE.");
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isRecordLocked) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = (event.target?.result as string).split('\n');
      const start = lines[0]?.includes('sep=') ? 2 : 1;

      const newItems = lines.slice(start).filter(l => l.trim()).map((line, idx) => {
        const cols = line.split(';');
        return {
          id: `imp-${Date.now()}-${idx}`,
          itemCliente: cols[0]?.trim() || '',
          tag: cols[1]?.toUpperCase() || '',
          codigo: cols[2]?.toUpperCase() || '',
          descricao: cols[3]?.toUpperCase() || '',
          quantidade: Math.max(1, parseFloat(cols[4]) || 1).toString(),
          moeda: (cols[5]?.toUpperCase() as any) || 'USD',
          valorUnitario: cols[6]?.replace(',', '.') || '0',
          fornecedor: cols[7]?.toUpperCase() || ''
        };
      });

      setForm(f => ({ ...f, itensPV: [...(f.itensPV || []), ...newItems] }));
      if (csvInputRef.current) csvInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const headers = "ITEM_CLIENTE;TAG;CODIGO;DESCRICAO;QUANTIDADE;MOEDA;VALOR_UNITARIO;FORNECEDOR";
    const blob = new Blob(["sep=;\n" + headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "template_imex_comercial.csv");
    link.click();
  };

  const masterQueue = useMemo(() => {
    return records.filter(r => {
      if (isEstoqueView) return r.Status_Geral === 'ESTOQUE';
      if (isPlanejamentoView) return r.Status_Geral === 'PLANEJAMENTO';
      if (isComprasView) return r.Status_Geral === 'COMPRAS';
      if (isEngenhariaView) return r.Status_Geral === 'ENGENHARIA';
      if (isFinanceiroView) return r.Status_Geral === 'FINANCEIRO';
      if (isLogisticaView) return r.Status_Geral === 'LOGISTICA';
      return true;
    });
  }, [records, isEstoqueView, isPlanejamentoView, isComprasView, isEngenhariaView, isFinanceiroView, isLogisticaView]);

  const masterSearch = (term: string) => {
    const t = term.trim().toUpperCase();
    return records
      .filter(r => (
        matchWithWildcardPrefix((r.PV || '').toUpperCase(), t) ||
        matchWithWildcardPrefix(((r as any).SC || '').toUpperCase(), t) ||
        matchWithWildcardPrefix(((r as any).PO || '').toUpperCase(), t)
      ))
      .slice(0, 5);
  };

  return (
    <div className="space-y-4 lg:space-y-8 animate-in fade-in pb-10">

      {selectedId && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between shadow-lg transition-all ${isRecordLocked ? 'bg-amber-500 border-amber-600 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'}`}>
          <div className="flex items-center gap-4">
            <div className={`${isRecordLocked ? 'animate-bounce' : 'animate-pulse'}`}>{ICONS.Warning}</div>
            <div>
              <p className="font-black text-[10px] lg:text-xs uppercase tracking-widest">
                {isRecordLocked ? `MODO CONSULTA: PV EM ${activeRecord?.Status_Geral}` : `OPERANDO EM: ${view} - PV: ${activeRecord?.PV}`}
              </p>
              <p className="text-[9px] font-bold uppercase opacity-80">
                {isRecordLocked ? 'Somente o departamento responsavel pode alterar dados neste estagio.' : 'Sincronizacao mestre ativa v4.1.0.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl lg:rounded-[3rem] shadow-2xl border border-slate-800 overflow-hidden">

        <div className="px-6 py-5 lg:px-10 lg:py-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/40">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center border border-white/10 ${isComercialView ? 'bg-[#04816E]/10 text-[#04816E]' : 'bg-blue-500/10 text-blue-400'}`}>
              {isComercialView ? ICONS.Plus : ICONS.Filter}
            </div>
            <div>
              <h3 className="text-white font-black text-sm lg:text-lg uppercase tracking-widest lg:tracking-[4px]">
                {view}
              </h3>
              <p className="text-slate-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest italic">Precision v4.1.0 Integrity</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isComercialView && (
              <>
                <button onClick={resetToNew} className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-all">
                  + Novo PV
                </button>
                <button onClick={downloadCSVTemplate} className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase border border-slate-700 hover:text-white transition-all">
                  Template CSV
                </button>
                {!isRecordLocked && (
                  <>
                    <button onClick={() => csvInputRef.current?.click()} className="flex-1 sm:flex-none px-6 py-2.5 bg-[#04816E]/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20 hover:bg-[#04816E]/20 transition-all">
                      Importar CSV
                    </button>
                    <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleCSVImport} />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-10 space-y-6 lg:space-y-10">

          {selectedId && <ProcessTimeline currentStatus={activeRecord?.Status_Geral} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Localizar Registro na Fila</label>

              {!isComercialView ? (
                <select
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold uppercase focus:border-emerald-500 outline-none"
                  value={selectedId || ''}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  <option value="">AGUARDANDO ACAO OPERACIONAL...</option>
                  {masterQueue.map(r => <option key={r.id} value={r.id}>{r.PV} - {r.Cliente} ({r.Status_Geral})</option>)}
                </select>
              ) : (
                <div className="relative">
                  <input
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold uppercase outline-none focus:border-emerald-500"
                    placeholder="LOCALIZAR PV PARA ALTERACAO..."
                    value={searchPV}
                    onChange={e => setSearchPV(e.target.value)}
                  />
                  {searchPV && masterSearch(searchPV).length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                      {masterSearch(searchPV).map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setSelectedId(r.id); setSearchPV(''); }}
                          className="w-full px-4 py-3 text-left hover:bg-emerald-500/10 border-b border-slate-700 text-white font-black text-xs block"
                        >
                          {r.PV} - {r.Cliente}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            <Input label="Codigo PV" required readonly={!isComercialView || isRecordLocked} value={form.PV} onChange={(v:any) => setForm({...form, PV: v})} hasError={errors.includes("CODIGO PV")} />
            <Input label="Cliente" required readonly={!isComercialView || isRecordLocked} value={form.Cliente} onChange={(v:any) => setForm({...form, Cliente: v})} hasError={errors.includes("CLIENTE")} />
            <Input label="PO Cliente" required readonly={!isComercialView || isRecordLocked} value={form.PO_Cliente} onChange={(v:any) => setForm({...form, PO_Cliente: v})} hasError={errors.includes("PO CLIENTE")} />
            <Input label="Data PV" required type="date" readonly={!isComercialView || isRecordLocked} value={form.Data_PV} onChange={(v:any) => setForm({...form, Data_PV: v})} hasError={errors.includes("DATA PV")} />
            <Input label="Prazo (Dias)" required readonly={isRecordLocked} value={form.Prazo_Contrato} onChange={(v:any) => setForm({...form, Prazo_Contrato: v})} />
          </div>

          {(isEstoqueView || isPlanejamentoView || isComprasView || isEngenhariaView || isFinanceiroView || isLogisticaView) && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-950/30 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[4px]">Dados da Etapa: {view}</h4>
                {isRecordLocked && <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Somente leitura</span>}
              </div>

              {isEstoqueView && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Observacoes Estoque (Gate)</label>
                    <textarea
                      className="w-full min-h-[44px] bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 uppercase"
                      placeholder="Ex: SEM ESTOQUE / COM ESTOQUE / RESERVADO / NECESSITA COMPRA..."
                      readOnly={isRecordLocked}
                      value={(form as any).Observacoes_Estoque || ''}
                      onChange={(e) => setForm({ ...form, Observacoes_Estoque: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Status Estoque</label>
                    <div className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-[10px] uppercase">
                      {(form.Status_Estoque || 'PENDENTE')}
                    </div>
                  </div>
                </div>
              )}

              {isPlanejamentoView && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Numero SC"
                    required
                    readonly={isRecordLocked}
                    value={(form as any).SC || ''}
                    onChange={(v:any) => setForm({ ...form, SC: v })}
                  />
                  <Input
                    label="Data SC"
                    type="date"
                    readonly={isRecordLocked}
                    value={(form as any).Data_SC || ''}
                    onChange={(v:any) => setForm({ ...form, Data_SC: v })}
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Responsavel Planejamento</label>
                    <div className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-[10px] uppercase">
                      {(form as any).Responsavel_Planejamento || user.name}
                    </div>
                  </div>
                </div>
              )}

              {isComprasView && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Numero PO"
                    required
                    readonly={isRecordLocked}
                    value={(form as any).PO || ''}
                    onChange={(v:any) => setForm({ ...form, PO: v })}
                  />
                  <Input
                    label="Data PO"
                    type="date"
                    readonly={isRecordLocked}
                    value={(form as any).Data_PO || ''}
                    onChange={(v:any) => setForm({ ...form, Data_PO: v })}
                  />
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Fornecedor PO</label>
                    <select
                      className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-bold uppercase"
                      disabled={isRecordLocked}
                      value={(form as any).Fornecedor_PO || ''}
                      onChange={(e) => setForm({ ...form, Fornecedor_PO: e.target.value.toUpperCase() })}
                    >
                      <option value="">SELECIONE...</option>
                      {suppliers?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <Input
                    label="Condicao Pagamento"
                    readonly={isRecordLocked}
                    value={(form as any).Condicao_Pagamento || ''}
                    onChange={(v:any) => setForm({ ...form, Condicao_Pagamento: v })}
                  />
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Detalhe Condicao / Observacoes Compras</label>
                    <textarea
                      className="w-full min-h-[44px] bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 uppercase"
                      placeholder="Ex: 15% ADIANTAMENTO / 85% APOS INSPECAO..."
                      readOnly={isRecordLocked}
                      value={(form as any).Condicao_Pagamento_Detalhe || ''}
                      onChange={(e) => setForm({ ...form, Condicao_Pagamento_Detalhe: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              )}

              {isEngenhariaView && (
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  <p className="font-black text-white uppercase tracking-widest text-[10px] mb-2">Controle de Revisao (Desenhos)</p>
                  <p>Ao clicar em <span className="font-black text-emerald-400">APROVAR DESENHO</span> no item, o sistema grava a revisao:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                    <li>Primeira aprovacao: <span className="font-black">Revisao 0</span></li>
                    <li>Proximas aprovacoes: incrementa para Revisao 1, Revisao 2, ...</li>
                  </ul>
                </div>
              )}

              {isFinanceiroView && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Status Pagamento</label>
                    <select
                      className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-bold uppercase"
                      disabled={isRecordLocked}
                      value={(form as any).Status_Pagamento || ''}
                      onChange={(e) => setForm({ ...form, Status_Pagamento: e.target.value })}
                    >
                      <option value="">SELECIONE...</option>
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="AGENDADO">AGENDADO</option>
                      <option value="PAGO">PAGO</option>
                    </select>
                  </div>
                  <Input label="Valor Adiantamento" readonly={isRecordLocked} value={(form as any).Valor_adiantamento || ''} onChange={(v:any) => setForm({ ...form, Valor_adiantamento: v })} />
                  <Input label="Data Adiantamento" type="date" readonly={isRecordLocked} value={(form as any).Data_adiantamento || ''} onChange={(v:any) => setForm({ ...form, Data_adiantamento: v })} />
                  <Input label="Valor Complemento" readonly={isRecordLocked} value={(form as any).Valor_complemento || ''} onChange={(v:any) => setForm({ ...form, Valor_complemento: v })} />
                </div>
              )}

              {isLogisticaView && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Modal</label>
                    <select
                      className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-bold uppercase"
                      disabled={isRecordLocked}
                      value={(form as any).Modal || ''}
                      onChange={(e) => setForm({ ...form, Modal: e.target.value })}
                    >
                      <option value="">SELECIONE...</option>
                      <option value="AEREO">AEREO</option>
                      <option value="MARITIMO">MARITIMO</option>
                      <option value="RODOVIARIO">RODOVIARIO</option>
                    </select>
                  </div>
                  <Input label="ETD" type="date" readonly={isRecordLocked} value={(form as any).ETD || ''} onChange={(v:any) => setForm({ ...form, ETD: v })} />
                  <Input label="ETA" type="date" readonly={isRecordLocked} value={(form as any).ETA || ''} onChange={(v:any) => setForm({ ...form, ETA: v })} />
                  <Input label="Coleta Agendada" type="date" readonly={isRecordLocked} value={(form as any).Coleta_Agendada || ''} onChange={(v:any) => setForm({ ...form, Coleta_Agendada: v })} />
                </div>
              )}
            </div>
          )}

          <div className="pt-6 lg:pt-10 border-t border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[4px]">Lista de Itens do Pedido de Vendas</h4>
              {isComercialView && !isRecordLocked && (
                <button onClick={addItem} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-500 transition-all">
                  {ICONS.Plus} Novo Item
                </button>
              )}
            </div>

            <div className="relative">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/20 custom-scrollbar">
                <table className="w-full text-left text-[10px] lg:text-[11px] min-w-[1300px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                      <th className="px-6 py-4 w-24">Item #</th>
                      <th className="px-6 py-4 w-40">NM / TAG</th>
                      <th className="px-6 py-4">Codigo / Descricao</th>
                      <th className="px-6 py-4 text-center w-24">Qtd PV</th>
                      {isEstoqueView && <th className="px-6 py-4 text-amber-500 text-center w-28">Estoque</th>}
                      <th className="px-6 py-4">Fornecedor</th>
                      {isEngenhariaView && (
                        <>
                          <th className="px-6 py-4 text-center w-28">Revisao</th>
                          <th className="px-6 py-4">Obs Eng.</th>
                          <th className="px-6 py-4 text-center w-40">Aprovar</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-center w-28">Moeda</th>
                      <th className="px-6 py-4 text-right w-32">Vlr Unit</th>
                      <th className="px-6 py-4 text-right w-32">Total Item</th>
                      {isComercialView && !isRecordLocked && <th className="px-6 py-4 text-center w-20">Acao</th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {(form.itensPV || []).map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="px-6 py-4 font-black text-slate-500">
                          {isComercialView && !isRecordLocked ? (
                            <input className="bg-slate-800 text-white px-3 py-1.5 rounded-lg w-full border border-slate-700" value={item.itemCliente} onChange={e => updateItem(item.id, 'itemCliente', e.target.value)} />
                          ) : `#${item.itemCliente || idx + 1}`}
                        </td>

                        <td className="px-6 py-4">
                          {isComercialView && !isRecordLocked ? (
                            <input className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg w-full border border-slate-700 font-bold uppercase" value={item.tag} onChange={e => updateItem(item.id, 'tag', e.target.value)} />
                          ) : <span className="text-slate-500 font-black uppercase">{item.tag || '---'}</span>}
                        </td>

                        <td className="px-6 py-4">
                          {isComercialView && !isRecordLocked ? (
                            <div className="space-y-1">
                              <input className="bg-slate-800 text-white px-3 py-1.5 rounded-lg w-full border border-slate-700 font-black uppercase" value={item.codigo} onChange={e => updateItem(item.id, 'codigo', e.target.value)} />
                              <input className="bg-slate-800 text-slate-500 px-3 py-1.5 rounded-lg w-full border border-slate-700 uppercase" value={item.descricao} onChange={e => updateItem(item.id, 'descricao', e.target.value)} />
                            </div>
                          ) : (
                            <div>
                              <span className="text-white font-black block">{item.codigo}</span>
                              <span className="text-slate-500 uppercase">{item.descricao}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isComercialView && !isRecordLocked ? (
                            <input type="number" min="1" className="w-16 bg-slate-800 text-white p-1.5 rounded-lg border border-slate-700 text-center font-black" value={item.quantidade} onChange={e => updateItem(item.id, 'quantidade', e.target.value)} />
                          ) : <span className="text-white font-black">{item.quantidade}</span>}
                        </td>

                        {isEstoqueView && (
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              min="0"
                              disabled={isRecordLocked}
                              className={`w-16 p-1.5 rounded-lg text-center font-black ${
                                isRecordLocked
                                  ? 'bg-slate-900 text-amber-300/60 border border-amber-500/10 opacity-60 cursor-not-allowed'
                                  : 'bg-slate-900 text-amber-500 border border-amber-500/30'
                              }`}
                              value={item.estoqueDisponivel || '0'}
                              onChange={e => updateItem(item.id, 'estoqueDisponivel', e.target.value)}
                            />
                          </td>
                        )}

                        <td className="px-6 py-4">
                          {isComercialView && !isRecordLocked ? (
                            <select className="bg-slate-800 text-white p-2 rounded-lg border border-slate-700 w-full font-bold" value={item.fornecedor} onChange={e => updateItem(item.id, 'fornecedor', e.target.value)}>
                              <option value="">FORNECEDOR...</option>
                              {suppliers?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          ) : <span className="text-emerald-500 font-black uppercase">{item.fornecedor || '---'}</span>}
                        </td>

                        {isEngenhariaView && (
                          <>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-black ${item.engineeringRevisionNumber === undefined || item.engineeringRevisionNumber === null ? 'text-amber-500' : 'text-emerald-400'}`}>
                                {item.engineeringRevisionNumber === undefined || item.engineeringRevisionNumber === null ? 'PENDENTE' : `REV ${item.engineeringRevisionNumber}`}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <input
                                className="bg-slate-800 text-white px-3 py-1.5 rounded-lg w-full border border-slate-700 uppercase"
                                placeholder="OBSERVACAO (OPCIONAL)"
                                readOnly={isRecordLocked}
                                value={item.engineeringObservation || ''}
                                onChange={e => updateItem(item.id, 'engineeringObservation', e.target.value)}
                              />
                            </td>

                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                disabled={isRecordLocked}
                                onClick={() => approveDrawing(item.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50"
                              >
                                Aprovar Desenho
                              </button>
                            </td>
                          </>
                        )}

                        <td className="px-6 py-4 text-center">
                          {isComercialView && !isRecordLocked ? (
                            <select className="bg-slate-800 text-white p-1.5 rounded-lg border border-slate-700 font-bold" value={item.moeda} onChange={e => updateItem(item.id, 'moeda', e.target.value as any)}>
                              <option value="USD">USD</option>
                              <option value="BRL">BRL</option>
                              <option value="EUR">EUR</option>
                            </select>
                          ) : <span className="text-white font-black">{item.moeda}</span>}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isComercialView && !isRecordLocked ? (
                            <input type="number" className="w-24 bg-slate-800 text-white p-1.5 rounded-lg border border-slate-700 font-black text-right" value={item.valorUnitario} onChange={e => updateItem(item.id, 'valorUnitario', e.target.value)} />
                          ) : <span className="text-white font-bold">{formatCurrency(item.valorUnitario, item.moeda)}</span>}
                        </td>

                        <td className="px-6 py-4 text-right text-emerald-400 font-black">
                          {formatCurrency(parseNum(item.quantidade) * parseNum(item.valorUnitario), item.moeda)}
                        </td>

                        {isComercialView && !isRecordLocked && (
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => setForm(f => ({...f, itensPV: f.itensPV?.filter(it => it.id !== item.id)}))} className="text-slate-500 hover:text-red-500 transition-colors">{ICONS.Close}</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="bg-slate-950/80 border-t border-slate-700">
                    <tr>
                      <td colSpan={Math.max(1, tableColumnCount - 3)} className="px-6 py-6 text-right">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Valores Consolidados do Pedido:</span>
                      </td>

                      <td colSpan={3} className="px-6 py-6 text-right">
                        <div className="flex flex-col gap-2">
                          {totalsByCurrency.USD > 0 && (
                            <div className="flex justify-end gap-3 items-center">
                              <span className="text-[9px] font-black text-blue-500/50 uppercase">TOTAL USD:</span>
                              <span className="text-xl font-black text-blue-400">{formatCurrency(totalsByCurrency.USD, 'USD')}</span>
                            </div>
                          )}
                          {totalsByCurrency.BRL > 0 && (
                            <div className="flex justify-end gap-3 items-center">
                              <span className="text-[9px] font-black text-emerald-500/50 uppercase">TOTAL BRL:</span>
                              <span className="text-xl font-black text-emerald-500">{formatCurrency(totalsByCurrency.BRL, 'BRL')}</span>
                            </div>
                          )}
                          {totalsByCurrency.EUR > 0 && (
                            <div className="flex justify-end gap-3 items-center">
                              <span className="text-[9px] font-black text-amber-500/50 uppercase">TOTAL EUR:</span>
                              <span className="text-xl font-black text-amber-500">{formatCurrency(totalsByCurrency.EUR, 'EUR')}</span>
                            </div>
                          )}
                          {!totalsByCurrency.USD && !totalsByCurrency.BRL && !totalsByCurrency.EUR && (
                            <span className="text-xl font-black text-slate-700">R$ 0,00</span>
                          )}
                        </div>
                      </td>

                      {isComercialView && !isRecordLocked && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center sm:items-start text-slate-500 text-[9px] font-black uppercase tracking-widest">
              <span>Imex Sentinel v4.1.0 Precision Master</span>
              {selectedId && <span className="text-emerald-500 animate-pulse mt-1">Sincronizacao em Tempo Real</span>}
            </div>

            {(!isRecordLocked || isAdmin) && selectedId && (
              <button onClick={handleSave} className="w-full sm:w-auto px-16 py-4 bg-[#04816E] text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all">
                SINCRONIZAR E AVANCAR PROCESSO
              </button>
            )}

            {isComercialView && !selectedId && (
              <button onClick={handleSave} className="w-full sm:w-auto px-16 py-4 bg-[#04816E] text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all">
                CRIAR NOVO PEDIDO MESTRE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentForms;
