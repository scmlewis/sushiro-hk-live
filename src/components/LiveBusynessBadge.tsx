import React from 'react';

interface LiveBusynessBadgeProps {
  live: number | null;
}

const getBusynessLevel = (live: number): { label: string; color: string; bgColor: string; borderColor: string } => {
  if (live >= 75) return {
    label: '非常繁忙',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/60',
    borderColor: 'border-red-300 dark:border-red-800',
  };
  if (live >= 50) return {
    label: '繁忙',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950/60',
    borderColor: 'border-orange-300 dark:border-orange-800',
  };
  if (live >= 25) return {
    label: '適中',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/60',
    borderColor: 'border-yellow-300 dark:border-yellow-800',
  };
  return {
    label: '清靜',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
  };
};

export const LiveBusynessBadge: React.FC<LiveBusynessBadgeProps> = ({ live }) => {
  if (live === null || live === undefined) return null;

  const level = getBusynessLevel(live);

  return (
    <div className={`flex items-center justify-between p-3 rounded-md border ${level.bgColor} ${level.borderColor}`}>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-black ${level.color}`}>
          目前人流
        </span>
        <span className={`text-xs font-bold ${level.color} opacity-70`}>
          {level.label}
        </span>
      </div>
      <span className={`text-lg font-black tabular-nums ${level.color}`}>
        {live}%
      </span>
    </div>
  );
};
