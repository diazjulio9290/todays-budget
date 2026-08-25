import type { ReactNode } from "react";

const INK = "#5c6cff";
const SOLID = "#5c6cff";
const INCOME = "#34c759";

const ICONS: Record<string, (color: string) => ReactNode> = {
  fun: FunIcon,
  tech: TechIcon,
  "eating out": EatIcon,
  bills: BillsIcon,
  loan: LoanIcon,
  mobility: CarIcon,
  health: HealthIcon,
  personal: ShirtIcon,
  home: HomeIcon,
  groceries: CartIcon,
  income: IncomeIcon,
};

export function CategoryIcon({
  name,
  size = 32,
  variant = "solid",
}: {
  name: string;
  size?: number;
  variant?: "solid" | "ghost";
}) {
  const key = name.trim().toLowerCase();
  const income = key === "income";
  const glyphColor = variant === "solid" ? "#fff" : INK;
  const glyph = (ICONS[key] ?? SparkIcon)(glyphColor);
  const bg = variant === "ghost" ? "transparent" : income ? INCOME : SOLID;
  const radius = Math.max(8, Math.round(size * 0.28));
  return (
    <span
      className="cat-icon"
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: radius,
        color: glyphColor,
      }}
      aria-hidden
    >
      {glyph}
    </span>
  );
}

function svg(children: ReactNode, color: string, fill = false) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="62%"
      height="62%"
      fill={fill ? color : "none"}
      stroke={color}
      strokeWidth={fill ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function FunIcon(c: string) {
  return svg(
    <>
      <path d="M9.2 13.8 14.8 5.5l3.2 2.2-4.2 9.2-4.6-3.1z" />
      <path d="M7.2 6.2l1.2 1.6M5.5 9.2l1.8.4M6.2 12.2l1.5-1" />
      <circle cx="8.2" cy="5.2" r="0.7" fill={c} stroke="none" />
      <circle cx="4.8" cy="7.8" r="0.6" fill={c} stroke="none" />
    </>,
    c,
  );
}

function TechIcon(c: string) {
  return svg(
    <>
      <rect x="2.8" y="6.2" width="13.2" height="9.2" rx="1.5" />
      <path d="M6 17.8h7" />
      <rect x="14.6" y="9.2" width="6.2" height="9.2" rx="1.3" />
    </>,
    c,
  );
}

function EatIcon(c: string) {
  return svg(
    <>
      <path d="M8 4.5v8.5" />
      <path d="M6 4.8v3.8c0 1.2.9 2.1 2 2.1s2-.9 2-2.1V4.8" />
      <path d="M16.8 5c1.8 2.6 1.8 5.4 0 8.2" />
      <path d="M16.8 5V19.5" />
    </>,
    c,
  );
}

function BillsIcon(c: string) {
  return svg(
    <>
      <path d="M7 3.8h8.4L19 7.6V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1z" />
      <path d="M15.2 3.8V8h4" />
      <path d="M9 12.2h6M9 15.6h4" />
    </>,
    c,
  );
}

function LoanIcon(c: string) {
  return svg(
    <>
      <path d="M4 16.5 9.2 11l3.2 3.2L20 6.8" />
      <path d="M14.5 6.8H20V12" />
    </>,
    c,
  );
}

function CarIcon(c: string) {
  return svg(
    <>
      <path d="M4 14.2 5.8 9.4A2 2 0 0 1 7.7 8h8.6a2 2 0 0 1 1.9 1.4L20 14.2v3.2a1 1 0 0 1-1 1h-1.1a1 1 0 0 1-1-1v-.5H7.1v.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.2z" />
      <circle cx="7.4" cy="14.4" r="1" fill={c} stroke="none" />
      <circle cx="16.6" cy="14.4" r="1" fill={c} stroke="none" />
    </>,
    c,
  );
}

function HealthIcon(c: string) {
  return svg(
    <>
      <path d="M7 9.2a2.4 2.4 0 0 1 4.8 0c0 1.4-1.6 2.4-2.4 3.4-.8-1-2.4-2-2.4-3.4z" />
      <path d="M11.8 12.2v4.4a2.2 2.2 0 0 0 4.4 0V11" />
      <circle cx="16.2" cy="9.2" r="2" />
    </>,
    c,
  );
}

function ShirtIcon(c: string) {
  return svg(
    <>
      <path d="M9 5.2 12 7.4 15 5.2l3.4 2.2-2 2.6v10H7.6V10L5.6 7.4z" />
      <path d="M9 5.2C9.6 6.6 10.6 7.4 12 7.4S14.4 6.6 15 5.2" />
    </>,
    c,
  );
}

function HomeIcon(c: string) {
  return svg(
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.6 10.8V19h10.8v-8.2" />
      <path d="M10.4 19v-5h3.2v5" />
    </>,
    c,
  );
}

function CartIcon(c: string) {
  return svg(
    <>
      <path d="M5 6.2h1.6L8.3 15h9.2L19.6 8.2H8" />
      <circle cx="10" cy="18.4" r="1.1" fill={c} stroke="none" />
      <circle cx="16.4" cy="18.4" r="1.1" fill={c} stroke="none" />
    </>,
    c,
  );
}

function IncomeIcon(c: string) {
  return svg(
    <>
      <rect x="3.5" y="6.6" width="17" height="11" rx="2" />
      <path d="M12 10v5M10.2 12.2 12 10l1.8 2.2" />
    </>,
    c,
  );
}

function SparkIcon(c: string) {
  return svg(
    <path d="M12 4.5 13.4 9.8 19 11.2 13.4 12.6 12 18 10.6 12.6 5 11.2 10.6 9.8z" />,
    c,
  );
}
