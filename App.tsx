import React, { useEffect, useState } from 'react';
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

// =============================================================
// LocalStorage Keys (centralizado)
// =============================================================
const STORAGE = {
  RECORDS: 'imex_records',
  SESSION_USER: 'imex_session_user',
  SLAS: 'imex_slas',
  SUPPLIERS: 'imex_suppliers',
  USERS: 'imex_users',
  TV_PROCESS: 'imex_tv_process',
} as const;

// =============================================================
// Super User (demo / admin total)
// =============================================================
const SUPER_USER: User = {
  email: 'carlos.teixeira@imexsolutions.com.br',
  name: 'Carlos Teixeira',
  role: UserRole.SUPER_ADMIN,
  department: 'ADMIN',
  lastLogin: new Date().toLocaleString(),
  passwordChangedAt: new Date().toISOString(),
};

// =============================================================
// Usuários de teste (USER) para validar travas do Patch2
// Login deve usar imex_users + password para autenticar
// =============================================================
const TEST_PASSWORD = '1234';

const DEFAULT_TEST_USERS: User[] = [
  {
    email: 'comercial@imexsolutions.com.br',
    name: 'Teste Comercial',
    role: UserRole.USER,
    department: 'COMERCIAL',
    password: TEST_PASSWORD,
    lastLogin: '',
    passwordChangedAt: new Date().toISOString(),
  },
  {
    email: 'estoque@imexsolutions.com.br',
    name: 'Teste Estoque',
    role: UserRole.USER,
    department: 'ESTOQUE',
    password: TEST_PASSWORD,
    lastLogin: '',
    passwordChangedAt: new Date().toISOString(),
  },
  {
    email: 'planejamento@imexsolutions.com.br',
    name: 'Teste Planejamento',
    role: UserRole.USER,
    department: 'PLANEJAMENTO',
    password: TEST_PASSWORD,
    lastLogin: '',
    passwordChangedAt: new Date().toISOString(),
  },
  {
    email: 'compras@imexsolutions.com.br',
    name: 'Teste Compras',
    role: UserRole.USER,
    department: 'COMPRAS',
    password: TEST_PASSWORD,
    lastLogin: '',
    passwordChangedAt: new Date().toISOString(),
  },
  {
    email: 'engenharia@imexsolutions.com.br',
    name: 'Teste Engenharia',
    role: UserRole.USER,
    department: 'ENGENHARIA',
    password: TEST_PASSWORD,
    lastLogin: '',
    passwordChangedAt: new Date().toISOString(),
  },
  {
    email: 'financeiro@imexsolutions.com.br',
    name: 'Teste Financeiro',
    role: UserRole.USER,
    department: 'FINANCEIRO',
    password: TEST_PASSWORD,
    lastLogin: '',
    passwordChangedAt: new Date().toISOString(),
  },
  {
    email: 'logistica@imexsolutions.com.br',
    name: 'Teste Logistica',
    role: UserRole.USER,
    department: 'LOGISTICA',
    password: TEST_PASSWORD,
    lastLogin: '',
    passwordChangedAt: new Date().toISOString(),
  },
];

// =============================================================
// Seeds / Sample data
// =============================================================
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
    Usuario_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '10/02/2025 10:00',
    itensPV: [
      {
        id: 'it-1',
        codigo: 'VAL-001',
        itemCliente: '10',
        tag: 'V-01',
        descricao: 'VALVULA ESFERA 2"',
        quantidade: '5',
        valorUnitario: '1200',
        moeda: 'USD',
        fornecedor: 'EMERSON',
      },
    ],
    auditTrail: [],
    attachments: [],
    paymentRequests: [],
    paymentPlan: [],
    pagamentosFornecedores: [],
    SC: '',
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
    Usuario_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '12/02/2025 14:00',
    itensPV: [
      {
        id: 'it-2',
        codigo: 'MNF-500',
        itemCliente: '1',
        tag: 'PT-102',
        descricao: 'MANIFOLD 5 VIAS',
        quantidade: '2',
        valorUnitario: '850',
        moeda: 'USD',
        fornecedor: 'PARKER',
      },
    ],
    auditTrail: [],
    attachments: [],
    paymentRequests: [],
    paymentPlan: [],
    pagamentosFornecedores: [],
    SC: '',
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
    Usuario_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '15/02/2025 09:30',
    itensPV: [
      {
        id: 'it-3',
        codigo: 'MOT-002',
        itemCliente: '5',
        tag: 'M-02',
        descricao: 'MOTOR WEG 50CV',
        quantidade: '1',
        valorUnitario: '15000',
        moeda: 'BRL',
        fornecedor: 'WEG',
      },
    ],
    auditTrail: [],
    attachments: [],
    paymentRequests: [],
    paymentPlan: [],
    pagamentosFornecedores: [],
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
    Usuario_Ult_Alteracao: 'SISTEMA',
    Data_Ult_Alteracao: '18/02/2025 16:20',
    itensPV: [
      {
        id: 'it-4',
        codigo: 'T-99',
        itemCliente: '1',
        tag: 'TAG-FINAL',
        descricao: 'TRANSFORMADOR 15KV',
        quantidade: '1',
        valorUnitario: '45000',
        moeda: 'BRL',
        fornecedor: 'ABB',
      },
    ],
    auditTrail: [],
    attachments: [],
    paymentRequests: [],
    paymentPlan: [],
    pagamentosFornecedores: [],
    SC: '',
  },
];

// =============================================================
// TV param -> localStorage key usada pelo StockTVPanel
// Aceita: ?tv=logistica | ?tv=comercial | etc.
// =============================================================
const TV_MAP = {
  comercial: 'COMERCIAL',
  estoque: 'ESTOQUE',
  planejamento: 'PLANEJAMENTO',
  compras: 'COMPRAS',
  engenharia: 'ENGENHARIA',
  financeiro: 'FINANCEIRO',
  logistica: 'LOGISTICA',
} as const;

type TvProcess = typeof TV_MAP[keyof typeof TV_MAP];

function getTvProcessFromUrl(search: string): TvProcess | null {
  try {
    const raw = new URLSearchParams(search).get('tv');
    if (!raw) return null;
    const key = raw.toLowerCase().trim() as keyof typeof TV_MAP;
    return TV_MAP[key] ?? null;
  } catch {
    return null;
  }
}

function persistTvProcess(p: TvProcess) {
  try {
    localStorage.setItem(STORAGE.TV_PROCESS, p);
  } catch {
    // ignore
  }
}

// =============================================================
// Migration: se existir campo antigo acentuado no localStorage
// copia para Usuario_Ult_Alteracao
// =============================================================
function migrateRecordAuditUserField(raw: any): ImportRecord {
  const r: any = raw ?? {};
  if (r.Usuario_Ult_Alteracao == null && r['Usuário_Ult_Alteracao'] != null) {
    r.Usuario_Ult_Alteracao = r['Usuário_Ult_Alteracao'];
  }
  return r as ImportRecord;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [slas, setSlas] = useState<SLAConfig>({ estoque: 24, compras: 3, financeiro: 2, logistica: 45 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // =============================================================
  // Sessao (persistencia local) + modo demo (?demo=1)
  // =============================================================
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const demo = urlParams.get('demo') === '1';

      const savedUser = localStorage.getItem(STORAGE.SESSION_USER);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else if (demo) {
        setUser(SUPER_USER);
      }
    } catch {
      // ignore
    }
  }, []);

  // =============================================================
  // Bootstrap: seed users / tv / dados
  // =============================================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // 1) Seed usuarios de teste (se nao existir ou ?seedUsers=1)
    const seedUsers = urlParams.get('seedUsers') === '1';
    try {
      const existing = localStorage.getItem(STORAGE.USERS);
      if (!existing || seedUsers) {
        localStorage.setItem(STORAGE.USERS, JSON.stringify(DEFAULT_TEST_USERS));
      }
    } catch {
      // ignore
    }

    // 2) TV por processo via querystring: ?tv=logistica etc
    const tvProcess = getTvProcessFromUrl(window.location.search);
    if (tvProcess) {
      persistTvProcess(tvProcess);
      setCurrentView('ESTOQUE_TV');
    } else {
      // compat antigo: ?tv=estoque (se você ainda usar em algum lugar)
      if (urlParams.get('tv') === 'estoque') {
        setCurrentView('ESTOQUE_TV');
      }
    }

    // 3) Carrega SLAs
    try {
      const savedSlas = localStorage.getItem(STORAGE.SLAS);
      if (savedSlas) setSlas(JSON.parse(savedSlas));
    } catch {
      // ignore
    }

    // 4) Carrega Suppliers
    try {
      const savedSuppliers = localStorage.getItem(STORAGE.SUPPLIERS);
      if (savedSuppliers) {
        setSuppliers(JSON.parse(savedSuppliers));
      } else {
        const defaultSupps: Supplier[] = [
          { id: '1', name: 'EMERSON' },
          { id: '2', name: 'PARKER' },
          { id: '3', name: 'WEG' },
          { id: '4', name: 'ABB' },
        ];
        setSuppliers(defaultSupps);
        localStorage.setItem(STORAGE.SUPPLIERS, JSON.stringify(defaultSupps));
      }
    } catch {
      // ignore
    }

    // 5) Carrega Records (+ migra nome de campo antigo, se existir)
    try {
      const savedRecords = localStorage.getItem(STORAGE.RECORDS);
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        const migrated: ImportRecord[] = Array.isArray(parsed)
          ? parsed.map(migrateRecordAuditUserField)
          : [];
        setRecords(migrated);
        localStorage.setItem(STORAGE.RECORDS, JSON.stringify(migrated));
      } else {
        setRecords(SAMPLE_RECORDS);
        localStorage.setItem(STORAGE.RECORDS, JSON.stringify(SAMPLE_RECORDS));
      }
    } catch {
      setRecords(SAMPLE_RECORDS);
      try {
        localStorage.setItem(STORAGE.RECORDS, JSON.stringify(SAMPLE_RECORDS));
      } catch {
        // ignore
      }
    }

    // 6) Sync multi-abas
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === STORAGE.RECORDS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const migrated: ImportRecord[] = Array.isArray(parsed)
            ? parsed.map(migrateRecordAuditUserField)
            : [];
          setRecords(migrated);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const updateRecords = (newRecords: ImportRecord[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem(STORAGE.RECORDS, JSON.stringify(newRecords));
    } catch {
      // ignore
    }
  };

  const persistSessionUser = (u: User) => {
    const safeUser: any = { ...u };
    delete safeUser.password;
    try {
      localStorage.setItem(STORAGE.SESSION_USER, JSON.stringify(safeUser));
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

    // sempre liberado
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
      alert('Acesso negado: voce nao tem permissao para este modulo.');
      return;
    }
    setCurrentView(v);
  };

  const exportAllRecordsCSV = () => {
    if (!records || records.length === 0) {
      alert('Nao ha registros para exportar.');
      return;
    }

    const allKeys = Array.from(new Set(records.flatMap(r => Object.keys(r as any))));

    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const needsQuote = /[;"\n\r]/.test(s);
      const cleaned = s.replace(/"/g, '""');
      return needsQuote ? `"${cleaned}"` : cleaned;
    };

    const header = allKeys.join(';');
    const rows = records.map(r => allKeys.map(k => escape((r as any)[k])).join(';'));
    const content = 'sep=;\n' + header + '\n' + rows.join('\n');

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
    try {
      localStorage.removeItem(STORAGE.SESSION_USER);
    } catch {
      // ignore
    }
    setCurrentView('DASHBOARD');
  };

  // Se nao estiver logado e nao for TV, vai para Login
  if (!user && currentView !== 'ESTOQUE_TV') return <Login onLogin={handleLogin} />;

  // TV mode (sem login)
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
        setView={(v) => {
          safeSetView(v);
          setIsMenuOpen(false);
        }}
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

            {currentView === 'FORNECEDORES' && (
              <SupplierManagement
                suppliers={suppliers}
                onUpdate={(s) => {
                  setSuppliers(s);
                  try {
                    localStorage.setItem(STORAGE.SUPPLIERS, JSON.stringify(s));
                  } catch {
                    // ignore
                  }
                }}
              />
            )}

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

            {currentView === 'SLA_CONFIG' && (
              <SLAConfigForm
                slas={slas}
                onSave={(s) => {
                  setSlas(s);
                  try {
                    localStorage.setItem(STORAGE.SLAS, JSON.stringify(s));
                  } catch {
                    // ignore
                  }
                }}
              />
            )}

            {currentView === 'SUPER_ADMIN_PANEL' && (
              <SuperAdminPanel records={records} onUpdate={updateRecords} user={user!} />
            )}
          </div>
        </main>
      </div>

      <AIAssistant records={records} />
    </div>
  );
};

export default App;
