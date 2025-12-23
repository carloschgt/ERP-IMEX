
import React, { useMemo } from 'react';
import { User, UserRole, ViewType, ImportRecord } from '../types';
import { COLORS, ICONS, LOGO_SVG } from '../constants';

interface SidebarProps {
  user: User;
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onLogout: () => void;
  onExport: () => void;
  records?: ImportRecord[];
  isOpen?: boolean;
}

const SUPER_ADMIN_EMAIL = 'carlos.teixeira@imexsolutions.com.br';

const Sidebar: React.FC<SidebarProps> = ({ user, currentView, setView, onLogout, onExport, records = [], isOpen }) => {
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.department === 'ADMIN';
  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL || user.role === UserRole.SUPER_ADMIN;

  const counts = useMemo(() => ({
    estoque: records.filter(r => r.Status_Geral === 'ESTOQUE' && r.Status_Estoque !== 'CONCLUIDO').length,
    planejamento: records.filter(r => r.Status_Geral === 'PLANEJAMENTO' && !r.SC).length,
    compras: records.filter(r => r.Status_Geral === 'COMPRAS' && !r.PO).length,
    engenharia: records.filter(r => r.Status_Geral === 'ENGENHARIA').length,
    financeiro: records.filter(r => r.Status_Geral === 'FINANCEIRO').length,
    logistica: records.filter(r => r.Status_Geral === 'LOGISTICA').length
  }), [records]);

  const NavButton = ({ view, label, icon, departmentMatch, special, badge }: { view: ViewType, label: string, icon: React.ReactNode, departmentMatch?: string | string[], special?: boolean, badge?: number }) => {
    const isVisible = isAdmin || view === 'DASHBOARD' || (departmentMatch && (Array.isArray(departmentMatch) ? departmentMatch.includes(user.department) : user.department === departmentMatch));
    if (special && !isSuperAdmin) return null;
    if (!isVisible && !special) return null;

    const isActive = currentView === view;
    return (
      <button
        onClick={() => setView(view)}
        className={`w-full flex items-center justify-between px-6 py-3.5 transition-all relative group overflow-hidden ${
          isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
        } ${special ? 'mt-4 border-t border-slate-800/50 pt-6' : ''}`}
      >
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="absolute inset-y-2 left-0 w-1 rounded-r-full shadow-[0_0_20px_rgba(0,130,112,1)]" style={{ backgroundColor: special ? '#ef4444' : COLORS.IMEX_GREEN }}></div>
          )}
          <span className="transition-colors" style={{ color: isActive ? (special ? '#ef4444' : COLORS.IMEX_GREEN) : undefined }}>
            {icon}
          </span>
          <span className={`font-black text-[10px] tracking-[2px] uppercase ${special ? 'text-red-500' : ''}`}>{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(217,119,6,0.5)]">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 w-72 lg:static flex flex-col h-full bg-[#0F172A] z-[50] border-r border-slate-800 shadow-[25px_0_50px_rgba(0,0,0,0.3)]
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-8 mb-2 flex flex-col items-center">
        <div className="w-48 drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="mt-8 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pt-4 custom-scrollbar">
        <div className="px-8 mb-2 text-[9px] font-black text-slate-600 tracking-[4px] uppercase opacity-60">Operação</div>
        <NavButton view="DASHBOARD" label="Performance" icon={ICONS.Dashboard} />
        
        <div className="px-8 mt-6 mb-2 text-[9px] font-black text-slate-600 tracking-[4px] uppercase opacity-60">Processos</div>
        <NavButton view="COMERCIAL" label="Comercial" icon={ICONS.Plus} departmentMatch="COMERCIAL" />
        <NavButton view="ESTOQUE" label="Estoque (Gate)" icon={ICONS.Search} departmentMatch="ESTOQUE" badge={counts.estoque} />
        <NavButton view="PLANEJAMENTO" label="Planejamento" icon={ICONS.Filter} departmentMatch="PLANEJAMENTO" badge={counts.planejamento} />
        <NavButton view="COMPRAS" label="Compras" icon={ICONS.Records} departmentMatch="COMPRAS" badge={counts.compras} />
        <NavButton view="ENGENHARIA" label="Engenharia" icon={ICONS.File} departmentMatch="ENGENHARIA" badge={counts.engenharia} />
        <NavButton view="FINANCEIRO" label="Financeiro" icon={ICONS.Save} departmentMatch="FINANCEIRO" badge={counts.financeiro} />
        <NavButton view="LOGISTICA" label="Logística" icon={ICONS.Trending} departmentMatch="LOGISTICA" badge={counts.logistica} />
        <NavButton view="ESTOQUE_TV" label="Modo TV" icon={ICONS.Trending} />
        
        {isAdmin && (
          <>
            <div className="px-8 mt-6 mb-2 text-[9px] font-black text-slate-600 tracking-[4px] uppercase opacity-60">Admin</div>
            <NavButton view="FORNECEDORES" label="Fornecedores" icon={ICONS.Suppliers} />
            <NavButton view="SLA_CONFIG" label="SLA & Prazos" icon={ICONS.Clock} />
            <NavButton view="ADMIN" label="Segurança" icon={ICONS.Admin} />
            <button
              onClick={onExport}
              className="w-full flex items-center gap-3 px-6 py-3.5 transition-all duration-200 text-left text-slate-100 hover:bg-slate-800/60"
              title="Exportar toda a base em CSV (backup)"
            >
              {/* Reaproveita ícone do Excel */}
              {ICONS.Excel}
              <span className="font-black text-[10px] tracking-[2px] uppercase">Exportar Base CSV</span>
            </button>
          </>
        )}

        {isSuperAdmin && (
          <NavButton view="SUPER_ADMIN_PANEL" label="Intervenção" icon={ICONS.Close} special />
        )}
      </nav>

      <div className="p-6 bg-slate-900/40 border-t border-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black bg-[#008270] shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-[10px] font-black truncate uppercase">{user.name}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">{user.department}</span>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition-all text-[9px] font-black uppercase tracking-widest">
          {ICONS.Logout} <span>Deslogar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;