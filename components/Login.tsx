
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { COLORS, LOGO_SVG, ICONS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('imex_users');
    if (!saved) {
      const initialUsers: User[] = [
        { 
          email: 'carlos.teixeira@imexsolutions.com.br', 
          name: 'Carlos Teixeira', 
          role: UserRole.ADMIN, 
          department: 'ADMIN', 
          lastLogin: '2025-02-15 08:30',
          passwordChangedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('imex_users', JSON.stringify(initialUsers));
    }
  }, []);

  const getUsers = (): User[] => {
    const saved = localStorage.getItem('imex_users');
    return saved ? JSON.parse(saved) : [];
  };

  const checkPasswordStatus = (user: User) => {
    if (!user.passwordChangedAt) return { expired: false, reminder: false };
    
    const lastChanged = new Date(user.passwordChangedAt).getTime();
    const now = new Date().getTime();
    const daysSince = (now - lastChanged) / (1000 * 60 * 60 * 24);
    
    return {
      expired: daysSince >= 60,
      reminder: daysSince >= 55 && daysSince < 60,
      daysLeft: Math.max(0, Math.floor(60 - daysSince))
    };
  };

  const handleInitialCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = email.trim().toLowerCase();
    
    // Login Mestre de Emergência (Carlos)
    if (cleanEmail === 'carlos.teixeira@imexsolutions.com.br' && password === 'IMEX@2025') {
      const allUsers = getUsers();
      let adminMatch = allUsers.find(u => u.email === cleanEmail);
      if (!adminMatch) {
        adminMatch = { email: cleanEmail, name: 'Carlos Teixeira', role: UserRole.ADMIN, department: 'ADMIN', passwordChangedAt: new Date().toISOString() };
        localStorage.setItem('imex_users', JSON.stringify([...allUsers, adminMatch]));
      }
      onLogin(adminMatch);
      return;
    }

    const allUsers = getUsers();
    const userMatch = allUsers.find(u => u.email === cleanEmail);

    if (!userMatch) {
      setError('Usuário não cadastrado ou e-mail incorreto.');
      return;
    }

    if (!userMatch.password) {
      setIsFirstAccess(true);
      setPendingUser(userMatch);
      setPassword('');
      return;
    }

    if (password === userMatch.password) {
      const { expired, reminder, daysLeft } = checkPasswordStatus(userMatch);
      
      if (expired) {
        alert('Sua senha expirou por política de segurança. Você deve alterá-la agora.');
        setIsExpiring(true);
        setPendingUser(userMatch);
        setPassword('');
        setOldPasswordInput('');
        return;
      }
      
      if (reminder) {
        if (window.confirm(`Sua senha expira em ${daysLeft} dias. Deseja alterá-la agora?`)) {
          setIsExpiring(true);
          setPendingUser(userMatch);
          setPassword('');
          setOldPasswordInput('');
          return;
        }
      }

      onLogin(userMatch);
    } else {
      setError('Senha incorreta.');
    }
  };

  const sendEmailNotification = (type: 'WELCOME' | 'SECURITY_CHANGE', userEmail: string, userName: string) => {
    const now = new Date().toLocaleString('pt-BR');
    let subject = "";
    let body = "";

    if (type === 'WELCOME') {
      subject = "Bem-vindo à Plataforma IMEX Solutions";
      body = `Olá ${userName}, seu acesso foi ativado com sucesso em ${now}.`;
    } else {
      subject = "Alerta de Segurança: Senha Alterada";
      body = `Olá ${userName}, informamos que sua senha de acesso foi alterada no sistema IMEX em ${now}.`;
    }

    console.log(`%c[SERVIDOR DE EMAIL IMEX] Para: ${userEmail}\nAssunto: ${subject}`, "color: #04816E; font-weight: bold;");
    alert(`Notificação enviada para ${userEmail}.`);
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('A confirmação da nova senha não coincide.');
      return;
    }

    if (isExpiring && pendingUser) {
      if (oldPasswordInput !== pendingUser.password) {
        setError('A senha anterior digitada está incorreta.');
        return;
      }
    }

    if (pendingUser) {
      const allUsers = getUsers();
      const now = new Date().toISOString();
      const updatedUsers = allUsers.map(u => 
        u.email === pendingUser.email ? { ...u, password, passwordChangedAt: now } : u
      );
      localStorage.setItem('imex_users', JSON.stringify(updatedUsers));
      
      sendEmailNotification(isFirstAccess ? 'WELCOME' : 'SECURITY_CHANGE', pendingUser.email, pendingUser.name);

      alert('Credenciais atualizadas com sucesso!');
      onLogin({ ...pendingUser, password, passwordChangedAt: now });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-12 border border-slate-200">
        <div className="flex justify-center mb-10">
          <div className="w-64" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        </div>

        {!isFirstAccess && !isExpiring ? (
          <form onSubmit={handleInitialCheck} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Acesso Corporativo</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Importação IMEX</p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail Corporativo</label>
              <input type="email" className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 transition-all bg-gray-50 font-bold text-sm text-slate-700" style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any} placeholder="nome@imexsolutions.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <input type="password" name="password" className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 transition-all bg-gray-50 text-sm text-slate-700 font-bold" style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black border border-red-100 text-center uppercase tracking-widest">{error}</div>}
            <button type="submit" className="w-full py-5 rounded-2xl font-black text-xs text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl uppercase tracking-[3px]" style={{ backgroundColor: COLORS.IMEX_GREEN }}>Entrar no Sistema</button>
          </form>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full mb-3 border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">{isExpiring ? 'Troca de Senha Obrigatória' : 'Primeiro Acesso'}</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Olá, {pendingUser?.name.split(' ')[0]}!</h2>
            </div>

            {isExpiring && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha Anterior</label>
                <input type="password" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 transition-all bg-gray-50 text-sm text-slate-700 font-bold" style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any} placeholder="Confirme sua senha atual" value={oldPasswordInput} onChange={(e) => setOldPasswordInput(e.target.value)} />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nova Senha</label>
              <input type="password" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 transition-all bg-gray-50 text-sm text-slate-700 font-bold" style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirme a Nova Senha</label>
              <input type="password" required className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 transition-all bg-gray-50 text-sm text-slate-700 font-bold" style={{ '--tw-ring-color': COLORS.IMEX_GREEN } as any} placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black border border-red-100 text-center uppercase tracking-widest">{error}</div>}

            <button type="submit" className="w-full py-5 rounded-2xl font-black text-xs text-white transition-all shadow-2xl uppercase tracking-[3px]" style={{ backgroundColor: COLORS.IMEX_GREEN }}>Atualizar e Acessar</button>
            
            <button type="button" onClick={() => { setIsFirstAccess(false); setIsExpiring(false); setPendingUser(null); setError(''); }} className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Voltar</button>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">© 2025 IMEX Solutions</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
