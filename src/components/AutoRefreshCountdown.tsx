import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AutoRefreshCountdownProps {
  pollIntervalMs: number;
}

export const AutoRefreshCountdown: React.FC<AutoRefreshCountdownProps> = ({ pollIntervalMs }) => {
  const totalSeconds = Math.max(1, Math.round(pollIntervalMs / 1000));
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? totalSeconds : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [totalSeconds]);

  const progress = (secondsLeft / totalSeconds) * 100;

  return (
    <div className="flex items-center gap-2.5 bg-neutral-100 dark:bg-neutral-800 px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
      <span className="text-[11px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        自動更新: <span className="text-[#aa151b] font-mono font-black">{secondsLeft}S</span>
      </span>
      <div className="w-10 bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#aa151b] h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
