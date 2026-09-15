import React, { useState } from 'react';
import { 
  Wallet, 
  Lock, 
  LogIn, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Key, 
  User, 
  Shield, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { getSupabaseClient, clearSupabaseCredentials } from '../lib/supabase';
import { UserType } from '../types';

interface LoginPageProps {
  onLoginSuccess: (userType: UserType, email: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function LoginPage({ onLoginSuccess, theme, onToggleTheme }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Login / Signup Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCoupleRole, setSelectedCoupleRole] = useState<UserType>('A');
  
  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('O Supabase não está configurado no ambiente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY com a chave pública (anon).');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userMetadataRole = data.user.user_metadata?.couple_role as UserType | undefined;
        const inferredRole: UserType = (data.user.email?.toLowerCase().includes('luana') || email.toLowerCase().includes('luana')) ? 'B' : 'A';
        const role = userMetadataRole || inferredRole;
        setSuccessMsg(`Autenticado como ${data.user.email}! Redirecionando...`);
        setTimeout(() => {
          onLoginSuccess(role, data.user?.email || (role === 'A' ? 'georges@financas.app' : 'luana@financas.app'));
        }, 800);
      }
    } catch (err: any) {
      if (err?.message?.includes('Forbidden use of secret API key') || err?.message?.includes('secret API key') || err?.message?.includes('Invalid API key')) {
        clearSupabaseCredentials();
        setErrorMsg('Sua sessão utilizava uma chave antiga em cache. A chave oficial anon JWT foi restaurada! Por favor, clique novamente para prosseguir.');
      } else if (err?.message?.toLowerCase().includes('email not confirmed') || err?.message?.toLowerCase().includes('email_not_confirmed')) {
        setErrorMsg('O Supabase ainda indica que o e-mail não foi confirmado. Causas comuns: 1) O link foi clicado no celular/outro navegador e a sessão deste navegador ainda não atualizou (recarregue esta página); 2) No painel do Supabase (Authentication -> Users), o admin precisa confirmar o e-mail ou desativar a exigência em "Authentication -> Providers -> Email -> Confirm email".');
      } else {
        setErrorMsg(err.message || 'Erro de autenticação. Verifique seu e-mail e senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('O Supabase não está configurado no ambiente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY com a chave pública (anon).');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            couple_role: selectedCoupleRole
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setSuccessMsg('Conta criada com sucesso! Entrando no sistema...');
        setTimeout(() => {
          onLoginSuccess(selectedCoupleRole, email);
        }, 1200);
      }
    } catch (err: any) {
      if (err?.message?.includes('Forbidden use of secret API key') || err?.message?.includes('secret API key') || err?.message?.includes('Invalid API key')) {
        clearSupabaseCredentials();
        setErrorMsg('Sua sessão utilizava uma chave antiga em cache. A chave oficial anon JWT foi restaurada! Por favor, tente criar a conta novamente.');
      } else {
        setErrorMsg(err.message || 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Finanças Compartilhadas
            </h1>
            <p className="text-xs text-indigo-300 font-medium">
              Georges & Luana
            </p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl text-slate-300 hover:text-white transition-colors"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
          {/* Card Title Header */}
          <div className="px-6 py-6 border-b border-slate-700/60 bg-slate-900/40 text-center">
            <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-3 border border-indigo-500/20">
              <Lock size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">
              Acessar Painel Financeiro
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gerenciamento integrado de patrimônio, investimentos e proventos
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-900/70 border-b border-slate-700/60 text-xs font-semibold gap-1">
            <button
              onClick={() => { setActiveTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={13} />
              Login
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck size={13} />
              Cadastrar
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {/* Notifications */}
            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs space-y-2 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const userMail = email || 'georges@financas.app';
                      const role: UserType = userMail.toLowerCase().includes('luana') ? 'B' : 'A';
                      onLoginSuccess(role, userMail);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm"
                  >
                    Entrar em Modo Local Agora →
                  </button>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleSupabaseLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="georges@exemplo.com ou luana@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            {/* TAB 2: SIGNUP */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSupabaseSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ex: Georges de Oliveira"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Perfil no Casal
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCoupleRole('A')}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        selectedCoupleRole === 'A'
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-bold'
                          : 'border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      👤 Georges (Marido)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCoupleRole('B')}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        selectedCoupleRole === 'B'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      👤 Luana (Esposa)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Cadastrando...' : 'Criar Conta'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              <span>Conexão Criptografada SSL</span>
            </div>
            <span className="text-[11px] text-slate-500">v1.0.0</span>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-xs text-slate-500 relative z-10">
        Finanças Compartilhadas para Casais • Georges & Luana
      </footer>
    </div>
  );
}

