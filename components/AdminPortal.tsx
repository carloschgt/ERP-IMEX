
import React, { useState, useEffect } from 'react';
import { User, UserRole, ImportRecord } from '../types';
import { COLORS, ICONS, LOGO_SVG } from '../constants';

interface AdminPortalProps {
  records: ImportRecord[];
  onImport: (newRecords: ImportRecord[]) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ records, onImport }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<Partial<User>>({
    role: UserRole.USER,
    department: 'COMERCIAL',
    email: '',
    name: ''
  });

  const MASTER_HEADERS = [
    "Item", "PV", "Cliente", "Data_PV", "Prazo_Contrato", "Itens_PV", "SC", "Data_SC", 
    "PO", "Data_PO", "Fornecedor_PO", "Status_Pagamento", "Valor_adiantamento", 
    "Data_Adiantamento", "Valor_Complemento", "Valor_Reembolso", "Status_Fabricacao", 
    "Inicio_Fabricacao", "Previsao_Conclusao", "Coleta_Agendada", "Modal", "Agente_Carga", 
    "Local_Coleta", "Coleta_Realizada", "ETD", "ETA", "DI", "Data_Registro_DI", "Canal", 
    "Data_Desembaraco", "Valor_FOB_USD", "Frete_Internacional_USD", "Unidade_RFB", 
    "Recinto_Aduaneiro", "DTA", "Data_DTA", "Recinto_Porto_Seco", "Observações", 
    "Status_Geral", "LeadTime_Previsto", "LeadTime_Real", "Reserva1", 
    "Usuário_Ult_Alteracao", "Data_Ult_Alteracao"
  ];

  useEffect(() => {
    const savedUsers = localStorage.getItem('imex_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('imex_users', JSON.stringify(updatedUsers));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.email || !userData.name) {
      alert("⚠️ Campos Nome e E-mail são obrigatórios.");
      return;
    }

    const emailKey = userData.email.toLowerCase().trim();
    const updatedUser: User = {
      ...(userData as User),
      email: emailKey,
      name: userData.name.toUpperCase()
    };

    if (editingEmail) {
      const updatedUsers = users.map(u => 
        u.email.toLowerCase() === editingEmail.toLowerCase() ? updatedUser : u
      );
      saveUsers(updatedUsers);
    } else {
      if (users.find(u => u.email.toLowerCase() === emailKey)) {
        alert('❌ ERRO: Este e-mail já possui um cadastro ativo.');
        return;
      }
      saveUsers([...users, { ...updatedUser, lastLogin: '-' }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setUserData({ role: UserRole.USER, department: 'COMERCIAL', email: '', name: '' });
    setEditingEmail(null);
    setShowAddForm(false);
  };

  const handleEditClick = (u: User) => {
    setUserData(u);
    setEditingEmail(u.email);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="bg-[#0F172A] p-12 rounded-[4rem] shadow-2xl text-white relative border border-slate-800">
        <div className="absolute right-[-50px] top-[-50px] w-96 opacity-[0.05]" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <h2 className="text-4xl font-black tracking-tighter mb-8 uppercase">Gestão Administrativa</h2>
        <div className="flex gap-4">
            <button className="flex items-center gap-4 px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                {ICONS.Excel} Template Mestre
            </button>
            <button className="flex items-center gap-4 px-8 py-4 bg-[#04816E]/20 hover:bg-[#04816E]/40 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                {ICONS.File} Exportar Bdados
            </button>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-10">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-[4px]">Acessos Corporativos</h3>
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} className="px-10 py-4 bg-[#04816E] text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-xl">
              {ICONS.Plus} Novo Operador
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSaveUser} className="mb-12 p-12 bg-slate-50 rounded-[3rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 animate-in slide-in-from-top-6 duration-700">
            <div className="lg:col-span-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome</label>
              <input type="text" required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase" value={userData.name || ''} onChange={e => setUserData({...userData, name: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">E-mail</label>
              <input type="email" required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs" value={userData.email || ''} onChange={e => setUserData({...userData, email: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Departamento</label>
              <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs" value={userData.department} onChange={e => setUserData({...userData, department: e.target.value as any})}>
                <option value="COMERCIAL">COMERCIAL</option>
                <option value="ESTOQUE">ESTOQUE</option>
                <option value="PLANEJAMENTO">PLANEJAMENTO</option>
                <option value="COMPRAS">COMPRAS</option>
                <option value="ENGENHARIA">ENGENHARIA</option>
                <option value="FINANCEIRO">FINANCEIRO</option>
                <option value="LOGISTICA">LOGISTICA</option>
                <option value="ADMIN">ADMIN / TI</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Papel</label>
              <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs" value={userData.role} onChange={e => setUserData({...userData, role: e.target.value as UserRole})}>
                <option value={UserRole.USER}>OPERADOR</option>
                <option value={UserRole.ADMIN}>ADMINISTRADOR</option>
                <option value={UserRole.SUPER_ADMIN}>SUPER ADMIN</option>
                <option value={UserRole.VIEWER}>VIEWER (LEITURA)</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar</button>
              <button type="button" onClick={resetForm} className="py-4 px-5 bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px]">X</button>
            </div>
          </form>
        )}

        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase font-black tracking-[4px] border-b border-slate-100">
                <th className="px-10 py-8">Identificação</th>
                <th className="px-10 py-8">Departamento</th>
                <th className="px-10 py-8">Acesso</th>
                <th className="px-10 py-8 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.email} className="hover:bg-slate-50/70 transition-all">
                  <td className="px-10 py-10">
                    <span className="text-sm font-black text-slate-800 uppercase block">{u.name}</span>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="px-10 py-10">
                    <span className="text-[10px] font-black px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full uppercase">{u.department}</span>
                  </td>
                  <td className="px-10 py-10">
                    <span className="text-[9px] font-black px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full uppercase">{u.role}</span>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <button onClick={() => handleEditClick(u)} className="px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all text-[9px] font-black uppercase">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
