import React from 'react';
import type { PriceTier } from '../data/menu';

interface TierBadgeProps {
  tier: PriceTier;
  size?: 'sm' | 'md' | 'lg';
  showPrice?: boolean;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', showPrice = true }) => {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-black shrink-0`}
      style={{
        backgroundColor: tier.bgColor,
        color: tier.color,
        border: `2px solid ${tier.borderColor}`,
        boxShadow: '0 0 0 3px rgba(255,255,255,0.85), 0 0 0 4px rgba(0,0,0,0.08)',
      }}
    >
      {showPrice ? `$${tier.price}` : ''}
    </div>
  );
};
