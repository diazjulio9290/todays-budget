import { useMemo, useState, type ReactNode } from "react";
import {
  addDays,
  dayNum,
  formatMoney,
  isSameMonth,
  monthShort,
  parseISO,
  startOfWeek,
  toISO,
  weekday,
  type DaySnapshot,
  type Item,
} from "../money";
import { CategoryIcon } from "./CategoryIcon";
import {
  BillIcon,
  CalendarIcon,
  Chevron,
  ChevronDown,
  CycleIcon,
  DotsGridIcon,
  PlusIcon,
  RepeatBadge,
} from "./chrome";

export function Ledger({
  today,
  selected,
  snapshot,
  items,
  onSelect,
  onBack,
  onAdd,
  onEdit,
}: {
  today: string;
  selected: string;
  snapshot: DaySnapshot;
  items: Item[];
  onSelect: (iso: string) => void;
  onBack: () => void;
  onAdd: () => void;
  onEdit: (item: Item) => void;
}) {
  const [listMode, setListMode] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [fixedOpen, setFixedOpen] = useState(true);
  const [incOpen, setIncOpen] = useState(true);
  const weekStart = startOfWeek(selected, 0);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const isToday = selected === today;

  return (
    <section className="ledger-sheet">
      <button className="sheet-handle" onClick={onBack} aria-label="Close ledger" />
      <header className="ledger-bar">
        <div className="cluster">
          <button
            className={`chip ${isToday && !monthOpen ? "on" : ""}`}
            onClick={() => onSelect(today)}
          >
            Today
          </button>
          <button
            className={`chip icon ${monthOpen ? "on" : ""}`}
            onClick={() => setMonthOpen((v) => !v)}
            aria-label="Calendar"
          >
            <CalendarIcon />
          </button>
        </div>
        <button className="month-center" onClick={() => setMonthOpen((v) => !v)}>
          {monthShort(selected)}
        </button>
        <div className="cluster">
          <button
            className={`chip icon ${listMode ? "on" : ""}`}
            onClick={() => setListMode((v) => !v)}
            aria-label="All items"
          >
            <DotsGridIcon />
          </button>
          <button className="chip icon" onClick={onAdd} aria-label="Add">
            <PlusIcon />
          </button>
        </div>
      </header>

      {monthOpen && (
        <MonthGrid
          selected={selected}
          onSelect={(d) => {
            onSelect(d);
            setMonthOpen(false);
            setListMode(false);
          }}
        />
      )}

      {listMode ? (
        <AllItems items={items} onEdit={onEdit} />
      ) : (
        <>
          <div className="week-strip">
            {week.map((d) => {
              const on = d === selected;
              const names = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
              return (
                <button
                  key={d}
                  className={`week-day ${on ? "on" : ""} ${d === today ? "is-today" : ""}`}
                  onClick={() => onSelect(d)}
                >
                  <small>{names[weekday(d)]}</small>
                  <span>{dayNum(d)}</span>
                </button>
              );
            })}
          </div>

          <div className="ledger-scroll">
            <Section
              title="Fixed costs"
              icon={<CycleIcon />}
              total={snapshot.fixedCosts}
              tone="neg"
              open={fixedOpen}
              onToggle={() => setFixedOpen((v) => !v)}
            >
              <div className="card">
                {snapshot.expenses.map((line) => (
                  <ItemRow key={line.item.id} item={line.item} cents={line.cents} onEdit={onEdit} />
                ))}
                {snapshot.expenses.length === 0 && <p className="empty">No expenses this day.</p>}
              </div>
            </Section>

            <Section
              title="Incomes"
              icon={<BillIcon />}
              total={snapshot.incomesTotal}
              tone="pos"
              open={incOpen}
              onToggle={() => setIncOpen((v) => !v)}
            >
              {snapshot.incomes.map((line) => (
                <div className="card income-card" key={line.item.id}>
                  <ItemRow item={line.item} cents={line.cents} onEdit={onEdit} />
                </div>
              ))}
              {snapshot.incomes.length === 0 && <p className="empty">No income this day.</p>}
            </Section>
          </div>

          <footer className="ledger-foot">
            <div className="foot-left">
              <div>
                <span>Rollover</span>
                <b className="pos">{formatMoney(snapshot.rollover)}</b>
              </div>
              <div>
                <span>Net for this day</span>
                <b className={snapshot.net < 0 ? "neg" : "pos"}>{formatMoney(snapshot.net)}</b>
              </div>
            </div>
            <div className="foot-right">
              <strong className="pos">{formatMoney(snapshot.todayBudget)}</strong>
              <em>
                {new Date(parseISO(selected).y, parseISO(selected).m - 1, parseISO(selected).d).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" },
                )}
              </em>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}

function Section({
  title,
  icon,
  total,
  tone,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: ReactNode;
  total: number;
  tone: "neg" | "pos";
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="block">
      <button className="block-head" onClick={onToggle}>
        <span className="sec-icon">{icon}</span>
        <h3>{title}</h3>
        <strong className={tone}>{formatMoney(total)}</strong>
        <span className={`caret ${open ? "open" : ""}`}>
          <ChevronDown />
        </span>
      </button>
      {open && children}
    </section>
  );
}

function ItemRow({
  item,
  cents,
  onEdit,
}: {
  item: Item;
  cents: number;
  onEdit: (item: Item) => void;
}) {
  return (
    <button className="item-row" onClick={() => onEdit(item)}>
      <CategoryIcon name={item.category} size={32} />
      <span className="item-memo">
        {item.memo.trim() || item.category}
        {item.repeats && item.amountCents > 0 ? (
          <span className="repeat-wrap">
            <RepeatBadge />
          </span>
        ) : null}
      </span>
      <span className="item-amt grey">{formatMoney(cents)}</span>
      <Chevron />
    </button>
  );
}

function AllItems({ items, onEdit }: { items: Item[]; onEdit: (item: Item) => void }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.start.localeCompare(a.start) || a.memo.localeCompare(b.memo)),
    [items],
  );
  return (
    <div className="ledger-scroll list-pad">
      <div className="card">
        {sorted.map((item) => (
          <ItemRow key={item.id} item={item} cents={item.amountCents} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ selected, onSelect }: { selected: string; onSelect: (iso: string) => void }) {
  const { y, m } = parseISO(selected);
  const first = toISO(y, m, 1);
  const start = startOfWeek(first, 0);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div className="month-grid">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <span key={i} className="dow">
          {d}
        </span>
      ))}
      {days.map((d) => (
        <button
          key={d}
          className={`md ${d === selected ? "on" : ""} ${isSameMonth(d, selected) ? "" : "dim"}`}
          onClick={() => onSelect(d)}
        >
          {dayNum(d)}
        </button>
      ))}
    </div>
  );
}
