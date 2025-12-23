
import React, { useState, useEffect, useMemo } from 'react';
import { ImportRecord, SLAConfig } from '../types';
import { LOGO_SVG, COLORS, ICONS } from '../constants';
import { businessHoursBetween, formatDuration, getHolidays } from '../utils/businessTime';

interface Props {
  records: ImportRecord[];
  slas: SLAConfig;
  onBack: () => void;
}

const StockTVPanel: React.FC<Props> = ({ records, slas, onBack }) => {
  const [now, setNow] = useState(new Date());
  const holidays = useMemo(() => getHolidays(), []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const queue = useMemo(() => {
    // PVs que estão em posse do Estoque (ESTOQUE) ou saindo de TRIAGEM e ainda não concluídos fisicamente
    return records
      .filter(r => 
        (r.Status_Geral === 'ESTOQUE' || r.Status_Geral === 'TRIAGEM') && 
        r.Status_Estoque !== 'CONCLUIDO'
      )
      .map(r => {
        const start = new Date(r.Data_Entrada_Estoque || r.Data_Lancamento_PV || r.Data_Ult_Alteracao);
        const hoursElapsed = businessHoursBetween(start, now, holidays);
        const hoursRemaining = (slas.estoque || 24) - hoursElapsed;
        const isLate = hoursRemaining < 0;
        
        return { ...r, hoursElapsed, hoursRemaining, isLate };
      })
      .sort((a, b) => b.hoursElapsed - a.hoursElapsed);
  }, [records, slas, now, holidays]);

  const recentConcluded = useMemo(() => {
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return records
      .filter(r => r.Status_Estoque === 'CONCLUIDO' && r.Data_Conclusao_Estoque && new Date(r.Data_Conclusao_Estoque) > twentyFourHoursAgo)
      .sort((a, b) => new Date(b.Data_Conclusao_Estoque!).getTime() - new Date(a.Data_Conclusao_Estoque!).getTime())
      .slice(0, 8);
  }, [records, now]);

  return (
    <div className="fixed inset-0 bg-[#020617] text-white overflow-hidden p-12 flex flex-col font-sans">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-8 relative z-10">
        <div className="flex items-center gap-12">
          <div className="w-56" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div>
            <div className="flex items-center gap-4">
               <h1 className="text-5xl font-black uppercase tracking-tighter">Fila de Gate Física</h1>
               <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-[2px]">Sincronia v4.0.0</span>
               </div>
            </div>
            <p className="text-xl font-bold text-slate-500 uppercase tracking-[8px] mt-1 italic">Monitoramento de Disponibilidade em Tempo Real</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-7xl font-black tabular-nums tracking-tighter text-slate-100">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-lg font-black text-emerald-500 uppercase tracking-[4px] mt-1">{now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-12 overflow-hidden relative z-10">
        <div className="col-span-9 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black uppercase tracking-[5px] text-slate-400 flex items-center gap-4">
               Aguardando Conferência <span className="text-emerald-500 bg-emerald-500/10 px-4 py-1 rounded-2xl">{queue.length}</span>
            </h2>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-4 pb-10">
            {queue.map(item => (
              <div key={item.id} className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex items-start justify-between gap-8 ${item.isLate ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]' : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 shadow-xl'}`}>
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-5xl font-black block tracking-tighter text-white mb-1">{item.PV}</span>
                    <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">{item.Cliente}</span>
                    <span className="ml-4 text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700 font-black">{item.Status_Geral}</span>
                  </div>
                  
                  <div className="bg-black/20 p-5 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Escopo do PV ({item.itensPV?.length || 0} Itens)</p>
                    <div className="flex flex-wrap gap-3">
                      {item.itensPV?.slice(0, 6).map((it, idx) => (
                        <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex flex-col">
                          <span className="text-[10px] font-black text-emerald-400">{it.codigo}</span>
                          <span className="text-[9px] font-bold text-slate-400 truncate max-w-[150px] uppercase">{it.descricao}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right min-w-[280px]">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[3px] mb-2">SLA Restante</p>
                  <div className={`text-5xl font-black tabular-nums ${item.isLate ? 'text-red-500' : 'text-emerald-500'}`}>
                    {item.isLate ? `+ ${formatDuration(Math.abs(item.hoursRemaining))}` : formatDuration(item.hoursRemaining)}
                  </div>
                  <div className={`mt-2 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full inline-block ${item.isLate ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {item.isLate ? 'GATE EM ATRASO' : 'AGUARDANDO RECEBIMENTO'}
                  </div>
                </div>
              </div>
            ))}

            {queue.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <div className="scale-[3] mb-10 text-emerald-500">{ICONS.Check}</div>
                <h3 className="text-4xl font-black uppercase tracking-[10px]">Gate Limpo</h3>
                <p className="text-xl font-bold uppercase tracking-widest mt-4">Nenhuma pendência física detectada</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 flex flex-col overflow-hidden bg-slate-900/30 rounded-[3rem] border border-slate-800/50 p-8 backdrop-blur-md">
          <h2 className="text-xl font-black uppercase tracking-[4px] text-slate-500 mb-8 border-b border-slate-800 pb-4 flex items-center gap-3">
             {ICONS.Check} Liberados (24h)
          </h2>
          <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
            {recentConcluded.map(item => (
              <div key={item.id} className="flex flex-col gap-1 border-l-2 border-emerald-500/50 pl-4 py-1 opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-xl font-black tracking-tight text-slate-200">{item.PV}</span>
                <span className="text-xs font-bold text-slate-500 uppercase truncate">{item.Cliente}</span>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Liberado {new Date(item.Data_Conclusao_Estoque!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-8 flex justify-between items-center text-slate-600 font-bold uppercase tracking-[3px] relative z-10">
        <button onClick={onBack} className="text-sm hover:text-emerald-400 transition-all flex items-center gap-2 uppercase font-black">
          ← Voltar para Operação
        </button>
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-black uppercase">v4.0.0 Sentinel TV Monitoring</p>
        </div>
      </footer>
    </div>
  );
};

export default StockTVPanel;
