import { formatMoney, shortWeekday, type DaySnapshot } from "../money";

const VBW = 1000;
const VBH = 1000;

export function Forecast({
  days,
  today,
  detailed,
  onToggleToday,
}: {
  days: DaySnapshot[];
  today: string;
  detailed: boolean;
  onToggleToday: () => void;
}) {
  const col = 0.32;
  const padX = 0.16;
  const n = Math.max(days.length, 1);
  const inner = padX + (n - 1) * col + 0.16;
  const xAt = (i: number) => (padX + i * col) / inner;
  const first = days[0]?.todayBudget ?? 0;
  const third = days[Math.min(2, days.length - 1)]?.todayBudget ?? first + 1;
  const ppc = 0.42 / Math.max(1, third - first);
  const yAt = (v: number) => Math.min(0.88, Math.max(0.12, 0.78 - (v - first) * ppc));

  const pts = days.map((d, i) => [xAt(i), yAt(d.todayBudget)] as const);
  const path = (() => {
    if (pts.length === 0) return "";
    const a = pts[0];
    const b = pts[1] ?? ([a[0] + col, a[1] - 0.2] as const);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const last = pts[pts.length - 1];
    const ext = [
      [a[0] - dx, a[1] - dy],
      ...pts.map((p) => [p[0], p[1]]),
      [last[0] + dx, last[1] + dy],
    ];
    return smoothPath(ext.map(([x, y]) => [x * VBW, y * VBH]));
  })();

  return (
    <div className="forecast">
      <div
        className="forecast-inner"
        style={{ width: `${Math.max(100, inner * 100)}%` }}
      >
        <svg className="forecast-line" viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" aria-hidden>
          {pts.map((p, i) => (
            <line
              key={i}
              x1={p[0] * VBW}
              x2={p[0] * VBW}
              y1="0"
              y2={VBH}
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="2"
            />
          ))}
          <path d={path} fill="none" stroke="rgba(255,255,255,0.96)" strokeWidth="9" strokeLinecap="round" />
        </svg>
        <div className="forecast-pills">
          {days.map((d, i) => {
            const isToday = d.date === today;
            const open = isToday && detailed;
            return (
              <button
                key={d.date}
                className={`pill ${isToday ? "pill-today" : ""} ${open ? "pill-open" : ""}`}
                style={{ left: `${xAt(i) * 100}%`, top: `${yAt(d.todayBudget) * 100}%` }}
                onClick={() => {
                  if (isToday) onToggleToday();
                }}
              >
                {open ? (
                  <>
                    <span className="pill-badge">Today</span>
                    <span className="pill-k">Rollover</span>
                    <span className="pill-pos">{formatMoney(d.rollover)}</span>
                    <span className="pill-k">Daily Budget</span>
                    <span className="pill-pos">{formatMoney(d.net)}</span>
                    <span className="pill-rule" />
                    <span className="pill-sum">{formatMoney(d.todayBudget)}</span>
                  </>
                ) : (
                  <>
                    <span className="pill-day">{isToday ? "Today" : shortWeekday(d.date)}</span>
                    <span className="pill-amt">{formatMoney(d.todayBudget)}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function smoothPath(pts: number[][]): string {
  if (pts.length === 0) return "";
  const d: string[] = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0[0] + p1[0]) / 2;
    d.push(`C ${cx} ${p0[1]}, ${cx} ${p1[1]}, ${p1[0]} ${p1[1]}`);
  }
  return d.join(" ");
}
