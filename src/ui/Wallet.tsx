import { useState } from "react";
import { categoryBite, formatMoney, leftoverAfterSpend, parseMoneyInput, type DaySnapshot } from "../money";
import { CalendarIcon, PlusIcon, SlidersIcon } from "./chrome";
import { CategoryIcon } from "./CategoryIcon";
import { Forecast } from "./Forecast";

export function Wallet({
  today,
  snapshot,
  forecast,
  detailedToday,
  photoUrl,
  onDetailed,
  onSettings,
  onLedger,
  onAdd,
}: {
  today: string;
  snapshot: DaySnapshot;
  forecast: DaySnapshot[];
  detailedToday: boolean;
  photoUrl?: string;
  onDetailed: (v: boolean) => void;
  onSettings: () => void;
  onLedger: () => void;
  onAdd: () => void;
}) {
  const bite = categoryBite(snapshot);
  const [spend, setSpend] = useState("");
  const [extras, setExtras] = useState(false);
  const spendCents = parseMoneyInput(spend, false) ?? 0;
  const left = leftoverAfterSpend(snapshot.todayBudget, spendCents);
  const negative = snapshot.todayBudget < 0;

  return (
    <section className={`wallet ${negative ? "wallet-neg" : ""}`}>
      <header className="wallet-top">
        <button className="ghost" onClick={onSettings} aria-label="Settings">
          <SlidersIcon />
        </button>
        <label className="detail-toggle" title="Show rollover on Today">
          {photoUrl ? (
            <img className="avatar" src={photoUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="avatar" aria-hidden />
          )}
          <input
            type="checkbox"
            checked={detailedToday}
            onChange={(e) => onDetailed(e.target.checked)}
          />
          <span className="knob" />
        </label>
      </header>

      <div className="hero">
        <p className="hero-label">Today's Budget</p>
        <h1 className="hero-num">{formatMoney(snapshot.todayBudget)}</h1>
      </div>

      <Forecast
        days={forecast}
        today={today}
        detailed={detailedToday}
        onToggleToday={() => onDetailed(!detailedToday)}
      />

      {extras && (
        <div className="wallet-cards">
          <article className="glass-card">
            <header>
              <h2>Today's bite</h2>
              <strong className="neg">{formatMoney(snapshot.fixedCosts)}</strong>
            </header>
            <ul className="bite-list">
              {bite.slice(0, 6).map((b) => (
                <li key={b.category}>
                  <CategoryIcon name={b.category} size={22} />
                  <span className="bite-name">{b.category}</span>
                  <span className="bite-bar">
                    <i style={{ width: `${Math.min(100, b.share * 100)}%` }} />
                  </span>
                  <span className="muted">{formatMoney(b.cents)}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="glass-card">
            <h2>If I spend this today</h2>
            <div className="spend-row">
              <span className="spend-prefix">$</span>
              <input
                value={spend}
                onChange={(e) => setSpend(e.target.value)}
                inputMode={
                  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
                    ? "decimal"
                    : undefined
                }
                placeholder="0.00"
                aria-label="Hypothetical spend"
              />
            </div>
            <p className="spend-left">
              Leftover <strong className={left < 0 ? "neg" : "pos"}>{formatMoney(left)}</strong>
            </p>
          </article>
        </div>
      )}

      <button className="extras-peek" onClick={() => setExtras((v) => !v)}>
        {extras ? "Hide extras" : `Today's bite ${formatMoney(snapshot.fixedCosts)}`}
      </button>

      <nav className="wallet-dock">
        <button className="dock-btn" onClick={onLedger} aria-label="Daily ledger">
          <CalendarIcon />
        </button>
        <span className="dock-title">My Wallet</span>
        <button className="dock-btn" onClick={onAdd} aria-label="Add">
          <PlusIcon />
        </button>
      </nav>
    </section>
  );
}
