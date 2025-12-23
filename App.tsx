
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import DepartmentForms from './components/DepartmentForms';
import AdminPortal from './components/AdminPortal';
import SLAConfigForm from './components/SLAConfigForm';
import AIAssistant from './components/AIAssistant';
import SupplierManagement from './components/SupplierManagement';
import SuperAdminPanel from './components/SuperAdminPanel';
import StockTVPanel from './components/StockTVPanel';
import { User, UserRole, ViewType, ImportRecord, SLAConfig, Supplier } from './types';

const SUPER_USER: User = { 
  email: 'carlos.teixeira@imexsolutions.com.br', 
  name: 'Carlos Teixeira', 
  role: UserRole.SUPER_ADMIN, 
  department: 'ADMIN', 
  lastLogin: new Date().toLocaleString(),
  passwordChangedAt: new Date().toISOString()
};

const SAMPLE_RECORDS: ImportRecord[] = [
  {
    id: 'sim-1',
    PV: 'PV25-001',
    Cliente: 'VALE S.A.',
    PO_Cliente: 'PO-VALE-2025-X',
    Data_PV: '2025-02-10',
    Data_Lancamento_PV: '2025-02-10T10:00:00Z',
    Prazo_Contrato: '15',
    Status_Geral: 'TRIAGEM',
    Usuário_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '10/02/2025 10:00',
    itensPV: [
      { id: 'it-1', codigo: 'VAL-001', itemCliente: '10', tag: 'V-01', descricao: 'VÁLVULA ESFERA 2"', quantidade: '5', valorUnitario: '1200', moeda: 'USD', fornecedor: 'EMERSON' }
    ],
    auditTrail: [], attachments: [], paymentRequests: [], paymentPlan: [], pagamentosFornecedores: [], SC: ''
  },
  {
    id: 'sim-2',
    PV: 'PV25-002',
    Cliente: 'PETROBRAS',
    PO_Cliente: '4500123456',
    Data_PV: '2025-02-12',
    Data_Lancamento_PV: '2025-02-12T08:00:00Z',
    Prazo_Contrato: '30',
    Status_Geral: 'ESTOQUE',
    Status_Estoque: 'PENDENTE',
    Usuário_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '12/02/2025 14:00',
    itensPV: [
      { id: 'it-2', codigo: 'MNF-500', itemCliente: '1', tag: 'PT-102', descricao: 'MANIFOLD 5 VIAS', quantidade: '2', valorUnitario: '850', moeda: 'USD', fornecedor: 'PARKER' }
    ],
    auditTrail: [], attachments: [], paymentRequests: [], paymentPlan: [], pagamentosFornecedores: [], SC: ''
  },
  {
    id: 'sim-3',
    PV: 'PV25-003',
    Cliente: 'SUZANO PAPEL',
    PO_Cliente: 'PO-SZ-112',
    Data_PV: '2025-02-14',
    Data_Lancamento_PV: '2025-02-14T09:00:00Z',
    Prazo_Contrato: '45',
    Status_Geral: 'COMPRAS',
    SC: 'SC-2025-001',
    Usuário_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '15/02/2025 09:30',
    itensPV: [
      { id: 'it-3', codigo: 'MOT-002', itemCliente: '5', tag: 'M-02', descricao: 'MOTOR WEG 50CV', quantidade: '1', valorUnitario: '15000', moeda: 'BRL', fornecedor: 'WEG' }
    ],
    auditTrail: [], attachments: [], paymentRequests: [], paymentPlan: [], pagamentosFornecedores: []
  },
  {
    id: 'sim-4',
    PV: 'PV25-004',
    Cliente: 'GERDAU',
    PO_Cliente: 'GER-445',
    Data_PV: '2025-01-20',
    Data_Lancamento_PV: '2025-01-20T10:00:00Z',
    Prazo_Contrato: '60',
    Status_Geral: 'FINALIZADO',
    Status_Pagamento: 'PAGO',
    Usuário_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '18/02/2025 16:20',
    itensPV: [
      { id: 'it-4', codigo: 'T-99', itemCliente: '1', tag: 'TAG-FINAL', descricao: 'TRANSFORMADOR 15KV', quantidade: '1', valorUnitario: '45000', moeda: 'BRL', fornecedor: 'ABB' }
    ],
    auditTrail: [], attachments: [], paymentRequests: [], paymentPlan: [], pagamentosFornecedores: [], SC: ''
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [slas, setSlas] = useState<SLAConfig>({ estoque: 24, compras: 3, financeiro: 2, logistica: 45 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  // =============================================================
  // 🔐 Sessão (persistência local) + modo demo (?demo=1)
  // =============================================================
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const demo = urlParams.get('demo') === '1';
      const savedUser = localStorage.getItem('imex_session_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else if (demo) {
        setUser(SUPER_USER);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tv') === 'estoque') {
      setCurrentView('ESTOQUE_TV');
    }

    const savedRecords = localStorage.getItem('imex_records');
    const savedSlas = localStorage.getItem('imex_slas');
    const savedSuppliers = localStorage.getItem('imex_suppliers');
    
    if (savedSlas) setSlas(JSON.parse(savedSlas));
    
    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    } else {
      const defaultSupps: Supplier[] = [
        { id: '1', name: 'EMERSON' }, { id: '2', name: 'PARKER' }, { id: '3', name: 'WEG' }, { id: '4', name: 'ABB' }
      ];
      setSuppliers(defaultSupps);
      localStorage.setItem('imex_suppliers', JSON.stringify(defaultSupps));
    }
    
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    } else {
      setRecords(SAMPLE_RECORDS);
      localStorage.setItem('imex_records', JSON.stringify(SAMPLE_RECORDS));
    }

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'imex_records' && e.newValue) {
        setRecords(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const updateRecords = (newRecords: ImportRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('imex_records', JSON.stringify(newRecords));
  };

  
  const persistSessionUser = (u: User) => {
    const safeUser: any = { ...u };
    delete safeUser.password;
    try {
      localStorage.setItem('imex_session_user', JSON.stringify(safeUser));
    } catch {
      // ignore
    }
  };

  const handleLogin = (u: User) => {
    setUser(u);
    persistSessionUser(u);
  };

  const canAccessView = (u: User, v: ViewType) => {
    if (u.role === UserRole.SUPER_ADMIN) return true;
    if (u.role === UserRole.ADMIN) return true;

    if (v === 'DASHBOARD' || v === 'ESTOQUE_TV') return true;

    const map: Partial<Record<ViewType, User['department']>> = {
      COMERCIAL: 'COMERCIAL',
      ESTOQUE: 'ESTOQUE',
      PLANEJAMENTO: 'PLANEJAMENTO',
      COMPRAS: 'COMPRAS',
      ENGENHARIA: 'ENGENHARIA',
      FINANCEIRO: 'FINANCEIRO',
      LOGISTICA: 'LOGISTICA',
    };

    const needed = map[v];
    if (!needed) return false;
    return u.department === needed;
  };

  const safeSetView = (v: ViewType) => {
    if (!user) return;
    if (!canAccessView(user, v)) {
      alert('Acesso negado: você não tem permissão para este módulo.');
      return;
    }
    setCurrentView(v);
  };

  const exportAllRecordsCSV = () => {
    if (!records || records.length === 0) {
      alert('Não há registros para exportar.');
      return;
    }

    const allKeys = Array.from(new Set(records.flatMap(r => Object.keys(r as any))));
    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = (typeof val === 'object') ? JSON.stringify(val) : String(val);
      const needsQuote = /[;"\n\r]/.test(s);
      const cleaned = s.replace(/"/g, '""');
      return needsQuote ? `"${cleaned}"` : cleaned;
    };

    const header = allKeys.join(';');
    const rows = records.map(r => allKeys.map(k => escape((r as any)[k])).join(';'));
    const content = "sep=;\n" + header + "\n" + rows.join("\n");

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `imex_base_${stamp}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem('imex_session_user'); } catch {}
    setCurrentView('DASHBOARD');
  };

  if (!user && currentView !== 'ESTOQUE_TV') return <Login onLogin={handleLogin} />;

  if (currentView === 'ESTOQUE_TV') {
    return <StockTVPanel records={records} slas={slas} onBack={() => setCurrentView('DASHBOARD')} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden relative">
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <Sidebar 
        user={user!} 
        currentView={currentView} 
        setView={(v) => { safeSetView(v); setIsMenuOpen(false); }} 
        onLogout={handleLogout}
        onExport={exportAllRecordsCSV}
        records={records}
        isOpen={isMenuOpen}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Topbar 
          user={user!} 
          currentView={currentView} 
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto pb-20">
            {currentView === 'DASHBOARD' && <Dashboard records={records} slas={slas} />}
            {currentView === 'FORNECEDORES' && <SupplierManagement suppliers={suppliers} onUpdate={(s) => { setSuppliers(s); localStorage.setItem('imex_suppliers', JSON.stringify(s)); }} />}
            {['COMERCIAL', 'ESTOQUE', 'PLANEJAMENTO', 'COMPRAS', 'ENGENHARIA', 'FINANCEIRO', 'LOGISTICA'].includes(currentView) && (
              <DepartmentForms 
                key={currentView}
                view={currentView as any} 
                records={records} 
                setRecords={updateRecords} 
                user={user!} 
                suppliers={suppliers} 
              />
            )}
            {currentView === 'ADMIN' && <AdminPortal records={records} onImport={updateRecords} />}
            {currentView === 'SLA_CONFIG' && <SLAConfigForm slas={slas} onSave={(s) => { setSlas(s); localStorage.setItem('imex_slas', JSON.stringify(s)); }} />}
            {currentView === 'SUPER_ADMIN_PANEL' && <SuperAdminPanel records={records} onUpdate={updateRecords} user={user!} />}
          </div>
        </main>
      </div>
      
      <AIAssistant records={records} />
    </div>
  );
};

export default App;
