import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';
import type { ToastMessage } from '../types';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} onDismiss={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders toast text', () => {
    render(<Toast toast={{ id: '1', text: 'Test message', type: 'success' }} onDismiss={vi.fn()} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders success icon for success type', () => {
    render(<Toast toast={{ id: '1', text: 'Done!', type: 'success' }} onDismiss={vi.fn()} />);
    const icon = screen.getByText('Done!').closest('div')?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders error icon for error type', () => {
    render(<Toast toast={{ id: '1', text: 'Error!', type: 'error' }} onDismiss={vi.fn()} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('calls onDismiss when X button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: '1', text: 'Click to dismiss', type: 'info' }} onDismiss={onDismiss} />);

    const closeBtn = screen.getByLabelText('Close message');
    await user.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 3200ms', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: '1', text: 'Auto dismiss', type: 'warning' }} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss before 3200ms', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: '1', text: 'Not yet', type: 'info' }} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
