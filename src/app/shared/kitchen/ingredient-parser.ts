import { Unit } from '../../core/api/models';

export interface ParsedIngredient {
  name: string;
  quantity: number | null;
  unit: Unit | null;
}

const UNIT_ALIASES: Record<string, Unit> = {
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup',
  piece: 'piece', pieces: 'piece', pc: 'piece', pcs: 'piece',
  pinch: 'pinch', pinches: 'pinch',
  clove: 'clove', cloves: 'clove',
  can: 'can', cans: 'can', tin: 'can', tins: 'can',
  bunch: 'bunch', bunches: 'bunch',
};

const VULGAR: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

const QUANTITY = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d*[¼½¾⅓⅔]|\d+(?:[.,]\d+)?)`;
const LINE = new RegExp(String.raw`^${QUANTITY}?\s*([a-zA-Z]+\.?)?\s*(?:of\s+)?(.*)$`);

/** Reads a line such as "2 kg potatoes", "1½ cups milk", "1/2 tsp salt" or "eggs". */
export function parseIngredientLine(line: string): ParsedIngredient | null {
  const text = line.trim().replace(/\s+/g, ' ');
  if (!text) return null;

  const match = LINE.exec(text);
  const [, rawQuantity, rawUnit, rest] = match ?? [];
  const quantity = rawQuantity ? parseQuantity(rawQuantity) : null;
  const unit = rawUnit ? UNIT_ALIASES[rawUnit.toLowerCase().replace(/\.$/, '')] : undefined;

  if (quantity === null) return { name: text.toLowerCase(), quantity: null, unit: null };
  // "2 onions": the word after the number is the ingredient, not a unit.
  const name = unit ? rest : `${rawUnit ?? ''} ${rest}`;
  return { name: name.trim().toLowerCase(), quantity, unit: unit ?? 'piece' };
}

function parseQuantity(raw: string): number {
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(raw);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = /^(\d+)\/(\d+)$/.exec(raw);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const vulgar = /^(\d*)([¼½¾⅓⅔])$/.exec(raw);
  if (vulgar) return Number(vulgar[1] || 0) + VULGAR[vulgar[2]!]!;
  return Number(raw.replace(',', '.'));
}
