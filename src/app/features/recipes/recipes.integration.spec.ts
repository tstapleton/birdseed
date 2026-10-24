import { HttpErrorResponse } from '@angular/common/http';
import { screen, within } from '@testing-library/angular';
import { throwError } from 'rxjs';
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
      recipes.setFavorite.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })));

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
