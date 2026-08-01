import React, { useEffect, useRef } from 'react';
import { ToastMessage } from '../types';
import { TOAST_DURATION_MS } from '../config';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismissRef.current();
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-bounce-short">
      <div className="relative bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-3 rounded-xl shadow-2xl shadow-neutral-900/30 dark:shadow-neutral-100/20 flex items-center gap-3 border border-neutral-800 dark:border-neutral-200 overflow-hidden">
        {iconMap[toast.type || 'info']}
        <span className="text-sm font-medium flex-1">{toast.text}</span>
        <button
          onClick={onDismiss}
          className="text-neutral-400 hover:text-white dark:hover:text-neutral-900 transition-colors duration-150 p-1 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          key={toast.id}
          className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-current opacity-40"
          style={{ animation: `toast-countdown ${TOAST_DURATION_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
};
