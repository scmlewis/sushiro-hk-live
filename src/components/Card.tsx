import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-1.5 shadow-sm ${className}`}
    >
      <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-[1.35rem] border border-neutral-200/60 dark:border-white/5 p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
