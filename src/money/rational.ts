import type { Rat } from "./types";

function abs(n: bigint): bigint {
  return n < 0n ? -n : n;
}

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a === 0n ? 1n : a;
}

export function rat(n: bigint | number, d: bigint | number = 1n): Rat {
  let nn = BigInt(n);
  let dd = BigInt(d);
  if (dd === 0n) throw new Error("Division by zero");
  if (dd < 0n) {
    nn = -nn;
    dd = -dd;
  }
  const g = gcd(nn, dd);
  return { n: nn / g, d: dd / g };
}

export const RAT_ZERO: Rat = { n: 0n, d: 1n };

export function addRat(a: Rat, b: Rat): Rat {
  return rat(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function isZero(r: Rat): boolean {
  return r.n === 0n;
}

export function isNegative(r: Rat): boolean {
  return r.n < 0n;
}

/**
 * Round a rational number of cents to the nearest integer cent.
 * Ties (.5) round away from zero (Decimal ROUND_HALF_UP).
 *
 * Example: 85000/31 = 2741.935… → 2742;  11000/7 = 1571.428… → 1571.
 */
export function roundHalfAway(r: Rat): number {
  let n = r.n;
  let d = r.d;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const sign = n < 0n ? -1n : 1n;
  n = abs(n);
  const q = n / d;
  const rem = n % d;
  const rounded = rem * 2n >= d ? q + 1n : q;
  return Number(sign * rounded);
}
