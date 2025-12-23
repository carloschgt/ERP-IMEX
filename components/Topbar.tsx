
import React from 'react';
import { User, ViewType } from '../types';
import { COLORS, ICONS } from '../constants';
import { Menu } from 'lucide-react';

interface TopbarProps {
  user: User;
  currentView: ViewType;
  onMenuToggle?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, currentView, onMenuToggle }) => {
  const getTitle = () => {
    switch (currentView) {
      case 'DASHBOARD': return 'Performance';
      case 'ADMIN': return 'Administração';
      case 'COMERCIAL': return 'Comercial';
      case 'COMPRAS': return 'Compras';
      case 'FINANCEIRO': return 'Financeiro';
      case 'LOGISTICA': return 'Logística';
      case 'ESTOQUE': return 'Estoque';
      case 'PLANEJAMENTO': return 'Planejamento';
      default: return 'IMEX Solutions';
    }
  };

  return (
    <header className="h-16 lg:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-10 shadow-sm z-20">
      <div className="flex items-center gap-3 lg:gap-6">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-slate-600 focus:outline-none"
          aria-label="Abrir Menu"
        >
          <Menu size={24} />
        </button>
        
        <h2 className="text-xs lg:text-sm font-black text-gray-800 uppercase tracking-[2px] lg:tracking-[4px]">{getTitle()}</h2>
        
        <div className="hidden lg:block h-8 w-px bg-gray-100"></div>
        
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Ambiente:</span>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Produção</span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-1.5 lg:py-2 bg-slate-900 rounded-lg lg:rounded-xl border border-slate-800 shadow-lg">
           <span className="hidden xs:inline text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest">v</span>
           <span className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-widest">3.7.0-SENTINEL</span>
        </div>
        
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">Governança</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
            <span className="text-[9px] font-black text-gray-700 tracking-tighter uppercase">Sentinel Ativo</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
