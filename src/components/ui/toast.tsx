'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-accent-light dark:bg-accent-dark border-primary text-text-light dark:text-text-dark',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  const iconStyles = {
    success: '✓',
    error: '✕',
    info: 'i',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 min-w-[300px] max-w-md p-4 border-2 rounded-2xl shadow-md flex items-center justify-between animate-slide-in ${typeStyles[type]}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-card-light dark:bg-card-dark font-bold text-sm">
          {iconStyles[type]}
        </span>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 flex-shrink-0 text-lg font-bold hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}
