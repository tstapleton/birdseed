import { screen, within } from '@testing-library/angular';
import { renderApp } from '../../../testing/render-app';

describe('Grocery lists', () => {
  it('shows each list with how much is in the basket', async () => {
    await renderApp('/groceries');

    const lists = await screen.findByRole('list', { name: 'Grocery lists' });
    expect(within(lists).getByRole('link', { name: /Weekly shop/ })).toBeInTheDocument();
    expect(within(lists).getByLabelText('1 of 4 in the basket')).toBeInTheDocument();
  });

  it('creates a list and opens it', async () => {
    const { groceries, user } = await renderApp('/groceries');

    await user.type(await screen.findByLabelText('List name'), 'Weekend BBQ');
    await user.click(screen.getByRole('button', { name: 'Create list' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Weekend BBQ' })).toBeInTheDocument();
    expect(screen.getByText('Nothing on this list yet.')).toBeInTheDocument();
    expect(groceries.create).toHaveBeenCalledWith('Weekend BBQ');
  });

  describe('a list', () => {
    it('adds typed items under their aisles', async () => {
      const { user } = await renderApp('/groceries/g-weekly');

      await user.type(await screen.findByLabelText('Items to add'), '2 kg potatoes, 250 g butter{enter}');

      expect(await screen.findByRole('checkbox', { name: '2 kg potatoes' })).toBeInTheDocument();
      expect(itemsIn('Fruit and veg')).toEqual(['6 bananas', '2 kg potatoes']);
      expect(itemsIn('Dairy and eggs')).toEqual(['250 g butter', '2 l milk']);
    });

    it('tops up an item that is already on the list instead of adding it twice', async () => {
      const { groceries, user } = await renderApp('/groceries/g-weekly');

      await user.type(await screen.findByLabelText('Items to add'), '500 ml milk{enter}');

      expect(await screen.findByRole('checkbox', { name: '2½ l milk' })).toBeInTheDocument();
      expect(groceries.updateItem).toHaveBeenCalledWith('g-weekly', 'i-1', expect.objectContaining({ quantity: 2.5, unit: 'l' }));
      expect(groceries.addItems).not.toHaveBeenCalled();
    });

    it('checks items off into the basket and clears it', async () => {
      const { groceries, toaster, user } = await renderApp('/groceries/g-weekly');

      await user.click(await screen.findByRole('checkbox', { name: '2 l milk' }));
      expect(itemsIn('In the basket')).toEqual(['1 bread', '2 l milk']);
      expect(screen.getByText('2 of 4 in the basket')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Clear basket' }));

      expect(await screen.findByText('0 of 2 in the basket')).toBeInTheDocument();
      expect(screen.queryByRole('list', { name: 'In the basket' })).not.toBeInTheDocument();
      expect(groceries.clearChecked).toHaveBeenCalledWith('g-weekly');
      expect(toaster.success).toHaveBeenCalledWith('Cleared the basket');
    });

    it('lists everything together when grouping is off', async () => {
      const { user } = await renderApp('/groceries/g-weekly');

      await user.click(await screen.findByRole('button', { name: 'Group by aisle' }));

      expect(itemsIn('To buy')).toEqual(['6 bananas', '250 g coffee', '2 l milk']);
    });

    it('removes an item', async () => {
      const { user } = await renderApp('/groceries/g-weekly');

      await user.click(await screen.findByRole('button', { name: 'Remove coffee' }));

      expect(await screen.findByText('1 of 3 in the basket')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: '250 g coffee' })).not.toBeInTheDocument();
    });

    it('deletes the list once the user confirms', async () => {
      const { groceries, user } = await renderApp('/groceries/g-weekly');

      await user.click(await screen.findByRole('button', { name: 'Delete list' }));
      await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));

      expect(await screen.findByText('No lists yet. Create one above.')).toBeInTheDocument();
      expect(groceries.delete).toHaveBeenCalledWith('g-weekly');
    });
  });
});

function itemsIn(section: string): string[] {
  return within(screen.getByRole('list', { name: section }))
    .getAllByRole('checkbox')
    .map((box) => box.closest('label')!.textContent!.replace(/\s+/g, ' ').trim());
}
