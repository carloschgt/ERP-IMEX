import React, { useEffect, useMemo, useState } from 'react';
import { ImportRecord } from '../types';
import { ICONS } from '../constants';

type TVProcess =
  | 'ESTOQUE'
  | 'PLANEJAMENTO'
  | 'COMPRAS'
  | 'ENGENHARIA'
  | 'FINANCEIRO'
  | 'LOGISTICA';

const STORAGE_TV_PROCESS = 'imex_tv_process';
const STORAGE_SLAS = 'imex_slas';

const PROCESSOS: { id: TVProcess; label: string }[] = [
  { id: 'ESTOQUE', label: 'ESTOQUE' },
  { id: 'PLANEJAMENTO', label: 'PLANEJAMENTO' },
  { id: 'COMPRAS', label: 'COMPRAS' },
  { id: 'ENGENHARIA', label: 'ENGENHARIA' },
  { id: 'FINANCEIRO', label: 'FINANCEIRO' },
  { id: 'LOGISTICA', label: 'LOGISTICA' },
];

const STAGE_ENTRY_FIELD: Record<TVProcess, string> = {
  ESTOQUE: 'Data_Entrada_Estoque',
  PLANEJAMENTO: 'Data_Entrada_Planejamento',
  COMPRAS: 'Data_Entrada_Compras',
  ENGENHARIA: 'Data_Entrada_Engenharia',
  FINANCEIRO: 'Data_Entrada_Financeiro',
  LOGISTICA: 'Data_Entrada_Logistica',
};

// SLA em HORAS (padrão)
const DEFAULT_SLA_HOURS: Record<TVProcess, number> = {
  ESTOQUE: 24,
  PLANEJAMENTO: 24,
  COMPRAS: 72,
  ENGENHARIA: 48,
  FINANCEIRO: 24,
  LOGISTICA: 72,
};

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parsePtBRDateTimeToMs(s: string): number | null {
  // Aceita "23/12/2025 12:34:56" ou "23/12/2025, 12:34:56"
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const hh = Number(m[4]);
  const mi = Number(m[5]);
  const ss = Number(m[6] || 0);
  const d = new Date(yyyy, mm - 1, dd, hh, mi, ss);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function toMsAny(v: any): number | null {
  if (!v) return null;

  if (typeof v === 'number' && Number.isFinite(v)) return v;

  if (typeof v === 'string') {
    // 1) tenta Date padrão (ISO / yyyy-mm-dd)
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.getTime();

    // 2) tenta pt-BR
    const msPt = parsePtBRDateTimeToMs(v);
    if (msPt !== null) return msPt;
  }

  return null;
}

function fmtDuration(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getSlaHours(proc: TVProcess) {
  // CONFIG SEMPRE EM HORAS
  const cfg = safeParseJSON<Record<string, number>>(localStorage.getItem(STORAGE_SLAS), {});
  const raw = cfg?.[proc];
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_SLA_HOURS[proc];
}

function getEntryMs(r: ImportRecord, proc: TVProcess): number {
  const now = Date.now();
  const stageKey = STAGE_ENTRY_FIELD[proc];

  // Preferência: entrada do estágio -> lançamento -> última alteração ISO -> fallback
  const stageMs = toMsAny((r as any)[stageKey]);
  const launchMs = toMsAny((r as any).Data_Lancamento_PV) ?? toMsAny((r as any).Data_PV);
  const lastIsoMs = toMsAny((r as any).Data_Ult_Alteracao_ISO);

  // Regra anti-bug: nunca deixar entry antes do lançamento
  // e usar o mais recente entre stage/launch/last (mais confiável pro "tempo parado" atual)
  const candidates = [stageMs, launchMs, lastIsoMs].filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  if (candidates.length === 0) return now;

  let entry = Math.max(...candidates);

  // Sanidade: se vier do futuro (relógio/parse), corta no now
  if (entry > now) entry = now;

  return entry;
}

const StockTVPanel: React.FC<{ records: ImportRecord[] }> = ({ records }) => {
  const [processo, setProcesso] = useState<TVProcess>(() => {
    const saved = localStorage.getItem(STORAGE_TV_PROCESS) as TVProcess | null;
    return saved && PROCESSOS.some(p => p.id === saved) ? saved : 'ESTOQUE';
  });

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    localStorage.setItem(STORAGE_TV_PROCESS, processo);
  }, [processo]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const slaHours = useMemo(() => getSlaHours(processo), [processo]);

  const fila = useMemo(() => {
    const list = records
      .filter(r => (r as any).Status_Geral === processo)
      .map(r => {
        const entryMs = getEntryMs(r, processo);
        const ageMs = Math.max(0, now - entryMs);
        const ageHours = ageMs / 3600000;
        const remainingHours = slaHours - ageHours;
        const overdue = remainingHours < 0;

        return { r, ageMs, remainingHours, overdue };
      });

    // Ordena: atrasados primeiro, depois mais antigos
    list.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return b.ageMs - a.ageMs;
    });

    return list;
  }, [records, processo, now, slaHours]);

  const total = fila.length;
  const atrasados = fila.filter(x => x.overdue).length;
  const maisAntigo = fila[0]?.ageMs ?? 0;

  return (
    <div className="min-h-[calc(100vh-60px)] p-6 lg:p-10 bg-slate-950 text-white">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            {ICONS.Filter}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">Modo TV - Processos</p>
            <h1 className="text-2xl lg:text-4xl font-black uppercase tracking-tight">{processo}</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fila</p>
            <p className="text-xl font-black">{total}</p>
          </div>
          <div className={`px-5 py-3 rounded-2xl border ${atrasados > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-900 border-slate-800'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest ${atrasados > 0 ? 'text-red-400' : 'text-slate-500'}`}>Atrasados</p>
            <p className={`text-xl font-black ${atrasados > 0 ? 'text-red-400' : ''}`}>{atrasados}</p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mais antigo</p>
            <p className="text-xl font-black">{fmtDuration(maisAntigo)}</p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">SLA</p>
            <p className="text-xl font-black">{Math.round(slaHours)}h</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {PROCESSOS.map(p => {
          const active = p.id === processo;
          return (
            <button
              key={p.id}
              onClick={() => setProcesso(p.id)}
              className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                active
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.25)]'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/30'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">Pendências do processo</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Atualizando em tempo real</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-slate-950/70 border-b border-slate-800">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4 w-52">PV</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 w-52">Tempo no estágio</th>
                <th className="px-6 py-4 w-52">SLA</th>
                <th className="px-6 py-4 w-56">Última alteração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fila.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-slate-500 font-bold uppercase text-[11px]">
                    Nenhum PV pendente neste processo.
                  </td>
                </tr>
              )}

              {fila.map(({ r, ageMs, remainingHours, overdue }) => {
                const remainingMs = Math.abs(remainingHours) * 3600000;
                return (
                  <tr key={r.id} className={`transition-colors ${overdue ? 'bg-red-500/5' : 'hover:bg-slate-800/40'}`}>
                    <td className="px-6 py-5">
                      <p className="text-white font-black text-sm">{(r as any).PV || '---'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">PO: {(r as any).PO_Cliente || '---'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-200 font-black uppercase">{(r as any).Cliente || '---'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border ${
                        overdue ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                      }`}>
                        {fmtDuration(ageMs)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {overdue ? (
                        <span className="inline-flex px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border text-red-400 border-red-500/30 bg-red-500/10">
                          ATRASADO {fmtDuration(remainingMs)}
                        </span>
                      ) : (
                        <span className="inline-flex px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border text-slate-300 border-slate-700 bg-slate-950/30">
                          RESTA {fmtDuration(remainingMs)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-black text-slate-300 uppercase">{(r as any).Usuario_Ult_Alteracao || '---'}</p>
                      <p className="text-[10px] font-bold text-slate-600">{(r as any).Data_Ult_Alteracao || '---'}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
        <span className="opacity-80">Painel Operacional - IMEX</span>
        <span className="opacity-40">•</span>
        <span className="opacity-80">TV Processos</span>
      </div>
    </div>
  );
};

export default StockTVPanel;
