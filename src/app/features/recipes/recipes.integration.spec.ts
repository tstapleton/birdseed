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
});

function recipeTitles(): string[] {
  return within(screen.getByRole('list', { name: 'Recipes' }))
    .getAllByRole('heading')
    .map((h) => h.textContent!.trim());
}
