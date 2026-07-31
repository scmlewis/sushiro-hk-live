import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiveBusynessBadge } from './LiveBusynessBadge';

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
