import React from 'react';
import { StatusBadge } from '../utils/status';

interface StatusBadgeProps {
  badge: StatusBadge;
  className?: string;
}

export const StatusBadgeComponent: React.FC<StatusBadgeProps> = ({ badge, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider border ${badge.bgColor} ${badge.textColor} ${badge.borderColor} ${className}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
    {badge.label}
  </span>
);
