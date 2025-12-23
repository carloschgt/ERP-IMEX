
import React, { useState, useEffect } from 'react';
import { SLAConfig } from '../types';
import { COLORS, ICONS } from '../constants';
import { getHolidays } from '../utils/businessTime';

interface Props {
  slas: SLAConfig;
  onSave: (slas: SLAConfig) => void;
}

const SLAConfigForm: React.FC<Props> = ({ slas, onSave }) => {
  const [localSlas, setLocalSlas] = useState(slas);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');

  useEffect(() => {
    setHolidays(getHolidays());
  }, []);

  const saveHolidays = () => {
    localStorage.setItem('imex_holidays', JSON.stringify(holidays));
    alert("Calendário de Feriados Atualizado!");
  };

  const addHoliday = () => {
    if (!newHoliday || holidays.includes(newHoliday)) return;
    setHolidays([...holidays, newHoliday].sort());
    setNewHoliday('');
  };

  const removeHoliday = (h: string) => {
    setHolidays(holidays.filter(x => x !== h));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800">
        <h2 className="text-white text-xl font-black uppercase tracking-tighter mb-10 flex items-center gap-4">
            <span className="text-emerald-500">{ICONS.Clock}</span> Alvos de Performance (SLA)
        </h2>

        <div className="space-y-6">
          <SlaInput 
            label="SLA Estoque (Horas Úteis)" 
            desc="SLA de 24h úteis ignora finais de semana e feriados."
            value={localSlas.estoque} 
            onChange={(v:any) => setLocalSlas({...localSlas, estoque: parseInt(v)})} 
          />
          <SlaInput label="SLA Compras (Dias)" desc="Alvo para geração do PC." value={localSlas.compras} onChange={(v:any) => setLocalSlas({...localSlas, compras: parseInt(v)})} />
          <SlaInput label="SLA Financeiro (Dias)" desc="Alvo para processar pagamentos." value={localSlas.financeiro} onChange={(v:any) => setLocalSlas({...localSlas, financeiro: parseInt(v)})} />
        </div>

        <button 
          onClick={() => { onSave(localSlas); alert('Alvos de SLA atualizados!'); }}
          className="w-full mt-10 py-5 bg-[#04816E] text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-xl"
        >
          Salvar Prazos
        </button>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <h2 className="text-slate-800 text-xl font-black uppercase tracking-tighter mb-10">Calendário de Feriados</h2>
        
        <div className="flex gap-4 mb-8">
            <input type="date" className="flex-1 px-5 py-3 border border-slate-200 rounded-xl font-bold text-xs" value={newHoliday} onChange={e => setNewHoliday(e.target.value)} />
            <button onClick={addHoliday} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">+ Adicionar</button>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 mb-8">
            {holidays.map(h => (
              <div key={h} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                <span className="text-xs font-black text-slate-700">{new Date(h).toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
                <button onClick={() => removeHoliday(h)} className="text-red-400 opacity-0 group-hover:opacity-100 font-black text-[10px] uppercase">Remover</button>
              </div>
            ))}
            {holidays.length === 0 && <p className="text-center text-slate-400 font-bold py-10 uppercase text-[10px]">Nenhum feriado configurado</p>}
        </div>

        <button onClick={saveHolidays} className="w-full py-5 border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[3px] hover:bg-slate-900 hover:text-white transition-all">
          Sincronizar Calendário
        </button>
      </div>
    </div>
  );
};

const SlaInput = ({ label, desc, value, onChange }: any) => (
  <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-2xl flex items-center justify-between gap-8">
    <div className="flex-1">
      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">{label}</label>
      <p className="text-[9px] text-slate-500 font-bold uppercase">{desc}</p>
    </div>
    <input type="number" className="w-24 bg-slate-900 border border-slate-700 text-white font-black text-center p-3 rounded-xl" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

export default SLAConfigForm;
