import { Injectable, inject } from '@angular/core';
import { NewPlannedMeal, PlannedMeal } from './models';
import { Transport } from './transport';

@Injectable({ providedIn: 'root' })
export class MealPlanApi {
  private readonly transport = inject(Transport);

  /** Meals planned from `from` to `to`, inclusive (ISO dates). */
  range(from: string, to: string): Promise<PlannedMeal[]> {
    return this.transport.send({ method: 'GET', path: '/meal-plan', query: { from, to } });
  }

  add(meal: NewPlannedMeal): Promise<PlannedMeal> {
    return this.transport.send({ method: 'POST', path: '/meal-plan', body: meal });
  }

  update(id: string, patch: Partial<NewPlannedMeal>): Promise<PlannedMeal> {
    return this.transport.send({ method: 'PATCH', path: `/meal-plan/${id}`, body: patch });
  }

  remove(id: string): Promise<void> {
    return this.transport.send({ method: 'DELETE', path: `/meal-plan/${id}` });
  }
}
