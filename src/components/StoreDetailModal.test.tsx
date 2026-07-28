import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoreDetailModal } from './StoreDetailModal';
import type { SushiroStore, GroupQueue } from '../types';

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

const mockQueue: GroupQueue = {
  storeQueue: ['201'],
  boothQueue: ['105', '106'],
  counterQueue: ['88'],
  mixedQueue: [],
  reservationQueue: [],
};

const defaultProps = {
  store: mockStore,
  queue: mockQueue,
  loading: false,
  isBookmarked: false,
  onClose: vi.fn(),
  onRefreshQueue: vi.fn(),
  onToggleBookmark: vi.fn(),
};

describe('StoreDetailModal', () => {
  it('renders store details correctly in active state', () => {
    render(<StoreDetailModal {...defaultProps} />);
    expect(screen.getByText('旺角店')).toBeInTheDocument();
    expect(screen.getByText('旺角彌敦道688號')).toBeInTheDocument();
    
    // Check for the queue type labeled headers
    expect(screen.getByText('桌席')).toBeInTheDocument();
    expect(screen.getByText('吧台')).toBeInTheDocument();
    expect(screen.getByText('現場/混合')).toBeInTheDocument();

    // Check that active queue numbers are shown (numbers appear in badge spans with '#' prefix and possible '叫號中' child span)
    const [queue105] = screen.getAllByText((_, el) => el?.textContent?.includes('#105') ?? false);
    expect(queue105).toBeInTheDocument();
    const [queue88] = screen.getAllByText((_, el) => el?.textContent?.includes('#88') ?? false);
    expect(queue88).toBeInTheDocument();
    const [queue201] = screen.getAllByText((_, el) => el?.textContent?.includes('#201') ?? false);
    expect(queue201).toBeInTheDocument();

    // Keypad is active and shows instructions
    expect(screen.getByText('請使用下方數字鍵盤輸入您手中的籌號')).toBeInTheDocument();
  });

  it('renders non-servicing state when store is CLOSED', () => {
    const closedStore = { ...mockStore, storeStatus: 'CLOSED' };
    render(<StoreDetailModal {...defaultProps} store={closedStore} />);

    // Placeholders are "—"
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBeGreaterThanOrEqual(3);

    // Shows finished validation warning message
    expect(screen.getByText('門市目前已收工，籌號計算器暫停使用')).toBeInTheDocument();

    // Stacked buttons "收工" and "等開工" are displayed
    expect(screen.getByText('收工')).toBeInTheDocument();
    expect(screen.getByText('等開工')).toBeInTheDocument();

    // Presets and numpad are disabled (opacity & cursor-not-allowed classes should be present)
    const presetBtn = screen.getByText('#88 (叫號中)');
    expect(presetBtn).toBeDisabled();
    expect(presetBtn).toHaveClass('cursor-not-allowed');

    const numpadBtn = screen.getByText('5');
    expect(numpadBtn).toBeDisabled();
    expect(numpadBtn).toHaveClass('cursor-not-allowed');
  });

  it('renders non-servicing state when store is finished (收工)', () => {
    const finishedStore = {
      ...mockStore,
      storeStatus: 'OPEN',
      netTicketStatus: 'OFFLINE_MANUAL',
      localTicketingStatus: 'OFF',
      wait: 0,
      waitingGroup: 0,
    };
    render(<StoreDetailModal {...defaultProps} store={finishedStore} />);

    expect(screen.getByText('門市目前已收工，籌號計算器暫停使用')).toBeInTheDocument();
    expect(screen.getByText('收工')).toBeInTheDocument();
    expect(screen.getByText('等開工')).toBeInTheDocument();
  });

  it('renders non-servicing state when store is walk-in stopped (停飛)', () => {
    const stoppedStore = {
      ...mockStore,
      storeStatus: 'OPEN',
      netTicketStatus: 'ONLINE',
      localTicketingStatus: 'OFF',
      wait: 10,
      waitingGroup: 2,
    };
    render(<StoreDetailModal {...defaultProps} store={stoppedStore} />);

    expect(screen.getByText('門市目前已收工，籌號計算器暫停使用')).toBeInTheDocument();
  });
});
