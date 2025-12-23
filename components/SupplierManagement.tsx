
import React, { useState } from 'react';
import { Supplier } from '../types';
import { COLORS, ICONS } from '../constants';

interface SupplierManagementProps {
  suppliers: Supplier[];
  onUpdate: (suppliers: Supplier[]) => void;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ suppliers, onUpdate }) => {
  const [form, setForm] = useState<Partial<Supplier>>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    if (isEditing) {
      onUpdate(suppliers.map(s => s.id === isEditing ? { ...s, ...form } as Supplier : s));
    } else {
      onUpdate([...suppliers, { ...form, id: Date.now().toString() } as Supplier]);
    }
    setForm({});
    setIsEditing(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800">
        <h3 className="text-white font-black text-xs uppercase tracking-[4px] mb-8">Cadastro de Fornecedores</h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social / Nome</label>
            <input 
              className="w-full px-4 py-3 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-xs focus:ring-1"
              value={form.name || ''}
              onChange={e => setForm({...form, name: e.target.value.toUpperCase()})}
              placeholder="NOME DA EMPRESA"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ / ID</label>
            <input 
              className="w-full px-4 py-3 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-xs focus:ring-1"
              value={form.cnpj || ''}
              onChange={e => setForm({...form, cnpj: e.target.value})}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contato / E-mail</label>
            <input 
              className="w-full px-4 py-3 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-xs focus:ring-1"
              value={form.email || ''}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="vendas@fornecedor.com"
            />
          </div>
          <button type="submit" className="py-3.5 bg-[#04816E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110">
            {isEditing ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-4">Fornecedor</th>
              <th className="px-8 py-4">Identificação</th>
              <th className="px-8 py-4">Contato</th>
              <th className="px-8 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 text-xs font-black text-slate-800">{s.name}</td>
                <td className="px-8 py-5 text-xs font-bold text-slate-500">{s.cnpj || '---'}</td>
                <td className="px-8 py-5 text-xs font-bold text-slate-500">{s.email || '---'}</td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => { setForm(s); setIsEditing(s.id); }}
                    className="p-2 text-slate-400 hover:text-[#04816E]"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierManagement;
