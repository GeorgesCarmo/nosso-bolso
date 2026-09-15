import React, { useState } from 'react';
import { Plus, Trash2, LineChart, Calendar, Award, ArrowUpRight, TrendingUp, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FixedIncome, UserType } from '../types';
import { formatDateBR, parseLocalDate } from '../utils/formatters';

interface FixedTabProps {
  fixedIncomeAssets: FixedIncome[];
  onAddFixed: (asset: Omit<FixedIncome, 'id'>) => void;
  onDeleteFixed: (id: string) => void;
  currentUser: UserType;
}

export default function FixedTab({
  fixedIncomeAssets,
  onAddFixed,
  onDeleteFixed,
  currentUser
}: FixedTabProps) {
  // Local state
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    fixedIncomeAssets.length > 0 ? fixedIncomeAssets[0].id : null
  );

  // Form states
  const [name, setName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [rate, setRate] = useState('');
  const [appDate, setAppDate] = useState('2026-01-01');
  const [matDate, setMatDate] = useState('2029-01-01');
  const [owner, setOwner] = useState<UserType>('A');

  const selectedAsset = fixedIncomeAssets.find(a => a.id === (selectedAssetId || fixedIncomeAssets[0]?.id));

  // Compound interest calculator & projection generator
  const getProjectionData = (asset: FixedIncome) => {
    const start = parseLocalDate(asset.applicationDate);
    const end = parseLocalDate(asset.maturityDate);
    
    // Difference in months
    const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const totalMonths = Math.max(1, Math.round(diffYears * 12));

    const monthlyRate = Math.pow(1 + (asset.rate / 100), 1 / 12) - 1;
    const data = [];

    for (let m = 0; m <= totalMonths; m += Math.max(1, Math.round(totalMonths / 12))) {
      const projectedValue = asset.initialAmount * Math.pow(1 + monthlyRate, m);
      const interestEarned = projectedValue - asset.initialAmount;
      
      // Calculate date string
      const currentLabelDate = new Date(start.getTime());
      currentLabelDate.setMonth(start.getMonth() + m);
      const label = currentLabelDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      data.push({
        mes: m,
        data: label,
        'Valor Projetado': Math.round(projectedValue),
        'Rendimento': Math.round(interestEarned)
      });
    }

    // Always ensure final month is added if not there
    const finalValue = asset.initialAmount * Math.pow(1 + (asset.rate / 100), diffYears);
    const finalLabel = end.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    data.push({
      mes: totalMonths,
      data: finalLabel,
      'Valor Projetado': Math.round(finalValue),
      'Rendimento': Math.round(finalValue - asset.initialAmount)
    });

    return {
      chartData: data,
      futureValue: finalValue,
      totalYield: finalValue - asset.initialAmount,
      totalYears: diffYears,
      totalMonths
    };
  };

  const activeProjection = selectedAsset ? getProjectionData(selectedAsset) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !initialAmount || !rate || !appDate || !matDate) return;

    const newAsset: Omit<FixedIncome, 'id'> = {
      name,
      initialAmount: parseFloat(initialAmount),
      rate: parseFloat(rate),
      applicationDate: appDate,
      maturityDate: matDate,
      user: owner
    };

    onAddFixed(newAsset);
    
    // Reset forms
    setName('');
    setInitialAmount('');
    setRate('');
  };

  return (
    <div className="space-y-8" id="fixed-tab-container">
      {/* Intro */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Investimentos Renda Fixa Pré-fixada
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-3xl">
              A renda fixa pré-fixada fornece previsibilidade absoluta ao casal. No momento da contratação, você já sabe exatamente 
              qual será a taxa de rendimento anual (ex: 12% a.a.) e o montante final que resgatará na data do vencimento contratado.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Forms and Assets list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Plus size={16} className="text-indigo-500" />
            Cadastrar Título de Renda Fixa
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nome do Título / Emissor</label>
              <input
                id="fixed-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CDB Banco Inter, Tesouro Prefixado..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor Aplicado (R$)</label>
                <input
                  id="fixed-amount-input"
                  type="number"
                  required
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Taxa Anual (% a.a.)</label>
                <input
                  id="fixed-rate-input"
                  type="number"
                  step="0.01"
                  required
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Ex: 11.5"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Aplicação</label>
                <input
                  id="fixed-app-date"
                  type="date"
                  required
                  value={appDate}
                  onChange={(e) => setAppDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Vencimento</label>
                <input
                  id="fixed-mat-date"
                  type="date"
                  required
                  value={matDate}
                  onChange={(e) => setMatDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Proprietário do Título</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="owner-a-btn"
                  type="button"
                  onClick={() => setOwner('A')}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-colors ${
                    owner === 'A'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Georges (Marido)
                </button>
                <button
                  id="owner-b-btn"
                  type="button"
                  onClick={() => setOwner('B')}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-colors ${
                    owner === 'B'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Luana (Esposa)
                </button>
              </div>
            </div>

            <button
              id="add-fixed-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Plus size={14} /> Cadastrar Renda Fixa
            </button>
          </form>
        </div>

        {/* Bond List Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Títulos de Renda Fixa Registrados ({fixedIncomeAssets.length})
          </h3>
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {fixedIncomeAssets.length === 0 ? (
              <p className="text-xs text-center text-slate-400 py-12">
                Nenhum título de renda fixa cadastrado ainda. Use o formulário ao lado.
              </p>
            ) : (
              fixedIncomeAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{asset.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          asset.user === 'A'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {asset.user === 'A' ? 'Georges' : 'Luana'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Taxa: <strong className="font-mono">{asset.rate.toFixed(2)}% a.a.</strong></span>
                        <span>Aplicação: <strong className="font-mono">{formatDateBR(asset.applicationDate)}</strong></span>
                        <span>Vencimento: <strong className="font-mono">{formatDateBR(asset.maturityDate)}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">Valor Inicial</span>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          R$ {asset.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <button
                        id={`delete-fixed-${asset.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFixed(asset.id);
                          if (selectedAssetId === asset.id) {
                            setSelectedAssetId(fixedIncomeAssets.filter(a => a.id !== asset.id)[0]?.id || null);
                          }
                        }}
                        className="p-1 hover:text-red-500 text-slate-400 dark:text-slate-500 rounded transition-colors cursor-pointer"
                        title="Deletar título"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Projection Dashboard and charts */}
      {selectedAsset && activeProjection && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
                <LineChart size={14} /> Projeção de Acúmulo de Juros Compostos
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedAsset.name}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Maturidade em:</span>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar size={12} /> {formatDateBR(selectedAsset.maturityDate)}
              </span>
            </div>
          </div>

          {/* Core calculations summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Tempo de Aplicação</span>
              <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                {activeProjection.totalYears.toFixed(1)} Anos
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">({activeProjection.totalMonths} Meses)</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Taxa Contratada</span>
              <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                {selectedAsset.rate.toFixed(2)}% a.a.
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pré-fixada</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Juros Acumulados (Lucro)</span>
              <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                + R$ {activeProjection.totalYield.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Rendimento líquido projetado</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1.5 text-indigo-200 dark:text-indigo-900">
                <Award size={20} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Montante no Vencimento</span>
              <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                R$ {activeProjection.futureValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Capital Inicial + Juros</span>
            </div>
          </div>

          {/* Interactive Recharts visualizer */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gráfico de Curva de Capital (Juros Compostos ao Longo do Tempo)
            </h4>
            <div className="h-64 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeProjection.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="data" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$ ${Math.round(val / 1000)}k`}
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
                  <Area type="monotone" dataKey="Valor Projetado" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
