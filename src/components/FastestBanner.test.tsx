// src/components/FastestBanner.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FastestBanner } from './FastestBanner';
import type { SushiroStore } from '../types';

const mk = (id: number, wait: number): SushiroStore => ({
  id, name: `店${id}`, nameEn: '', area: '旺角', address: 'a',
  latitude: 0, longitude: 0, wait, waitingGroup: 1,
  storeStatus: 'OPEN', netTicketStatus: 'ONLINE', localTicketingStatus: 'ON',
  waitTimeCap: 60,
} as SushiroStore);

describe('FastestBanner', () => {
  it('renders nothing when no stores', () => {
    const { container } = render(<FastestBanner stores={[]} hasLocation={false} onSelect={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows top 3 and calls onSelect on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const stores = [mk(1, 30), mk(2, 5), mk(3, 10), mk(4, 0)];
    render(<FastestBanner stores={stores} hasLocation={false} onSelect={onSelect} />);
    expect(screen.getByText(/最快 3 間/)).toBeInTheDocument();
    await user.click(screen.getByText('店4'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
  });
});
