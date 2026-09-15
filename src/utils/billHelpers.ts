import { CreditCard, InstallmentPlan, Transaction } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getDaysDifference(targetDateStr: string, baseDateStr?: string): number {
  const baseStr = baseDateStr || getTodayDateString();
  const [tY, tM, tD] = targetDateStr.split('T')[0].split('-').map(Number);
  const [bY, bM, bD] = baseStr.split('T')[0].split('-').map(Number);

  const target = new Date(tY, tM - 1, tD);
  const base = new Date(bY, bM - 1, bD);

  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export type DueUrgency = 'paid' | 'overdue' | 'today' | 'urgent' | 'soon' | 'future';

export function getDueUrgency(dueDateStr: string, isPaid: boolean, baseDateStr?: string): DueUrgency {
  if (isPaid) return 'paid';
  const diffDays = getDaysDifference(dueDateStr, baseDateStr);
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 7) return 'soon';
  return 'future';
}

export function getDueBadgeInfo(urgency: DueUrgency, diffDays: number) {
  switch (urgency) {
    case 'paid':
      return {
        label: 'Pago / Liquidado',
        shortLabel: 'Pago',
        colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        urgencyOrder: 5
      };
    case 'overdue':
      const absDays = Math.abs(diffDays);
      return {
        label: `Vencido há ${absDays} ${absDays === 1 ? 'dia' : 'dias'}!`,
        shortLabel: `Atrasado ${absDays}d`,
        colorClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 animate-pulse',
        dotColor: 'bg-red-500',
        urgencyOrder: 1
      };
    case 'today':
      return {
        label: 'Vence HOJE!',
        shortLabel: 'Vence Hoje',
        colorClass: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 font-bold animate-bounce',
        dotColor: 'bg-rose-500',
        urgencyOrder: 0
      };
    case 'urgent':
      return {
        label: `Vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
        shortLabel: `Em ${diffDays}d`,
        colorClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold',
        dotColor: 'bg-amber-500',
        urgencyOrder: 2
      };
    case 'soon':
      return {
        label: `Vence em ${diffDays} dias`,
        shortLabel: `Em ${diffDays}d`,
        colorClass: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
        dotColor: 'bg-yellow-500',
        urgencyOrder: 3
      };
    case 'future':
    default:
      return {
        label: `Em ${diffDays} dias`,
        shortLabel: `Em ${diffDays}d`,
        colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        dotColor: 'bg-slate-400',
        urgencyOrder: 4
      };
  }
}

export interface UnifiedBill {
  id: string;
  sourceType: 'transaction' | 'credit_card_invoice';
  title: string;
  category: string;
  subcategory?: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  dueDay: number;
  user: 'A' | 'B' | 'both';
  paymentMethod: string;
  isPaid: boolean;
  paidAt?: string;
  isConsortium?: boolean;
  installmentInfo?: {
    current: number;
    total: number;
  };
  cardDetails?: {
    cardId: string;
    cardName: string;
    bank: string;
    digits?: string;
    closingDay: number;
    dueDay: number;
  };
  transactionRef?: Transaction;
}

export function buildUnifiedBillsList(
  transactions: Transaction[],
  creditCards: CreditCard[],
  installmentPlans: InstallmentPlan[],
  targetMonth: string, // YYYY-MM
  cardPaidMap: Record<string, { status: 'paid' | 'pending'; paidAt?: string; amount?: number }> = {}
): UnifiedBill[] {
  const bills: UnifiedBill[] = [];

  // 1. Despesas / Boletos das transações que caem no targetMonth
  const targetYearMonth = targetMonth; // e.g. "2026-08"

  transactions
    .filter(tx => tx.type === 'despesa' && tx.date.startsWith(targetYearMonth))
    .forEach(tx => {
      const parts = tx.date.split('-');
      const dueDay = parts.length === 3 ? parseInt(parts[2], 10) : 1;
      const isPaid = tx.status === 'paid' || Boolean(tx.paidAt);

      bills.push({
        id: `bill-tx-${tx.id}`,
        sourceType: 'transaction',
        title: tx.description,
        category: tx.category,
        subcategory: tx.subcategory,
        amount: tx.amount,
        dueDate: tx.dueDate || tx.date,
        dueDay,
        user: tx.user,
        paymentMethod: tx.paymentMethod || 'boleto',
        isPaid,
        paidAt: tx.paidAt,
        isConsortium: tx.isConsortium || tx.category === 'Consórcio & Financiamento',
        installmentInfo: tx.installmentInfo ? {
          current: tx.installmentInfo.current,
          total: tx.installmentInfo.total
        } : undefined,
        transactionRef: tx
      });
    });

  // 2. Faturas de Cartão de Crédito para o targetMonth
  creditCards.forEach(card => {
    // Calcular parcelamentos ativos no targetMonth para este cartão
    const cardInstallmentsInMonth = installmentPlans.filter(p => {
      if (p.cardId !== card.id) return false;
      const [startYear, startMonth] = p.startDate.split('-').map(Number);
      const [tYear, tMonth] = targetMonth.split('-').map(Number);
      const monthDiff = (tYear - startYear) * 12 + (tMonth - startMonth);
      return monthDiff >= 0 && monthDiff < p.totalInstallments;
    });

    const installmentsSum = cardInstallmentsInMonth.reduce((sum, p) => sum + p.installmentAmount, 0);

    // Despesas de débito/crédito lançadas diretamente no cartão no mês
    const directCardExpenses = transactions
      .filter(tx => tx.type === 'despesa' && tx.cardId === card.id && tx.date.startsWith(targetMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalInvoiceAmount = installmentsSum + directCardExpenses;

    // Se houver valor na fatura do cartão ou se o cartão estiver ativo
    if (totalInvoiceAmount > 0) {
      const dueDayFormatted = String(card.dueDay).padStart(2, '0');
      const invoiceDueDate = `${targetMonth}-${dueDayFormatted}`;
      const cardKey = `${card.id}_${targetMonth}`;
      const cardPaymentStatus = cardPaidMap[cardKey];
      const isPaid = cardPaymentStatus?.status === 'paid';

      bills.push({
        id: `bill-card-${card.id}-${targetMonth}`,
        sourceType: 'credit_card_invoice',
        title: `Fatura ${card.name} (${card.bank})`,
        category: 'Cartão de Crédito',
        subcategory: `Vencimento dia ${card.dueDay}`,
        amount: totalInvoiceAmount,
        dueDate: invoiceDueDate,
        dueDay: card.dueDay,
        user: card.user,
        paymentMethod: 'credito',
        isPaid,
        paidAt: cardPaymentStatus?.paidAt,
        cardDetails: {
          cardId: card.id,
          cardName: card.name,
          bank: card.bank,
          digits: card.digits,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
        }
      });
    }
  });

  // Ordenar por data de vencimento crescente
  bills.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return bills;
}
