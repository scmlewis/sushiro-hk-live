import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiveBusynessBadge, getBusynessLevel } from './LiveBusynessBadge';

describe('LiveBusynessBadge', () => {
  it('renders quiet state (0-24%)', () => {
    render(<LiveBusynessBadge live={15} />);
    expect(screen.getByText('目前人流')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('清靜')).toBeInTheDocument();
  });

  it('renders moderate state (25-49%)', () => {
    render(<LiveBusynessBadge live={40} />);
    expect(screen.getByText('適中')).toBeInTheDocument();
  });

  it('renders busy state (50-74%)', () => {
    render(<LiveBusynessBadge live={60} />);
    expect(screen.getByText('繁忙')).toBeInTheDocument();
  });

  it('renders very busy state (75-100%)', () => {
    render(<LiveBusynessBadge live={85} />);
    expect(screen.getByText('非常繁忙')).toBeInTheDocument();
  });

  it('does not render when live is null', () => {
    const { container } = render(<LiveBusynessBadge live={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('getBusynessLevel', () => {
  it('returns emerald for quiet (0-24)', () => {
    const level = getBusynessLevel(0);
    expect(level.label).toBe('清靜');
    expect(level.color).toContain('emerald');
    expect(level.bgColor).toContain('emerald');
    expect(level.borderColor).toContain('emerald');
  });

  it('returns yellow for moderate (25-49)', () => {
    const level = getBusynessLevel(25);
    expect(level.label).toBe('適中');
    expect(level.color).toContain('yellow');

    const level49 = getBusynessLevel(49);
    expect(level49.label).toBe('適中');
  });

  it('returns orange for busy (50-74)', () => {
    const level = getBusynessLevel(50);
    expect(level.label).toBe('繁忙');
    expect(level.color).toContain('orange');

    const level74 = getBusynessLevel(74);
    expect(level74.label).toBe('繁忙');
  });

  it('returns red for very busy (75-100)', () => {
    const level = getBusynessLevel(75);
    expect(level.label).toBe('非常繁忙');
    expect(level.color).toContain('red');

    const level100 = getBusynessLevel(100);
    expect(level100.label).toBe('非常繁忙');
  });

  it('includes dark mode classes', () => {
    const level = getBusynessLevel(50);
    expect(level.bgColor).toContain('dark:');
    expect(level.borderColor).toContain('dark:');
    expect(level.color).toContain('dark:');
  });
});
