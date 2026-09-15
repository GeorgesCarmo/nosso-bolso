import React, { useState } from 'react';
import { Plus, Trash2, Landmark, DollarSign, BarChart2, TrendingUp, Sparkles, Percent } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { VariableAsset, DividendReceived, UserType } from '../types';

interface VariableTabProps {
  assets: VariableAsset[];
  onAddAsset: (asset: Omit<VariableAsset, 'id'>) => void;
  onDeleteAsset: (id: string) => void;
  dividends: DividendReceived[];
  onAddDividend: (div: Omit<DividendReceived, 'id'>) => void;
  onDeleteDividend: (id: string) => void;
  currentUser: UserType;
}

export default function VariableTab({
  assets,
  onAddAsset,
  onDeleteAsset,
  dividends,
  onAddDividend,
  onDeleteDividend,
  currentUser
}: VariableTabProps) {
  // Forms local state
  const [activeSubTab, setActiveSubTab] = useState<'carteira' | 'proventos'>('carteira');

  // Asset Form
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currPrice, setCurrPrice] = useState('');
  const [assetType, setAssetType] = useState<'Ação' | 'FII' | 'ETF' | 'BDR'>('Ação');

  // Dividend Form
  const [divTicker, setDivTicker] = useState('');
  const [divAmount, setDivAmount] = useState('');
  const [divMonth, setDivMonth] = useState('2026-07');
  const [divType, setDivType] = useState<'Dividendo' | 'JCP' | 'Rendimento'>('Dividendo');
  const [divUser, setDivUser] = useState<UserType>('A');

  // Calculations for variable portfolio
  const totalInvested = assets.reduce((sum, a) => sum + (a.quantity * a.averagePrice), 0);
  const totalCurrent = assets.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0);
  const totalProfit = totalCurrent - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Compile monthly passive income for the Recharts bar chart
  const getMonthlyPassiveIncome = () => {
    const monthlyMap: { [key: string]: number } = {};
    dividends.forEach(d => {
      // Date in dividends is stored as YYYY-MM
      const monthLabel = d.date; // e.g. "2026-03"
      monthlyMap[monthLabel] = (monthlyMap[monthLabel] || 0) + d.amount;
    });

    // Format for Recharts, sort chronologically
    return Object.keys(monthlyMap)
      .sort()
      .map(month => {
        const [year, m] = month.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const label = `${monthNames[parseInt(m) - 1]}/${year.slice(2)}`;
        return {
          monthCode: month,
          monthName: label,
          'Renda Passiva': Math.round(monthlyMap[month] * 100) / 100
        };
      });
  };

  const passiveIncomeChartData = getMonthlyPassiveIncome();

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !name || !qty || !avgPrice) return;

    onAddAsset({
      ticker: ticker.toUpperCase(),
      name,
      quantity: parseFloat(qty),
      averagePrice: parseFloat(avgPrice),
      currentPrice: currPrice ? parseFloat(currPrice) : parseFloat(avgPrice),
      type: assetType
    });

    // Reset fields
    setTicker('');
    setName('');
    setQty('');
    setAvgPrice('');
    setCurrPrice('');
  };

  const handleDividendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!divTicker || !divAmount || !divMonth) return;

    onAddDividend({
      ticker: divTicker.toUpperCase(),
      amount: parseFloat(divAmount),
      date: divMonth,
      type: divType,
      user: divUser
    });

    setDivTicker('');
    setDivAmount('');
  };

  return (
    <div className="space-y-8" id="variable-tab-container">
      {/* Header Info */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Landmark size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Investimentos Renda Variável (Ações e FIIs)
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-3xl">
                Acompanhe o preço médio, quantidade e rentabilidade acumulada de suas ações e fundos imobiliários favoritos. 
                Registre o recebimento mensal de rendimentos para retroalimentar sua carteira e expandir o efeito dos juros compostos.
              </p>
            </div>
          </div>

          {/* Sub Navigation buttons */}
          <div className="flex gap-2.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 shrink-0 w-full md:w-auto">
            <button
              id="subtab-carteira-btn"
              onClick={() => setActiveSubTab('carteira')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'carteira'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
              }`}
            >
              Minha Carteira
            </button>
            <button
              id="subtab-proventos-btn"
              onClick={() => setActiveSubTab('proventos')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'proventos'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
              }`}
            >
              Renda Passiva (Proventos)
            </button>
          </div>
        </div>
      </div>

      {/* --- SUBTAB: MY PORTFOLIO --- */}
      {activeSubTab === 'carteira' && (
        <div className="space-y-8 animate-fade-in" id="variable-subtab-carteira">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Aplicado</span>
              <span className="font-mono text-2xl font-bold text-slate-850 dark:text-slate-100 block">
                R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block">Soma baseada no preço médio de compra</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Valor Atual da Carteira</span>
              <span className="font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400 block">
                R$ {totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block">Valoração com base nas cotações de mercado</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Resultado Acumulado</span>
              <span className={`font-mono text-2xl font-bold block ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {totalProfit >= 0 ? '+' : ''} R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                <Percent size={12} /> {profitPercentage.toFixed(2)}% de retorno bruto
              </span>
            </div>
          </div>

          {/* Form and Assets table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form asset addition */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus size={16} className="text-indigo-500" />
                Cadastrar Novo Ativo (RV)
              </h3>
              <form onSubmit={handleAssetSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Ticker do Ativo</label>
                    <input
                      id="asset-ticker-input"
                      type="text"
                      required
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                      placeholder="Ex: VALE3, MXRF11"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo de Ativo</label>
                    <select
                      id="asset-type-select"
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="Ação">Ação (Brasil)</option>
                      <option value="FII">Fundo Imobiliário</option>
                      <option value="ETF">ETF</option>
                      <option value="BDR">BDR</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nome da Empresa / Fundo</label>
                  <input
                    id="asset-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Vale S.A."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Quantidade</label>
                    <input
                      id="asset-qty-input"
                      type="number"
                      required
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="Qtd"
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Preço Médio</label>
                    <input
                      id="asset-avgprice-input"
                      type="number"
                      step="0.01"
                      required
                      value={avgPrice}
                      onChange={(e) => setAvgPrice(e.target.value)}
                      placeholder="R$"
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Cotação Atual</label>
                    <input
                      id="asset-currprice-input"
                      type="number"
                      step="0.01"
                      value={currPrice}
                      onChange={(e) => setCurrPrice(e.target.value)}
                      placeholder="Opcional"
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <button
                  id="add-asset-btn"
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Cadastrar Ativo
                </button>
              </form>
            </div>

            {/* Table of Assets */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Seus Ativos de Renda Variável</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                      <th className="py-2.5 font-semibold">Ativo / Empresa</th>
                      <th className="py-2.5 font-semibold text-center">Tipo</th>
                      <th className="py-2.5 font-semibold text-right">Qtd</th>
                      <th className="py-2.5 font-semibold text-right">Preço Médio</th>
                      <th className="py-2.5 font-semibold text-right">Preço Atual</th>
                      <th className="py-2.5 font-semibold text-right">Investido</th>
                      <th className="py-2.5 font-semibold text-right">Total Atual</th>
                      <th className="py-2.5 font-semibold text-right">Lucro/Prejuízo</th>
                      <th className="py-2.5 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500">
                          Nenhum ativo cadastrado na carteira. Adicione acima.
                        </td>
                      </tr>
                    ) : (
                      assets.map((asset) => {
                        const investedVal = asset.quantity * asset.averagePrice;
                        const currentVal = asset.quantity * asset.currentPrice;
                        const profitVal = currentVal - investedVal;
                        const profitPct = investedVal > 0 ? (profitVal / investedVal) * 100 : 0;
                        return (
                          <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                            <td className="py-3">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">{asset.ticker}</span>
                              <span className="text-[10px] text-slate-400 truncate block max-w-[130px]">{asset.name}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                asset.type === 'Ação'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                  : asset.type === 'FII'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {asset.type}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-right text-slate-800 dark:text-slate-300">{asset.quantity}</td>
                            <td className="py-3 font-mono text-right text-slate-850 dark:text-slate-300">
                              R$ {asset.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 font-mono text-right text-slate-850 dark:text-slate-300">
                              R$ {asset.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 font-mono text-right text-slate-500 dark:text-slate-400">
                              R$ {investedVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 font-mono text-right font-semibold text-slate-850 dark:text-slate-200">
                              R$ {currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`py-3 font-mono text-right font-bold ${profitVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                              <span className="block">{profitVal >= 0 ? '+' : ''}R$ {profitVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span className="text-[9px] font-semibold">{profitVal >= 0 ? '+' : ''}{profitPct.toFixed(1)}%</span>
                            </td>
                            <td className="py-3 text-center">
                              <button
                                id={`delete-asset-${asset.id}`}
                                onClick={() => onDeleteAsset(asset.id)}
                                className="p-1 hover:text-red-500 text-slate-400 dark:text-slate-500 rounded transition-colors cursor-pointer"
                                title="Excluir ativo"
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
      )}

      {/* --- SUBTAB: DIVIDENDS RECEIVED --- */}
      {activeSubTab === 'proventos' && (
        <div className="space-y-8 animate-fade-in" id="variable-subtab-proventos">
          {/* Quick Info summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Total Recebido</span>
                <span className="font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400 block">
                  R$ {dividends.reduce((sum, d) => sum + d.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Histórico acumulado de dividendos de Ações e rendimentos de Fundos Imobiliários. Esse fluxo gera efeito bola de neve ao comprar novos ativos com capital próprio gerado pela própria carteira.
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/30 rounded-xl flex gap-3 text-xs text-indigo-700 dark:text-indigo-300 mt-4">
                <Sparkles size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Dica de Casal:</strong> Reinvestir 100% dos dividendos recebidos acelera a independência financeira familiar em até 30%!
                </span>
              </div>
            </div>

            {/* Recharts Chart of passive income */}
            <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart2 size={16} className="text-indigo-500" />
                Evolução da Renda Passiva Gerada Mensalmente
              </h3>
              <div className="h-56 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={passiveIncomeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                    <Bar dataKey="Renda Passiva" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Dividend registration and history */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form registration */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus size={16} className="text-indigo-500" />
                Lançar Dividendos Recebidos
              </h3>
              <form onSubmit={handleDividendSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Ativo (Ticker)</label>
                    <input
                      id="div-ticker-input"
                      type="text"
                      required
                      value={divTicker}
                      onChange={(e) => setDivTicker(e.target.value)}
                      placeholder="Ex: HGLG11"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo Provento</label>
                    <select
                      id="div-type-select"
                      value={divType}
                      onChange={(e) => setDivType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="Dividendo">Dividendo</option>
                      <option value="Rendimento">Rendimento (FII)</option>
                      <option value="JCP">JCP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor Pago (R$)</label>
                    <input
                      id="div-amount-input"
                      type="number"
                      step="0.01"
                      required
                      value={divAmount}
                      onChange={(e) => setDivAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Mês de Referência</label>
                    <input
                      id="div-month-input"
                      type="month"
                      required
                      value={divMonth}
                      onChange={(e) => setDivMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Quem Recebeu / Lançou</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="div-owner-a-btn"
                      type="button"
                      onClick={() => setDivUser('A')}
                      className={`px-3 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-colors ${
                        divUser === 'A'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Georges (Marido)
                    </button>
                    <button
                      id="div-owner-b-btn"
                      type="button"
                      onClick={() => setDivUser('B')}
                      className={`px-3 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-colors ${
                        divUser === 'B'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Luana (Esposa)
                    </button>
                  </div>
                </div>

                <button
                  id="add-div-btn"
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Registrar Provento
                </button>
              </form>
            </div>

            {/* List of dividends */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Histórico de Proventos ({dividends.length})
              </h3>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                      <th className="py-2.5 font-semibold">Ativo</th>
                      <th className="py-2.5 font-semibold">Mês Pago</th>
                      <th className="py-2.5 font-semibold">Tipo de Provento</th>
                      <th className="py-2.5 font-semibold">Quem Lançou</th>
                      <th className="py-2.5 font-semibold text-right">Valor Pago</th>
                      <th className="py-2.5 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dividends.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                          Nenhum dividendo registrado ainda. Lance no formulário.
                        </td>
                      </tr>
                    ) : (
                      dividends
                        .slice()
                        .sort((x, y) => y.date.localeCompare(x.date))
                        .map((div) => {
                          const [year, month] = div.date.split('-');
                          const formattedMonth = `${month}/${year}`;
                          return (
                            <tr key={div.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                              <td className="py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{div.ticker}</td>
                              <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300">{formattedMonth}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold ${
                                  div.type === 'Rendimento'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                }`}>
                                  {div.type}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                  div.user === 'A'
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                }`}>
                                  {div.user === 'A' ? 'Georges' : 'Luana'}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono text-right font-semibold text-slate-800 dark:text-slate-200">
                                R$ {div.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 text-center">
                                <button
                                  id={`delete-div-${div.id}`}
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
      )}
    </div>
  );
}
