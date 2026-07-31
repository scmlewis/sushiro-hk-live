import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BusynessChart, getBarColor, CustomTooltip } from './BusynessChart';
import type { PopularTimesHour } from '../types';

describe('BusynessChart', () => {
  const mockPopularTimes: PopularTimesHour[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    busy: i >= 11 && i <= 20 ? 50 + Math.floor(Math.random() * 40) : 10 + Math.floor(Math.random() * 20),
  }));

  it('renders the chart title', () => {
    render(<BusynessChart popularTimes={mockPopularTimes} currentHour={14} />);
    expect(screen.getByText('今日人流')).toBeInTheDocument();
  });

  it('renders the source label', () => {
    render(<BusynessChart popularTimes={mockPopularTimes} currentHour={14} />);
    expect(screen.getByText('資料來源：Google')).toBeInTheDocument();
  });

  it('renders the legend', () => {
    render(<BusynessChart popularTimes={mockPopularTimes} currentHour={14} />);
    expect(screen.getByText('目前時段')).toBeInTheDocument();
    expect(screen.getByText('已過時段')).toBeInTheDocument();
  });

  it('does not render when popularTimes is null', () => {
    const { container } = render(<BusynessChart popularTimes={null} currentHour={14} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when popularTimes is empty', () => {
    const { container } = render(<BusynessChart popularTimes={[]} currentHour={14} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('getBarColor', () => {
  it('returns gray for past hours', () => {
    expect(getBarColor(10, 14, 50)).toBe('#d4d4d4');
  });

  it('returns brand red for current hour', () => {
    expect(getBarColor(14, 14, 50)).toBe('#aa151b');
  });

  it('returns brand red for busy >= 75', () => {
    expect(getBarColor(16, 14, 75)).toBe('#aa151b');
    expect(getBarColor(16, 14, 90)).toBe('#aa151b');
  });

  it('returns orange for busy >= 50', () => {
    expect(getBarColor(16, 14, 50)).toBe('#f97316');
    expect(getBarColor(16, 14, 74)).toBe('#f97316');
  });

  it('returns yellow for busy >= 25', () => {
    expect(getBarColor(16, 14, 25)).toBe('#eab308');
    expect(getBarColor(16, 14, 49)).toBe('#eab308');
  });

  it('returns green for busy < 25', () => {
    expect(getBarColor(16, 14, 0)).toBe('#10b981');
    expect(getBarColor(16, 14, 24)).toBe('#10b981');
  });
});

describe('CustomTooltip', () => {
  it('renders tooltip when active with payload', () => {
    const { container } = render(
      <CustomTooltip
        active={true}
        payload={[{ payload: { hour: 14 }, value: 65 }]}
      />
    );
    expect(container.textContent).toContain('14:00 — 65%');
  });

  it('returns null when not active', () => {
    const { container } = render(
      <CustomTooltip active={false} payload={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when no payload', () => {
    const { container } = render(
      <CustomTooltip active={true} payload={[]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
