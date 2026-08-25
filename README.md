# Today's Budget

A mobile-first, offline daily-budget app. It answers one question: **how much can I spend today after my bills?**

Open it with:

```bash
npm install
npm run dev
```

Tests and production build:

```bash
npm test
npm run build
```

Seed data loads from `public/seed.csv` on first run. Edits live in `localStorage` on this device.

## Sign in with Google

Google is used only to identify you. Budget rows stay on the device, namespaced by your Google account.

1. Open [Google Cloud OAuth clients](https://console.cloud.google.com/auth/clients).
2. Create a **Web application** client (or reuse one).
3. Under **Authorized JavaScript origins** add:
   - `http://localhost`
   - `http://localhost:5173`
   - your production origin, if you have one
4. Copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID`.
5. Restart `npm run dev`.

Settings → **Account** has the Sign in with Google button. Sign-out keeps guest data separate from the signed-in copy.

## The three numbers

These are always on the ledger footer, and on the wallet when the Today pill is expanded (toggle, top right).

| Number | Meaning |
| --- | --- |
| **Daily budget / net for this day** | What's left today after every *active* bill and paycheck is spread across the days it covers. On Mon Aug 24, 2026 with the seed CSV this is **$58.42**. |
| **Rollover** | Unused daily budget carried forward from earlier days. Spend under your daily budget and tomorrow gets the leftover. Seed: **$1,380.03**. |
| **Today's Budget** | Rollover + today's net — the free money you can actually use. Hero number on My Wallet. Seed: **$1,438.45**. |

If nothing else changes, the forecast climbs by about a daily budget a day: Tue **$1,496.87**, Wed **$1,555.28**.

## How a day is calculated

Money is stored as **integer cents**. Totals never use floating-point.

An item is **active** on date `D` when `D ≥ start` and (`end` is `open end` or `D ≤ end`). Dates in the CSV are `M/D/YYYY`.

Seed rows that have a **Repeats** value are treated as **spread = yes** (that matches the iOS screenshots):

- **Monthly** — `daily = amount / days in that month`. August 2026 has 31 days, so Personal Loan `1025 / 31 → $33.06`, Car payment `850 / 31 → $27.42`, Office suite `13.13 / 31 → $0.42`.
- **Weekly** — `daily = amount / 7`. Saturday meal `110 / 7 → $15.71` and Thursday meal `55 / 7 → $7.86` show **every day**, not only Sat/Thu.
- **Every 2 weeks** — `daily = amount / 14`. Paycheck `3000 / 14 → $214.29`.

If you turn **Spread** off, the full amount hits only on cadence dates (that day-of-month, that weekday, or every 14 days from start).

One-time rows (empty Repeats, start = end) hit that date only.

Then:

```
Fixed costs(D) = sum of expense daily amounts
Incomes(D)     = sum of income daily amounts
Net(D)         = Incomes + Fixed costs          (expenses are negative)
Rollover(D)    = sum of Net for every day strictly before D
Today's Budget(D) = Rollover + Net
```

## Rounding (the 1-cent rule)

Each **line** is rounded half-away-from-zero on its own (`85000¢ / 31 → 2742¢`).

**Section totals, net, rollover, and Today's Budget** are rounded from the *unrounded* sums, not from the already-rounded lines.

On Aug 24, 2026 the grey expense lines add to **−$155.86**, but **Fixed costs** shows **−$155.87** — same as the iOS screenshot. We do not fudge the UI to make those add up.

Rollover and the forecast are a single rounding of the **cumulative** unrounded net, which is why Wednesday is **$1,555.28** rather than $1,555.29.

Ties (exactly `.5`) round away from zero, matching Decimal `ROUND_HALF_UP`.

## When rollover starts

Car payment in the seed CSV starts **6/29/2026**. Those car-only days still appear if you open that date in the ledger.

Rollover for “today’s free money” starts at the **first income start** (Paycheck **7/29/2026**). That is the only rule that reproduces the screenshot’s **$1,380.03**. Starting from the car payment’s 6/29 date would drag the wallet by ~$800 of car payment with no paycheck yet.

If a wallet has no income, rollover starts at the earliest item start.

## CSV

Columns: `Category, Memo, Amount, Amount display, Currency code, Repeats, Start date, End date`.

- `Amount` is signed (expenses negative, income positive).
- Currency is USD.
- `End date` is `open end` or a date.
- Settings can reset to the seed, import, or export this same format.

Spread is inferred on import: any row with a Repeats value is spread = yes. In the app you can turn spread off; that flag lives in localStorage.

## Screens

- **My Wallet** — teal-to-blue gradient, hero Today's Budget, 14-day forecast. Top-right toggle stacks Rollover + Daily Budget on Today. Calendar opens the ledger; **+** adds an item.
- **Daily ledger** — week strip, collapsible Fixed costs / Incomes, sticky footer with the three numbers.
- **Add / edit** — category sheet (including custom categories such as Groceries), amount, memo chips, Yesterday / Today / calendar, repeating, spread. Tap a row to edit or delete.
- **Settings** — Google account, reset, import, export.

Also on the wallet: a category breakdown of today’s bite, and an “If I spend $X today” leftover.
