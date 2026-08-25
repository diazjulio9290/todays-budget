import { addDays, daysInMonth, diffDays, parseISO, weekday } from "./dates";
import { addRat, isNegative, isZero, rat, RAT_ZERO, roundHalfAway } from "./rational";
import type { DayLine, DaySnapshot, Item, Rat } from "./types";

export function isActiveOn(item: Item, date: string): boolean {
  if (date < item.start) return false;
  if (item.end === null) return true;
  return date <= item.end;
}

function hitsCadence(item: Item, date: string): boolean {
  if (!item.repeats) return true;
  if (item.repeats === "Weekly") return weekday(date) === weekday(item.start);
  if (item.repeats === "Every 2 weeks") {
    const delta = diffDays(item.start, date);
    return delta >= 0 && delta % 14 === 0;
  }
  if (item.repeats === "Monthly") {
    const startDay = parseISO(item.start).d;
    const dim = daysInMonth(date);
    const target = Math.min(startDay, dim);
    return parseISO(date).d === target;
  }
  return true;
}

/** Unrounded daily contribution in cents (rational). */
export function dailyUnrounded(item: Item, date: string): Rat {
  if (!isActiveOn(item, date)) return RAT_ZERO;
  if (!item.repeats) return rat(item.amountCents);
  if (!item.spread) return hitsCadence(item, date) ? rat(item.amountCents) : RAT_ZERO;
  if (item.repeats === "Monthly") return rat(item.amountCents, daysInMonth(date));
  if (item.repeats === "Weekly") return rat(item.amountCents, 7);
  if (item.repeats === "Every 2 weeks") return rat(item.amountCents, 14);
  return RAT_ZERO;
}

export function dailyCents(item: Item, date: string): number {
  const u = dailyUnrounded(item, date);
  if (isZero(u)) return 0;
  return roundHalfAway(u);
}

/**
 * Timeline start for rollover.
 *
 * The iOS screenshot's $1,380.03 rollover on Mon Aug 24, 2026 is the
 * rounded cumulative unrounded net from the first *income* start
 * (Paycheck 7/29/2026). The car payment is active from 6/29, and those car-only
 * days still appear on the ledger, but they are not allowed to drag
 * today's free money. If there is no income, we fall back to the earliest
 * item start.
 */
export function getEpoch(items: Item[]): string | null {
  if (items.length === 0) return null;
  const incomes = items.filter((i) => i.amountCents > 0);
  const pool = incomes.length > 0 ? incomes : items;
  return pool.reduce((min, i) => (i.start < min ? i.start : min), pool[0].start);
}

function linesOn(items: Item[], date: string): DayLine[] {
  const lines: DayLine[] = [];
  for (const item of items) {
    const unrounded = dailyUnrounded(item, date);
    if (isZero(unrounded)) continue;
    const cents = roundHalfAway(unrounded);
    if (cents === 0) continue;
    lines.push({ item, unrounded, cents });
  }
  return lines;
}

function buildDay(items: Item[], date: string): Omit<
  DaySnapshot,
  "rollover" | "todayBudget"
> {
  const lines = linesOn(items, date);
  const expenses = lines.filter((l) => l.cents < 0).sort((a, b) => a.cents - b.cents);
  const incomes = lines.filter((l) => l.cents > 0).sort((a, b) => b.cents - a.cents);
  let unroundedFixed: Rat = RAT_ZERO;
  let unroundedIncome: Rat = RAT_ZERO;
  for (const line of lines) {
    if (isNegative(line.unrounded) || line.cents < 0) {
      unroundedFixed = addRat(unroundedFixed, line.unrounded);
    } else {
      unroundedIncome = addRat(unroundedIncome, line.unrounded);
    }
  }
  const unroundedNet = addRat(unroundedFixed, unroundedIncome);
  return {
    date,
    lines,
    expenses,
    incomes,
    fixedCosts: roundHalfAway(unroundedFixed),
    incomesTotal: roundHalfAway(unroundedIncome),
    net: roundHalfAway(unroundedNet),
    unroundedNet,
    unroundedFixed,
    unroundedIncome,
  };
}

export function snapshotsInRange(
  items: Item[],
  start: string,
  end: string,
): DaySnapshot[] {
  const epoch = getEpoch(items);
  let acc: Rat = RAT_ZERO;
  if (epoch && start > epoch) {
    let cursor = epoch;
    while (cursor < start) {
      acc = addRat(acc, dayUnroundedNet(items, cursor));
      cursor = addDays(cursor, 1);
    }
  }
  const out: DaySnapshot[] = [];
  let d = start;
  while (d <= end) {
    const day = buildDay(items, d);
    const inWindow = !epoch || d >= epoch;
    const rollover = inWindow ? roundHalfAway(acc) : 0;
    if (inWindow) acc = addRat(acc, day.unroundedNet);
    const todayBudget = inWindow ? roundHalfAway(acc) : day.net;
    out.push({ ...day, rollover, todayBudget });
    d = addDays(d, 1);
  }
  return out;
}

export function snapshotOn(items: Item[], date: string): DaySnapshot {
  return snapshotsInRange(items, date, date)[0];
}

function dayUnroundedNet(items: Item[], date: string): Rat {
  let s: Rat = RAT_ZERO;
  for (const item of items) s = addRat(s, dailyUnrounded(item, date));
  return s;
}

export function leftoverAfterSpend(todayBudget: number, spendCents: number): number {
  return todayBudget - spendCents;
}

export interface CategoryBite {
  category: string;
  cents: number;
  share: number;
}

export function categoryBite(snapshot: DaySnapshot): CategoryBite[] {
  const map = new Map<string, number>();
  for (const line of snapshot.expenses) {
    map.set(line.item.category, (map.get(line.item.category) ?? 0) + line.cents);
  }
  const total = snapshot.fixedCosts === 0 ? 1 : Math.abs(snapshot.fixedCosts);
  return [...map.entries()]
    .map(([category, cents]) => ({
      category,
      cents,
      share: Math.abs(cents) / total,
    }))
    .sort((a, b) => a.cents - b.cents);
}
