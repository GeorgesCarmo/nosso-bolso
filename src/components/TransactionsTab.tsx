import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter, 
  DollarSign, 
  Calendar, 
  Tag, 
  Repeat, 
  Pencil, 
  CheckCircle2, 
  Car, 
  FileText, 
  Sparkles,
  Layers,
  Building2,
  Wallet
} from 'lucide-react';
import { Transaction, UserType } from '../types';
import { formatDateBR } from '../utils/formatters';

interface TransactionsTabProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onAddBatchTransactions?: (txs: Omit<Transaction, 'id'>[]) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  currentUser: UserType;
}

const CATEGORY_MAP: { [key: string]: string[] } = {
  'Consórcio & Financiamento': [
    'Consórcio Veículo (Boleto)',
    'Consórcio Veículo (Lance)',
    'Consórcio Imóvel (Boleto)',
    'Consórcio Imóvel (Lance)',
    'Financiamento Veicular',
    'Financiamento Imobiliário',
    'Outros Boletos / Carnês'
  ],
  Transporte: ['Combustível Carro', 'Consórcio Veículo', 'IPVA/Seguro', 'Manutenção Veículo', 'Uber', 'Metrô/Ônibus'],
  Moradia: ['Aluguel', 'Condomínio', 'Energia', 'Internet', 'Manutenção', 'Água', 'Gás', 'Consórcio Imobiliário'],
  Alimentação: ['Supermercado', 'Restaurantes', 'Delivery', 'Lanches'],
  Lazer: ['Viagem', 'Cinema/Streaming', 'Restaurantes', 'Show/Teatro', 'Hobbies'],
  Saúde: ['Academia', 'Farmácia', 'Plano de Saúde', 'Consultas'],
  Educação: ['Faculdade', 'Curso/Livros', 'Mensalidade Escola'],
  Salário: ['CLT', 'PJ', 'Pró-labore', 'Bônus', '13º Salário'],
  'Outras Rendas': ['Freelance', 'Venda Usados', 'Cashback', 'Presente'],
};

function calculateRecurringDates(
  startDateStr: string,
  count: number = 12
): string[] {
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3) return [startDateStr];
  const [startYear, startMonth, startDay] = parts; // startMonth: 1-12

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const targetMonthIndex = startMonth - 1 + i;
    const year = startYear + Math.floor(targetMonthIndex / 12);
    const month = (targetMonthIndex % 12) + 1; // 1-12

    const daysInMonth = new Date(year, month, 0).getDate();
    const day = Math.min(startDay, daysInMonth);

    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
  }
  return result;
}

export default function TransactionsTab({
  transactions,
  onAddTransaction,
  onAddBatchTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  currentUser
}: TransactionsTabProps) {
  // Form State
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('Consórcio & Financiamento');
  const [subcategory, setSubcategory] = useState('Consórcio Veículo (Boleto)');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-07-13');
  const [description, setDescription] = useState('Consórcio Veículo');
  const [paymentMethod, setPaymentMethod] = useState<'boleto' | 'pix' | 'debito' | 'credito' | 'dinheiro' | 'outros'>('boleto');

  // Recurrence / Consortium State
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurrenceMode, setRecurrenceMode] = useState<'consorcio' | 'standard'>('consorcio');
  const [startInstallment, setStartInstallment] = useState<number>(1);
  const [totalInstallments, setTotalInstallments] = useState<number>(100);
  const [installmentsToGenerate, setInstallmentsToGenerate] = useState<number>(12);
  const [standardRecurrenceType, setStandardRecurrenceType] = useState<'whole_year' | 'rest_of_year' | 'months'>('whole_year');
  const [standardRecurrenceCount, setStandardRecurrenceCount] = useState<number>(12);

  // Edit State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterUser, setFilterUser] = useState<'all' | 'A' | 'B'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  // Quick Preset Handlers
  const applyPresetVehicleConsortium = () => {
    setType('despesa');
    setCategory('Consórcio & Financiamento');
    setSubcategory('Consórcio Veículo (Boleto)');
    setDescription('Consórcio Veículo');
    setPaymentMethod('boleto');
    setIsRecurring(true);
    setRecurrenceMode('consorcio');
    setStartInstallment(1);
    setTotalInstallments(100);
    setInstallmentsToGenerate(12);
  };

  const applyPresetConsortiumBid = () => {
    setType('despesa');
    setCategory('Consórcio & Financiamento');
    setSubcategory('Consórcio Veículo (Lance)');
    setDescription('Lance Inicial - Consórcio de Veículo');
    setPaymentMethod('boleto');
    setIsRecurring(false);
  };

  const applyPresetSalary = () => {
    setType('receita');
    setCategory('Salário');
    setSubcategory('CLT');
    setDescription('Salário Mensal');
    setPaymentMethod('pix');
    setIsRecurring(true);
    setRecurrenceMode('standard');
    setStandardRecurrenceType('whole_year');
    setStandardRecurrenceCount(12);
  };

  // Update subcategory options automatically when category changes
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const subcats = CATEGORY_MAP[cat];
    if (subcats && subcats.length > 0) {
      setSubcategory(subcats[0]);
    } else {
      setSubcategory('');
    }

    if (cat === 'Consórcio & Financiamento') {
      setPaymentMethod('boleto');
      setIsRecurring(true);
      setRecurrenceMode('consorcio');
    }
  };

  // Calculate dates to generate based on recurrence settings
  let calculatedDates: string[] = [date];
  if (isRecurring) {
    if (recurrenceMode === 'consorcio') {
      calculatedDates = calculateRecurringDates(date, installmentsToGenerate);
    } else {
      let count = standardRecurrenceCount;
      if (standardRecurrenceType === 'whole_year') {
        count = 12;
      } else if (standardRecurrenceType === 'rest_of_year') {
        const parts = date.split('-').map(Number);
        const startMonth = parts[1] || 1;
        count = Math.max(1, 12 - startMonth + 1);
      }
      calculatedDates = calculateRecurringDates(date, count);
    }
  }

  const generatedCount = calculatedDates.length;
  const parsedAmount = parseFloat(amount) || 0;
  const totalProjectedAmount = parsedAmount * generatedCount;

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesUser = filterUser === 'all' || tx.user === filterUser;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || tx.paymentMethod === filterPaymentMethod;
    return matchesType && matchesUser && matchesCategory && matchesPaymentMethod;
  });

  // Totals based on filter
  const totalReceitas = filteredTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = filteredTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalReceitas - totalDespesas;

  // Consortium statistics
  const consortiumTransactions = transactions.filter(t => 
    t.category === 'Consórcio & Financiamento' || 
    t.isConsortium || 
    t.description.toLowerCase().includes('consórcio') ||
    t.description.toLowerCase().includes('lance')
  );
  const totalConsortiumPaid = consortiumTransactions.reduce((acc, t) => acc + t.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date || !description) return;

    const val = parseFloat(amount);
    const userRole = currentUser || 'A';
    const isConsortiumCategory = category === 'Consórcio & Financiamento' || recurrenceMode === 'consorcio';

    if (isRecurring && calculatedDates.length > 1) {
      const groupId = `rec-group-${Date.now()}`;
      const batchList: Omit<Transaction, 'id'>[] = calculatedDates.map((d, index) => {
        const currentInstNum = recurrenceMode === 'consorcio' ? startInstallment + index : index + 1;
        const totalInstNum = recurrenceMode === 'consorcio' ? totalInstallments : calculatedDates.length;

        // Auto-formatted smart description
        let finalDescription = description;
        if (recurrenceMode === 'consorcio') {
          const instTag = `(Boleto ${String(currentInstNum).padStart(2, '0')}/${totalInstNum})`;
          if (!finalDescription.includes('Boleto') && !finalDescription.includes('/')) {
            finalDescription = `${finalDescription} ${instTag}`;
          }
        }

        return {
          type,
          category,
          subcategory,
          amount: val,
          date: d,
          user: userRole,
          description: finalDescription,
          paymentMethod,
          isRecurring: true,
          isConsortium: isConsortiumCategory,
          installmentInfo: recurrenceMode === 'consorcio' ? {
            current: currentInstNum,
            total: totalInstNum,
            totalAmount: val * totalInstNum
          } : undefined,
          recurringGroupId: groupId
        };
      });

      if (onAddBatchTransactions) {
        onAddBatchTransactions(batchList);
      } else {
        batchList.forEach(tx => onAddTransaction(tx));
      }
    } else {
      onAddTransaction({
        type,
        category,
        subcategory,
        amount: val,
        date,
        user: userRole,
        description,
        paymentMethod,
        isRecurring: false,
        isConsortium: isConsortiumCategory || subcategory.includes('Lance')
      });
    }

    // Reset Form (keep sensible defaults)
    setAmount('');
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx({ ...tx });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !onUpdateTransaction) return;
    onUpdateTransaction(editingTx);
    setEditingTx(null);
  };

  return (
    <div className="space-y-8" id="transactions-tab-container">
      {/* Metrics of ledger */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Receitas Filtrado</span>
            <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ArrowUpCircle size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Despesas Filtrado</span>
            <span className="font-mono text-xl font-bold text-red-500">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-500">
            <ArrowDownCircle size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Saldo Líquido Filtrado</span>
            <span className={`font-mono text-xl font-bold ${netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
              R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${netBalance >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Consórcios & Boletos</span>
            <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
              R$ {totalConsortiumPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">{consortiumTransactions.length} lançamentos gravados</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <FileText size={22} />
          </div>
        </div>
      </div>

      {/* Quick Launch Presets Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-4 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Atalhos Rápidos de Lançamento</h4>
            <p className="text-xs text-slate-300">Preencha o formulário em 1 clique para Consórcios de Veículos, Lances e Salários.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyPresetVehicleConsortium}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Car size={14} />
            <span>Consórcio de Veículo (100 Boletos)</span>
          </button>

          <button
            type="button"
            onClick={applyPresetConsortiumBid}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Wallet size={14} />
            <span>Lance Inicial (Contemplação)</span>
          </button>

          <button
            type="button"
            onClick={applyPresetSalary}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowUpCircle size={14} />
            <span>Salário Anual (12 Meses)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Plus size={16} className="text-indigo-500" />
              Lançar Receita ou Despesa
            </h3>
            {isRecurring && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Repeat size={10} /> {recurrenceMode === 'consorcio' ? 'Boletos Consórcio' : 'Recorrente'}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo de Lançamento</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <button
                  id="type-despesa-btn"
                  type="button"
                  onClick={() => {
                    setType('despesa');
                    handleCategoryChange('Consórcio & Financiamento');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                    type === 'despesa'
                      ? 'bg-white dark:bg-slate-900 text-red-500 shadow-sm border border-slate-100 dark:border-slate-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Despesa / Boleto
                </button>
                <button
                  id="type-receita-btn"
                  type="button"
                  onClick={() => {
                    setType('receita');
                    handleCategoryChange('Salário');
                    setRecurrenceMode('standard');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                    type === 'receita'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Receita
                </button>
              </div>
            </div>

            {/* Category / Subcategory selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Categoria</label>
                <select
                  id="tx-category-select"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {type === 'receita' ? (
                    <>
                      <option value="Salário">Salário</option>
                      <option value="Outras Rendas">Outras Rendas</option>
                    </>
                  ) : (
                    <>
                      <option value="Consórcio & Financiamento">Consórcio & Financiamento</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Moradia">Moradia</option>
                      <option value="Alimentação">Alimentação</option>
                      <option value="Lazer">Lazer</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Educação">Educação</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Subcategoria</label>
                <select
                  id="tx-subcategory-select"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {CATEGORY_MAP[category]?.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Forma de Pagamento</label>
              <select
                id="tx-payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="boleto">📄 Boleto Bancário (Consórcios / Carnês)</option>
                <option value="pix">⚡ Pix</option>
                <option value="debito">💳 Débito em Conta</option>
                <option value="credito">💳 Cartão de Crédito</option>
                <option value="dinheiro">💵 Dinheiro</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            {/* Amount / Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isRecurring ? 'Valor do Boleto/Mês (R$)' : 'Valor (R$)'}
                </label>
                <input
                  id="tx-amount-input"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isRecurring ? '1º Vencimento' : 'Data do Pagamento'}
                </label>
                <input
                  id="tx-date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Descrição</label>
              <input
                id="tx-description-input"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Consórcio Veículo..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {/* Recurrence & Consortium Boletos Setup */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Repeat size={14} className="text-indigo-500" />
                  Repetir lançamento / Boletos Recorrentes
                </span>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {isRecurring && (
                <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  {/* Mode selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecurrenceMode('consorcio')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                        recurrenceMode === 'consorcio'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Car size={12} />
                      <span>Consórcio / Boletos (ex: 100x)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceMode('standard')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                        recurrenceMode === 'standard'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Calendar size={12} />
                      <span>Recorrência Padrão</span>
                    </button>
                  </div>

                  {recurrenceMode === 'consorcio' ? (
                    <div className="space-y-3 bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-amber-500/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                            Parcela Inicial
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={totalInstallments}
                            value={startInstallment}
                            onChange={(e) => setStartInstallment(Math.max(1, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                            Total do Consórcio
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={360}
                            value={totalInstallments}
                            onChange={(e) => setTotalInstallments(Math.max(1, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Quantos boletos lançar agora no fluxo?
                        </label>
                        <select
                          value={installmentsToGenerate}
                          onChange={(e) => setInstallmentsToGenerate(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 font-medium"
                        >
                          <option value={12}>📅 Próximos 12 meses (1 ano de boletos)</option>
                          <option value={24}>📅 Próximos 24 meses (2 anos)</option>
                          <option value={36}>📅 Próximos 36 meses (3 anos)</option>
                          <option value={60}>📅 Próximos 60 meses (5 anos)</option>
                          <option value={totalInstallments - startInstallment + 1}>
                            🎯 Todas as {totalInstallments - startInstallment + 1} parcelas restantes
                          </option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Período de Repetição
                        </label>
                        <select
                          value={standardRecurrenceType}
                          onChange={(e) => setStandardRecurrenceType(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="whole_year">📅 Ano Todo (12 meses)</option>
                          <option value="rest_of_year">🎯 Resto do ano atual</option>
                          <option value="months">🔢 Quantidade personalizada de meses</option>
                        </select>
                      </div>

                      {standardRecurrenceType === 'months' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Número de meses
                          </label>
                          <select
                            value={standardRecurrenceCount}
                            onChange={(e) => setStandardRecurrenceCount(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-mono"
                          >
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36].map(n => (
                              <option key={n} value={n}>{n} meses consecutivos</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary preview */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 p-2.5 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                      <CheckCircle2 size={13} />
                      Resumo da Operação:
                    </div>
                    <p className="leading-relaxed">
                      Serão criados <strong>{generatedCount} lançamentos</strong> mensais de{' '}
                      <strong>R$ {parsedAmount > 0 ? parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</strong>{' '}
                      {recurrenceMode === 'consorcio' && (
                        <span>
                          (da parcela <strong>{startInstallment}</strong> até a parcela{' '}
                          <strong>{startInstallment + generatedCount - 1}</strong> de {totalInstallments})
                        </span>
                      )}{' '}
                      de <strong>{formatDateBR(calculatedDates[0])}</strong> até{' '}
                      <strong>{formatDateBR(calculatedDates[calculatedDates.length - 1])}</strong>.
                    </p>
                    {parsedAmount > 0 && (
                      <p className="text-[10px] opacity-80 font-mono">
                        Compromisso total do lote: R$ {totalProjectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              id="add-tx-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer mt-2 shadow-md shadow-indigo-600/20"
            >
              <Plus size={14} />
              {isRecurring ? `Lançar ${generatedCount} Boletos / Meses` : 'Lançar Transação'}
            </button>
          </form>
        </div>

        {/* Ledger & Filters Column */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Filter size={16} className="text-slate-400" />
              Lançamentos Financeiros ({filteredTransactions.length})
            </h3>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 text-xs">
              {/* Type Filter */}
              <select
                id="filter-type-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="all">Tipos (Todos)</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas / Boletos</option>
              </select>

              {/* Category filter */}
              <select
                id="filter-cat-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="all">Categorias (Todas)</option>
                <option value="Consórcio & Financiamento">Consórcio & Financiamento</option>
                <option value="Transporte">Transporte</option>
                <option value="Moradia">Moradia</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Lazer">Lazer</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Salário">Salário</option>
                <option value="Outras Rendas">Outras Rendas</option>
              </select>

              {/* Payment Method filter */}
              <select
                id="filter-method-select"
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="all">Formas de Pagamento</option>
                <option value="boleto">📄 Boletos Bancários</option>
                <option value="pix">⚡ Pix</option>
                <option value="debito">💳 Débito</option>
                <option value="credito">💳 Crédito</option>
              </select>

              {/* User filter */}
              <select
                id="filter-user-select"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="all">Usuários</option>
                <option value="A">Georges</option>
                <option value="B">Luana</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-2.5 font-semibold">Data / Venc.</th>
                  <th className="py-2.5 font-semibold">Descrição</th>
                  <th className="py-2.5 font-semibold">Categoria / Subcat</th>
                  <th className="py-2.5 font-semibold">Forma</th>
                  <th className="py-2.5 font-semibold text-center">Status</th>
                  <th className="py-2.5 font-semibold text-right">Valor</th>
                  <th className="py-2.5 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Nenhum lançamento corresponde aos filtros ativos.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((tx) => {
                      const isReceita = tx.type === 'receita';
                      const isBoleto = tx.paymentMethod === 'boleto' || tx.description.toLowerCase().includes('boleto');
                      const isConsorcio = tx.category === 'Consórcio & Financiamento' || tx.isConsortium || tx.description.toLowerCase().includes('consórcio');
                      const isLance = tx.subcategory?.includes('Lance') || tx.description.toLowerCase().includes('lance');
                      const isPaid = tx.status === 'paid' || Boolean(tx.paidAt);

                      const handleQuickTogglePaid = () => {
                        if (onUpdateTransaction) {
                          const today = new Date().toISOString().split('T')[0];
                          onUpdateTransaction({
                            ...tx,
                            status: isPaid ? 'pending' : 'paid',
                            paidAt: isPaid ? undefined : today
                          });
                        }
                      };

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 group">
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDateBR(tx.date)}
                          </td>
                          <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={isPaid && !isReceita ? 'text-slate-700 dark:text-slate-300' : ''}>{tx.description}</span>
                              {isLance && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold">
                                  Lance
                                </span>
                              )}
                              {tx.installmentInfo && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono font-bold">
                                  {tx.installmentInfo.current}/{tx.installmentInfo.total}
                                </span>
                              )}
                              {tx.isRecurring && !tx.installmentInfo && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 font-semibold" title="Lançamento Recorrente">
                                  Recorrente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 space-y-0.5 whitespace-nowrap">
                            <span className="font-semibold block text-slate-700 dark:text-slate-300">
                              {tx.category}
                            </span>
                            <span className="text-[10px] text-slate-450 dark:text-slate-400 block">
                              {tx.subcategory}
                            </span>
                          </td>
                          <td className="py-3 whitespace-nowrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block border ${
                              isBoleto 
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                                : tx.paymentMethod === 'pix'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                              {tx.paymentMethod === 'boleto' ? '📄 Boleto' : tx.paymentMethod === 'pix' ? '⚡ Pix' : tx.paymentMethod === 'debito' ? '💳 Débito' : tx.paymentMethod === 'credito' ? '💳 Crédito' : 'Outros'}
                            </span>
                          </td>
                          <td className="py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={handleQuickTogglePaid}
                              className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer border flex items-center gap-1 mx-auto ${
                                isPaid
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                              }`}
                              title={isPaid ? 'Clique para reabrir (marcar como pendente)' : 'Clique para dar baixa (marcar como pago)'}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span>{isPaid ? 'Pago' : 'A Pagar'}</span>
                            </button>
                          </td>
                          <td className={`py-3 font-mono text-right font-bold text-sm whitespace-nowrap ${isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {isReceita ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                id={`edit-tx-${tx.id}`}
                                onClick={() => handleOpenEdit(tx)}
                                className="p-1 hover:text-indigo-600 text-slate-400 dark:text-slate-500 rounded transition-colors cursor-pointer"
                                title="Editar lançamento (reajustar valor da parcela, data ou categoria)"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                id={`delete-tx-${tx.id}`}
                                onClick={() => onDeleteTransaction(tx.id)}
                                className="p-1 hover:text-red-500 text-slate-400 dark:text-slate-500 rounded transition-colors cursor-pointer"
                                title="Excluir lançamento"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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

      {/* Modal: Edit Transaction */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil size={18} className="text-indigo-500" />
                <span>Editar Lançamento / Boleto</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Type */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, type: 'despesa' })}
                    className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                      editingTx.type === 'despesa'
                        ? 'bg-white dark:bg-slate-900 text-red-500 shadow-sm border border-slate-100 dark:border-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    Despesa / Boleto
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, type: 'receita' })}
                    className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                      editingTx.type === 'receita'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Descrição</label>
                <input
                  type="text"
                  required
                  value={editingTx.description}
                  onChange={(e) => setEditingTx({ ...editingTx, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingTx.amount}
                    onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={editingTx.date}
                    onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Forma de Pagamento</label>
                <select
                  value={editingTx.paymentMethod || 'boleto'}
                  onChange={(e) => setEditingTx({ ...editingTx, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="boleto">📄 Boleto Bancário</option>
                  <option value="pix">⚡ Pix</option>
                  <option value="debito">💳 Débito em Conta</option>
                  <option value="credito">💳 Cartão de Crédito</option>
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              {/* Category / Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Categoria</label>
                  <select
                    value={editingTx.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const newSub = (CATEGORY_MAP[newCat] && CATEGORY_MAP[newCat][0]) || '';
                      setEditingTx({ ...editingTx, category: newCat, subcategory: newSub });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {editingTx.type === 'receita' ? (
                      <>
                        <option value="Salário">Salário</option>
                        <option value="Outras Rendas">Outras Rendas</option>
                      </>
                    ) : (
                      <>
                        <option value="Consórcio & Financiamento">Consórcio & Financiamento</option>
                        <option value="Transporte">Transporte</option>
                        <option value="Moradia">Moradia</option>
                        <option value="Alimentação">Alimentação</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Educação">Educação</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Subcategoria</label>
                  <select
                    value={editingTx.subcategory}
                    onChange={(e) => setEditingTx({ ...editingTx, subcategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {CATEGORY_MAP[editingTx.category]?.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
