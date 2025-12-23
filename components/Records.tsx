
import React, { useState, useMemo } from 'react';
import { ImportRecord, User } from '../types';
import { COLORS, ICONS, LOGO_SVG } from '../constants';

const DarkInput = ({ label, field, form, onChange, type = "text", isSelect = false, options = [] }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative group">
      {isSelect ? (
        <select 
          className="w-full px-3 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-xs focus:ring-2 transition-all appearance-none cursor-pointer hover:bg-slate-700/80"
          style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any}
          value={form[field] || ''}
          onChange={e => onChange(field, e.target.value)}
        >
          <option value="">SELECIONE</option>
          {options.map((opt: string) => (
            <option key={opt} value={opt} className="bg-slate-800 text-white">{opt}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type}
          className="w-full px-3 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-xs focus:ring-2 transition-all placeholder-slate-600 uppercase hover:bg-slate-700/80" 
          style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any}
          value={form[field] || ''} 
          placeholder={`---`}
          onChange={e => onChange(field, e.target.value)}
        />
      )}
    </div>
  </div>
);

const SectionTitle = ({ title, icon }: any) => (
  <div className="col-span-full flex items-center gap-3 mt-6 mb-2 border-b border-slate-800 pb-2">
    <span className="text-[#04816E]">{icon}</span>
    <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-[3px]">{title}</h4>
  </div>
);

const Records: React.FC<{ records: ImportRecord[]; setRecords: (records: ImportRecord[]) => void; user: User }> = ({ records, setRecords, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ImportRecord | null>(null);
  const [form, setForm] = useState<Partial<ImportRecord>>({});

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.trim().toUpperCase();
    return records.filter(r => {
      const pv = String((r as any).PV || '').toUpperCase();
      const cliente = String((r as any).Cliente || '').toUpperCase();
      const po = String((r as any).PO || '').toUpperCase();
      const sc = String((r as any).SC || '').toUpperCase();
      const clean = term.replace('*','');
      return (
        matchWithWildcardPrefix(pv, term) ||
        cliente.includes(clean) ||
        matchWithWildcardPrefix(po, term) ||
        matchWithWildcardPrefix(sc, term)
      );
    });
  }, [records, searchTerm]);

  const handleInputChange = (field: keyof ImportRecord, value: string) => {
    setForm(prev => ({ ...prev, [field]: value.toUpperCase() }));
  };

  const handleSave = () => {
    if (!form.PV) { alert('PV é obrigatório para salvar.'); return; }
    const now = new Date().toLocaleString('pt-BR');
    const newRecord: ImportRecord = {
      ...(selectedRecord || { id: Date.now().toString() } as ImportRecord),
      ...form,
      Usuário_Ult_Alteracao: user.name,
      Data_Ult_Alteracao: now
    } as ImportRecord;

    if (selectedRecord) {
      setRecords(records.map(r => r.id === selectedRecord.id ? newRecord : r));
    } else {
      setRecords([newRecord, ...records]);
    }
    setForm({});
    setSelectedRecord(null);
    alert('Dados sincronizados com sucesso na base local.');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-4 flex items-center text-slate-400">{ICONS.Search}</div>
          <input 
            type="text" 
            placeholder="PESQUISAR PV, CLIENTE OU PO..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 font-bold text-slate-700"
            style={{ '--tw-ring-color': `${COLORS.IMEX_GREEN}22` } as any}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setSelectedRecord(null); setForm({}); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 flex items-center gap-3">
          {ICONS.Plus} Novo Registro
        </button>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
        <div className="px-10 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-[4px]">Lançamento Operacional</h3>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mt-1">Sincronização com Gestão de Importação Imex.xlsx</p>
          </div>
          <div className="w-24 opacity-20" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        </div>
        
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <SectionTitle title="Comercial" icon={ICONS.Dashboard} />
          <DarkInput label="PV" field="PV" form={form} onChange={handleInputChange} />
          <DarkInput label="Cliente" field="Cliente" form={form} onChange={handleInputChange} />
          <DarkInput label="Data PV" field="Data_PV" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="Prazo Contrato" field="Prazo_Contrato" form={form} onChange={handleInputChange} />
          <DarkInput label="Itens PV" field="Itens_PV" form={form} onChange={handleInputChange} />

          <SectionTitle title="Compras & Suprimentos" icon={ICONS.Records} />
          <DarkInput label="SC" field="SC" form={form} onChange={handleInputChange} />
          <DarkInput label="Data SC" field="Data_SC" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="PO" field="PO" form={form} onChange={handleInputChange} />
          <DarkInput label="Data PO" field="Data_PO" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="Fornecedor PO" field="Fornecedor_PO" form={form} onChange={handleInputChange} />

          <SectionTitle title="Financeiro" icon={ICONS.Save} />
          <DarkInput label="Status Pagamento" field="Status_Pagamento" isSelect options={['PENDENTE', 'ADIANTADO', 'PAGO', 'REEMBOLSADO']} form={form} onChange={handleInputChange} />
          <DarkInput label="Valor Adiantamento" field="Valor_adiantamento" form={form} onChange={handleInputChange} />
          <DarkInput label="Data Adiantamento" field="Data_Adiantamento" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="Valor Complemento" field="Valor_Complemento" form={form} onChange={handleInputChange} />
          <DarkInput label="Valor Reembolso" field="Valor_Reembolso" form={form} onChange={handleInputChange} />

          <SectionTitle title="Logística & Produção" icon={ICONS.Trending} />
          <DarkInput label="Status Fabricação" field="Status_Fabricacao" isSelect options={['NÃO INICIADO', 'EM CURSO', 'CONCLUÍDO']} form={form} onChange={handleInputChange} />
          <DarkInput label="Início Fabricação" field="Inicio_Fabricacao" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="Prev. Conclusão" field="Previsao_Conclusao" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="Coleta Agendada" field="Coleta_Agendada" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="Modal" field="Modal" isSelect options={['MARÍTIMO', 'AÉREO', 'RODOVIÁRIO', 'COURIER']} form={form} onChange={handleInputChange} />
          <DarkInput label="ETD" field="ETD" type="date" form={form} onChange={handleInputChange} />
          <DarkInput label="ETA" field="ETA" type="date" form={form} onChange={handleInputChange} />

          <SectionTitle title="Aduaneiro & Custos" icon={ICONS.Filter} />
          <DarkInput label="DI" field="DI" form={form} onChange={handleInputChange} />
          <DarkInput label="Canal" field="Canal" isSelect options={['VERDE', 'AMARELO', 'VERMELHO', 'CINZA']} form={form} onChange={handleInputChange} />
          <DarkInput label="FOB USD" field="Valor_FOB_USD" form={form} onChange={handleInputChange} />
          <DarkInput label="Frete USD" field="Frete_Internacional_USD" form={form} onChange={handleInputChange} />
          <DarkInput label="Status Geral" field="Status_Geral" isSelect options={['TRIAGEM', 'PRODUÇÃO', 'TRÂNSITO', 'DESPACHO', 'FINALIZADO']} form={form} onChange={handleInputChange} />

          <div className="col-span-full mt-10 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#04816E]/20 flex items-center justify-center text-[#04816E]">{ICONS.Clock}</div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Última Modificação</p>
                <p className="text-xs font-bold text-slate-300">{selectedRecord ? `${selectedRecord.Usuário_Ult_Alteracao} em ${selectedRecord.Data_Ult_Alteracao}` : 'Novo lançamento'}</p>
              </div>
            </div>
            <button onClick={handleSave} className="w-full md:w-64 py-4 bg-[#04816E] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:brightness-110 transition-all">
              {selectedRecord ? 'Atualizar Bdados' : 'Salvar na Bdados'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-[3px]">Histórico de Operações</h3>
          <span className="text-[10px] font-black text-[#04816E] bg-[#04816E]/10 px-3 py-1 rounded-full uppercase tracking-tighter">{filteredRecords.length} REGISTROS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">PV / Cliente</th>
                <th className="px-8 py-4">Status Geral</th>
                <th className="px-8 py-4">ETA</th>
                <th className="px-8 py-4">FOB USD</th>
                <th className="px-8 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800">{r.PV}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{r.Cliente}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      r.Status_Geral === 'FINALIZADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>{r.Status_Geral || 'TRIAGEM'}</span>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-slate-600">{r.ETA || '---'}</td>
                  <td className="px-8 py-5 text-xs font-black text-[#04816E]">${r.Valor_FOB_USD || '0.00'}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => { setSelectedRecord(r); setForm(r); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-[#04816E] hover:text-white transition-all">
                      {ICONS.File}
                    </button>
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

export default Records;
