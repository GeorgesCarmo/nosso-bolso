import React, { useState } from 'react';
import { 
  CreditCard as CreditCardIcon, 
  Plus, 
  Trash2, 
  Pencil,
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  PieChart, 
  Zap, 
  ShieldCheck, 
  User, 
  Sliders, 
  Sparkles,
  Tag,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CreditCard, InstallmentPlan, Transaction, UserType } from '../types';

interface CardsTabProps {
  creditCards: CreditCard[];
  installmentPlans: InstallmentPlan[];
  transactions: Transaction[];
  onAddCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  onUpdateCreditCard?: (card: CreditCard) => void;
  onDeleteCreditCard: (id: string) => void;
  onAddInstallmentPlan: (plan: Omit<InstallmentPlan, 'id' | 'paidInstallments'>) => void;
  onDeleteInstallmentPlan: (id: string) => void;
  onUpdateInstallmentProgress: (id: string, paidCount: number) => void;
  currentUser: UserType;
}

const BRAND_GRADIENTS = [
  { label: 'Prata / Platinum (Amex Silver)', value: 'from-slate-400 via-zinc-600 to-slate-900' },
  { label: 'Roxo Nubank', value: 'from-purple-900 via-indigo-950 to-slate-950' },
  { label: 'Preto Black / XP', value: 'from-slate-900 via-zinc-900 to-black' },
  { label: 'Laranja / Amarelo Itaú', value: 'from-amber-700 via-orange-900 to-stone-950' },
  { label: 'Azul Bradesco / Itaú', value: 'from-blue-900 via-indigo-900 to-slate-950' },
  { label: 'Verde Inter / BTG', value: 'from-emerald-800 via-teal-950 to-slate-950' },
  { label: 'Vermelho Santander', value: 'from-rose-900 via-red-950 to-slate-950' },
];

export default function CardsTab({
  creditCards,
  installmentPlans,
  transactions,
  onAddCreditCard,
  onUpdateCreditCard,
  onDeleteCreditCard,
  onAddInstallmentPlan,
  onDeleteInstallmentPlan,
  onUpdateInstallmentProgress,
  currentUser,
}: CardsTabProps) {
  // Modals state
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [selectedCardIdForFilter, setSelectedCardIdForFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'A' | 'B'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03'); // YYYY-MM

  // Card Form State (Add / Edit)
  const [cardName, setCardName] = useState('');
  const [bank, setBank] = useState('');
  const [closingDay, setClosingDay] = useState<number>(5);
  const [dueDay, setDueDay] = useState<number>(12);
  const [limit, setLimit] = useState<string>('15000');
  const [cardUser, setCardUser] = useState<UserType | 'both'>('A');
  const [colorGradient, setColorGradient] = useState(BRAND_GRADIENTS[0].value);
  const [digits, setDigits] = useState('');

  // New Purchase / Installment Form State
  const [purchaseDesc, setPurchaseDesc] = useState('');
  const [purchaseCardId, setPurchaseCardId] = useState('');
  const [purchaseCategory, setPurchaseCategory] = useState('Tecnologia');
  const [purchaseTotalAmount, setPurchaseTotalAmount] = useState('');
  const [purchaseInstallments, setPurchaseInstallments] = useState<number>(1);
  const [purchaseUser, setPurchaseUser] = useState<UserType>('A');
  const [purchaseStartDate, setPurchaseStartDate] = useState('2026-03');

  // Filter Cards
  const filteredCards = creditCards.filter(card => {
    if (userFilter === 'all') return true;
    return card.user === userFilter || card.user === 'both';
  });

  // Calculate totals across cards & active installment plans
  const totalCreditLimit = filteredCards.reduce((acc, card) => acc + card.limit, 0);

  // Active installment plans calculation
  const filteredInstallmentPlans = installmentPlans.filter(plan => {
    if (userFilter === 'all') return true;
    return plan.user === userFilter;
  });

  const totalMonthlyInstallmentCommitments = filteredInstallmentPlans.reduce((acc, plan) => {
    const isOngoing = plan.paidInstallments < plan.totalInstallments;
    return isOngoing ? acc + plan.installmentAmount : acc;
  }, 0);

  const totalRemainingDeubt = filteredInstallmentPlans.reduce((acc, plan) => {
    const remainingCount = Math.max(0, plan.totalInstallments - plan.paidInstallments);
    return acc + (remainingCount * plan.installmentAmount);
  }, 0);

  // Helper to open modal for new card
  const handleOpenAddCard = () => {
    setEditingCard(null);
    setCardName('');
    setBank('');
    setClosingDay(5);
    setDueDay(12);
    setLimit('15000');
    setCardUser('A');
    setColorGradient(BRAND_GRADIENTS[0].value);
    setDigits('');
    setShowAddCardModal(true);
  };

  // Helper to open modal for editing existing card
  const handleOpenEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardName(card.name);
    setBank(card.bank);
    setClosingDay(card.closingDay);
    setDueDay(card.dueDay);
    setLimit(card.limit.toString());
    setCardUser(card.user);
    setColorGradient(card.color || BRAND_GRADIENTS[0].value);
    setDigits(card.digits || '');
    setShowAddCardModal(true);
  };

  // Helper to save card (Add or Update)
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !bank || !limit) return;

    if (editingCard) {
      if (onUpdateCreditCard) {
        onUpdateCreditCard({
          ...editingCard,
          name: cardName,
          bank,
          closingDay: Number(closingDay),
          dueDay: Number(dueDay),
          limit: parseFloat(limit),
          user: cardUser,
          color: colorGradient,
          digits: digits || '4321',
        });
      }
    } else {
      onAddCreditCard({
        name: cardName,
        bank,
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        limit: parseFloat(limit),
        user: cardUser,
        color: colorGradient,
        digits: digits || '4321',
      });
    }

    // Reset Form
    setCardName('');
    setBank('');
    setLimit('15000');
    setDigits('');
    setEditingCard(null);
    setShowAddCardModal(false);
  };

  // Helper to handle creation of purchase/installment
  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCardId = purchaseCardId || (creditCards[0]?.id || '');
    if (!purchaseDesc || !purchaseTotalAmount || !targetCardId) return;

    const totalVal = parseFloat(purchaseTotalAmount);
    const instCount = Math.max(1, purchaseInstallments);
    const instVal = totalVal / instCount;

    onAddInstallmentPlan({
      description: purchaseDesc,
      cardId: targetCardId,
      category: purchaseCategory,
      totalAmount: totalVal,
      installmentAmount: instVal,
      totalInstallments: instCount,
      startDate: purchaseStartDate,
      user: purchaseUser,
    });

    setPurchaseDesc('');
    setPurchaseTotalAmount('');
    setPurchaseInstallments(1);
    setShowAddPurchaseModal(false);
  };

  return (
    <div className="space-y-8" id="cards-tab-container">
      {/* Header Banner & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <CreditCardIcon size={16} />
              <span>Gestão Integrada de Cartões & Parcelados</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Cartões de Crédito & Faturas
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Gerencie limites de crédito do casal, acompanhe o dia de fechamento de cada fatura e controle compras parceladas mês a mês sem surpresas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="open-add-purchase-modal-btn"
              onClick={() => {
                if (creditCards.length > 0) setPurchaseCardId(creditCards[0].id);
                setShowAddPurchaseModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Plus size={16} />
              <span>Lançar Compra / Parcelamento</span>
            </button>
            <button
              type="button"
              id="open-add-card-modal-btn"
              onClick={handleOpenAddCard}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
            >
              <CreditCardIcon size={16} />
              <span>+ Novo Cartão</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Limite de Crédito Total</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
              R$ {totalCreditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 block">Soma dos limites cadastrados</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Parcelas do Mês Atual</span>
            <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
              R$ {totalMonthlyInstallmentCommitments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 block">Comprometimento mensal fixo</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Saldo Devedor Parcelado Futuro</span>
            <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
              R$ {totalRemainingDeubt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 block">Total a liquidar em compras futuras</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrar por Beneficiário:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUserFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              userFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            👥 Ambos (Casal)
          </button>
          <button
            type="button"
            onClick={() => setUserFilter('A')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              userFilter === 'A'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            👤 Georges (Marido)
          </button>
          <button
            type="button"
            onClick={() => setUserFilter('B')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              userFilter === 'B'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            👤 Luana (Esposa)
          </button>
        </div>
      </div>

      {/* Registered Credit Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCardIcon size={20} className="text-indigo-500" />
            <span>Meus Cartões de Crédito ({filteredCards.length})</span>
          </h2>
        </div>

        {filteredCards.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <p className="text-sm text-slate-500">Nenhum cartão cadastrado para este filtro.</p>
            <button
              type="button"
              onClick={handleOpenAddCard}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-500 transition-all cursor-pointer"
            >
              + Cadastrar Primeiro Cartão
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map(card => {
              // Calculate active installment commitments for this card
              const cardPlans = installmentPlans.filter(p => p.cardId === card.id);
              const cardMonthlyCommitment = cardPlans.reduce((acc, p) => p.paidInstallments < p.totalInstallments ? acc + p.installmentAmount : acc, 0);
              const cardTotalPendingDebt = cardPlans.reduce((acc, p) => acc + (Math.max(0, p.totalInstallments - p.paidInstallments) * p.installmentAmount), 0);
              const usedLimitPercentage = Math.min(100, (cardTotalPendingDebt / card.limit) * 100);

              const holderBadge = card.user === 'A' ? 'Marido (Georges)' : card.user === 'B' ? 'Esposa (Luana)' : 'Casal (Ambos)';
              const holderBadgeColor = card.user === 'A' ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40' : card.user === 'B' ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40' : 'bg-purple-500/30 text-purple-200 border-purple-400/40';

              return (
                <div 
                  key={card.id}
                  className={`bg-gradient-to-br ${card.color} p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-white/10 group`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Bank, Holder & Card Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">{card.bank}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${holderBadgeColor}`}>
                          {holderBadge}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCard(card)}
                          className="bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-medium border border-white/10 backdrop-blur-sm"
                          title="Editar Informações do Cartão"
                        >
                          <Pencil size={12} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja remover o cartão ${card.name}?`)) {
                              onDeleteCreditCard(card.id);
                            }
                          }}
                          className="bg-white/10 hover:bg-red-500/30 text-white/60 hover:text-red-300 transition-all cursor-pointer p-1 rounded-lg border border-white/10"
                          title="Excluir Cartão"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Card Name & Digits */}
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-white">{card.name}</h3>
                      <p className="font-mono text-sm tracking-widest text-white/60">
                        •••• •••• •••• {card.digits || '4321'}
                      </p>
                    </div>

                    {/* Dates Badges */}
                    <div className="flex items-center gap-3 text-[11px] text-white/80 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 w-fit">
                      <span>Fechamento: <strong>Dia {card.closingDay}</strong></span>
                      <span className="text-white/40">•</span>
                      <span>Vencimento: <strong>Dia {card.dueDay}</strong></span>
                    </div>
                  </div>

                  {/* Bottom Limit & Progress */}
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">Comprometido / Limite</span>
                      <span className="font-mono font-semibold">
                        R$ {cardTotalPendingDebt.toLocaleString('pt-BR')} / R$ {card.limit.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          usedLimitPercentage > 80 ? 'bg-red-500' : usedLimitPercentage > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${usedLimitPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
                      <span>Parcelas/Mês: <strong>R$ {cardMonthlyCommitment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                      <span>{usedLimitPercentage.toFixed(0)}% do limite</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Installment Plans Tracker (Gerenciador de Parcelamentos Ativos) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              <span>Compras Parceladas Ativas ({filteredInstallmentPlans.length})</span>
            </h2>
            <p className="text-xs text-slate-500">Acompanhe a evolução de pagamentos de cada item parcelado no cartão.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPurchaseModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm cursor-pointer w-fit"
          >
            <Plus size={14} />
            <span>Adicionar Parcelamento</span>
          </button>
        </div>

        {filteredInstallmentPlans.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-sm">
            Nenhum parcelamento registrado no momento.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInstallmentPlans.map(plan => {
                const card = creditCards.find(c => c.id === plan.cardId);
                const isCompleted = plan.paidInstallments >= plan.totalInstallments;
                const progressPercentage = Math.min(100, (plan.paidInstallments / plan.totalInstallments) * 100);
                const remainingInstallments = Math.max(0, plan.totalInstallments - plan.paidInstallments);
                const remainingValue = remainingInstallments * plan.installmentAmount;

                return (
                  <div key={plan.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {plan.description}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {plan.category}
                        </span>
                        {card && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-800">
                            💳 {card.name}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          plan.user === 'A' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {plan.user === 'A' ? 'Georges (Marido)' : 'Luana (Esposa)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>Valor Total: <strong className="text-slate-700 dark:text-slate-300 font-mono">R$ {plan.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                        <span>•</span>
                        <span>Valor Mensal: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">R$ {plan.installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</strong></span>
                        <span>•</span>
                        <span>Saldo Restante: <strong className="text-slate-700 dark:text-slate-300 font-mono">R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="space-y-1 w-36 sm:w-44">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {plan.paidInstallments}/{plan.totalInstallments} parcelas
                          </span>
                          <span className="text-slate-400 font-mono">{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => onUpdateInstallmentProgress(plan.id, plan.paidInstallments + 1)}
                            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                            title="Avançar 1 Parcela Paga"
                          >
                            <CheckCircle2 size={14} />
                            <span>+1 Parcela</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Excluir o registro do parcelamento "${plan.description}"?`)) {
                              onDeleteInstallmentPlan(plan.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                          title="Excluir Parcelamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Credit Card */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCardIcon size={20} className="text-indigo-500" />
                <span>{editingCard ? 'Editar Cartão de Crédito' : 'Cadastrar Novo Cartão de Crédito'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddCardModal(false);
                  setEditingCard(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nome do Cartão (Ex: Nubank Black)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: XP Visa Infinite"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Banco Emissor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: XP / Itaú / Nubank"
                    value={bank}
                    onChange={e => setBank(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Limite Total (R$)</label>
                  <input
                    type="number"
                    required
                    step="100"
                    placeholder="15000"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Dia Fechamento Fatura</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={closingDay}
                    onChange={e => setClosingDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Dia Vencimento Fatura</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={e => setDueDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Titular do Cartão</label>
                  <select
                    value={cardUser}
                    onChange={e => setCardUser(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                  >
                    <option value="A">Georges (Marido)</option>
                    <option value="B">Luana (Esposa)</option>
                    <option value="both">Casal (Ambos)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Últimos 4 dígitos (Opcional)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={digits}
                    onChange={e => setDigits(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Cor do Cartão</label>
                <select
                  value={colorGradient}
                  onChange={e => setColorGradient(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                >
                  {BRAND_GRADIENTS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCardModal(false);
                    setEditingCard(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  {editingCard ? 'Salvar Alterações' : 'Salvar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Purchase / Installment */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap size={20} className="text-indigo-500" />
                <span>Lançar Compra / Parcelamento</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Descrição da Compra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Notebook Novo / Passagens Aéreas"
                  value={purchaseDesc}
                  onChange={e => setPurchaseDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Cartão de Crédito</label>
                  <select
                    value={purchaseCardId}
                    onChange={e => setPurchaseCardId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                  >
                    {creditCards.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.bank})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Quem comprou?</label>
                  <select
                    value={purchaseUser}
                    onChange={e => setPurchaseUser(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                  >
                    <option value="A">Georges (Marido)</option>
                    <option value="B">Luana (Esposa)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3000.00"
                    value={purchaseTotalAmount}
                    onChange={e => setPurchaseTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nº de Parcelas</label>
                  <select
                    value={purchaseInstallments}
                    onChange={e => setPurchaseInstallments(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white font-mono"
                  >
                    <option value={1}>1x (À vista)</option>
                    {Array.from({ length: 23 }, (_, i) => i + 2).map(n => (
                      <option key={n} value={n}>{n}x parcelado</option>
                    ))}
                  </select>
                </div>
              </div>

              {purchaseTotalAmount && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between font-mono">
                  <span>Valor estimado da parcela:</span>
                  <strong>
                    {purchaseInstallments}x de R$ {(parseFloat(purchaseTotalAmount) / Math.max(1, purchaseInstallments)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  Salvar Parcelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
