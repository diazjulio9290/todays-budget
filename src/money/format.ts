/** Format signed cents as $1,234.56 or -$1,234.56. Never uses floats. */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${formatAbs(cents)}`;
}

export function formatAbs(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${commas(dollars)}.${frac}`;
}

export function formatAmountDisplay(cents: number): string {
  const abs = `$${formatAbs(cents)}`;
  return cents < 0 ? `-${abs}` : abs;
}

export function formatDollarsInput(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const frac = abs % 100;
  if (frac === 0) return String(dollars);
  return `${dollars}.${String(frac).padStart(2, "0")}`;
}

function commas(n: number): string {
  const s = String(n);
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Parse a user-typed dollar string into signed integer cents. */
export function parseMoneyInput(raw: string, negative: boolean): number | null {
  const t = raw.trim().replace(/[$,\s]/g, "");
  if (!t || t === "-" || t === ".") return 0;
  if (!/^-?\d*(\.\d*)?$/.test(t)) return null;
  const sign = t.startsWith("-") || negative ? -1 : 1;
  const unsigned = t.replace("-", "");
  const [w = "0", f = ""] = unsigned.split(".");
  const whole = Number(w || "0");
  const frac = Number((f + "00").slice(0, 2));
  if (!Number.isFinite(whole) || !Number.isFinite(frac)) return null;
  return sign * (whole * 100 + frac);
}
