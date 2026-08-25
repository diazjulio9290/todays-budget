export interface CategoryMeta {
  name: string;
  color: string;
  ink?: string;
}

export const BUILTIN_CATEGORIES: CategoryMeta[] = [
  { name: "Fun", color: "#ff9f0a" },
  { name: "Tech", color: "#0a84ff" },
  { name: "Eating Out", color: "#ff6b2c" },
  { name: "Bills", color: "#007aff" },
  { name: "Loan", color: "#30d158" },
  { name: "Mobility", color: "#64d2ff", ink: "#00344d" },
  { name: "Health", color: "#ff453a" },
  { name: "Personal", color: "#ff9f0a" },
  { name: "Home", color: "#34c759" },
];

export const EXTRA_KNOWN: CategoryMeta[] = [
  { name: "Groceries", color: "#32ade6" },
  { name: "Income", color: "#30d158" },
];

const PALETTE = [
  "#af52de",
  "#5e5ce6",
  "#64d2ff",
  "#ff375f",
  "#ac8e68",
  "#8e8e93",
];

function hashName(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function categoryMeta(name: string): CategoryMeta {
  const all = [...BUILTIN_CATEGORIES, ...EXTRA_KNOWN];
  const found = all.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  if (found) return found;
  const color = PALETTE[hashName(name) % PALETTE.length];
  return { name, color };
}

export function allCategories(existing: string[]): CategoryMeta[] {
  const seen = new Set<string>();
  const out: CategoryMeta[] = [];
  for (const c of [...BUILTIN_CATEGORIES, ...EXTRA_KNOWN]) {
    if (seen.has(c.name.toLowerCase())) continue;
    seen.add(c.name.toLowerCase());
    out.push(c);
  }
  for (const name of existing) {
    const key = name.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(categoryMeta(key));
  }
  return out;
}
