import { Unit } from '../../core/api/models';

export interface Amount {
  quantity: number | null;
  unit: Unit | null;
}

/** Units that convert into each other, with their size in the family's base unit. */
const FAMILIES: Record<string, Partial<Record<Unit, number>>> = {
  mass: { g: 1, kg: 1000 },
  volume: { ml: 1, tsp: 5, tbsp: 15, cup: 240, l: 1000 },
};

function familyOf(unit: Unit | null): Partial<Record<Unit, number>> | undefined {
  return Object.values(FAMILIES).find((f) => unit !== null && unit in f);
}

/** Metric units read fine with decimals (2.12 l); spoons and cups need tidy fractions. */
const METRIC: Unit[] = ['g', 'kg', 'ml', 'l'];

/**
 * Adds two amounts of the same ingredient, or returns null when they can't be added
 * (say 2 cloves and 10 g). The result uses the larger of the two units when it reads
 * well, otherwise the family's base unit.
 */
export function combine(a: Amount, b: Amount): Amount | null {
  if (a.quantity === null || b.quantity === null) return a.unit === b.unit ? { quantity: a.quantity ?? b.quantity, unit: a.unit } : null;
  if (a.unit === b.unit) return { quantity: round(a.quantity + b.quantity), unit: a.unit };

  const family = familyOf(a.unit);
  if (!family || family !== familyOf(b.unit)) return null;
  const total = a.quantity * family[a.unit!]! + b.quantity * family[b.unit!]!;
  const larger = family[a.unit!]! >= family[b.unit!]! ? a.unit! : b.unit!;
  const inLarger = total / family[larger]!;
  const readsWell = METRIC.includes(larger) ? inLarger >= 1 : Number.isInteger(round(inLarger * 4));
  const unit = readsWell ? larger : (Object.keys(family)[0] as Unit);
  return { quantity: round(total / family[unit]!), unit };
}

export function scale(amount: Amount, factor: number): Amount {
  return amount.quantity === null ? amount : { ...amount, quantity: round(amount.quantity * factor) };
}

const FRACTIONS: [number, string][] = [
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.5, '½'],
  [0.667, '⅔'],
  [0.75, '¾'],
];

/** 1.5 → "1½", 0.25 → "¼", 2.4 → "2.4". */
export function formatQuantity(quantity: number): string {
  const whole = Math.floor(quantity);
  const rest = quantity - whole;
  if (rest < 0.01) return String(whole);
  const fraction = FRACTIONS.find(([value]) => Math.abs(value - rest) < 0.02);
  if (fraction) return `${whole || ''}${fraction[1]}`;
  return String(round(quantity));
}

/** "2 tbsp", "1½ cups", "3" (pieces show no unit), "" when there's no quantity. */
export function formatAmount({ quantity, unit }: Amount): string {
  if (quantity === null) return '';
  const q = formatQuantity(quantity);
  if (!unit || unit === 'piece') return q;
  const plural = quantity > 1 && ['cup', 'clove', 'can', 'bunch', 'pinch'].includes(unit);
  return `${q} ${unit}${plural ? (unit === 'bunch' || unit === 'pinch' ? 'es' : 's') : ''}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
