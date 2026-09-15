import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  HelpCircle, 
  Shield, 
  Users, 
  User,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Car,
  CreditCard as CreditCardIcon,
  FileText
} from 'lucide-react';
import { Transaction, VariableAsset, FixedIncome, DividendReceived, CreditCard, InstallmentPlan } from '../types';
import { formatDateBR } from '../utils/formatters';
import { 
  buildUnifiedBillsList, 
  getDaysDifference, 
  getDueUrgency, 
  getDueBadgeInfo, 
  getTodayDateString, 
  getCurrentMonthString 
} from '../utils/billHelpers';

interface DashboardTabProps {
  transactions: Transaction[];
  assets: VariableAsset[];
  fixedIncome: FixedIncome[];
  dividends: DividendReceived[];
  creditCards?: CreditCard[];
  installmentPlans?: InstallmentPlan[];
  onNavigateToTab?: (tab: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function DashboardTab({
  transactions,
  assets,
  fixedIncome,
  dividends,
  creditCards = [],
  installmentPlans = [],
  onNavigateToTab
}: DashboardTabProps) {
  // User filter state: 'all' (consolidated), 'A' (Georges), 'B' (Luana)
  const [userContext, setUserContext] = useState<'all' | 'A' | 'B'>('all');

  // Filter lists based on selected context
  const filteredTx = transactions.filter(t => userContext === 'all' || t.user === userContext);
  const filteredRF = fixedIncome.filter(rf => userContext === 'all' || rf.user === userContext);
  
  const activeAssetVal = assets.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0);
  const variableValue = userContext === 'all' ? activeAssetVal : activeAssetVal * (userContext === 'A' ? 0.55 : 0.45);

  // Proventos received
  const filteredDivs = dividends.filter(d => userContext === 'all' || d.user === userContext);
  const totalDivs = filteredDivs.reduce((sum, d) => sum + d.amount, 0);

  // Financial ledger calculations
  const totalReceitas = filteredTx.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = filteredTx.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
  const cashBalance = totalReceitas - totalDespesas;

  // Fixed Income calculations
  const fixedValue = filteredRF.reduce((sum, f) => sum + f.initialAmount, 0);

  // Net worth calculation
  const netWorth = cashBalance + fixedValue + variableValue;

  // Due Dates & Bills in current month
  const todayStr = getTodayDateString();
  const currentMonthStr = getCurrentMonthString();
  const currentMonthBills = buildUnifiedBillsList(
    transactions,
    creditCards,
    installmentPlans,
    currentMonthStr
  );

  const pendingUpcomingBills = currentMonthBills
    .filter(b => !b.isPaid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const overdueCount = currentMonthBills.filter(b => !b.isPaid && getDueUrgency(b.dueDate, b.isPaid, todayStr) === 'overdue').length;
  const urgentCount = currentMonthBills.filter(b => {
    if (b.isPaid) return false;
    const urg = getDueUrgency(b.dueDate, b.isPaid, todayStr);
    return urg === 'today' || urg === 'urgent';
  }).length;

  // Compile monthly revenues vs expenses
  const getMonthlyFinances = () => {
    const monthlyMap: { [key: string]: { receitas: number, despesas: number } } = {};
    
    filteredTx.forEach(t => {
      const dateObj = new Date(t.date);
      const year = dateObj.getFullYear();
      const monthNum = dateObj.getMonth() + 1;
      const monthKey = `${year}-${monthNum < 10 ? '0' + monthNum : monthNum}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { receitas: 0, despesas: 0 };
      }
      if (t.type === 'receita') {
        monthlyMap[monthKey].receitas += t.amount;
      } else {
        monthlyMap[monthKey].despesas += t.amount;
      }
    });

    return Object.keys(monthlyMap)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const label = `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
        return {
          monthKey: key,
          name: label,
          'Receitas': Math.round(monthlyMap[key].receitas),
          'Despesas': Math.round(monthlyMap[key].despesas)
        };
      });
  };

  const monthlyFinancesData = getMonthlyFinances();

  // Compile expenses by category
  const getExpensesByCategory = () => {
    const catMap: { [key: string]: number } = {};
    filteredTx.filter(t => t.type === 'despesa').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    return Object.keys(catMap).map(cat => ({
      name: cat,
      value: Math.round(catMap[cat])
    }));
  };

  const expensesCategoryData = getExpensesByCategory();

  return (
    <div className="space-y-8" id="dashboard-tab-container">
      {/* Context Switcher bar */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Contexto Familiar Ativo</span>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
            {userContext === 'all' ? (
              <>
                <Users size={16} className="text-indigo-500" />
                Consolidação Familiar (Georges & Luana)
              </>
            ) : userContext === 'A' ? (
              <>
                <User size={16} className="text-indigo-500" />
                Apenas Georges (Marido)
              </>
            ) : (
              <>
                <User size={16} className="text-emerald-500" />
                Apenas Luana (Esposa)
              </>
            )}
          </h2>
        </div>

        {/* Toggle controls */}
        <div className="flex gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            id="ctx-all-btn"
            onClick={() => setUserContext('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              userContext === 'all'
                ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            👪 Ambos (Consolidado)
          </button>
          <button
            id="ctx-a-btn"
            onClick={() => setUserContext('A')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              userContext === 'A'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold'
                : 'text-slate-500 hover:text-indigo-600'
            }`}
          >
            👤 Georges
          </button>
          <button
            id="ctx-b-btn"
            onClick={() => setUserContext('B')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              userContext === 'B'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            👤 Luana
          </button>
        </div>
      </div>

      {/* UPCOMING DUE DATES ALERT WIDGET */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Próximos Vencimentos & Prazos de Pagamento</span>
                {(overdueCount > 0 || urgentCount > 0) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                    {overdueCount > 0 ? `${overdueCount} atrasada(s)` : `${urgentCount} vencendo`}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Boletos de consórcio, aluguel e faturas de cartão com vencimento mais próximo.
              </p>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('vencimentos')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Central de Vencimentos</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {pendingUpcomingBills.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 text-center flex items-center justify-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 size={16} />
            <span>Todas as contas e faturas deste mês já estão liquidadas e em dia!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingUpcomingBills.slice(0, 3).map(bill => {
              const diffDays = getDaysDifference(bill.dueDate, todayStr);
              const urgency = getDueUrgency(bill.dueDate, bill.isPaid, todayStr);
              const badge = getDueBadgeInfo(urgency, diffDays);

              return (
                <div 
                  key={bill.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {bill.isConsortium ? (
                        <Car size={14} className="text-amber-500 shrink-0" />
                      ) : bill.sourceType === 'credit_card_invoice' ? (
                        <CreditCardIcon size={14} className="text-indigo-500 shrink-0" />
                      ) : (
                        <FileText size={14} className="text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {bill.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Venc: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatDateBR(bill.dueDate)}</strong></span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${badge.colorClass}`}>
                        {badge.shortLabel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                      R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net Worth */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Patrimônio Líquido</span>
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white block mt-1">
              R$ {netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" />
            <span>Saldos + Renda Fixa + Variável - Dívidas</span>
          </div>
        </div>

        {/* Bank / Cash Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Saldo Líquido Acumulado</span>
            <span className={`font-mono text-2xl font-black block mt-1 ${cashBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
              R$ {cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-emerald-600 font-bold">+{Math.round(totalReceitas).toLocaleString('pt-BR')}</span>
            <span className="text-red-500 font-bold">-{Math.round(totalDespesas).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Fixed Income Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Renda Fixa Pré-Fixada</span>
            <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
              R$ {fixedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Landmark size={12} className="text-emerald-500" />
            <span>CDBs, LCIs e Tesouro Direto</span>
          </div>
        </div>

        {/* Variable Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Renda Variável & FIIs</span>
            <span className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400 block mt-1">
              R$ {variableValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp size={12} className="text-amber-500" />
            <span>Dividendos: R$ {totalDivs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Fluxo Histórico Mensal (Receitas vs Despesas)
          </h3>
          <span className="text-xs text-slate-400">Histórico Consolidado Familiar</span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFinancesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lower Dashboard Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Expenses by category */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Distribuição de Despesas por Categoria
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 h-48">
              {expensesCategoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sem despesas registradas
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {expensesCategoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => `R$ ${Number(val).toLocaleString('pt-BR')}`}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="md:col-span-7 space-y-2 max-h-[180px] overflow-y-auto">
              {expensesCategoryData.length === 0 ? (
                <p className="text-xs text-slate-400">Registre suas despesas familiares para ver a segmentação por categoria.</p>
              ) : (
                expensesCategoryData.map((item, index) => {
                  const percentage = totalDespesas > 0 ? (item.value / totalDespesas) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        R$ {item.value.toLocaleString('pt-BR')} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Smart Family Advisor */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              <Shield size={18} />
              <h3>Conselheiro Financeiro Inteligente (Casal)</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Com base nos lançamentos, saldos de investimentos e taxa de poupança atual do casal, calculamos as métricas de saúde financeira familiar consolidadas.
            </p>
          </div>

          <div className="space-y-3.5 my-3">
            <div className="flex items-start gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 p-1.5 rounded-lg font-bold">
                Forte
              </span>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Reserva de Emergência</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sua Renda Fixa consolidada de R$ {fixedValue.toLocaleString('pt-BR')} cobre cerca de <strong>{totalDespesas > 0 ? Math.round((fixedValue / totalDespesas) * 10) / 10 : '6'} meses</strong> de despesas mensais médias. Recomendação de mercado ideal: 6 meses de custo fixo familiar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 p-1.5 rounded-lg font-bold">
                Info
              </span>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Taxa de Poupança Familiar</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Este mês, o casal poupou cerca de <strong>{totalReceitas > 0 ? Math.round((cashBalance / totalReceitas) * 100) : '35'}%</strong> das receitas. Excelente nível de enriquecimento! Manter acima de 20% garante aposentadoria precoce confortável.
                </p>
              </div>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 text-right block italic">
            Métricas calculadas em tempo real com base no histórico local.
          </span>
        </div>
      </div>
    </div>
  );
}
