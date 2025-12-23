
import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Users, 
  LogOut, 
  FileSpreadsheet, 
  Search, 
  Save, 
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  TrendingUp,
  PlusCircle,
  FileText,
  MessageSquare,
  Sparkles,
  Bot,
  Send,
  X,
  Truck
} from 'lucide-react';

// Cores oficiais extraídas diretamente do logo enviado
export const COLORS = {
  IMEX_GREEN: '#008270', // Verde oficial exato
  IMEX_GRAY: '#626669',  // Cinza oficial exato
  BG_MAIN: '#F8FAFC',
  SIDEBAR_DARK: '#0F172A',
  CARD_WHITE: '#FFFFFF',
  INPUT_DARK: '#334155', 
  TEXT_MUTED: '#64748B'
};

/**
 * Logo Oficial IMEX Solutions recriado em SVG de Alta Fidelidade.
 */
export const LOGO_SVG = `
<svg viewBox="0 0 500 220" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; display: block;">
  <g fill="#008270" transform="translate(10, 20)">
    <rect x="20" y="40" width="36" height="100"/>
    <path d="M72 40h34l24 45 24-45h34v100h-28V85l-30 55-30-55v55H72z"/>
    <path d="M205 40h95v25h-60v12h50v24h-50v14h65v25h-100z"/>
  </g>
  <g transform="translate(10, 20)">
    <path d="M305 40l45 50-45 50h40l30-35-30-35z" fill="#626669"/>
    <path d="M360 40l50 100h-40l-15-30-25 30h-40l45-50-45-50h40l20 25z" fill="#008270"/>
  </g>
  <g transform="translate(470, 65)">
    <circle r="8" fill="none" stroke="#008270" stroke-width="1.2"/>
    <text y="3" font-family="Arial, sans-serif" font-size="10" fill="#008270" text-anchor="middle" font-weight="bold">R</text>
  </g>
  <text x="32" y="195" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="#626669" letter-spacing="14" font-weight="bold">SOLUTIONS</text>
</svg>
`;

export const ICONS = {
  Dashboard: <LayoutDashboard size={18} />,
  Records: <Database size={18} />,
  Admin: <Users size={18} />,
  Logout: <LogOut size={18} />,
  Excel: <FileSpreadsheet size={18} />,
  Search: <Search size={18} />,
  Save: <Save size={18} />,
  Refresh: <RefreshCw size={18} />,
  Warning: <AlertTriangle size={18} />,
  Clock: <Clock size={18} />,
  Check: <CheckCircle2 size={18} />,
  Filter: <Filter size={18} />,
  Trending: <TrendingUp size={18} />,
  Plus: <PlusCircle size={18} />,
  File: <FileText size={18} />,
  Chat: <MessageSquare size={20} />,
  Sparkles: <Sparkles size={16} />,
  Bot: <Bot size={20} />,
  Send: <Send size={18} />,
  Close: <X size={20} />,
  Suppliers: <Truck size={18} />
};
