export type UserType = 'A' | 'B';

export interface UserProfile {
  id: UserType;
  name: string;
  role: string;
  avatarColor: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  closingDay: number; // Dia de fechamento da fatura (ex: 5)
  dueDay: number;     // Dia de vencimento (ex: 12)
  limit: number;      // Limite total em R$
  user: UserType | 'both'; // Marido (A), Esposa (B) ou Ambos (both)
  color: string;      // Tailwind gradient class or color hex
  digits?: string;    // Últimos 4 dígitos (opcional)
}

export interface InstallmentPlan {
  id: string;
  description: string;
  cardId: string;
  category: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: string; // YYYY-MM ou YYYY-MM-DD
  user: UserType;
}

export interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  subcategory: string;
  amount: number;
  date: string;
  user: UserType;
  description: string;
  paymentMethod?: 'pix' | 'debito' | 'credito' | 'boleto' | 'dinheiro' | 'outros';
  cardId?: string;
  isConsortium?: boolean;
  installmentInfo?: {
    current: number;
    total: number;
    totalAmount?: number;
    planId?: string;
  };
  isRecurring?: boolean;
  recurringGroupId?: string;
  status?: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
  dueDate?: string;
}

export interface CardInvoicePayment {
  id: string;
  cardId: string;
  month: string; // YYYY-MM
  status: 'pending' | 'paid';
  paidAt?: string;
  amount?: number;
}

export interface VariableAsset {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  type: 'Ação' | 'FII' | 'ETF' | 'BDR';
}

export interface DividendReceived {
  id: string;
  ticker: string;
  amount: number;
  date: string; // YYYY-MM
  type: 'Dividendo' | 'JCP' | 'Rendimento';
  user: UserType;
}

export interface FixedIncome {
  id: string;
  name: string;
  initialAmount: number;
  rate: number; // e.g. 11.5 for 11.5% per year
  applicationDate: string;
  maturityDate: string;
  user: UserType;
}

