const BORDER_MAP: Record<string, string> = {
  blue: 'border-l-8 border-blue-500',
  emerald: 'border-l-8 border-emerald-500',
  yellow: 'border-l-8 border-yellow-500',
  orange: 'border-l-8 border-orange-500',
  red: 'border-l-8 border-[#aa151b]',
  purple: 'border-l-8 border-[#8b5cf6]',
  neutral: 'border-l-8 border-neutral-300 dark:border-l-8 dark:border-neutral-700',
};

const TEXT_MAP: Record<string, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-[#aa151b]',
  purple: 'text-[#8b5cf6]',
  neutral: 'text-neutral-400',
};

const BG_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-700',
  purple: 'bg-[#8b5cf6]',
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
  if (waitText === '現場派籌已暫停') return 'text-[#8b5cf6] dark:text-violet-400';
  return getAccentTextClass(accentColor) || 'text-[#141414] dark:text-white';
}
