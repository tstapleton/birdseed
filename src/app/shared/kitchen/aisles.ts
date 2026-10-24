import { Aisle } from '../../core/api/models';

const KEYWORDS: [Aisle, string[]][] = [
  ['spices', ['paprika', 'cumin', 'oregano', 'pepper flakes', 'black pepper', 'curry powder', 'cinnamon', 'salt', 'turmeric', 'chilli powder']],
  ['dairy', ['milk', 'butter', 'cheese', 'feta', 'parmesan', 'yoghurt', 'yogurt', 'cream', 'egg']],
  ['meat', ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'sausage', 'fish', 'salmon', 'prawn']],
  ['bakery', ['bread', 'bagel', 'tortilla', 'pitta', 'bun', 'croissant']],
  ['frozen', ['frozen', 'ice cream', 'peas']],
  [
    'produce',
    ['onion', 'garlic', 'ginger', 'pepper', 'tomato', 'potato', 'spinach', 'lemon', 'lime', 'banana', 'berries', 'berry', 'apple',
      'cucumber', 'parsley', 'basil', 'coriander', 'carrot', 'lettuce', 'avocado', 'mushroom', 'herb'],
  ],
  [
    'pantry',
    ['flour', 'sugar', 'rice', 'pasta', 'spaghetti', 'oats', 'oil', 'stock', 'chickpeas', 'beans', 'lentils', 'coconut milk', 'honey',
      'baking', 'olives', 'coffee', 'tea', 'chopped tomatoes', 'can'],
  ],
];

/** Which aisle an ingredient is usually found in, from words in its name. */
export function aisleFor(name: string): Aisle {
  const text = name.toLowerCase();
  // Longest keyword wins, so "coconut milk" is pantry rather than dairy.
  let best: { aisle: Aisle; length: number } | undefined;
  for (const [aisle, words] of KEYWORDS) {
    for (const word of words) {
      if (text.includes(word) && word.length > (best?.length ?? 0)) best = { aisle, length: word.length };
    }
  }
  return best?.aisle ?? 'other';
}
