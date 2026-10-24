import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class Toaster {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  private show(kind: Toast['kind'], message: string): void {
    const id = this.nextId++;
    this.toasts.update((t) => [...t, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
