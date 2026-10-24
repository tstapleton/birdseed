import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NewPlannedMeal, PlannedMeal } from './models';

@Injectable({ providedIn: 'root' })
export class MealPlanApi {
  private readonly http = inject(HttpClient);

  /** Meals planned from `from` to `to`, inclusive (ISO dates). */
  range(from: string, to: string): Observable<PlannedMeal[]> {
    return this.http.get<PlannedMeal[]>('/api/meal-plan', { params: { from, to } });
  }

  add(meal: NewPlannedMeal): Observable<PlannedMeal> {
    return this.http.post<PlannedMeal>('/api/meal-plan', meal);
  }

  update(id: string, patch: Partial<NewPlannedMeal>): Observable<PlannedMeal> {
    return this.http.patch<PlannedMeal>(`/api/meal-plan/${id}`, patch);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/meal-plan/${id}`);
  }
}
