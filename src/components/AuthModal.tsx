import React, { useState } from 'react';
import { LogIn, UserCheck, Key, AlertCircle, CheckCircle2, Lock, Mail, User, Sparkles, X, Shield } from 'lucide-react';
import { getSupabaseClient, clearSupabaseCredentials } from '../lib/supabase';
import { UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onSelectUser: (user: UserType, email?: string) => void;
  userEmail?: string;
  onAuthSuccess?: (email: string, userType: UserType) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  userEmail,
  onAuthSuccess
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'login' | 'signup'>('login');
  
  // Login / Signup Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCoupleRole, setSelectedCoupleRole] = useState<UserType>('A');
  
  // Status messages
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('Autenticação remota indisponível no momento. Por favor, use a aba "Trocar Usuário" para acesso rápido.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const userMetadataRole = data.user.user_metadata?.couple_role as UserType | undefined;
        const inferredRole: UserType = (data.user.email?.toLowerCase().includes('luana') || email.toLowerCase().includes('luana')) ? 'B' : 'A';
        const role = userMetadataRole || inferredRole;
        setSuccessMsg(`Login efetuado com sucesso! Bem-vindo(a), ${data.user.user_metadata?.full_name || data.user.email}`);
        
        if (onAuthSuccess) {
          onAuthSuccess(data.user.email || '', role);
        } else {
          onSelectUser(role, data.user.email);
        }

        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      if (err?.message?.includes('Forbidden use of secret API key') || err?.message?.includes('secret API key') || err?.message?.includes('Invalid API key')) {
        clearSupabaseCredentials();
        setErrorMsg('Sua sessão utilizava uma chave antiga em cache. A chave oficial anon JWT foi restaurada! Por favor, clique novamente para prosseguir.');
      } else if (err?.message?.toLowerCase().includes('email not confirmed') || err?.message?.toLowerCase().includes('email_not_confirmed')) {
        setErrorMsg('O Supabase registra este e-mail como pendente de confirmação. Recarregue a página se o link foi clicado recentemente ou confirme o usuário no painel do Supabase.');
      } else {
        setErrorMsg(err.message || 'Erro ao realizar login.');
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
        setSuccessMsg('Conta criada com sucesso!');
        if (onAuthSuccess) {
          onAuthSuccess(data.user.email || '', selectedCoupleRole);
        } else {
          onSelectUser(selectedCoupleRole, data.user.email);
        }
        setTimeout(() => {
          setActiveTab('login');
        }, 1500);
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

  const handleQuickLogin = (role: UserType) => {
    const name = role === 'A' ? 'Georges' : 'Luana';
    onSelectUser(role, role === 'A' ? 'georges@financas.app' : 'luana@financas.app');
    setSuccessMsg(`Sessão ativa como ${name}`);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <Lock size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Autenticação & Acesso
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Finanças Compartilhadas • Georges & Luana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn size={14} />
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck size={14} />
            Criar Conta
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            Trocar Usuário
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-xs space-y-2 animate-fade-in">
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
                    if (onAuthSuccess) {
                      onAuthSuccess(userMail, role);
                    } else {
                      onSelectUser(role, userMail);
                    }
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm"
                >
                  Entrar em Modo Local Agora →
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleSupabaseLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail do Usuário
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="georges@exemplo.com ou luana@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </form>
          )}

          {/* TAB 2: SIGNUP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSupabaseSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="georges@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Perfil de Cônjuge
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCoupleRole('A')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      selectedCoupleRole === 'A'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👤 Georges (Marido)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCoupleRole('B')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      selectedCoupleRole === 'B'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👤 Luana (Esposa)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Criar Conta'}
              </button>
            </form>
          )}

          {/* TAB 3: QUICK SWITCH */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Selecione qual cônjuge está interagindo com o painel para lançamentos e filtros rápidos:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('A')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    currentUser === 'A'
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      G
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Georges</h4>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Marido</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">georges@financas.app</span>
                  {currentUser === 'A' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-1 rounded-full self-start">
                      <CheckCircle2 size={12} /> Ativo no momento
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('B')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    currentUser === 'B'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      L
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Luana</h4>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Esposa</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">luana@financas.app</span>
                  {currentUser === 'B' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full self-start">
                      <CheckCircle2 size={12} /> Ativa no momento
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-500" />
            <span>Sessão Protegida SSL</span>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Continuar para o App →
          </button>
        </div>
      </div>
    </div>
  );
}

