const BORDER_MAP: Record<string, string> = {
  emerald: 'border-l-8 border-emerald-500',
  amber: 'border-l-8 border-amber-500',
  violet: 'border-l-8 border-violet-500',
  orange: 'border-l-8 border-orange-500',
  red: 'border-l-8 border-[#aa151b]',
  neutral: 'border-l-8 border-neutral-300 dark:border-l-8 dark:border-neutral-700',
};

const TEXT_MAP: Record<string, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-[#aa151b]',
  neutral: 'text-neutral-400',
};

const BG_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  orange: 'bg-orange-500',
  red: 'bg-red-700',
  neutral: 'bg-neutral-300 dark:bg-neutral-700',
};

export function getAccentBorderClass(accentColor: string): string {
  return BORDER_MAP[accentColor] || BORDER_MAP.neutral;
}

export function getAccentTextClass(accentColor: string): string {
  return TEXT_MAP[accentColor] || TEXT_MAP.neutral;
}

export function getAccentBgClass(accentColor: string): string {
  return BG_MAP[accentColor] || BG_MAP.neutral;
}

export function getWaitTextColor(waitText: string, accentColor: string): string {
  if (waitText === '停飛') return 'text-rose-600 dark:text-rose-400';
  return getAccentTextClass(accentColor) || 'text-[#141414] dark:text-white';
}
