import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl sm:rounded-3xl p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${className}`}
    >
      <div className="bg-neutral-50/80 dark:bg-neutral-800/30 rounded-[1.35rem] p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
