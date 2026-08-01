import React from 'react';

interface NumericKeypadProps {
  onInput: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onDone: () => void;
  onCancel?: () => void;
  label?: string;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onInput,
  onBackspace,
  onClear,
  onDone,
  onCancel,
  label,
}) => {
  return (
    <div className="fixed inset-0 z-50 sm:static sm:z-auto flex sm:block items-end justify-center">
      <button
        className="absolute inset-0 bg-black/40 sm:hidden"
        onClick={onCancel ?? onDone}
        aria-label="關閉鍵盤"
      />
      <div className="relative w-full sm:hidden bg-white dark:bg-neutral-900 rounded-t-3xl p-4 shadow-[0_-8px_40px_rgba(0,0,0,0.15)] border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
            {label || '輸入金額'}
          </span>
          <button
            onClick={onDone}
            className="px-5 py-2 rounded-xl bg-[#aa151b] text-white text-sm font-black active:scale-95 transition-transform"
          >
            完成
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => {
            const isAction = k === 'C' || k === '⌫';
            return (
              <button
                key={k}
                onClick={() => {
                  if (k === 'C') onClear();
                  else if (k === '⌫') onBackspace();
                  else onInput(k);
                }}
                className={`h-14 rounded-2xl text-lg font-black transition-all active:scale-[0.98] ${
                  isAction
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ring-1 ring-inset ring-neutral-200 dark:ring-neutral-700'
                }`}
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
