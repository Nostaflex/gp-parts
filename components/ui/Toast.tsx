'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: { label: string; href: string };
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-caribbean text-white',
  error: 'bg-error text-white',
  info: 'bg-basalt text-cream',
  warning: 'bg-warning text-white',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-xl shadow-elevated animate-slide-up',
        STYLES[toast.type]
      )}
    >
      <Icon size={18} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-body-sm font-medium">
        {toast.message}
        {toast.action && (
          <Link
            href={toast.action.href}
            className="block mt-1 underline text-caption font-medium opacity-90 hover:opacity-100"
          >
            {toast.action.label} →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return ctx;
}
