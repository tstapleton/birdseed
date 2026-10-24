# Birdseed

A recipe, meal planning and grocery list app, and the example app for
[plotline](https://github.com/tstapleton/plotline): every pull request gets a comment
showing how the app's behaviour changed, as sequence diagrams recorded from its tests.

- **Recipes**: browse, search, filter by tag, star favourites, scale servings, and write
  or edit recipes (paste an ingredient list and it's read for you).
- **Meal plan**: plan recipes into breakfast, lunch and dinner for any week, with servings.
- **Grocery lists**: add items as free text ("2 kg potatoes, milk"), sorted into aisles,
  straight from a recipe or from a whole week's plan. Items already on the list are
  topped up, with units converted, rather than listed twice.

Built with Angular 20 (zoneless, signals) and NgRx SignalStore, with async/await rather
than RxJS. API clients talk to the backend through a small `Transport` (`fetch` in
production). There's no server: the demo swaps in a transport that answers from an
in-memory database kept in `localStorage`, so `ng serve` is all you need, and the app
deploys as static files.

## Run it

```bash
npm ci        # needs a GitHub token for @tstapleton packages; see below
npm start     # http://localhost:4200
npm test      # unit and integration tests
```

`@tstapleton/plotline` is published to GitHub Packages, which needs a token even for
public packages. Create a [personal access token](https://github.com/settings/tokens)
with `read:packages` and add it to your user `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

## How it's put together

```
src/app/
  core/         The "host app": API clients and transport, models, clock, toasts, mock backend
  shared/       Kitchen logic with no Angular in it: units, ingredient parsing, aisles, merging
  features/
    recipes/    Collection, recipe page, editor (RecipesStore, RecipeDetailStore, RecipeEditorStore)
    groceries/  Lists and a list (GroceryListsStore, GroceryListStore, GroceryAdder)
    meal-plan/  The week view (MealPlanStore)
```

Each feature keeps its state in a SignalStore provided by the page that uses it.

## Tests

Integration tests (`*.integration.spec.ts`) render the whole app with Testing Library and
drive it as a user would. Everything in `core/` is replaced by Jest mocks backed by an
in-memory copy of the demo data (`src/testing/render-app.ts`), the way the feature would
be tested inside a larger app.

## Behaviour diffs with plotline

Each store is marked with `withTracing('…')`, and the test harness names the mocked
services with `traced(…)`. Then:

```bash
npm run test:plotline     # writes plotline/<spec>/<test>.md, one sequence diagram per test
npm run plotline:report   # renders them all to plotline/report/index.html
```

On pull requests, [`.github/workflows/plotline.yml`](.github/workflows/plotline.yml) runs
the tests on the PR and on its base, and comments with a diagram of each test whose
behaviour changed.
