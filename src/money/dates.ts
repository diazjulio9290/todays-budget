export function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function fromMDY(s: string): string {
  const parts = s.trim().split(/[/-]/).map(Number);
  const [m, d, y] = parts;
  return toISO(y, m, d);
}

export function toMDY(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return `${m}/${d}/${y}`;
}

export function addDays(iso: string, n: number): string {
  const { y, m, d } = parseISO(iso);
  const dt = new Date(y, m - 1, d + n);
  return toISO(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

export function diffDays(a: string, b: string): number {
  const pa = parseISO(a);
  const pb = parseISO(b);
  const da = Date.UTC(pa.y, pa.m - 1, pa.d);
  const db = Date.UTC(pb.y, pb.m - 1, pb.d);
  return Math.round((db - da) / 86400000);
}

export function daysInMonth(iso: string): number {
  const { y, m } = parseISO(iso);
  return new Date(y, m, 0).getDate();
}

export function lastDayOfMonth(iso: string): string {
  const { y, m } = parseISO(iso);
  return toISO(y, m, daysInMonth(iso));
}

export function weekday(iso: string): number {
  const { y, m, d } = parseISO(iso);
  return new Date(y, m - 1, d).getDay();
}

export function todayISO(now = new Date()): string {
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function startOfWeek(iso: string, weekStartsOn = 0): string {
  const wd = weekday(iso);
  const delta = (wd - weekStartsOn + 7) % 7;
  return addDays(iso, -delta);
}

export function monthLabel(iso: string): string {
  const { y, m } = parseISO(iso);
  const name = new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long" });
  return `${name} ${y}`;
}

export function monthShort(iso: string): string {
  const { m } = parseISO(iso);
  return new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "short" });
}

export function longDate(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function shortWeekday(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

export function dayNum(iso: string): number {
  return parseISO(iso).d;
}

export function isSameMonth(a: string, b: string): boolean {
  const pa = parseISO(a);
  const pb = parseISO(b);
  return pa.y === pb.y && pa.m === pb.m;
}
