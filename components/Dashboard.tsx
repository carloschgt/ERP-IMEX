
import React, { useMemo, useState } from 'react';
import { ImportRecord, SLAConfig, PVItem } from '../types';
import { COLORS, ICONS, LOGO_SVG } from '../constants';
import { businessHoursBetween, getHolidays } from '../utils/businessTime';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend
} from 'recharts';

interface DashboardProps {
  records: ImportRecord[];
  slas: SLAConfig;
}

type TabType = 'GERAL' | 'SLA' | 'ESTOQUE' | 'FINANCEIRO';

const Dashboard: React.FC<DashboardProps> = ({ records, slas }) => {
  const [activeTab, setActiveTab] = useState<TabType>('GERAL');
  const holidays = useMemo(() => getHolidays(), []);

  const metrics = useMemo(() => {
    const finalizados = records.filter(r => r.Status_Pagamento === 'PAGO').length;
    const wip = {
      comercial: records.filter(r => !r.Status_Estoque).length,
      estoque: records.filter(r => r.Status_Estoque === 'PENDENTE').length,
      planejamento: records.filter(r => r.Status_Estoque === 'CONCLUIDO' && !r.SC).length,
      compras: records.filter(r => !!r.SC && !r.PC).length,
      financeiro: records.filter(r => !!r.PC && r.Status_Pagamento !== 'PAGO').length,
      finalizado: finalizados
    };
    return { total: records.length, wip, finalizados };
  }, [records]);

  const wipData = [
    { name: 'COM', val: metrics.wip.comercial },
    { name: 'EST', val: metrics.wip.estoque },
    { name: 'PLA', val: metrics.wip.planejamento },
    { name: 'CMP', val: metrics.wip.compras },
    { name: 'FIN', val: metrics.wip.financeiro }
  ];

  return (
    <div className="space-y-4 lg:space-y-8 animate-in fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h2 className="text-xl lg:text-3xl font-black text-slate-800 uppercase tracking-tighter">Cockpit Operacional</h2>
          <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-[2px] lg:tracking-[4px] mt-1 italic">Monitoramento em Tempo Real</p>
        </div>
        
        <div className="w-full lg:w-auto overflow-x-auto pb-2 custom-scrollbar">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex gap-1 min-w-max">
            {(['GERAL', 'SLA', 'ESTOQUE', 'FINANCEIRO'] as TabType[]).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-4 lg:px-8 py-2 lg:py-3 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard label="Total PVs" val={metrics.total} color="emerald" icon={ICONS.Records} />
        <StatCard label="Em Aberto" val={metrics.total - metrics.finalizados} color="amber" icon={ICONS.Refresh} />
        <StatCard label="Finalizados" val={metrics.finalizados} color="slate" icon={ICONS.Check} />
        <StatCard label="KPI Saúde" val="94%" color="blue" icon={ICONS.Trending} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        <section className="lg:col-span-8 bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] shadow-sm border border-slate-100">
           <h3 className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-8">Processos Pendentes por Etapa</h3>
           <div className="h-[250px] lg:h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={wipData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                 <Tooltip />
                 <Bar dataKey="val" fill={COLORS.IMEX_GREEN} radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </section>

        <section className="lg:col-span-4 bg-slate-900 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] shadow-2xl text-white">
           <h3 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-8">Metas de SLA (Horas)</h3>
           <div className="space-y-6 lg:space-y-8">
              <SlaStat label="Estoque" val="24h" perc={90} />
              <SlaStat label="Compras" val="72h" perc={60} color="red" />
              <SlaStat label="Logística" val="48h" perc={85} />
           </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color, icon }: any) => (
  <div className="bg-white p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl lg:text-3xl font-black text-slate-800 tracking-tighter">{val}</p>
    </div>
    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-${color}-500 bg-${color}-50`}>
      {icon}
    </div>
  </div>
);

const SlaStat = ({ label, val, perc, color = "emerald" }: any) => (
  <div>
    <div className="flex justify-between items-end mb-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-xs font-black text-${color}-400`}>{val}</span>
    </div>
    <div className="h-1.5 lg:h-2 w-full bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]`} style={{width: `${perc}%`}}></div>
    </div>
  </div>
);

export default Dashboard;
