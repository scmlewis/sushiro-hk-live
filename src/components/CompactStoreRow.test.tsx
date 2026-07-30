import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompactStoreRow } from './CompactStoreRow';
import type { SushiroStore } from '../types';

const mockStore: SushiroStore = {
  id: 1,
  name: '旺角店',
  nameEn: 'Mong Kok',
  area: '旺角',
  address: '旺角彌敦道688號',
  latitude: 22.3193,
  longitude: 114.1694,
  wait: 15,
  waitingGroup: 8,
  storeStatus: 'OPEN',
  netTicketStatus: 'ONLINE',
  localTicketingStatus: 'ON',
  waitTimeCap: 60,
};

const defaultProps = {
  store: mockStore,
  queue: undefined,
  queueLoading: false,
  isBookmarked: false,
  isComparing: false,
  onToggleBookmark: vi.fn(),
  onToggleCompare: vi.fn(),
  onRefreshQueue: vi.fn(),
  onSelectStore: vi.fn(),
};

describe('CompactStoreRow', () => {
  it('renders store name', () => {
    render(<CompactStoreRow {...defaultProps} />);
    expect(screen.getByText('旺角店')).toBeInTheDocument();
  });

  it('renders wait time for open store', () => {
    render(<CompactStoreRow {...defaultProps} />);
    expect(screen.getByText('15分')).toBeInTheDocument();
  });

  it('renders 非營業中 for closed store', () => {
    render(<CompactStoreRow {...defaultProps} store={{ ...mockStore, storeStatus: 'CLOSED' }} />);
    expect(screen.getByText('非營業中')).toBeInTheDocument();
  });

   it('renders 停籌 when localTicketingStatus is OFF', () => {
     render(<CompactStoreRow {...defaultProps} store={{ ...mockStore, localTicketingStatus: 'OFF' }} />);
     expect(screen.getByText('停籌')).toBeInTheDocument();
  });

   it('renders 停籌 when store has finished servicing', () => {
    render(
      <CompactStoreRow
        {...defaultProps}
        store={{
          ...mockStore,
          storeStatus: 'OPEN',
          netTicketStatus: 'OFFLINE_MANUAL',
          localTicketingStatus: 'OFF',
          wait: 0,
          waitingGroup: 0,
        }}
      />
    );
     expect(screen.getByText('停籌')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('renders group count for open store', () => {
    render(<CompactStoreRow {...defaultProps} />);
    expect(screen.getByText('8組')).toBeInTheDocument();
  });

  it('renders -- for closed store group count', () => {
    render(<CompactStoreRow {...defaultProps} store={{ ...mockStore, storeStatus: 'CLOSED' }} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('calls onToggleBookmark when heart button clicked', async () => {
    const user = userEvent.setup();
    const onToggleBookmark = vi.fn();
    render(<CompactStoreRow {...defaultProps} onToggleBookmark={onToggleBookmark} />);

    await user.click(screen.getByTitle('加入關注'));
    expect(onToggleBookmark).toHaveBeenCalledWith(mockStore);
  });

  it('shows 取消關注 when bookmarked', () => {
    render(<CompactStoreRow {...defaultProps} isBookmarked={true} />);
    expect(screen.getByTitle('取消關注')).toBeInTheDocument();
  });

  it('calls onToggleCompare when compare button clicked', async () => {
    const user = userEvent.setup();
    const onToggleCompare = vi.fn();
    render(<CompactStoreRow {...defaultProps} onToggleCompare={onToggleCompare} />);

    await user.click(screen.getByTitle('加入比較'));
    expect(onToggleCompare).toHaveBeenCalledWith(mockStore);
  });

  it('calls onSelectStore when 詳情 button clicked', async () => {
    const user = userEvent.setup();
    const onSelectStore = vi.fn();
    render(<CompactStoreRow {...defaultProps} onSelectStore={onSelectStore} />);

    await user.click(screen.getByText('詳情'));
    expect(onSelectStore).toHaveBeenCalledWith(mockStore, 'live');
  });

  it('calls onRefreshQueue when refresh button clicked', async () => {
    const user = userEvent.setup();
    const onRefreshQueue = vi.fn();
    render(<CompactStoreRow {...defaultProps} onRefreshQueue={onRefreshQueue} />);

    await user.click(screen.getByTitle('更新叫號'));
    expect(onRefreshQueue).toHaveBeenCalledWith(1, '旺角店');
  });

  it('disables refresh button when loading', () => {
    render(<CompactStoreRow {...defaultProps} queueLoading={true} />);
    const refreshBtn = screen.getByTitle('更新叫號');
    expect(refreshBtn).toBeDisabled();
  });

  it('renders maps link', () => {
    render(<CompactStoreRow {...defaultProps} />);
    const mapsLink = screen.getByTitle('Google 地圖');
    expect(mapsLink).toHaveAttribute('target', '_blank');
  });
});
