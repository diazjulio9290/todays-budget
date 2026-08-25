import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { itemsFromCsv } from "./csv";
import { addDays } from "./dates";
import {
  categoryBite,
  dailyCents,
  getEpoch,
  leftoverAfterSpend,
  snapshotOn,
  snapshotsInRange,
} from "./engine";
import { formatMoney } from "./format";
import type { Item } from "./types";

const seedPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/seed.csv",
);
const seedCsv = readFileSync(seedPath, "utf8");
const items = itemsFromCsv(seedCsv);

const AUG24 = "2026-08-24";

function byMemo(memo: string): Item {
  const found = items.find((i) => i.memo.trim() === memo);
  if (!found) throw new Error(`missing ${memo}`);
  return found;
}

describe("seed CSV parsing", () => {
  it("loads 38 items and treats repeating rows as spread", () => {
    expect(items).toHaveLength(38);
    expect(byMemo("Car payment").spread).toBe(true);
    expect(byMemo("Paycheck").spread).toBe(true);
    expect(byMemo("Saturday meal").spread).toBe(true);
    expect(byMemo("Coffee shop").repeats).toBe("");
    expect(byMemo("Coffee shop").spread).toBe(false);
    expect(byMemo("Gym").amountCents).toBe(-8998);
    expect(byMemo("Stream D").amountCents).toBe(-4499);
    expect(byMemo("Car payment").start).toBe("2026-06-29");
    expect(byMemo("Car payment").end).toBeNull();
  });
});

describe("daily proration (spread = yes)", () => {
  it("divides monthly bills by days in August (31)", () => {
    expect(dailyCents(byMemo("Personal Loan"), AUG24)).toBe(-3306);
    expect(dailyCents(byMemo("Car payment"), AUG24)).toBe(-2742);
    expect(dailyCents(byMemo("Office suite"), AUG24)).toBe(-42);
  });

  it("divides weekly meals by 7 and shows them every day", () => {
    expect(dailyCents(byMemo("Saturday meal"), AUG24)).toBe(-1571);
    expect(dailyCents(byMemo("Thursday meal"), AUG24)).toBe(-786);
    expect(dailyCents(byMemo("Saturday meal"), "2026-08-25")).toBe(-1571);
    expect(dailyCents(byMemo("Thursday meal"), "2026-08-22")).toBe(-786);
  });

  it("divides every-2-weeks paycheck by 14", () => {
    expect(dailyCents(byMemo("Paycheck"), AUG24)).toBe(21429);
  });

  it("applies one-time rows only on that date", () => {
    expect(dailyCents(byMemo("Coffee shop"), "2026-07-30")).toBe(-1081);
    expect(dailyCents(byMemo("Coffee shop"), AUG24)).toBe(0);
    expect(dailyCents(byMemo("Barber"), "2026-08-15")).toBe(-4200);
    expect(dailyCents(byMemo("Barber"), AUG24)).toBe(0);
  });
});

describe("non-spread cadence", () => {
  it("posts the full weekly amount only on that weekday", () => {
    const meal: Item = { ...byMemo("Saturday meal"), spread: false };
    // Start date 7/29/2026 is a Wednesday, so cadence is Wednesday.
    expect(dailyCents(meal, "2026-08-19")).toBe(-11000);
    expect(dailyCents(meal, "2026-08-22")).toBe(0);
    expect(dailyCents(meal, AUG24)).toBe(0);
  });

  it("posts the full monthly amount only on that day-of-month", () => {
    const car: Item = { ...byMemo("Car payment"), spread: false };
    expect(dailyCents(car, "2026-07-29")).toBe(-85000);
    expect(dailyCents(car, "2026-07-28")).toBe(0);
    expect(dailyCents(car, "2026-08-29")).toBe(-85000);
  });

  it("posts every-2-weeks full amount every 14 days from start", () => {
    const pay: Item = { ...byMemo("Paycheck"), spread: false };
    expect(dailyCents(pay, "2026-07-29")).toBe(300000);
    expect(dailyCents(pay, "2026-08-12")).toBe(300000);
    expect(dailyCents(pay, "2026-08-11")).toBe(0);
  });
});

describe("Monday Aug 24, 2026 ground truth", () => {
  const day = snapshotOn(items, AUG24);

  it("matches the iOS screenshot totals", () => {
    expect(day.fixedCosts).toBe(-15587);
    expect(day.incomesTotal).toBe(21429);
    expect(day.net).toBe(5842);
    expect(day.rollover).toBe(138003);
    expect(day.todayBudget).toBe(143845);
    expect(formatMoney(day.fixedCosts)).toBe("-$155.87");
    expect(formatMoney(day.incomesTotal)).toBe("$214.29");
    expect(formatMoney(day.net)).toBe("$58.42");
    expect(formatMoney(day.rollover)).toBe("$1,380.03");
    expect(formatMoney(day.todayBudget)).toBe("$1,438.45");
  });

  it("forecasts Tue and Wed as independently rounded cumulatives", () => {
    const range = snapshotsInRange(items, AUG24, "2026-08-26");
    expect(range[1].date).toBe("2026-08-25");
    expect(range[1].todayBudget).toBe(149687);
    expect(range[2].date).toBe("2026-08-26");
    expect(range[2].todayBudget).toBe(155528);
    expect(formatMoney(range[1].todayBudget)).toBe("$1,496.87");
    expect(formatMoney(range[2].todayBudget)).toBe("$1,555.28");
  });

  it("documents the 1-cent gap between rounded lines and section total", () => {
    const lineSum = day.expenses.reduce((s, l) => s + l.cents, 0);
    expect(lineSum).toBe(-15586);
    expect(day.fixedCosts).toBe(-15587);
    expect(day.expenses[0].item.memo.trim()).toBe("Personal Loan");
    expect(day.expenses[0].cents).toBe(-3306);
  });

  it("starts rollover from the first income, not the car payment's 6/29 start", () => {
    expect(getEpoch(items)).toBe("2026-07-29");
    expect(byMemo("Car payment").start).toBe("2026-06-29");
    const carOnly = snapshotOn(items, "2026-06-29");
    expect(carOnly.rollover).toBe(0);
    expect(carOnly.net).toBe(dailyCents(byMemo("Car payment"), "2026-06-29"));
  });
});

describe("mutations", () => {
  it("drops today's budget by the full amount of a one-time expense", () => {
    const before = snapshotOn(items, AUG24).todayBudget;
    const extra: Item = {
      id: "one-time",
      category: "Fun",
      memo: "Concert",
      amountCents: -4000,
      currency: "USD",
      repeats: "",
      spread: false,
      start: AUG24,
      end: AUG24,
    };
    const after = snapshotOn([...items, extra], AUG24);
    expect(after.todayBudget).toBe(before - 4000);
    expect(snapshotOn([...items, extra], addDays(AUG24, 1)).net).toBe(
      snapshotOn(items, addDays(AUG24, 1)).net,
    );
  });

  it("spreads a new monthly bill across every day of the month", () => {
    const extra: Item = {
      id: "rent",
      category: "Home",
      memo: "Rent",
      amountCents: -310000,
      currency: "USD",
      repeats: "Monthly",
      spread: true,
      start: "2026-08-01",
      end: null,
    };
    const before = snapshotOn(items, AUG24);
    const after = snapshotOn([...items, extra], AUG24);
    expect(dailyCents(extra, AUG24)).toBe(-10000);
    expect(after.fixedCosts).toBe(before.fixedCosts - 10000);
    expect(dailyCents(extra, "2026-08-31")).toBe(-10000);
    expect(dailyCents(extra, "2026-07-31")).toBe(0);
  });
});

describe("helpers", () => {
  it("computes leftover after a hypothetical spend", () => {
    expect(leftoverAfterSpend(143845, 2000)).toBe(141845);
    expect(leftoverAfterSpend(143845, 200000)).toBe(-56155);
  });

  it("groups today's bite by category", () => {
    const bite = categoryBite(snapshotOn(items, AUG24));
    expect(bite[0].category).toBe("Loan");
    expect(bite.some((b) => b.category === "Eating Out")).toBe(true);
    const shares = bite.reduce((s, b) => s + b.share, 0);
    expect(shares).toBeGreaterThan(0.99);
    expect(shares).toBeLessThan(1.02);
  });
});
