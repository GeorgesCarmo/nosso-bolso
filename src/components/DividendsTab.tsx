import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Coins, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  TrendingUp, 
  Target, 
  User, 
  Users, 
  ArrowUpRight, 
  Percent, 
  Sparkles,
  HelpCircle,
  PiggyBank
} from 'lucide-react';
import { DividendReceived, VariableAsset, UserType } from '../types';

interface DividendsTabProps {
  dividends: DividendReceived[];
  assets: VariableAsset[];
  onAddDividend: (div: Omit<DividendReceived, 'id'>) => void;
  onDeleteDividend: (id: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444'];

export default function DividendsTab({
  dividends,
  assets,
  onAddDividend,
  onDeleteDividend
}: DividendsTabProps) {
  // Filters local state
  const [tickerSearch, setTickerSearch] = useState('');
  const [filterUser, setFilterUser] = useState<'all' | 'A' | 'B'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Custom Independence Target state (customizable!)
  const [monthlyTarget, setMonthlyTarget] = useState<number>(1000);
  
  // Form local state
  const [formTicker, setFormTicker] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMonth, setFormMonth] = useState('2026-07');
  const [formType, setFormType] = useState<'Dividendo' | 'JCP' | 'Rendimento'>('Dividendo');
  const [formUser, setFormUser] = useState<UserType>('A');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-complete suggestions from existing assets
  const portfolioTickers = Array.from(new Set(assets.map(a => a.ticker)));

  // Filter lists
  const filteredDividends = dividends.filter(d => {
    const matchesTicker = d.ticker.toLowerCase().includes(tickerSearch.toLowerCase().trim());
    const matchesUser = filterUser === 'all' || d.user === filterUser;
    const matchesType = filterType === 'all' || d.type === filterType;
    return matchesTicker && matchesUser && matchesType;
  });

  // Calculate stats based on filtered (or all) dividends
  const totalAmount = filteredDividends.reduce((sum, d) => sum + d.amount, 0);
  
  // Group dividends by month to find unique months and average
  const getMonthsList = () => {
    const months = new Set(dividends.map(d => d.date));
    return months.size > 0 ? months.size : 1;
  };
  const activeMonthsCount = getMonthsList();
  const averageMonthly = totalAmount / activeMonthsCount;

  // Find biggest payer
  const getBiggestPayer = () => {
    const payers: { [key: string]: number } = {};
    filteredDividends.forEach(d => {
      payers[d.ticker] = (payers[d.ticker] || 0) + d.amount;
    });
    
    let biggestTicker = '-';
    let biggestVal = 0;
    
    Object.keys(payers).forEach(ticker => {
      if (payers[ticker] > biggestVal) {
        biggestVal = payers[ticker];
        biggestTicker = ticker;
      }
    });

    return { ticker: biggestTicker, amount: biggestVal };
  };
  const biggestPayer = getBiggestPayer();

  // Share between Georges and Luana
  const georgeTotal = filteredDividends.filter(d => d.user === 'A').reduce((sum, d) => sum + d.amount, 0);
  const marianaTotal = filteredDividends.filter(d => d.user === 'B').reduce((sum, d) => sum + d.amount, 0);

  // Group monthly for Recharts (stacked bars)
  const getMonthlyChartData = () => {
    const monthlyMap: { [key: string]: { A: number; B: number } } = {};
    
    // Initialize months represented in dividends
    dividends.forEach(d => {
      if (!monthlyMap[d.date]) {
        monthlyMap[d.date] = { A: 0, B: 0 };
      }
    });

    filteredDividends.forEach(d => {
      if (monthlyMap[d.date]) {
        monthlyMap[d.date][d.user] += d.amount;
      }
    });

    return Object.keys(monthlyMap)
      .sort()
      .map(month => {
        const [year, m] = month.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const label = `${monthNames[parseInt(m) - 1]}/${year.slice(2)}`;
        return {
          monthCode: month,
          name: label,
          'Georges': Math.round(monthlyMap[month].A * 100) / 100,
          'Luana': Math.round(monthlyMap[month].B * 100) / 100,
          'Total': Math.round((monthlyMap[month].A + monthlyMap[month].B) * 100) / 100
        };
      });
  };

  const monthlyChartData = getMonthlyChartData();

  // Donut chart of asset breakdown
  const getAssetDistributionData = () => {
    const tickerMap: { [key: string]: number } = {};
    filteredDividends.forEach(d => {
      tickerMap[d.ticker] = (tickerMap[d.ticker] || 0) + d.amount;
    });

    return Object.keys(tickerMap)
      .map(ticker => ({
        name: ticker,
        value: Math.round(tickerMap[ticker] * 100) / 100
      }))
      .sort((a, b) => b.value - a.value);
  };

  const assetDistributionData = getAssetDistributionData();

  // Handle Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTicker || !formAmount || !formMonth) return;

    onAddDividend({
      ticker: formTicker.toUpperCase().trim(),
      amount: parseFloat(formAmount),
      date: formMonth,
      type: formType,
      user: formUser
    });

    // Show success message
    setSuccessMessage(`Provento de ${formTicker.toUpperCase()} registrado com sucesso!`);
    setTimeout(() => setSuccessMessage(''), 3000);

    // Reset input fields
    setFormTicker('');
    setFormAmount('');
  };

  const handleSuggestTicker = (ticker: string) => {
    setFormTicker(ticker);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dividends-tab-container">
      {/* HEADER BANNER */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Coins size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Gestão de Proventos e Dividendos
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-3xl">
                Gerencie seus rendimentos de Fundos Imobiliários (FIIs) e dividendos/JCP de ações. 
                Acompanhe o crescimento da renda passiva do casal e projete a sua independência financeira de forma integrada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Received */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Recebido</span>
            <span className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400 block mt-1">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" />
            <span>Soma de todo o histórico lançado</span>
          </div>
        </div>

        {/* Monthly Average */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Média Mensal Ativa</span>
            <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
              R$ {averageMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            <span>Calculada sobre {activeMonthsCount} meses ativos</span>
          </div>
        </div>

        {/* Highest Payer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Maior Pagador</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white block mt-1 truncate">
              {biggestPayer.ticker}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              R$ {biggestPayer.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pagos
            </span>
          </div>
        </div>

        {/* Spouse Balance Share */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full translate-x-4 -translate-y-4" />
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Divisão por Cônjuge</span>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-center">
                <span className="text-[10px] text-indigo-500 uppercase font-bold block">Georges</span>
                <span className="font-mono text-sm font-bold text-slate-850 dark:text-slate-200">
                  {totalAmount > 0 ? `${((georgeTotal / totalAmount) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
              <div className="h-6 border-r border-slate-200 dark:border-slate-800" />
              <div className="text-center">
                <span className="text-[10px] text-emerald-500 uppercase font-bold block">Luana</span>
                <span className="font-mono text-sm font-bold text-slate-850 dark:text-slate-200">
                  {totalAmount > 0 ? `${((marianaTotal / totalAmount) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>G: R$ {Math.round(georgeTotal)}</span>
            <span>L: R$ {Math.round(marianaTotal)}</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC RETIREMENT / INDEPENDENCE GOAL TRACKER */}
      <div className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-100 dark:border-indigo-950/50 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              <Target size={18} />
              <h3>Meta de Liberdade Financeira</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Defina o seu objetivo de renda passiva mensal. Calculamos o quanto a sua carteira consolidada atual já atinge essa meta de vida.
            </p>
            <div className="pt-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Meta Mensal (R$): R$ {monthlyTarget.toLocaleString('pt-BR')}
              </label>
              <input 
                id="retirement-target-slider"
                type="range"
                min="200"
                max="10000"
                step="100"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="md:col-span-5 space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Progresso Consolidado</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                {monthlyTarget > 0 ? ((averageMonthly / monthlyTarget) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            {/* Custom progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-100 dark:border-slate-850">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, monthlyTarget > 0 ? (averageMonthly / monthlyTarget) * 100 : 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Média Atual: R$ {averageMonthly.toFixed(2)}</span>
              <span>Meta: R$ {monthlyTarget.toFixed(2)}</span>
            </div>
          </div>

          <div className="md:col-span-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-900 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Status da Meta 🏆</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              {averageMonthly >= monthlyTarget ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles size={12} /> Parabéns! Meta alcançada! Suas contas essenciais estão cobertas por renda passiva.
                </span>
              ) : averageMonthly > (monthlyTarget * 0.5) ? (
                <span>Excelente! Vocês já cobrem metade da meta planejada. O efeito bola de neve está acelerando!</span>
              ) : averageMonthly > (monthlyTarget * 0.1) ? (
                <span>Ótimo! Sua renda passiva já cobre contas menores de luz, internet e streaming. Continuem aportando!</span>
              ) : (
                <span>Estágio inicial. Cada pequeno dividendo recebido é um tijolo na construção da liberdade de vocês.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & GRAPHS AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FILTERS CONTAINER (Left/Header of block) */}
        <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-850 dark:text-slate-200 text-xs font-semibold">
            <Filter size={16} className="text-indigo-500" />
            <span>Filtros Rápidos:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1 md:flex-initial max-w-2xl">
            {/* Search ticker */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={tickerSearch}
                onChange={(e) => setTickerSearch(e.target.value)}
                placeholder="Filtrar por Ticker..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
              />
            </div>

            {/* Recipient selection */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-300"
            >
              <option value="all">👥 Todos os Beneficiários</option>
              <option value="A">👤 Georges (Marido)</option>
              <option value="B">👤 Luana (Esposa)</option>
            </select>

            {/* Type selection */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-300"
            >
              <option value="all">🏷️ Todos os Tipos</option>
              <option value="Dividendo">Dividendo</option>
              <option value="Rendimento">Rendimento</option>
              <option value="JCP">JCP</option>
            </select>
          </div>
        </div>

        {/* Charts: Left - Evolution; Right - Breakdown */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Histórico e Evolução Mensal (Georges vs Luana)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Visualização de proventos empilhados para demonstrar a sinergia financeira.</p>
          </div>

          <div className="h-64 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850">
            {monthlyChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Nenhum dado financeiro para exibir.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, undefined]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Bar dataKey="Georges" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={32} />
                  <Bar dataKey="Luana" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Breakdown by Ticker Asset */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Participação por Ativo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quais papéis mais contribuem com o fluxo passivo.</p>
          </div>

          <div className="h-44 flex items-center justify-center">
            {assetDistributionData.length === 0 ? (
              <span className="text-xs text-slate-400">Nenhum provento recebido.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assetDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, undefined]}
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

          {/* Color Indicators legend */}
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
            {assetDistributionData.slice(0, 5).map((item, index) => {
              const percentage = totalAmount > 0 ? (item.value / totalAmount) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-[11px] font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                    R$ {Math.round(item.value)} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
            {assetDistributionData.length > 5 && (
              <div className="text-[10px] text-slate-400 text-center italic mt-1">
                + {assetDistributionData.length - 5} outros ativos menores
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FORM AND RECORDS LIST ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Registration */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Plus size={16} className="text-indigo-500" />
              Lançar Rendimento/Dividendo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Insira as informações do provento pago.</p>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-pulse">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Ativo (Ticker)</label>
                <input
                  id="div-ticker-input-main"
                  type="text"
                  required
                  value={formTicker}
                  onChange={(e) => setFormTicker(e.target.value)}
                  placeholder="Ex: HGLG11"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo Provento</label>
                <select
                  id="div-type-select-main"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-slate-900"
                >
                  <option value="Dividendo">Dividendo</option>
                  <option value="Rendimento">Rendimento (FII)</option>
                  <option value="JCP">JCP (Ações)</option>
                </select>
              </div>
            </div>

            {/* Quick Suggest Ticker bar if tickers exist */}
            {portfolioTickers.length > 0 && !formTicker && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Minha Carteira:</span>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {portfolioTickers.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSuggestTicker(t)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono hover:border-indigo-500 transition-colors cursor-pointer text-slate-600 dark:text-slate-400"
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor Pago (R$)</label>
                <input
                  id="div-amount-input-main"
                  type="number"
                  step="0.01"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Mês Pago</label>
                <input
                  id="div-month-input-main"
                  type="month"
                  required
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Cônjuge Recebedor</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="form-owner-a"
                  type="button"
                  onClick={() => setFormUser('A')}
                  className={`px-3 py-2 rounded-xl border font-bold text-xs cursor-pointer transition-colors ${
                    formUser === 'A'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  👤 Georges
                </button>
                <button
                  id="form-owner-b"
                  type="button"
                  onClick={() => setFormUser('B')}
                  className={`px-3 py-2 rounded-xl border font-bold text-xs cursor-pointer transition-colors ${
                    formUser === 'B'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  👤 Luana
                </button>
              </div>
            </div>

            <button
              id="submit-dividend-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Plus size={14} /> Registrar Dividendo
            </button>
          </form>
        </div>

        {/* List of dividends records */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Histórico Geral de Pagamentos ({filteredDividends.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Todos os lançamentos do casal no banco de dados.</p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-2.5 font-semibold">Ativo</th>
                  <th className="py-2.5 font-semibold">Mês de Referência</th>
                  <th className="py-2.5 font-semibold">Tipo de Provento</th>
                  <th className="py-2.5 font-semibold">Beneficiário</th>
                  <th className="py-2.5 font-semibold text-right">Valor Pago</th>
                  <th className="py-2.5 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDividends.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhum provento atende aos filtros definidos.
                    </td>
                  </tr>
                ) : (
                  filteredDividends
                    .slice()
                    .sort((x, y) => y.date.localeCompare(x.date))
                    .map((div) => {
                      const [year, month] = div.date.split('-');
                      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                      const formattedMonth = `${monthNames[parseInt(month) - 1]}/${year}`;
                      return (
                        <tr key={div.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                          <td className="py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{div.ticker}</td>
                          <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300">{formattedMonth}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold ${
                              div.type === 'Rendimento'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : div.type === 'Dividendo'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                            }`}>
                              {div.type}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              div.user === 'A'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            }`}>
                              {div.user === 'A' ? 'Georges' : 'Luana'}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-right font-semibold text-slate-850 dark:text-slate-100">
                            R$ {div.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              id={`delete-dividend-${div.id}`}
                              onClick={() => onDeleteDividend(div.id)}
                              className="p-1 hover:text-red-500 text-slate-400 dark:text-slate-500 rounded transition-colors cursor-pointer"
                              title="Excluir lançamento"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
