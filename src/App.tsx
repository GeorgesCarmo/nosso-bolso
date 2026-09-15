import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Shield, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  LayoutDashboard, 
  Heart,
  Settings,
  HelpCircle,
  Coins,
  LogIn,
  LogOut,
  User,
  UserCheck,
  CreditCard as CreditCardIcon,
  CalendarClock,
  AlertTriangle
} from 'lucide-react';

// Data and Types
import { Transaction, VariableAsset, DividendReceived, FixedIncome, UserType, CreditCard, InstallmentPlan } from './types';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_ASSETS, 
  INITIAL_DIVIDENDS, 
  INITIAL_FIXED_INCOME,
  INITIAL_CREDIT_CARDS,
  INITIAL_INSTALLMENT_PLANS
} from './data/initialData';

// Subcomponents
import DashboardTab from './components/DashboardTab';
import TransactionsTab from './components/TransactionsTab';
import VariableTab from './components/VariableTab';
import DividendsTab from './components/DividendsTab';
import FixedTab from './components/FixedTab';
import CardsTab from './components/CardsTab';
import BillsDueTab from './components/BillsDueTab';
import AuthModal from './components/AuthModal';
import LoginPage from './components/LoginPage';
import { getSupabaseClient } from './lib/supabase';
import { buildUnifiedBillsList, getCurrentMonthString, getDueUrgency, getTodayDateString } from './utils/billHelpers';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Login Gate State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('app-is-logged-in') === 'true';
  });

  // Auth & Active User State
  const [currentUser, setCurrentUser] = useState<UserType>(() => {
    const saved = localStorage.getItem('app-current-user');
    return (saved as UserType) || 'A';
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    const saved = localStorage.getItem('app-user-email');
    return saved || 'georges@financas.app';
  });

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Check Supabase session on mount & subscribe to auth changes
  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      // 1. Initial session check
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserEmail(session.user.email || '');
          const role = (session.user.user_metadata?.couple_role as UserType) || 'A';
          setCurrentUser(role);
          setIsLoggedIn(true);
          localStorage.setItem('app-is-logged-in', 'true');
        }
      });

      // 2. Auth state listener
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setUserEmail(session.user.email || '');
          const role = (session.user.user_metadata?.couple_role as UserType) || 'A';
          setCurrentUser(role);
          setIsLoggedIn(true);
          localStorage.setItem('app-is-logged-in', 'true');

          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Save auth state
  useEffect(() => {
    localStorage.setItem('app-current-user', currentUser);
    localStorage.setItem('app-user-email', userEmail);
  }, [currentUser, userEmail]);

  const handleLoginSuccess = (userType: UserType, email: string) => {
    setCurrentUser(userType);
    setUserEmail(email);
    setIsLoggedIn(true);
    localStorage.setItem('app-is-logged-in', 'true');
  };

  const handleLogout = () => {
    const client = getSupabaseClient();
    if (client) {
      client.auth.signOut().catch(() => {});
    }
    setIsLoggedIn(false);
    localStorage.removeItem('app-is-logged-in');
  };

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Financial States
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finances-tx');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [assets, setAssets] = useState<VariableAsset[]>(() => {
    const saved = localStorage.getItem('finances-assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [dividends, setDividends] = useState<DividendReceived[]>(() => {
    const saved = localStorage.getItem('finances-divs');
    return saved ? JSON.parse(saved) : INITIAL_DIVIDENDS;
  });

  const [fixedIncome, setFixedIncome] = useState<FixedIncome[]>(() => {
    const saved = localStorage.getItem('finances-fixed');
    return saved ? JSON.parse(saved) : INITIAL_FIXED_INCOME;
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('finances-cards');
    if (!saved) return INITIAL_CREDIT_CARDS;
    try {
      const parsed: CreditCard[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map(c => c.id));
      const missingDefaults = INITIAL_CREDIT_CARDS.filter(c => !existingIds.has(c.id));
      return [...parsed, ...missingDefaults];
    } catch {
      return INITIAL_CREDIT_CARDS;
    }
  });

  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(() => {
    const saved = localStorage.getItem('finances-installments');
    return saved ? JSON.parse(saved) : INITIAL_INSTALLMENT_PLANS;
  });

  const [cardPaidMap, setCardPaidMap] = useState<Record<string, { status: 'paid' | 'pending'; paidAt?: string; amount?: number }>>(() => {
    const saved = localStorage.getItem('finances-card-paid-map');
    return saved ? JSON.parse(saved) : {};
  });

  // Effect to apply Theme Class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Sync state to localStorage on modification
  useEffect(() => {
    localStorage.setItem('finances-tx', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finances-assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('finances-divs', JSON.stringify(dividends));
  }, [dividends]);

  useEffect(() => {
    localStorage.setItem('finances-fixed', JSON.stringify(fixedIncome));
  }, [fixedIncome]);

  useEffect(() => {
    localStorage.setItem('finances-cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('finances-installments', JSON.stringify(installmentPlans));
  }, [installmentPlans]);

  useEffect(() => {
    localStorage.setItem('finances-card-paid-map', JSON.stringify(cardPaidMap));
  }, [cardPaidMap]);

  // Global theme switcher toggle
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSelectUser = (user: UserType, email?: string) => {
    setCurrentUser(user);
    if (email) {
      setUserEmail(email);
    } else {
      setUserEmail(user === 'A' ? 'georges@financas.app' : 'luana@financas.app');
    }
  };

  const handleAuthSuccess = (email: string, userType: UserType) => {
    setUserEmail(email);
    setCurrentUser(userType);
  };

  // State mutation handlers (CRUD)
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const txWithId: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [txWithId, ...prev]);
  };

  const handleAddBatchTransactions = (newTxs: Omit<Transaction, 'id'>[]) => {
    const now = Date.now();
    const txsWithIds: Transaction[] = newTxs.map((tx, idx) => ({
      ...tx,
      id: `tx-${now}-${idx}`
    }));
    setTransactions(prev => [...txsWithIds, ...prev]);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleCardPayment = (cardId: string, month: string, currentAmount: number) => {
    const key = `${cardId}_${month}`;
    const today = getTodayDateString();
    setCardPaidMap(prev => {
      const isPaid = prev[key]?.status === 'paid';
      const updated = { ...prev };
      if (isPaid) {
        updated[key] = { status: 'pending', paidAt: undefined, amount: currentAmount };
      } else {
        updated[key] = { status: 'paid', paidAt: today, amount: currentAmount };
      }
      return updated;
    });
  };

  const handleAddAsset = (newAsset: Omit<VariableAsset, 'id'>) => {
    const assetWithId: VariableAsset = {
      ...newAsset,
      id: `asset-${Date.now()}`
    };
    setAssets(prev => [assetWithId, ...prev]);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleAddDividend = (newDiv: Omit<DividendReceived, 'id'>) => {
    const divWithId: DividendReceived = {
      ...newDiv,
      id: `div-${Date.now()}`
    };
    setDividends(prev => [divWithId, ...prev]);
  };

  const handleDeleteDividend = (id: string) => {
    setDividends(prev => prev.filter(d => d.id !== id));
  };

  const handleAddFixed = (newFixed: Omit<FixedIncome, 'id'>) => {
    const fixedWithId: FixedIncome = {
      ...newFixed,
      id: `fixed-${Date.now()}`
    };
    setFixedIncome(prev => [fixedWithId, ...prev]);
  };

  const handleDeleteFixed = (id: string) => {
    setFixedIncome(prev => prev.filter(f => f.id !== id));
  };

  const handleAddCreditCard = (newCard: Omit<CreditCard, 'id'>) => {
    const cardWithId: CreditCard = {
      ...newCard,
      id: `card-${Date.now()}`
    };
    setCreditCards(prev => [...prev, cardWithId]);
  };

  const handleUpdateCreditCard = (updatedCard: CreditCard) => {
    setCreditCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  const handleDeleteCreditCard = (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
    setInstallmentPlans(prev => prev.filter(p => p.cardId !== id));
  };

  const handleAddInstallmentPlan = (newPlan: Omit<InstallmentPlan, 'id' | 'paidInstallments'>) => {
    const planWithId: InstallmentPlan = {
      ...newPlan,
      id: `plan-${Date.now()}`,
      paidInstallments: 0,
    };
    setInstallmentPlans(prev => [planWithId, ...prev]);
  };

  const handleDeleteInstallmentPlan = (id: string) => {
    setInstallmentPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateInstallmentProgress = (id: string, paidCount: number) => {
    setInstallmentPlans(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          paidInstallments: Math.min(p.totalInstallments, Math.max(0, paidCount))
        };
      }
      return p;
    }));
  };

  // Calculate current month urgent and overdue items for topbar notification badge
  const todayStr = getTodayDateString();
  const currentMonth = getCurrentMonthString();
  const currentMonthBills = buildUnifiedBillsList(
    transactions,
    creditCards,
    installmentPlans,
    currentMonth,
    cardPaidMap
  );

  const urgentBillsCount = currentMonthBills.filter(b => {
    if (b.isPaid) return false;
    const urg = getDueUrgency(b.dueDate, b.isPaid, todayStr);
    return urg === 'overdue' || urg === 'today' || urg === 'urgent';
  }).length;

  // Render correct panel
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab 
            transactions={transactions} 
            assets={assets} 
            fixedIncome={fixedIncome} 
            dividends={dividends} 
            creditCards={creditCards}
            installmentPlans={installmentPlans}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'vencimentos':
        return (
          <BillsDueTab 
            transactions={transactions}
            creditCards={creditCards}
            installmentPlans={installmentPlans}
            onUpdateTransaction={handleUpdateTransaction}
            onAddTransaction={handleAddTransaction}
            currentUser={currentUser}
            cardPaidMap={cardPaidMap}
            onToggleCardPayment={handleToggleCardPayment}
          />
        );
      case 'lancamentos':
        return (
          <TransactionsTab 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction} 
            onAddBatchTransactions={handleAddBatchTransactions}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            currentUser={currentUser}
          />
        );
      case 'cartoes':
        return (
          <CardsTab 
            creditCards={creditCards}
            installmentPlans={installmentPlans}
            transactions={transactions}
            onAddCreditCard={handleAddCreditCard}
            onUpdateCreditCard={handleUpdateCreditCard}
            onDeleteCreditCard={handleDeleteCreditCard}
            onAddInstallmentPlan={handleAddInstallmentPlan}
            onDeleteInstallmentPlan={handleDeleteInstallmentPlan}
            onUpdateInstallmentProgress={handleUpdateInstallmentProgress}
            currentUser={currentUser}
          />
        );
      case 'renda-variavel':
        return (
          <VariableTab 
            assets={assets} 
            onAddAsset={handleAddAsset} 
            onDeleteAsset={handleDeleteAsset} 
            dividends={dividends} 
            onAddDividend={handleAddDividend} 
            onDeleteDividend={handleDeleteDividend}
            currentUser={currentUser}
          />
        );
      case 'dividendos':
        return (
          <DividendsTab
            dividends={dividends}
            assets={assets}
            onAddDividend={handleAddDividend}
            onDeleteDividend={handleDeleteDividend}
          />
        );
      case 'renda-fixa':
        return (
          <FixedTab 
            fixedIncomeAssets={fixedIncome} 
            onAddFixed={handleAddFixed} 
            onDeleteFixed={handleDeleteFixed}
            currentUser={currentUser}
          />
        );
      default:
        return <div className="text-center py-12">Tab não encontrada.</div>;
    }
  };

  // Sidebar Menu Items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'vencimentos', label: 'Vencimentos & Contas', icon: CalendarClock, badge: urgentBillsCount > 0 ? urgentBillsCount : undefined },
    { id: 'lancamentos', label: 'Receitas & Despesas', icon: Wallet },
    { id: 'cartoes', label: 'Cartões & Parcelamentos', icon: CreditCardIcon },
    { id: 'renda-variavel', label: 'Renda Variável (Ações/FIIs)', icon: TrendingUp },
    { id: 'dividendos', label: 'Proventos & Dividendos', icon: Coins },
    { id: 'renda-fixa', label: 'Renda Fixa Pré', icon: TrendingUp },
  ];

  const handleClearAllData = () => {
    if (window.confirm('Deseja limpar os dados de exemplo para iniciar seus testes com dados zerados? (Você poderá restaurar os dados de demonstração a qualquer momento).')) {
      setTransactions([]);
      setAssets([]);
      setDividends([]);
      setFixedIncome([]);
      setCreditCards([]);
      setInstallmentPlans([]);
      setCardPaidMap({});
      localStorage.setItem('finances-tx', JSON.stringify([]));
      localStorage.setItem('finances-assets', JSON.stringify([]));
      localStorage.setItem('finances-divs', JSON.stringify([]));
      localStorage.setItem('finances-fixed', JSON.stringify([]));
      localStorage.setItem('finances-cards', JSON.stringify([]));
      localStorage.setItem('finances-installments', JSON.stringify([]));
      localStorage.setItem('finances-card-paid-map', JSON.stringify({}));
    }
  };

  const handleRestoreDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setAssets(INITIAL_ASSETS);
    setDividends(INITIAL_DIVIDENDS);
    setFixedIncome(INITIAL_FIXED_INCOME);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setInstallmentPlans(INITIAL_INSTALLMENT_PLANS);
    setCardPaidMap({});
    localStorage.setItem('finances-tx', JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem('finances-assets', JSON.stringify(INITIAL_ASSETS));
    localStorage.setItem('finances-divs', JSON.stringify(INITIAL_DIVIDENDS));
    localStorage.setItem('finances-fixed', JSON.stringify(INITIAL_FIXED_INCOME));
    localStorage.setItem('finances-cards', JSON.stringify(INITIAL_CREDIT_CARDS));
    localStorage.setItem('finances-installments', JSON.stringify(INITIAL_INSTALLMENT_PLANS));
    localStorage.setItem('finances-card-paid-map', JSON.stringify({}));
  };

  const currentUserName = currentUser === 'A' ? 'Georges' : 'Luana';

  // If user is not logged in, render the Login/Registration Screen
  if (!isLoggedIn) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
                <Wallet size={20} />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-950 dark:text-white flex items-center gap-1.5">
                  Finanças Compartilhadas <Heart size={14} className="text-red-500 fill-red-500" />
                </span>
                <span className="text-[10px] text-slate-500 block">Georges & Luana • Planejamento Familiar</span>
              </div>
            </div>

            {/* Actions: Light/Dark, Login/User Status, Logout, Mobile trigger */}
            <div className="flex items-center gap-3">
              {/* Due Date Alert Quick Pill */}
              {urgentBillsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('vencimentos')}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold transition-all cursor-pointer animate-pulse"
                  title="Clique para ver os vencimentos urgentes"
                >
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span>{urgentBillsCount} {urgentBillsCount === 1 ? 'vencimento próximo' : 'vencimentos próximos'}</span>
                </button>
              )}

              {/* User Account / Auth Badge */}
              <button
                id="auth-badge-btn"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                title="Clique para Entrar, Cadastrar ou Trocar de Usuário"
              >
                <div className={`w-6 h-6 rounded-lg text-white font-bold flex items-center justify-center text-[10px] ${
                  currentUser === 'A' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}>
                  {currentUser}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-bold text-slate-900 dark:text-white block leading-none">
                    {currentUserName}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight truncate max-w-[120px]">
                    {userEmail}
                  </span>
                </div>
              </button>

              {/* Logout Button */}
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut size={18} />
              </button>

              {/* Theme Toggle Button */}
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title={theme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
              >
                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>

              {/* Mobile Menu trigger */}
              <button
                id="mobile-menu-trigger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        userEmail={userEmail}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* WORKSPACE CONTENT AREA */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8" id="workspace-layout">
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside className="hidden md:block w-64 shrink-0">
          <nav className="space-y-1.5 sticky top-24" id="desktop-nav">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">Módulos do Sistema</span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive 
                        ? 'bg-white text-indigo-700' 
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Workspace quick utilities */}
            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3">Dados & Demonstração</span>
              <button
                id="restore-demo-data-btn"
                onClick={handleRestoreDemoData}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                ↺ Restaurar Dados de Exemplo
              </button>
              <button
                id="clear-all-data-btn"
                onClick={handleClearAllData}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                🗑 Limpar Todos os Registros
              </button>
            </div>
          </nav>
        </aside>

        {/* MOBILE DRAWER NAVIGATION */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm md:hidden flex justify-end" id="mobile-drawer">
            <div className="w-72 bg-white dark:bg-slate-900 h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <Wallet size={16} />
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Finanças Compartilhadas</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-white text-indigo-700' : 'bg-amber-500 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                <button
                  onClick={() => {
                    handleRestoreDemoData();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-400"
                >
                  ↺ Restaurar Dados de Exemplo
                </button>
                <button
                  onClick={() => {
                    handleClearAllData();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-500"
                >
                  🗑 Limpar Todos os Registros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 min-w-0" id="main-panel">
          {renderActivePanel()}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1">
          <p>Finanças Compartilhadas • Sistema de Gestão Patrimonial e Familiar de Georges & Luana</p>
          <p className="text-[11px] text-slate-500">Módulo de Vencimentos, Consórcios, Cartões de Crédito e Controle de Investimentos</p>
        </div>
      </footer>
    </div>
  );
}
