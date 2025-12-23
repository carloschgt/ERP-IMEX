import React, { useEffect, useMemo, useState } from 'react';
import { ImportRecord, SLAConfig } from '../types';
import { LOGO_SVG, ICONS, COLORS } from '../constants';
import { businessHoursBetween, formatDuration, getHolidays } from '../utils/businessTime';

type ProcessKey =
  | 'COMERCIAL'
  | 'ESTOQUE'
  | 'PLANEJAMENTO'
  | 'COMPRAS'
  | 'ENGENHARIA'
  | 'FINANCEIRO'
  | 'LOGISTICA';

interface Props {
  records: ImportRecord[];
  slas: SLAConfig;
  onBack: () => void;
}

const PROCESS_ORDER: ProcessKey[] = [
  'COMERCIAL',
  'ESTOQUE',
  'PLANEJAMENTO',
  'COMPRAS',
  'ENGENHARIA',
  'FINANCEIRO',
  'LOGISTICA'
];

function norm(v?: string) {
  return (v ?? '').toString().trim();
}

function getInitialProcess(): ProcessKey {
  const qs = new URLSearchParams(window.location.search);
  const p = (qs.get('process') || '').toUpperCase().trim();
  if (PROCESS_ORDER.includes(p as ProcessKey)) return p as ProcessKey;

  const stored = (localStorage.getItem('imex_tv_process') || '').toUpperCase().trim();
  if (PROCESS_ORDER.includes(stored as ProcessKey)) return stored as ProcessKey;

  return 'ESTOQUE';
}

function processLabel(p: ProcessKey) {
  switch (p) {
    case 'COMERCIAL':
      return 'Comercial';
    case 'ESTOQUE':
      return 'Estoque';
    case 'PLANEJAMENTO':
      return 'Planejamento';
    case 'COMPRAS':
      return 'Compras';
    case 'ENGENHARIA':
      return 'Engenharia';
    case 'FINANCEIRO':
      return 'Financeiro';
    case 'LOGISTICA':
      return 'Logística';
  }
}

function actionLabel(p: ProcessKey) {
  switch (p) {
    case 'COMERCIAL':
      return 'Cadastrar PV e itens / fornecedor';
    case 'ESTOQUE':
      return 'Verificar estoque (Gate) e concluir';
    case 'PLANEJAMENTO':
      return 'Vincular SC ao PV';
    case 'COMPRAS':
      return 'Vincular PO (e data) à SC';
    case 'ENGENHARIA':
      return 'Aprovar desenho / revisão';
    case 'FINANCEIRO':
      return 'Registrar pagamentos / plano';
    case 'LOGISTICA':
      return 'Atualizar ETD/ETA, coleta e status logístico';
  }
}

function processIcon(p: ProcessKey) {
  switch (p) {
    case 'COMERCIAL':
      return ICONS.Plus;
    case 'ESTOQUE':
      return ICONS.Search;
    case 'PLANEJAMENTO':
      return ICONS.Filter;
    case 'COMPRAS':
      return ICONS.Records;
    case 'ENGENHARIA':
      return ICONS.File;
    case 'FINANCEIRO':
      return ICONS.Save;
    case 'LOGISTICA':
      return ICONS.Trending;
  }
}

function slaHoursForProcess(p: ProcessKey, slas: SLAConfig) {
  // Convenção atual do projeto:
  // - slas.estoque já está em HORAS
  // - slas.compras/financeiro/logistica estão em DIAS (converter para horas)
  const daysToHours = (d: number) => d * 24;

  switch (p) {
    case 'ESTOQUE':
      return slas.estoque || 24;
    case 'COMPRAS':
      return daysToHours(slas.compras || 3);
    case 'FINANCEIRO':
      return daysToHours(slas.financeiro || 3);
    case 'LOGISTICA':
      return daysToHours(slas.logistica || 2);
    case 'COMERCIAL':
      return 24;
    case 'PLANEJAMENTO':
      return 24;
    case 'ENGENHARIA':
      return 48;
  }
}

function startDateForProcess(r: ImportRecord, p: ProcessKey) {
  // tenta usar “datas de entrada” quando existirem; cai para Data_Ult_Alteracao/Data_Lancamento_PV
  const fallback = norm(r.Data_Lancamento_PV) || norm(r.Data_Ult_Alteracao) || norm(r.Data_PV);
  const pick = (v?: string) => (norm(v) ? new Date(v as string) : null);

  if (p === 'ESTOQUE') return pick(r.Data_Entrada_Estoque) || pick(fallback) || new Date();
  if (p === 'COMPRAS') return pick(r.Data_Entrada_Compras) || pick(r.Data_SC) || pick(fallback) || new Date();
  if (p === 'FINANCEIRO') return pick(r.Data_Entrada_Financeiro) || pick(r.Data_PC) || pick(fallback) || new Date();
  if (p === 'PLANEJAMENTO') return pick(r.Data_Conclusao_Estoque) || pick(r.Data_Entrada_Estoque) || pick(fallback) || new Date();
  return pick(fallback) || new Date();
}

function isPendingForProcess(r: ImportRecord, p: ProcessKey) {
  const sg = norm(r.Status_Geral).toUpperCase();

  // Prioridade: se Status_Geral estiver preenchido, ele manda.
  if (sg) return sg === p;

  // Fallbacks (quando Status_Geral não está confiável/preenchido)
  if (p === 'COMERCIAL') return !norm(r.Status_Estoque); // ainda não entrou no gate
  if (p === 'ESTOQUE') return norm(r.Status_Estoque).toUpperCase() !== 'CONCLUIDO';
  if (p === 'PLANEJAMENTO') return norm(r.Status_Estoque).toUpperCase() === 'CONCLUIDO' && !norm(r.SC);
  if (p === 'COMPRAS') return !!norm(r.SC) && !norm(r.PO);
  if (p === 'FINANCEIRO') return !!norm(r.PO) && norm(r.Status_Pagamento).toUpperCase() !== 'PAGO';
  if (p === 'LOGISTICA') return norm(r.Status_Pagamento).toUpperCase() === 'PAGO' && (!norm(r.ETD) || !norm(r.ETA));
  if (p === 'ENGENHARIA') return false;

  return false;
}

const StockTVPanel: React.FC<Props> = ({ records, slas, onBack }) => {
  const [now, setNow] = useState(new Date());
  const holidays = useMemo(() => getHolidays(), []);
  const [process, setProcess] = useState<ProcessKey>(() => getInitialProcess());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('imex_tv_process', process);
  }, [process]);

  const counts = useMemo(() => {
    const out: Record<ProcessKey, number> = {
      COMERCIAL: 0,
      ESTOQUE: 0,
      PLANEJAMENTO: 0,
      COMPRAS: 0,
      ENGENHARIA: 0,
      FINANCEIRO: 0,
      LOGISTICA: 0
    };
    for (const p of PROCESS_ORDER) out[p] = records.filter(r => isPendingForProcess(r, p)).length;
    return out;
  }, [records]);

  const queue = useMemo(() => {
    const slaHours = slaHoursForProcess(process, slas);

    return records
      .filter(r => isPendingForProcess(r, process))
      .map(r => {
        const start = startDateForProcess(r, process);
        const hoursElapsed = businessHoursBetween(start, now, holidays);
        const hoursRemaining = slaHours - hoursElapsed;
        const isLate = hoursRemaining < 0;
        return { ...r, hoursElapsed, hoursRemaining, isLate };
      })
      .sort((a, b) => b.hoursElapsed - a.hoursElapsed);
  }, [records, process, slas, now, holidays]);

  const topBar = (
    <div className="flex flex-wrap gap-3 mt-6">
      {PROCESS_ORDER.map(p => {
        const active = p === process;
        return (
          <button
            key={p}
            onClick={() => setProcess(p)}
            className={`px-5 py-3 rounded-2xl border transition-all flex items-center gap-3 font-black uppercase tracking-[2px] text-[10px]
              ${active ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)]' : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-600'}
            `}
            title={`Filtrar modo TV por ${processLabel(p)}`}
          >
            <span className="opacity-90">{processIcon(p)}</span>
            <span>{processLabel(p)}</span>
            {counts[p] > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] shadow-[0_0_10px_rgba(217,119,6,0.35)]">
                {counts[p]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#020617] text-white overflow-hidden p-10 lg:p-12 flex flex-col font-sans">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="flex flex-col gap-6 border-b border-slate-800 pb-8 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-10">
            <div className="w-52" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">
                  Modo TV — {processLabel(process)}
                </h1>
                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-[2px]">
                    Painel Operacional — IMEX
                  </span>
                </div>
              </div>
              <p className="text-sm lg:text-base font-bold text-slate-500 uppercase tracking-[6px] mt-1 italic">
                Selecione o processo para ver pendências e aging (SLA)
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-6xl lg:text-7xl font-black tabular-nums tracking-tighter text-slate-100">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-base lg:text-lg font-black text-emerald-400 uppercase tracking-[4px] mt-1">
              {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
        </div>

        {topBar}
      </header>

      <main className="flex-1 grid grid-cols-12 gap-10 overflow-hidden relative z-10 pt-10">
        <div className="col-span-12 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-[5px] text-slate-400 flex items-center gap-4">
              Pendências — {processLabel(process)}
              <span className="text-emerald-400 bg-emerald-500/10 px-4 py-1 rounded-2xl">
                {queue.length}
              </span>
            </h2>

            <div className="bg-black/20 border border-slate-800/50 rounded-2xl px-5 py-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ação esperada</p>
              <p className="text-sm font-bold text-slate-200">{actionLabel(process)}</p>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-3 pb-10">
            {queue.map(item => (
              <div
                key={item.id}
                className={`p-7 rounded-[2.25rem] border transition-all duration-300 flex items-start justify-between gap-8 ${
                  item.isLate
                    ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.10)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 shadow-xl'
                }`}
              >
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-4xl lg:text-5xl font-black block tracking-tighter text-white mb-1">
                      {item.PV}
                    </span>
                    <span className="text-base lg:text-lg font-bold text-slate-500 uppercase tracking-widest">
                      {item.Cliente}
                    </span>
                    <span className="ml-4 text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700 font-black uppercase">
                      {norm(item.Status_Geral) || '—'}
                    </span>
                  </div>

                  <div className="bg-black/20 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Escopo do PV ({item.itensPV?.length || 0} itens)
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {item.itensPV?.slice(0, 6).map((it, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex flex-col"
                        >
                          <span className="text-[10px] font-black text-emerald-300">{it.codigo}</span>
                          <span className="text-[9px] font-bold text-slate-300 truncate max-w-[180px] uppercase">
                            {it.descricao}
                          </span>
                        </div>
                      ))}
                      {(item.itensPV?.length || 0) > 6 && (
                        <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-black text-slate-300">
                          +{(item.itensPV?.length || 0) - 6} itens…
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right min-w-[290px]">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[3px] mb-2">SLA Restante</p>
                  <div className={`text-5xl font-black tabular-nums ${item.isLate ? 'text-red-400' : 'text-emerald-400'}`}>
                    {item.isLate ? `+ ${formatDuration(Math.abs(item.hoursRemaining))}` : formatDuration(item.hoursRemaining)}
                  </div>
                  <div className={`mt-2 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full inline-block ${item.isLate ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {item.isLate ? 'EM ATRASO' : 'DENTRO DO SLA'}
                  </div>

                  <div className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[3px]">
                    Aging: <span className="text-slate-200">{formatDuration(item.hoursElapsed)}</span>
                  </div>
                </div>
              </div>
            ))}

            {queue.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <div className="scale-[3] mb-10 text-emerald-500">{ICONS.Check}</div>
                <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-[10px]">
                  Sem Pendências
                </h3>
                <p className="text-lg lg:text-xl font-bold uppercase tracking-widest mt-4">
                  Nada aguardando ação neste processo
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-6 flex justify-between items-center text-slate-600 font-bold uppercase tracking-[3px] relative z-10">
        <button onClick={onBack} className="text-sm hover:text-emerald-300 transition-all flex items-center gap-2 uppercase font-black">
          ← Voltar para Operação
        </button>
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-black uppercase">TV • {processLabel(process)} • {COLORS.IMEX_GREEN}</p>
        </div>
      </footer>
    </div>
  );
};

export default StockTVPanel;
