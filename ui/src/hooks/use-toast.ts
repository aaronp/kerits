import { useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

const toastListeners = new Set<(toast: Toast) => void>();

export function subscribeToToasts(listener: (toast: Toast) => void) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      ...options,
      duration: options.duration || 3000,
    };

    // Notify all listeners (e.g., Toaster component)
    toastListeners.forEach(listener => listener(newToast));

    return id;
  }, []);

  return {
    toast,
  };
}
