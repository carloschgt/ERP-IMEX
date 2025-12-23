
import React, { useState, useMemo } from 'react';
import { ImportRecord, User } from '../types';
import { COLORS, LOGO_SVG, ICONS } from '../constants';

interface Props {
  records: ImportRecord[];
  onUpdate: (records: ImportRecord[]) => void;
  user: User;
}

const SUPER_ADMIN_EMAIL = 'carlos.teixeira@imexsolutions.com.br';

const SuperAdminPanel: React.FC<Props> = ({ records, onUpdate, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPV, setSelectedPV] = useState<ImportRecord | null>(null);
  const [reason, setReason] = useState('');

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return <div className="p-10 text-red-500 font-black uppercase">Acesso Restrito: Auditoria Mestre</div>;
  }

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.trim().toUpperCase();
    return records.filter(r => r.PV.toUpperCase().includes(term) || r.Cliente.toUpperCase().includes(term));
  }, [records, searchTerm]);

  const handleResetStage = (stage: 'COMERCIAL' | 'ESTOQUE' | 'COMPRAS' | 'FINANCEIRO') => {
    if (!selectedPV) return;
    if (!reason.trim()) return alert("⚠️ OBRIGATÓRIO: Para fins de auditoria, informe o motivo da reabertura deste processo.");

    const confirmMessage = `⚠️ INTERVENÇÃO CARLOS TEIXEIRA:\n\nVocê está reabilitando a etapa de ${stage} do PV ${selectedPV.PV}.\n\nIsso sinalizará o processo com o banner de 'INTERVENÇÃO ADMIN' e permitirá que o time edite os dados novamente.\n\nConfirmar flow-back?`;
    
    if (window.confirm(confirmMessage)) {
      const now = new Date().toLocaleString('pt-BR');
      const updated = records.map(r => {
        if (r.id === selectedPV.id) {
          const mod: Partial<ImportRecord> = { 
            ...r, 
            Intervencao_Admin: true,
            Data_Intervencao: now,
            Motivo_Intervencao: reason.toUpperCase(),
            Etapa_Reaberta: stage,
            Usuário_Ult_Alteracao: `ADMIN: ${user.name}`,
            Data_Ult_Alteracao: now
          };

          // Lógica de Destravamento de Gates
          if (stage === 'ESTOQUE') {
            mod.Status_Estoque = 'PENDENTE';
            mod.Data_Conclusao_Estoque = undefined;
            mod.Responsavel_Estoque = undefined;
          } else if (stage === 'COMPRAS') {
            mod.PC = '';
            mod.Data_PC = undefined;
          } else if (stage === 'FINANCEIRO') {
            mod.Status_Pagamento = 'PENDENTE';
          }
          // Comercial não precisa reset de campos, apenas a flag Intervencao_Admin já habilita a edição
          return mod as ImportRecord;
        }
        return r;
      });

      onUpdate(updated);
      setSelectedPV(updated.find(r => r.id === selectedPV.id) || null);
      setReason('');
      alert(`✅ Sucesso. O departamento de ${stage} agora pode realizar as alterações necessárias.`);
    }
  };

  const handleWipeTotal = () => {
    if (!selectedPV) return;
    if (window.confirm(`🚨🚨 ALERTA CRÍTICO DE EXCLUSÃO 🚨🚨\n\nVocê está prestes a APAGAR INTEGRALMENTE o PV ${selectedPV.PV}. NÃO É POSSÍVEL DESFAZER.\n\nContinuar?`)) {
      const prompt = window.prompt("Para confirmar a exclusão mestre, digite CONFIRMAR:");
      if (prompt === 'CONFIRMAR') {
        const updated = records.filter(r => r.id !== selectedPV.id);
        onUpdate(updated);
        setSelectedPV(null);
        setSearchTerm('');
        alert('✅ PROCESSO ELIMINADO DA BASE MASTER.');
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-[#0F172A] p-12 rounded-[4rem] shadow-2xl border border-red-900/20 relative overflow-hidden">
        <div className="absolute right-[-40px] top-[-40px] w-96 opacity-[0.03] pointer-events-none" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-8">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>
            <span className="text-[10px] font-black uppercase tracking-[4px] text-red-400">Master Governance Hub</span>
          </div>
          
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Cofre de Intervenção Estratégica</h2>
          <p className="text-slate-400 max-w-2xl font-medium leading-relaxed">
            Painel exclusivo Carlos Teixeira. Utilize esta central para destravar processos concluídos indevidamente ou corrigir falhas críticas de lançamento.
          </p>

          <div className="mt-12 max-w-2xl space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Localizar Processo para Intervenção (PV ou Cliente)</label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="EX: PV25-001..." 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:ring-1 focus:ring-red-500/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600">
                {ICONS.Search}
              </div>
            </div>
            
            {searchTerm && filteredRecords.length > 0 && !selectedPV && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredRecords.map(r => (
                  <button key={r.id} onClick={() => setSelectedPV(r)} className="w-full text-left px-6 py-4 hover:bg-slate-800 flex justify-between items-center group border-b border-slate-800 last:border-none transition-colors">
                    <div>
                      <span className="text-xs font-black text-white block">{r.PV}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{r.Cliente}</span>
                    </div>
                    <span className="text-[10px] font-black text-red-500 opacity-0 group-hover:opacity-100 uppercase tracking-widest">Abrir Cofre →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPV && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mb-8">Snapshot do Processo</h3>
            <div className="space-y-6">
              <Detail label="CÓDIGO PV" value={selectedPV.PV} />
              <Detail label="CLIENTE" value={selectedPV.Cliente} />
              <Detail label="GATE ESTOQUE" value={selectedPV.Status_Estoque || 'PENDENTE'} />
              <Detail label="STATUS COMPRAS" value={selectedPV.PC ? `FECHADO (${selectedPV.PC})` : 'ABERTO'} />
              <Detail label="STATUS FINANCEIRO" value={selectedPV.Status_Pagamento || 'PENDENTE'} />
              <Detail label="AUDITORIA ADMIN" value={selectedPV.Intervencao_Admin ? 'SIM (SINALIZADA)' : 'NÃO'} />
            </div>

            <div className="mt-10 pt-10 border-t border-slate-50">
              <label className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-3 ml-2">Justificativa da Reabertura *</label>
              <textarea 
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-red-500 outline-none uppercase"
                placeholder="DIGITE O MOTIVO DA ALTERAÇÃO MANUAL..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <button onClick={() => { setSelectedPV(null); setReason(''); setSearchTerm(''); }} className="w-full mt-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar Operação</button>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-[#04816E]/5 rounded-bl-full flex items-center justify-center pointer-events-none">
                  <div className="text-[#04816E]/20">{ICONS.Refresh}</div>
               </div>
              
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mb-8">Protocolo Flow-Back (Destravar Departamentos)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResetCard 
                  title="REABRIR COMERCIAL" 
                  desc="Habilita edição para usuários comuns em PVs que já estavam bloqueados."
                  active={!!selectedPV.PV}
                  onReset={() => handleResetStage('COMERCIAL')}
                />
                <ResetCard 
                  title="REABRIR ESTOQUE" 
                  desc="Reseta o gate físico. Retira o bloqueio de compras e volta para 'Pendente'."
                  active={selectedPV.Status_Estoque === 'CONCLUIDO'}
                  onReset={() => handleResetStage('ESTOQUE')}
                />
                <ResetCard 
                  title="REABRIR COMPRAS" 
                  desc="Remove o vínculo do PC e libera re-edição de itens pelo time de suprimentos."
                  active={!!selectedPV.PC}
                  onReset={() => handleResetStage('COMPRAS')}
                />
                <ResetCard 
                  title="REABRIR FINANCEIRO" 
                  desc="Retorna o status de pagamento e libera campos de numerários."
                  active={selectedPV.Status_Pagamento === 'PAGO'}
                  onReset={() => handleResetStage('FINANCEIRO')}
                />
              </div>
            </div>

            <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                  {ICONS.Warning}
                </div>
                <div className="flex-1">
                  <h3 className="text-red-600 font-black text-lg uppercase tracking-tight">Exclusão Integral do Sistema</h3>
                  <p className="text-[11px] text-red-500 font-bold uppercase mt-1">Apagar PV e limpar todos os rastros históricos da base master</p>
                </div>
                <button onClick={handleWipeTotal} className="px-12 py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-2xl hover:bg-red-700 transition-all">
                  WIPE: APAGAR PV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-1 border-b border-slate-50 pb-4 last:border-none">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-black text-slate-800 uppercase">{value}</span>
  </div>
);

const ResetCard = ({ title, desc, active, onReset }: any) => (
  <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 group ${active ? 'bg-slate-50 border-slate-100 hover:border-emerald-500/30 shadow-sm' : 'bg-slate-50 border-slate-50 opacity-30 grayscale'}`}>
    <div className="flex justify-between items-start mb-4">
      <h4 className="font-black text-xs uppercase tracking-widest text-slate-800">{title}</h4>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
    </div>
    <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed mb-8">{desc}</p>
    <button 
      disabled={!active}
      onClick={onReset}
      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-slate-900 text-white shadow-xl hover:bg-[#04816E]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
    >
      Reabilitar Etapa
    </button>
  </div>
);

export default SuperAdminPanel;
