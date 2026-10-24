import { screen, within } from '@testing-library/angular';
import { ApiError } from '../../core/api/transport';
import { renderApp } from '../../../testing/render-app';

describe('Recipes', () => {
  describe('browsing', () => {
    it('lists the collection and narrows it by search and tag', async () => {
      const { user } = await renderApp('/recipes');

      expect(await screen.findByText('8 recipes in your collection')).toBeInTheDocument();
      await user.type(screen.getByRole('searchbox', { name: 'Search recipes' }), 'curry');
      expect(recipeTitles()).toEqual(['Chickpea and spinach curry']);

      await user.clear(screen.getByRole('searchbox', { name: 'Search recipes' }));
      await user.click(within(screen.getByRole('group', { name: 'Filter by tag' })).getByRole('button', { name: 'breakfast' }));
      expect(recipeTitles()).toEqual(['Overnight oats', 'Shakshuka']);
    });

    it('offers to clear filters when nothing matches', async () => {
      const { user } = await renderApp('/recipes');

      await user.type(await screen.findByRole('searchbox', { name: 'Search recipes' }), 'lasagne');
      expect(screen.getByText('No recipes match these filters.')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Clear filters' }));
      expect(recipeTitles()).toHaveLength(8);
    });

    it('stars a recipe as a favourite and filters by favourites', async () => {
      const { recipes, user } = await renderApp('/recipes');

      await user.click(await screen.findByRole('button', { name: 'Add Banana bread to favourites' }));
      expect(recipes.setFavorite).toHaveBeenCalledWith('r-banana-bread', true);

      await user.click(screen.getByRole('button', { name: '★ Favourites' }));
      expect(recipeTitles()).toEqual(['Banana bread', 'Lemon and garlic spaghetti', 'Shakshuka']);
    });

    it('puts the star back when saving a favourite fails', async () => {
      const { recipes, toaster, user } = await renderApp('/recipes');
      recipes.setFavorite.mockRejectedValueOnce(new ApiError(503));

      await user.click(await screen.findByRole('button', { name: 'Add Banana bread to favourites' }));

      expect(screen.getByRole('button', { name: 'Add Banana bread to favourites' })).toBeInTheDocument();
      expect(toaster.error).toHaveBeenCalledWith("Couldn't update Banana bread");
    });
  });

  describe('a recipe', () => {
    it('opens from the collection and scales its ingredients to the servings', async () => {
      const { user } = await renderApp('/recipes');

      await user.click(await screen.findByRole('link', { name: 'Shakshuka' }));
      expect(await screen.findByRole('heading', { level: 1, name: 'Shakshuka' })).toBeInTheDocument();
      expect(ingredientLines()).toContain('4 eggs');

      await user.click(screen.getByRole('button', { name: 'More servings' }));
      await user.click(screen.getByRole('button', { name: 'More servings' }));

      expect(within(screen.getByRole('group', { name: 'Servings' })).getByText('4')).toBeInTheDocument();
      expect(ingredientLines()).toEqual(expect.arrayContaining(['8 eggs', '4 tbsp olive oil', '2 cans chopped tomatoes', '100 g feta']));
    });

    it('deletes a recipe once the user confirms', async () => {
      const { recipes, toaster, user } = await renderApp('/recipes/r-banana-bread');

      await user.click(await screen.findByRole('button', { name: 'Delete' }));
      expect(screen.getByRole('alertdialog', { name: /Delete Banana bread\?/ })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Delete recipe' }));

      expect(await screen.findByText('7 recipes in your collection')).toBeInTheDocument();
      expect(recipes.delete).toHaveBeenCalledWith('r-banana-bread');
      expect(toaster.success).toHaveBeenCalledWith('Deleted Banana bread');
    });

    it('keeps the recipe when the user cancels the delete', async () => {
      const { recipes, user } = await renderApp('/recipes/r-banana-bread');

      await user.click(await screen.findByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(recipes.delete).not.toHaveBeenCalled();
    });

    it("says so when a recipe doesn't exist", async () => {
      await renderApp('/recipes/r-nope');

      expect(await screen.findByRole('alert')).toHaveTextContent("That recipe doesn't exist.");
    });
  });

  describe('shopping for a recipe', () => {
    it('adds the ingredients to an existing list, topping up what is already there', async () => {
      const { groceries, toaster, user } = await renderApp('/recipes/r-overnight-oats');

      await user.click(await screen.findByRole('button', { name: 'Add to grocery list' }));
      const panel = await screen.findByRole('form', { name: 'Add to grocery list' });
      expect(await within(panel).findByRole('combobox', { name: 'Grocery list' })).toHaveDisplayValue('Weekly shop');
      await user.click(within(panel).getByRole('button', { name: 'Add ingredients' }));

      await screen.findByRole('button', { name: 'Add to grocery list', expanded: false });
      expect(toaster.success).toHaveBeenCalledWith('Added Overnight oats to Weekly shop');
      expect(groceries.updateItem).toHaveBeenCalledWith('g-weekly', 'i-1', expect.objectContaining({ quantity: 2.12, unit: 'l', recipes: ['Overnight oats'] }));

      await user.click(screen.getByRole('link', { name: 'Groceries' }));
      await user.click(await screen.findByRole('link', { name: /Weekly shop/ }));
      expect(await screen.findByRole('checkbox', { name: '50 g rolled oats' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: '2.12 l milk' })).toBeInTheDocument();
    });

    it('starts a new list with the ingredients scaled to the servings', async () => {
      const { groceries, user } = await renderApp('/recipes/r-shakshuka');

      await user.click(await screen.findByRole('button', { name: 'More servings' }));
      await user.click(screen.getByRole('button', { name: 'More servings' }));
      await user.click(screen.getByRole('button', { name: 'Add to grocery list' }));
      await user.selectOptions(await screen.findByRole('combobox', { name: 'Grocery list' }), 'New list…');
      const name = screen.getByRole('textbox', { name: 'New list name' });
      await user.clear(name);
      await user.type(name, 'Brunch');
      await user.click(screen.getByRole('button', { name: 'Add ingredients' }));

      await screen.findByRole('button', { name: 'Add to grocery list', expanded: false });
      expect(groceries.create).toHaveBeenCalledWith('Brunch');
      expect(groceries.addItems).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          { name: 'eggs', quantity: 8, unit: 'piece', aisle: 'dairy', recipes: ['Shakshuka'] },
          { name: 'smoked paprika', quantity: 2, unit: 'tsp', aisle: 'spices', recipes: ['Shakshuka'] },
        ]),
      );
    });
  });

  describe('planning a recipe', () => {
    it('adds it to the meal plan for a day this week', async () => {
      const { mealPlan, toaster, user } = await renderApp('/recipes/r-chicken-traybake');

      await user.click(await screen.findByRole('button', { name: 'Add to meal plan' }));
      const panel = screen.getByRole('form', { name: 'Add to meal plan' });
      await user.selectOptions(within(panel).getByRole('combobox', { name: 'Day' }), 'Saturday 18 April');
      await user.click(within(panel).getByRole('button', { name: 'Add to plan' }));

      await screen.findByRole('button', { name: 'Add to meal plan', expanded: false });
      expect(mealPlan.add).toHaveBeenCalledWith({
        date: '2026-04-18',
        meal: 'dinner',
        recipeId: 'r-chicken-traybake',
        recipeTitle: 'Chicken and vegetable traybake',
        servings: 4,
      });
      expect(toaster.success).toHaveBeenCalledWith('Planned Chicken and vegetable traybake for Saturday dinner');

      await user.click(screen.getByRole('link', { name: 'Meal plan' }));
      const saturday = await screen.findByRole('region', { name: 'Saturday dinner' });
      expect(await within(saturday).findByRole('link', { name: 'Chicken and vegetable traybake' })).toBeInTheDocument();
    });
  });

  describe('writing a recipe', () => {
    it('creates a recipe, pointing out what is missing first', async () => {
      const { recipes, toaster, user } = await renderApp('/recipes');

      await user.click(await screen.findByRole('link', { name: 'New recipe' }));
      await user.click(await screen.findByRole('button', { name: 'Save recipe' }));
      const errors = within(screen.getByRole('alert'));
      expect(errors.getByText('Give the recipe a name')).toBeInTheDocument();
      expect(errors.getByText('Add at least one ingredient')).toBeInTheDocument();

      await user.type(screen.getByLabelText('Name'), 'Pancakes');
      await user.type(screen.getByLabelText('Tags'), 'Breakfast, sweet');
      await user.click(screen.getByRole('button', { name: 'Paste a list' }));
      await user.type(screen.getByLabelText(/One ingredient per line/), '1½ cups flour{enter}2 eggs{enter}300 ml milk');
      await user.click(screen.getByRole('button', { name: 'Add these ingredients' }));
      await user.type(screen.getByRole('textbox', { name: 'Step 1' }), 'Whisk everything together and fry in a hot pan.');
      await user.click(screen.getByRole('button', { name: 'Save recipe' }));

      expect(await screen.findByRole('heading', { level: 1, name: 'Pancakes' })).toBeInTheDocument();
      expect(ingredientLines()).toEqual(['1½ cups flour', '2 eggs', '300 ml milk']);
      expect(recipes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Pancakes',
          tags: ['breakfast', 'sweet'],
          ingredients: [
            { name: 'flour', quantity: 1.5, unit: 'cup' },
            { name: 'eggs', quantity: 2, unit: 'piece' },
            { name: 'milk', quantity: 300, unit: 'ml' },
          ],
        }),
      );
      expect(toaster.success).toHaveBeenCalledWith('Saved Pancakes');
    });

    it('edits a recipe', async () => {
      const { recipes, user } = await renderApp('/recipes/r-greek-salad');

      await user.click(await screen.findByRole('link', { name: 'Edit' }));
      const title = await screen.findByLabelText('Name');
      await user.clear(title);
      await user.type(title, 'Horiatiki');
      await user.click(screen.getByRole('button', { name: 'Remove ingredient 3' }));
      await user.clear(screen.getByLabelText('Quantity for ingredient 1'));
      await user.type(screen.getByLabelText('Quantity for ingredient 1'), '400');
      await user.click(screen.getByRole('button', { name: 'Save recipe' }));

      expect(await screen.findByRole('heading', { level: 1, name: 'Horiatiki' })).toBeInTheDocument();
      expect(ingredientLines()).toContain('400 g tomatoes');
      expect(ingredientLines()).not.toContain('½ red onion');
      expect(recipes.update).toHaveBeenCalledWith('r-greek-salad', expect.objectContaining({ title: 'Horiatiki' }));
    });

    it('flags a quantity that is not a number', async () => {
      const { recipes, user } = await renderApp('/recipes/new');

      await user.type(await screen.findByLabelText('Name'), 'Toast');
      await user.type(screen.getByLabelText('Quantity for ingredient 1'), 'some');
      await user.type(screen.getByLabelText('Ingredient 1'), 'bread');
      await user.type(screen.getByRole('textbox', { name: 'Step 1' }), 'Toast it.');
      await user.click(screen.getByRole('button', { name: 'Save recipe' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Some quantities aren’t numbers');
      expect(screen.getByLabelText('Quantity for ingredient 1')).toHaveAttribute('aria-invalid', 'true');
      expect(recipes.create).not.toHaveBeenCalled();
    });
  });
});

function ingredientLines(): string[] {
  return within(screen.getByRole('list', { name: 'Ingredients' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent!.replace(/\s+/g, ' ').trim());
}

function recipeTitles(): string[] {
  return within(screen.getByRole('list', { name: 'Recipes' }))
    .getAllByRole('heading')
    .map((h) => h.textContent!.trim());
}
