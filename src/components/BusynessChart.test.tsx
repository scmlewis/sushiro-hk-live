import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BusynessChart } from './BusynessChart';
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
