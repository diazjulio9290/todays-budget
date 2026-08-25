import { useCallback, useEffect, useMemo, useState } from "react";
import {
  disableGoogleAutoSelect,
  loadAuth,
  saveAuth,
  type GoogleProfile,
} from "./auth/google";
import {
  addDays,
  itemsFromCsv,
  snapshotOn,
  snapshotsInRange,
  todayISO,
  type Item,
} from "./money";
import {
  adoptGuestIfEmpty,
  clearPersisted,
  loadPersisted,
  loadSeed,
  savePersisted,
} from "./store/storage";
import { Editor, type Sheet } from "./ui/Editor";
import { Ledger } from "./ui/Ledger";
import { Settings } from "./ui/Settings";
import { Wallet } from "./ui/Wallet";

type View = "wallet" | "ledger" | "settings";

function viewFromHash(): View {
  const h = location.hash.replace(/^#\/?/, "");
  if (h === "ledger" || h === "settings") return h;
  return "wallet";
}

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(viewFromHash);
  const [selected, setSelected] = useState(todayISO);
  const [detailedToday, setDetailedToday] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [user, setUser] = useState<GoogleProfile | null>(null);
  const today = todayISO();
  const userId = user?.sub ?? null;

  useEffect(() => {
    const applyHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    const next = `#${view}`;
    if (location.hash !== next) history.replaceState(null, "", next);
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const signedIn = loadAuth();
        const persisted = signedIn
          ? adoptGuestIfEmpty(signedIn.sub) ?? loadPersisted(signedIn.sub)
          : loadPersisted(null);
        if (!cancelled && signedIn) setUser(signedIn);
        if (persisted && persisted.items.length) {
          if (!cancelled) {
            setItems(persisted.items);
            setDetailedToday(persisted.detailedToday);
            setReady(true);
          }
          return;
        }
        const seed = await loadSeed();
        if (!cancelled) {
          setItems(seed);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Item[], detailed = detailedToday) => {
    setItems(next);
    savePersisted({ items: next, detailedToday: detailed }, userId);
  }, [detailedToday, userId]);

  const forecast = useMemo(
    () => (items.length ? snapshotsInRange(items, today, addDays(today, 13)) : []),
    [items, today],
  );
  const walletSnap = forecast[0];
  const ledgerSnap = useMemo(
    () => (items.length ? snapshotOn(items, selected) : null),
    [items, selected],
  );

  function saveItem(item: Item) {
    const idx = items.findIndex((i) => i.id === item.id);
    const next = idx >= 0 ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];
    persist(next);
  }

  function deleteItem(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  async function reset() {
    clearPersisted(userId);
    const seed = await loadSeed();
    setDetailedToday(false);
    persist(seed, false);
    setView("wallet");
    setSelected(todayISO());
  }

  function applyPersisted(next: GoogleProfile | null) {
    const id = next?.sub ?? null;
    const stored = id ? adoptGuestIfEmpty(id) : loadPersisted(null);
    setUser(next);
    saveAuth(next);
    if (stored?.items.length) {
      setItems(stored.items);
      setDetailedToday(stored.detailedToday);
      return;
    }
    void loadSeed().then((seed) => {
      setItems(seed);
      setDetailedToday(false);
      savePersisted({ items: seed, detailedToday: false }, id);
    });
  }

  function signedIn(profile: GoogleProfile) {
    savePersisted({ items, detailedToday }, userId);
    applyPersisted(profile);
  }

  function signOut() {
    savePersisted({ items, detailedToday }, userId);
    disableGoogleAutoSelect();
    applyPersisted(null);
  }

  async function importFile(file: File) {
    const text = await file.text();
    persist(itemsFromCsv(text));
    setView("wallet");
  }

  if (error) {
    return (
      <div className="boot">
        <p>{error}</p>
      </div>
    );
  }
  if (!ready || !walletSnap) {
    return (
      <div className="boot">
        <p>Today's Budget</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="phone">
        {view !== "settings" && (
          <Wallet
            today={today}
            snapshot={walletSnap}
            forecast={forecast}
            detailedToday={detailedToday}
            photoUrl={user?.picture}
            onDetailed={(v) => {
              setDetailedToday(v);
              savePersisted({ items, detailedToday: v }, userId);
            }}
            onSettings={() => setView("settings")}
            onLedger={() => {
              setSelected(today);
              setView("ledger");
            }}
            onAdd={() => setSheet({ kind: "pick" })}
          />
        )}
        {view === "ledger" && ledgerSnap && (
          <Ledger
            today={today}
            selected={selected}
            snapshot={ledgerSnap}
            items={items}
            onSelect={setSelected}
            onBack={() => setView("wallet")}
            onAdd={() => setSheet({ kind: "pick" })}
            onEdit={(item) =>
              setSheet({
                kind: "form",
                editing: item,
                category: item.category,
                isIncome: item.amountCents > 0,
              })
            }
          />
        )}
        {view === "settings" && (
          <Settings
            items={items}
            user={user}
            onBack={() => setView("wallet")}
            onReset={() => void reset()}
            onImport={(f) => void importFile(f)}
            onSignedIn={signedIn}
            onSignOut={signOut}
          />
        )}
        {sheet && (
          <Editor
            sheet={sheet}
            items={items}
            selectedDate={view === "ledger" ? selected : today}
            onSheet={setSheet}
            onSave={saveItem}
            onDelete={deleteItem}
            onClose={() => setSheet(null)}
          />
        )}
      </div>
    </div>
  );
}
