import { aisleFor } from './aisles';
import { parseIngredientLine } from './ingredient-parser';
import { planMerge } from './merge-items';
import { combine, formatAmount, formatQuantity, scale } from './units';

describe('units', () => {
  it('adds amounts in the same unit', () => {
    expect(combine({ quantity: 2, unit: 'tbsp' }, { quantity: 1, unit: 'tbsp' })).toEqual({ quantity: 3, unit: 'tbsp' });
  });

  it('converts within a family, keeping the larger unit when it reads well', () => {
    expect(combine({ quantity: 1, unit: 'kg' }, { quantity: 500, unit: 'g' })).toEqual({ quantity: 1.5, unit: 'kg' });
    expect(combine({ quantity: 2, unit: 'l' }, { quantity: 120, unit: 'ml' })).toEqual({ quantity: 2.12, unit: 'l' });
    expect(combine({ quantity: 1, unit: 'tbsp' }, { quantity: 1, unit: 'tsp' })).toEqual({ quantity: 20, unit: 'ml' });
  });

  it('refuses to add amounts that do not convert', () => {
    expect(combine({ quantity: 2, unit: 'clove' }, { quantity: 10, unit: 'g' })).toBeNull();
  });

  it('scales and formats quantities as kitchen fractions', () => {
    expect(scale({ quantity: 3, unit: 'piece' }, 0.5)).toEqual({ quantity: 1.5, unit: 'piece' });
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(0.25)).toBe('¼');
    expect(formatAmount({ quantity: 2, unit: 'cup' })).toBe('2 cups');
    expect(formatAmount({ quantity: 3, unit: 'piece' })).toBe('3');
  });
});

describe('parseIngredientLine', () => {
  it.each([
    ['2 kg potatoes', { name: 'potatoes', quantity: 2, unit: 'kg' }],
    ['1½ cups milk', { name: 'milk', quantity: 1.5, unit: 'cup' }],
    ['1/2 tsp salt', { name: 'salt', quantity: 0.5, unit: 'tsp' }],
    ['3 onions', { name: 'onions', quantity: 3, unit: 'piece' }],
    ['250 grams of butter', { name: 'butter', quantity: 250, unit: 'g' }],
    ['Eggs', { name: 'eggs', quantity: null, unit: null }],
  ])('reads %p', (line, expected) => {
    expect(parseIngredientLine(line)).toEqual(expected);
  });
});

describe('aisleFor', () => {
  it.each([
    ['red onion', 'produce'],
    ['coconut milk', 'pantry'],
    ['milk', 'dairy'],
    ['smoked paprika', 'spices'],
    ['chicken thighs', 'meat'],
    ['washing-up liquid', 'other'],
  ])('puts %p in %p', (name, aisle) => {
    expect(aisleFor(name)).toBe(aisle);
  });
});

describe('planMerge', () => {
  const item = (id: string, name: string, quantity: number, unit: 'g' | 'piece', checked = false) => ({
    id, name, quantity, unit, checked, aisle: 'produce' as const, recipes: [],
  });

  it('tops up matching items still to buy and adds the rest', () => {
    const plan = planMerge(
      [item('a', 'onion', 1, 'piece'), item('b', 'spinach', 100, 'g', true)],
      [
        { name: 'onions', quantity: 2, unit: 'piece', aisle: 'produce', recipes: ['Curry'] },
        { name: 'spinach', quantity: 200, unit: 'g', aisle: 'produce', recipes: ['Curry'] },
      ],
    );
    expect(plan.update).toEqual([{ id: 'a', patch: { quantity: 3, unit: 'piece', recipes: ['Curry'] } }]);
    expect(plan.add).toEqual([{ name: 'spinach', quantity: 200, unit: 'g', aisle: 'produce', recipes: ['Curry'] }]);
  });

  it('combines duplicates within what is being added', () => {
    const plan = planMerge([], [
      { name: 'garlic', quantity: 2, unit: 'clove', aisle: 'produce', recipes: ['A'] },
      { name: 'garlic', quantity: 3, unit: 'clove', aisle: 'produce', recipes: ['B'] },
    ]);
    expect(plan.add).toEqual([{ name: 'garlic', quantity: 5, unit: 'clove', aisle: 'produce', recipes: ['A', 'B'] }]);
  });
});
