import type { PeriodFilter } from '@/lib/week';

// Tipos e constantes da tela de finanças. Os dados vêm da API (src/api/finance.ts);
// mês e filtro de período ficam em src/store/finance.ts.

export const PERIOD_FILTERS: { id: PeriodFilter; label: string }[] = [
  { id: 'month', label: 'Mês' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Ano' },
  { id: 'overview', label: 'Visão Geral' },
];

export type TransactionKind = 'income' | 'essential' | 'investment' | 'lifestyle';

export const KIND_LABEL: Record<TransactionKind, string> = {
  income: 'Receita',
  essential: 'Despesa Essencial',
  investment: 'Investimento',
  lifestyle: 'Estilo de Vida',
};

export const KIND_LABEL_PLURAL: Record<TransactionKind, string> = {
  income: 'Receitas',
  essential: 'Despesas Essenciais',
  investment: 'Investimentos',
  lifestyle: 'Estilo de Vida',
};

export const TRANSACTION_ICONS = [
  'bank',
  'cash-multiple',
  'office-building',
  'credit-card-outline',
  'monitor',
  'cart-outline',
  'food-fork-drink',
  'car-outline',
  'medical-bag',
  'airplane',
  'chart-line',
  'gift-outline',
] as const;

export type TransactionIcon = (typeof TRANSACTION_ICONS)[number];

export type Transaction = {
  id: string;
  title: string;
  category: string;
  kind: TransactionKind;
  /** Valor sempre positivo; `kind === 'income'` é entrada, o resto é saída. */
  amount: number;
  /** Data ISO (YYYY-MM-DD). */
  date: string;
  icon: TransactionIcon;
};

// Seed com datas relativas a hoje, para o mês atual e os anteriores terem movimentação
export type AssetClass = {
  id: string;
  name: string;
  amount: number;
  /** Tom do segmento na barra e da bolinha na legenda (escala de cinza, do maior ao menor). */
  tone: string;
};

export const ALLOCATION_TONES = ['#FFFFFF', '#8A8A8A', '#4A4A4A', '#2E2E2E', '#232323', '#1B1B1B'];

export const quote = {
  text: '"A riqueza não consiste na posse de tesouros, mas no uso sensato deles."',
  author: 'Napoleão Bonaparte • Sêneca',
};
