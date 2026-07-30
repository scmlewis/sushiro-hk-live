import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { TOAST_DURATION_MS } from '../config';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-bounce-short">
      <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800 dark:border-slate-200">
        {iconMap[toast.type || 'info']}
        <span className="text-sm font-medium flex-1">{toast.text}</span>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors p-1"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
