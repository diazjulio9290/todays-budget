export type Repeat = "" | "Weekly" | "Every 2 weeks" | "Monthly";

export interface Item {
  id: string;
  category: string;
  memo: string;
  amountCents: number;
  currency: string;
  repeats: Repeat;
  spread: boolean;
  start: string;
  end: string | null;
}

export interface Rat {
  n: bigint;
  d: bigint;
}

export interface DayLine {
  item: Item;
  unrounded: Rat;
  cents: number;
}

export interface DaySnapshot {
  date: string;
  lines: DayLine[];
  expenses: DayLine[];
  incomes: DayLine[];
  fixedCosts: number;
  incomesTotal: number;
  net: number;
  rollover: number;
  todayBudget: number;
  unroundedNet: Rat;
  unroundedFixed: Rat;
  unroundedIncome: Rat;
}

export const CSV_HEADERS = [
  "Category",
  "Memo",
  "Amount",
  "Amount display",
  "Currency code",
  "Repeats",
  "Start date",
  "End date",
] as const;
