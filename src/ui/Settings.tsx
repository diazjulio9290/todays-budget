import { useRef } from "react";
import type { GoogleProfile } from "../auth/google";
import { itemsToCsv, type Item } from "../money";
import { BackIcon } from "./chrome";
import { GoogleButton } from "./GoogleButton";

export function Settings({
  items,
  user,
  onBack,
  onReset,
  onImport,
  onSignedIn,
  onSignOut,
}: {
  items: Item[];
  user: GoogleProfile | null;
  onBack: () => void;
  onReset: () => void;
  onImport: (file: File) => void;
  onSignedIn: (profile: GoogleProfile) => void;
  onSignOut: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function exportCsv() {
    const blob = new Blob([itemsToCsv(items)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="settings">
      <header className="ledger-top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <h1>Settings</h1>
        <span className="icon-btn" />
      </header>

      <div className="settings-body">
        <article className="panel">
          <h2>Account</h2>
          {user ? (
            <div className="account-card">
              {user.picture ? (
                <img className="account-photo" src={user.picture} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="account-photo fallback" aria-hidden />
              )}
              <div className="account-meta">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button className="row-btn compact" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <p>Sign in with Google to keep this device’s budget under your account.</p>
              <GoogleButton onSignedIn={onSignedIn} />
            </>
          )}
        </article>

        <article className="panel">
          <h2>The three numbers</h2>
          <p>
            <strong>Daily budget</strong> is what’s safe to spend today after every
            active bill and paycheck is spread across the days they cover.
          </p>
          <p>
            <strong>Rollover</strong> is unused daily budget carried forward from
            earlier days — spend less today, have more tomorrow.
          </p>
          <p>
            <strong>Today's Budget</strong> is rollover plus today’s daily budget:
            the free money you can actually use.
          </p>
        </article>

        <article className="panel">
          <h2>Data</h2>
          <p className="hint">CSV columns match the iOS export: Category, Memo, Amount, Amount display, Currency code, Repeats, Start date, End date.</p>
          <button className="row-btn" onClick={exportCsv}>
            Export CSV
          </button>
          <button className="row-btn" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          <button
            className="row-btn danger-text"
            onClick={() => {
              if (confirm("Reset to the original seed CSV? Your edits will be replaced.")) {
                onReset();
              }
            }}
          >
            Reset to seed CSV
          </button>
        </article>

        <p className="footnote">
          Google is only used to identify you. Budget data stays on this device — no bank link.
        </p>
      </div>
    </section>
  );
}
