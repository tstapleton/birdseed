import { screen, within } from '@testing-library/angular';
import { renderApp } from '../../../testing/render-app';

describe('Meal plan', () => {
  it("shows this week's meals and moves between weeks", async () => {
    const { mealPlan, user } = await renderApp('/plan');

    expect(await screen.findByText('13 April – 19 April 2026')).toBeInTheDocument();
    expect(await mealsIn('Wednesday breakfast')).toEqual(['Shakshuka']);
    expect(within(day('Wednesday 15 April')).getByText('Today')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next week →' }));

    expect(await screen.findByText('20 April – 26 April 2026')).toBeInTheDocument();
    expect(mealPlan.range).toHaveBeenLastCalledWith('2026-04-20', '2026-04-26');
    expect(await screen.findByText('0 meals planned this week.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'This week' }));
    expect(await screen.findByText('3 meals planned this week.')).toBeInTheDocument();
  });

  it('plans a recipe for a meal', async () => {
    const { mealPlan, user } = await renderApp('/plan');

    await user.click(await screen.findByRole('button', { name: 'Plan Friday dinner' }));
    const picker = screen.getByRole('form', { name: 'Choose a recipe' });
    await user.selectOptions(within(picker).getByRole('combobox', { name: 'Recipe' }), 'Greek salad');
    await user.clear(within(picker).getByRole('spinbutton', { name: 'Servings' }));
    await user.type(within(picker).getByRole('spinbutton', { name: 'Servings' }), '3');
    await user.click(within(picker).getByRole('button', { name: 'Add' }));

    expect(await mealsIn('Friday dinner')).toEqual(['Greek salad']);
    expect(mealPlan.add).toHaveBeenCalledWith({ date: '2026-04-17', meal: 'dinner', recipeId: 'r-greek-salad', recipeTitle: 'Greek salad', servings: 3 });
  });

  it('changes servings and removes a meal', async () => {
    const { mealPlan, user } = await renderApp('/plan');

    await user.click(await screen.findByRole('button', { name: 'More servings of Lemon and garlic spaghetti' }));
    expect(within(slot('Thursday dinner')).getByText('3')).toBeInTheDocument();
    expect(mealPlan.update).toHaveBeenCalledWith('m-3', { servings: 3 });

    await user.click(screen.getByRole('button', { name: 'Remove Lemon and garlic spaghetti from Thursday dinner' }));
    expect(await screen.findByText('2 meals planned this week.')).toBeInTheDocument();
    expect(mealPlan.remove).toHaveBeenCalledWith('m-3');
  });

  it("makes one grocery list from the week's meals", async () => {
    const { toaster, user } = await renderApp('/plan');

    await user.click(await screen.findByRole('button', { name: 'Make a grocery list' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Week of 13 April' })).toBeInTheDocument();
    // Garlic for the curry (3), shakshuka (2) and spaghetti (2), as one item.
    expect(screen.getByRole('checkbox', { name: '7 cloves garlic' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '2 onion' })).toBeInTheDocument();
    expect(toaster.success).toHaveBeenCalledWith('Made Week of 13 April from 3 meals');
  });
});

function day(name: string): HTMLElement {
  return screen.getByRole('listitem', { name: new RegExp(`^${name}`) });
}

function slot(name: string): HTMLElement {
  return screen.getByRole('region', { name });
}

/** Waits for the slot to show at least one meal, then lists them. */
async function mealsIn(name: string): Promise<string[]> {
  const region = await screen.findByRole('region', { name });
  return (await within(region).findAllByRole('link')).map((a) => a.textContent!.trim());
}
