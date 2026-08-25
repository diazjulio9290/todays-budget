import { fromMDY, toMDY } from "./dates";
import { formatAmountDisplay } from "./format";
import type { Item, Repeat } from "./types";
import { CSV_HEADERS } from "./types";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((c) => c.length) || rows.length === 0) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((r) => r.map(escapeCsvField).join(","))
    .join("\r\n");
}

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function parseRepeat(raw: string): Repeat {
  const t = raw.trim();
  if (t === "Weekly" || t === "Every 2 weeks" || t === "Monthly") return t;
  return "";
}

function parseEnd(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t || t === "open end" || t === "open-end" || t === "openend") return null;
  return fromMDY(raw.trim());
}

/** Prefer the already-rounded Amount display; fall back to Amount. */
export function dollarsToCents(amount: string, display: string): number {
  const fromDisplay = parseDisplay(display);
  if (fromDisplay !== null) return fromDisplay;
  const n = Number(String(amount).trim().replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  const abs = Math.abs(n);
  return sign * Math.round(abs * 100);
}

function parseDisplay(display: string): number | null {
  const t = display.trim().replace(/\s/g, "").replace(/,/g, "");
  if (!t) return null;
  const neg = t.startsWith("-") || t.startsWith("-$") || t.includes("-$");
  const unsigned = t.replace(/[-+$]/g, "");
  if (!unsigned) return null;
  const m = unsigned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const whole = Number(m[1]);
  const frac = Number((m[2] ?? "00").padEnd(2, "0"));
  const cents = whole * 100 + frac;
  return neg ? -cents : cents;
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function itemsFromCsv(text: string): Item[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iCat = idx("Category");
  const iMemo = idx("Memo");
  const iAmt = idx("Amount");
  const iDisp = idx("Amount display");
  const iCur = idx("Currency code");
  const iRep = idx("Repeats");
  const iStart = idx("Start date");
  const iEnd = idx("End date");
  const iSpread = idx("Spread");
  if (iCat < 0 || iMemo < 0 || iAmt < 0 || iStart < 0) {
    throw new Error("CSV is missing required columns.");
  }
  const items: Item[] = [];
  for (const row of rows.slice(1)) {
    if (row.every((c) => !c.trim())) continue;
    const repeats = parseRepeat(row[iRep] ?? "");
    let spread = repeats !== "";
    if (iSpread >= 0) {
      const s = (row[iSpread] ?? "").trim().toLowerCase();
      if (s === "yes" || s === "true" || s === "1") spread = true;
      else if (s === "no" || s === "false" || s === "0") spread = false;
    }
    const startRaw = (row[iStart] ?? "").trim();
    if (!startRaw) continue;
    items.push({
      id: newId(),
      category: (row[iCat] ?? "").trim() || "Personal",
      memo: row[iMemo] ?? "",
      amountCents: dollarsToCents(row[iAmt] ?? "0", row[iDisp] ?? ""),
      currency: (row[iCur] ?? "USD").trim() || "USD",
      repeats,
      spread,
      start: fromMDY(startRaw),
      end: parseEnd(row[iEnd] ?? ""),
    });
  }
  return items;
}

function centsToAmountField(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  if (frac === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${String(frac).padStart(2, "0")}`;
}

export function itemsToCsv(items: Item[]): string {
  const rows: string[][] = [[...CSV_HEADERS]];
  for (const item of items) {
    rows.push([
      item.category,
      item.memo,
      centsToAmountField(item.amountCents),
      formatAmountDisplay(item.amountCents),
      item.currency || "USD",
      item.repeats,
      toMDY(item.start),
      item.end ? toMDY(item.end) : "open end",
    ]);
  }
  return toCsv(rows) + "\r\n";
}
