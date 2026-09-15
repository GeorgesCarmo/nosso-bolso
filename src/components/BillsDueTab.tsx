import React, { useState, useMemo } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard as CreditCardIcon, 
  FileText, 
  Car, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  DollarSign, 
  Calendar, 
  RotateCcw,
  Sparkles,
  Layers,
  AlertTriangle,
  Building2,
  Tag,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { CreditCard, InstallmentPlan, Transaction, UserType } from '../types';
import { formatDateBR } from '../utils/formatters';
import { 
  buildUnifiedBillsList, 
  getDaysDifference, 
  getDueUrgency, 
  getDueBadgeInfo, 
  getTodayDateString, 
  getCurrentMonthString,
  UnifiedBill
} from '../utils/billHelpers';

interface BillsDueTabProps {
  transactions: Transaction[];
  creditCards: CreditCard[];
  installmentPlans: InstallmentPlan[];
  onUpdateTransaction?: (tx: Transaction) => void;
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  currentUser: UserType;
  cardPaidMap: Record<string, { status: 'paid' | 'pending'; paidAt?: string; amount?: number }>;
  onToggleCardPayment: (cardId: string, month: string, currentAmount: number) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function BillsDueTab({
  transactions,
  creditCards,
  installmentPlans,
  onUpdateTransaction,
  onAddTransaction,
  currentUser,
  cardPaidMap,
  onToggleCardPayment,
}: BillsDueTabProps) {
  // Reference month state (defaults to current month or August 2026 for demo context)
  const todayStr = getTodayDateString();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Check if there are transactions in 2026-08, else use current month
    const curMonth = getCurrentMonthString();
    return curMonth || '2026-08';
  });

  // Filters state
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'urgent' | 'paid'>('all');
  const [filterUser, setFilterUser] = useState<'all' | 'A' | 'B' | 'both'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'boletos' | 'consorcio' | 'cartoes'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
    setSelectedDayFilter(null);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
    setSelectedDayFilter(null);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(getCurrentMonthString());
    setSelectedDayFilter(null);
  };

  // Build unified bills list for the active month
  const allMonthBills = useMemo(() => {
    return buildUnifiedBillsList(
      transactions,
      creditCards,
      installmentPlans,
      selectedMonth,
      cardPaidMap
    );
  }, [transactions, creditCards, installmentPlans, selectedMonth, cardPaidMap]);

  // Aggregate Metrics
  const totalBillsCount = allMonthBills.length;
  const totalAmountMonth = allMonthBills.reduce((acc, b) => acc + b.amount, 0);

  const overdueBills = allMonthBills.filter(b => !b.isPaid && getDueUrgency(b.dueDate, b.isPaid, todayStr) === 'overdue');
  const totalOverdueAmount = overdueBills.reduce((acc, b) => acc + b.amount, 0);

  const urgentBills = allMonthBills.filter(b => {
    if (b.isPaid) return false;
    const urgency = getDueUrgency(b.dueDate, b.isPaid, todayStr);
    return urgency === 'today' || urgency === 'urgent' || urgency === 'soon';
  });
  const totalUrgentAmount = urgentBills.reduce((acc, b) => acc + b.amount, 0);

  const pendingBills = allMonthBills.filter(b => !b.isPaid);
  const totalPendingAmount = pendingBills.reduce((acc, b) => acc + b.amount, 0);

  const paidBills = allMonthBills.filter(b => b.isPaid);
  const totalPaidAmount = paidBills.reduce((acc, b) => acc + b.amount, 0);

  // Group bills by day for timeline
  const billsByDay = useMemo(() => {
    const map: Record<number, UnifiedBill[]> = {};
    allMonthBills.forEach(bill => {
      if (!map[bill.dueDay]) {
        map[bill.dueDay] = [];
      }
      map[bill.dueDay].push(bill);
    });
    return map;
  }, [allMonthBills]);

  const uniqueDays = Object.keys(billsByDay).map(Number).sort((a, b) => a - b);

  // Apply User, Status, Source, and Search filters
  const filteredBills = useMemo(() => {
    return allMonthBills.filter(bill => {
      // Day filter
      if (selectedDayFilter !== null && bill.dueDay !== selectedDayFilter) {
        return false;
      }

      // Status filter
      if (filterStatus === 'pending' && bill.isPaid) return false;
      if (filterStatus === 'paid' && !bill.isPaid) return false;
      if (filterStatus === 'urgent') {
        const urg = getDueUrgency(bill.dueDate, bill.isPaid, todayStr);
        if (bill.isPaid || (urg !== 'today' && urg !== 'urgent' && urg !== 'overdue')) {
          return false;
        }
      }

      // User filter
      if (filterUser !== 'all') {
        if (bill.user !== 'both' && bill.user !== filterUser) return false;
      }

      // Source filter
      if (filterSource === 'cartoes' && bill.sourceType !== 'credit_card_invoice') return false;
      if (filterSource === 'consorcio' && !bill.isConsortium) return false;
      if (filterSource === 'boletos' && (bill.sourceType === 'credit_card_invoice' || bill.isConsortium)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = bill.title.toLowerCase().includes(query);
        const matchesCategory = bill.category.toLowerCase().includes(query);
        const matchesSubcat = bill.subcategory?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesSubcat) return false;
      }

      return true;
    });
  }, [allMonthBills, selectedDayFilter, filterStatus, filterUser, filterSource, searchQuery, todayStr]);

  // Actions: Toggle payment for transaction or credit card
  const handleToggleBillPaid = (bill: UnifiedBill) => {
    if (bill.sourceType === 'transaction' && bill.transactionRef && onUpdateTransaction) {
      const isNowPaid = !bill.isPaid;
      const updatedTx: Transaction = {
        ...bill.transactionRef,
        status: isNowPaid ? 'paid' : 'pending',
        paidAt: isNowPaid ? todayStr : undefined
      };
      onUpdateTransaction(updatedTx);
    } else if (bill.sourceType === 'credit_card_invoice' && bill.cardDetails) {
      onToggleCardPayment(bill.cardDetails.cardId, selectedMonth, bill.amount);
    }
  };

  // Helper for month display
  const [selectedYearStr, selectedMonthStr] = selectedMonth.split('-');
  const monthLabel = `${MONTH_NAMES[parseInt(selectedMonthStr, 10) - 1]} de ${selectedYearStr}`;

  return (
    <div className="space-y-8" id="bills-due-container">
      {/* HEADER & MONTH NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <CalendarClock size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Central de Vencimentos & Contas a Pagar</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhe prazos de boletos, consórcios e faturas de cartão para manter pagamentos em dia.
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 px-3 min-w-[140px] text-center">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer ml-1"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue / In Arrears */}
        <div className={`border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all ${
          overdueBills.length > 0 
            ? 'bg-red-500/5 dark:bg-red-950/30 border-red-500/30 text-red-700 dark:text-red-300' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Atrasadas / Vencidas
              </span>
              {overdueBills.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <span className="font-mono text-xl font-bold text-red-600 dark:text-red-400 block">
              R$ {totalOverdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {overdueBills.length} {overdueBills.length === 1 ? 'conta vencida' : 'contas vencidas'}
            </span>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl text-red-600 dark:text-red-400">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Urgent (Next 7 Days) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Vencendo Próx. 7 Dias
            </span>
            <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400 block">
              R$ {totalUrgentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {urgentBills.length} {urgentBills.length === 1 ? 'obrigação próxima' : 'obrigações próximas'}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock size={22} />
          </div>
        </div>

        {/* Total Pending in Month */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              A Pagar no Mês
            </span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white block">
              R$ {totalPendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {pendingBills.length} pendências em aberto
            </span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
            <Calendar size={22} />
          </div>
        </div>

        {/* Total Paid in Month */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Pago / Liquidado
            </span>
            <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 block">
              R$ {totalPaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {paidBills.length} de {totalBillsCount} contas quitadas
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* SMART ALERT BANNER FOR UPCOMING / OVERDUE BILLS */}
      {(overdueBills.length > 0 || urgentBills.length > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5 md:mt-0">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <span>Atenção aos Prazos de Vencimento</span>
                {overdueBills.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                    {overdueBills.length} Vencida(s)
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {overdueBills.length > 0 ? (
                  <span>Você tem contas vencidas aguardando pagamento no valor de <strong>R$ {totalOverdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.</span>
                ) : (
                  <span>Você possui <strong>{urgentBills.length} conta(s)</strong> vencendo nos próximos 7 dias totalizando <strong>R$ {totalUrgentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus('urgent')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <AlertCircle size={14} />
              <span>Ver Apenas Urgentes / Vencendo</span>
            </button>
          </div>
        </div>
      )}

      {/* TIMELINE / CALENDAR DAY BAR */}
      {uniqueDays.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-500" />
              Linha do Tempo dos Vencimentos ({monthLabel})
            </span>
            {selectedDayFilter !== null && (
              <button
                type="button"
                onClick={() => setSelectedDayFilter(null)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Mostrar Todos os Dias</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            {uniqueDays.map(day => {
              const dayBills = billsByDay[day] || [];
              const dayTotal = dayBills.reduce((acc, b) => acc + b.amount, 0);
              const hasOverdue = dayBills.some(b => !b.isPaid && getDueUrgency(b.dueDate, b.isPaid, todayStr) === 'overdue');
              const hasUrgent = dayBills.some(b => !b.isPaid && getDueUrgency(b.dueDate, b.isPaid, todayStr) === 'today');
              const isAllPaid = dayBills.every(b => b.isPaid);
              const isSelected = selectedDayFilter === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayFilter(isSelected ? null : day)}
                  className={`shrink-0 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center min-w-[76px] ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                      : isAllPaid
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                      : hasOverdue
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900 text-red-800 dark:text-red-300'
                      : hasUrgent
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase opacity-75">Dia</span>
                  <span className="text-base font-bold font-mono leading-none my-0.5">{String(day).padStart(2, '0')}</span>
                  <span className={`text-[9px] font-mono font-semibold ${isSelected ? 'text-indigo-100' : 'opacity-80'}`}>
                    R$ {dayTotal >= 1000 ? `${(dayTotal / 1000).toFixed(1)}k` : dayTotal.toFixed(0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, consórcio, fatura ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            <option value="all">Status: Todos</option>
            <option value="pending">⏳ Apenas Pendentes (A Pagar)</option>
            <option value="urgent">⚠️ Urgentes / Vencendo</option>
            <option value="paid">✅ Apenas Pagas</option>
          </select>

          {/* Source Filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            <option value="all">Tipo: Todos os Compromissos</option>
            <option value="consorcio">🚗 Consórcio de Veículo & Lances</option>
            <option value="boletos">📄 Boletos & Despesas Fixas</option>
            <option value="cartoes">💳 Faturas de Cartão de Crédito</option>
          </select>

          {/* User Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            <option value="all">Responsável: Todos</option>
            <option value="A">Georges</option>
            <option value="B">Luana</option>
          </select>
        </div>
      </div>

      {/* UNIFIED BILLS LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Lista de Obrigações do Mês
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              {filteredBills.length}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            Clique no botão <strong>"Dar Baixa"</strong> para registrar a quitação.
          </span>
        </div>

        {filteredBills.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarClock size={24} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Nenhuma conta ou vencimento encontrado para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBills.map((bill) => {
              const diffDays = getDaysDifference(bill.dueDate, todayStr);
              const urgency = getDueUrgency(bill.dueDate, bill.isPaid, todayStr);
              const badge = getDueBadgeInfo(urgency, diffDays);
              const isCard = bill.sourceType === 'credit_card_invoice';
              const isConsortium = bill.isConsortium;

              return (
                <div
                  key={bill.id}
                  className={`p-4.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    bill.isPaid
                      ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                      : urgency === 'overdue'
                      ? 'bg-red-500/5 dark:bg-red-950/20 border-red-500/30 hover:border-red-500/50'
                      : urgency === 'today'
                      ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                      : urgency === 'urgent'
                      ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
                  }`}
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                      bill.isPaid
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isConsortium
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : isCard
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isConsortium ? (
                        <Car size={20} />
                      ) : isCard ? (
                        <CreditCardIcon size={20} />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${bill.isPaid ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {bill.title}
                        </span>

                        {/* Urgency Badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${badge.colorClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                          {badge.label}
                        </span>

                        {/* Consortium Installment Fraction */}
                        {bill.installmentInfo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Boleto {bill.installmentInfo.current}/{bill.installmentInfo.total}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Vencimento: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatDateBR(bill.dueDate)}</strong>
                        </span>

                        <span>•</span>

                        <span>{bill.category}</span>

                        {bill.subcategory && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{bill.subcategory}</span>
                          </>
                        )}

                        <span>•</span>

                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {bill.user === 'both' ? 'Georges & Luana' : bill.user === 'A' ? 'Georges' : 'Luana'}
                        </span>
                      </div>

                      {bill.isPaid && bill.paidAt && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Liquidado em {formatDateBR(bill.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Action Button */}
                  <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Valor da Obrigação</span>
                      <span className={`font-mono text-base font-bold ${bill.isPaid ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                        R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBillPaid(bill)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        bill.isPaid
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      {bill.isPaid ? (
                        <>
                          <RotateCcw size={13} />
                          <span>Desfazer Baixa</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Dar Baixa (Pagar)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDUCATIONAL / BEST PRACTICES FOOTER */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-start gap-3.5 text-xs text-slate-600 dark:text-slate-400">
        <Info size={20} className="text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white block">Como funciona o Gerenciador de Vencimentos?</span>
          <p>
            O módulo centraliza automaticamente todas as saídas financeiras do mês: boletos lançados (como as <strong>100 parcelas do Consórcio de Veículo</strong>), aluguel, energia, e as <strong>faturas estimadas dos cartões de crédito</strong> com base no dia de vencimento de cada cartão. Ao efetuar o pagamento, clique em <strong>"Dar Baixa"</strong> para marcar a obrigação como liquidada e manter seu controle rigorosamente atualizado.
          </p>
        </div>
      </div>
    </div>
  );
}
