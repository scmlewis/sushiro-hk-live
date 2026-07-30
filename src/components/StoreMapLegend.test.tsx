import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoreMapLegend } from './StoreMapLegend';

describe('StoreMapLegend', () => {
  it('renders all legend labels', () => {
    render(<StoreMapLegend />);
    expect(screen.getByText('即時入座')).toBeInTheDocument();
    expect(screen.getByText('<15分')).toBeInTheDocument();
    expect(screen.getByText('15-29分')).toBeInTheDocument();
    expect(screen.getByText('30-59分')).toBeInTheDocument();
    expect(screen.getByText('≥60分')).toBeInTheDocument();
    expect(screen.getByText('現場派籌已暫停')).toBeInTheDocument();
    expect(screen.getByText('非營業中')).toBeInTheDocument();
  });

  it('renders color dots for each legend item', () => {
    const { container } = render(<StoreMapLegend />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(7);
  });

  it('has correct color styles on dots', () => {
    const { container } = render(<StoreMapLegend />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots[0]).toHaveStyle({ backgroundColor: '#3b82f6' });
    expect(dots[6]).toHaveStyle({ backgroundColor: '#6b7280' });
  });

  it('is positioned absolutely in bottom-right', () => {
    const { container } = render(<StoreMapLegend />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('absolute');
    expect(wrapper.className).toContain('bottom-4');
    expect(wrapper.className).toContain('right-4');
  });
});
