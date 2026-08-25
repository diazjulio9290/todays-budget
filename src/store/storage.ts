import { itemsFromCsv, type Item } from "../money";

const BASE_KEY = "todays-budget:v1";

export interface Persisted {
  items: Item[];
  detailedToday: boolean;
}

export function storageKey(userId?: string | null): string {
  return userId ? `${BASE_KEY}:${userId}` : BASE_KEY;
}

export function loadPersisted(userId?: string | null): Persisted | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (!Array.isArray(parsed.items)) return null;
    return {
      items: parsed.items,
      detailedToday: Boolean(parsed.detailedToday),
    };
  } catch {
    return null;
  }
}

export function savePersisted(state: Persisted, userId?: string | null): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export function clearPersisted(userId?: string | null): void {
  localStorage.removeItem(storageKey(userId));
}

/** First Google sign-in inherits guest data so nothing on this device is lost. */
export function adoptGuestIfEmpty(userId: string): Persisted | null {
  const existing = loadPersisted(userId);
  if (existing?.items.length) return existing;
  const guest = loadPersisted(null);
  if (guest?.items.length) {
    savePersisted(guest, userId);
    return guest;
  }
  return null;
}

export async function loadSeed(): Promise<Item[]> {
  const res = await fetch("/seed.csv");
  if (!res.ok) throw new Error("Could not load seed.csv");
  const text = await res.text();
  return itemsFromCsv(text);
}
