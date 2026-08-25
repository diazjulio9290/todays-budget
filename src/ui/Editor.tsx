import { useMemo, useState } from "react";
import { allCategories, BUILTIN_CATEGORIES } from "../categories";
import { addDays, parseMoneyInput, todayISO, type Item, type Repeat } from "../money";
import { CategoryIcon } from "./CategoryIcon";
import { BackIcon, CheckIcon, Chevron } from "./chrome";

export type Sheet =
  | { kind: "pick"; editing?: Item; isIncome?: boolean }
  | { kind: "form"; editing?: Item; category: string; isIncome: boolean };

function isCoarse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

const REPEATS: { id: Repeat; label: string }[] = [
  { id: "", label: "No" },
  { id: "Weekly", label: "Weekly" },
  { id: "Every 2 weeks", label: "Every 2 weeks" },
  { id: "Monthly", label: "Monthly" },
];

export function Editor({
  sheet,
  items,
  selectedDate,
  onSheet,
  onSave,
  onDelete,
  onClose,
}: {
  sheet: Sheet;
  items: Item[];
  selectedDate: string;
  onSheet: (s: Sheet) => void;
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const frosted = sheet.kind === "pick";
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${frosted ? "sheet-frost" : "sheet-form"}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {sheet.kind === "pick" ? (
          <CategoryPick
            items={items}
            isIncome={sheet.isIncome ?? (sheet.editing ? sheet.editing.amountCents > 0 : false)}
            onPick={(category, isIncome) =>
              onSheet({ kind: "form", editing: sheet.editing, category, isIncome })
            }
          />
        ) : (
          <ItemForm
            items={items}
            category={sheet.category}
            isIncome={sheet.isIncome}
            editing={sheet.editing}
            selectedDate={selectedDate}
            onBack={() =>
              onSheet({ kind: "pick", editing: sheet.editing, isIncome: sheet.isIncome })
            }
            onSave={onSave}
            onDelete={onDelete}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function CategoryPick({
  items,
  isIncome,
  onPick,
}: {
  items: Item[];
  isIncome: boolean;
  onPick: (category: string, isIncome: boolean) => void;
}) {
  const [income, setIncome] = useState(isIncome);
  const [editingCats, setEditingCats] = useState(false);
  const [name, setName] = useState("");
  const extras = allCategories(items.map((i) => i.category)).filter(
    (c) => !BUILTIN_CATEGORIES.some((b) => b.name === c.name) && c.name !== "Income",
  );
  const cats = income
    ? [{ name: "Income", color: "#34c759" }, ...BUILTIN_CATEGORIES, ...extras]
    : [...BUILTIN_CATEGORIES, ...extras];

  return (
    <>
      <header className="sheet-head pick-head">
        <span />
        <h2>Choose a category</h2>
        <button className="edit-pill" onClick={() => setEditingCats((v) => !v)}>
          {editingCats ? "Done" : "Edit"}
        </button>
      </header>
      <div className="seg type-seg">
        <button className={!income ? "on" : ""} onClick={() => setIncome(false)}>
          Expense
        </button>
        <button className={income ? "on" : ""} onClick={() => setIncome(true)}>
          Income
        </button>
      </div>
      <div className="cat-grid">
        {cats.map((c) => (
          <button key={c.name} className="cat-tile" onClick={() => onPick(c.name, income)}>
            <CategoryIcon name={c.name} size={36} variant="ghost" />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      {editingCats && (
        <form
          className="custom-row"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            onPick(n, income);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
          />
          <button type="submit" disabled={!name.trim()}>
            Add
          </button>
        </form>
      )}
    </>
  );
}

function ItemForm({
  items,
  category,
  isIncome,
  editing,
  selectedDate,
  onBack,
  onSave,
  onDelete,
  onClose,
}: {
  items: Item[];
  category: string;
  isIncome: boolean;
  editing?: Item;
  selectedDate: string;
  onBack: () => void;
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const today = todayISO();
  const yesterday = addDays(today, -1);
  const [amount, setAmount] = useState(() => {
    if (!editing) return "";
    const abs = Math.abs(editing.amountCents);
    const w = Math.floor(abs / 100);
    const f = abs % 100;
    return f ? `${w}.${String(f).padStart(2, "0")}` : String(w);
  });
  const [memo, setMemo] = useState(editing?.memo ?? "");
  const [date, setDate] = useState(editing?.start ?? selectedDate);
  const [repeats, setRepeats] = useState<Repeat>(editing?.repeats ?? "");
  const [spread, setSpread] = useState(editing?.spread ?? false);
  const [cal, setCal] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [spreadOpen, setSpreadOpen] = useState(false);

  const chips = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of [...items].reverse()) {
      if (item.category !== category) continue;
      const m = item.memo.trim();
      if (!m || seen.has(m.toLowerCase())) continue;
      seen.add(m.toLowerCase());
      out.push(m);
      if (out.length >= 8) break;
    }
    return out;
  }, [items, category]);

  const cents = parseMoneyInput(amount, !isIncome);
  const canSave = cents !== null && cents !== 0;
  const repeatLabel = REPEATS.find((r) => r.id === repeats)?.label ?? "No";

  function save() {
    if (cents === null || cents === 0) return;
    const oneTime = repeats === "";
    onSave({
      id: editing?.id ?? crypto.randomUUID(),
      category: isIncome && category === "Income" ? "Income" : category,
      memo,
      amountCents: cents,
      currency: "USD",
      repeats,
      spread: oneTime ? false : spread,
      start: date,
      end: oneTime ? date : (editing?.end ?? null),
    });
    onClose();
  }

  return (
    <>
      <header className="sheet-head form-head">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <div className="form-cat">
          <CategoryIcon name={category} size={28} variant="ghost" />
          <h2>{category}</h2>
        </div>
        <button className="round-btn check" disabled={!canSave} onClick={save} aria-label="Save">
          <CheckIcon />
        </button>
      </header>

      <label className="amount-box">
        <span>$</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode={isCoarse() ? "decimal" : undefined}
          placeholder="0.00"
          autoFocus
        />
      </label>

      <input
        className="memo-box"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="Add a memo"
      />

      <div className="date-pills">
        <button className={date === yesterday ? "on" : ""} onClick={() => setDate(yesterday)}>
          Yesterday
        </button>
        <button className={date === today ? "on" : ""} onClick={() => setDate(today)}>
          Today
        </button>
        <button
          className={`cal ${date !== today && date !== yesterday ? "on" : ""}`}
          onClick={() => setCal((v) => !v)}
          aria-label="Calendar"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="5.5" width="16" height="14" rx="2.2" />
            <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
          </svg>
        </button>
      </div>
      {cal && (
        <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      )}

      <button className="disclose" onClick={() => setRepeatOpen((v) => !v)}>
        <span>Repeating</span>
        <em>
          {repeatLabel} <Chevron />
        </em>
      </button>
      {repeatOpen && (
        <div className="disclose-menu">
          {REPEATS.map((r) => (
            <button
              key={r.id || "no"}
              className={repeats === r.id ? "on" : ""}
              onClick={() => {
                setRepeats(r.id);
                setRepeatOpen(false);
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <button className="disclose" onClick={() => setSpreadOpen((v) => !v)}>
        <span>Spread out over several days</span>
        <em>
          {spread ? "Yes" : "No"} <Chevron />
        </em>
      </button>
      {spreadOpen && (
        <div className="disclose-menu">
          {["Yes", "No"].map((label) => (
            <button
              key={label}
              className={(spread ? "Yes" : "No") === label ? "on" : ""}
              onClick={() => {
                setSpread(label === "Yes");
                setSpreadOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <button
          className="danger"
          onClick={() => {
            if (confirm("Delete this item?")) {
              onDelete(editing.id);
              onClose();
            }
          }}
        >
          Delete
        </button>
      )}

      {chips.length > 0 && (
        <div className="chip-bar">
          {chips.map((c) => (
            <button key={c} className={memo.trim() === c ? "on" : ""} onClick={() => setMemo(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
