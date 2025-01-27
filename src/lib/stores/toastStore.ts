import { writable } from 'svelte/store';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export const toasts = writable<Toast[]>([]);

export function addToast(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    duration: number = 3000
): void {
    const id = Date.now();
    toasts.update((all) => [...all, { id, message, type }]);

    setTimeout(() => {
        toasts.update((all) => all.filter((toast) => toast.id !== id));
    }, duration);
}
