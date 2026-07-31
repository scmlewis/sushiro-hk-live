import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StoreDetailModal } from './StoreDetailModal';
import type { SushiroStore, GroupQueue } from '../types';

vi.mock('./BusynessChart', () => ({
  BusynessChart: ({ popularTimes, currentHour }: any) => (
    <div data-testid="busyness-chart">
      {popularTimes ? `Chart with ${popularTimes.length} hours` : 'No data'}
    </div>
  ),
}));

vi.mock('./LiveBusynessBadge', () => ({
  LiveBusynessBadge: ({ live }: any) => (
    <div data-testid="live-busyness-badge">
      {live !== null ? `Live: ${live}%` : 'No data'}
    </div>
  ),
}));

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
  mixedQueue: ['74-1', '74-2'],
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
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders store details correctly in active state', () => {
    render(<StoreDetailModal {...defaultProps} />);
    expect(screen.getByText('旺角店')).toBeInTheDocument();
    expect(screen.getByText('旺角彌敦道688號')).toBeInTheDocument();
    
    // Check for the latest calling numbers section
    expect(screen.getByText('最新叫號')).toBeInTheDocument();

    // Check that recent queue numbers are shown (sorted: 74-1, 74-2, 88 — top 3 smallest)
    const [queue741] = screen.getAllByText((_, el) => el?.textContent?.includes('#74-1') ?? false);
    expect(queue741).toBeInTheDocument();
    const [queue742] = screen.getAllByText((_, el) => el?.textContent?.includes('#74-2') ?? false);
    expect(queue742).toBeInTheDocument();
    const [queue88] = screen.getAllByText((_, el) => el?.textContent?.includes('#88') ?? false);
    expect(queue88).toBeInTheDocument();

    // Keypad is active and shows instructions
    expect(screen.getByText('請使用下方數字鍵盤輸入您手中的籌號')).toBeInTheDocument();
  });

  it('renders non-servicing state when store is CLOSED', () => {
    const closedStore = { ...mockStore, storeStatus: 'CLOSED' as const };
    render(<StoreDetailModal {...defaultProps} store={closedStore} />);

    // Shows finished validation warning message
    expect(screen.getByText('門市非營業中，籌號計算器暫停使用')).toBeInTheDocument();

     // Stacked buttons "非營業中" and "等待開門" are displayed
     expect(screen.getAllByText('非營業中').length).toBeGreaterThan(0);
    expect(screen.getByText('等待開門')).toBeInTheDocument();

    // Numpad is disabled
    const numpadBtn = screen.getByText('5');
    expect(numpadBtn).toBeDisabled();
    expect(numpadBtn).toHaveClass('cursor-not-allowed');
  });

   it('renders non-servicing state when store is finished (非營業中)', () => {
    const finishedStore = {
      ...mockStore,
      storeStatus: 'OPEN' as const,
      netTicketStatus: 'OFFLINE_MANUAL' as const,
      localTicketingStatus: 'OFF' as const,
      wait: 0,
      waitingGroup: 0,
    };
    render(<StoreDetailModal {...defaultProps} store={finishedStore} />);

     expect(screen.getByText('門市非營業中，籌號計算器暫停使用')).toBeInTheDocument();
     expect(screen.getAllByText('非營業中').length).toBeGreaterThan(0);
     expect(screen.getByText('等待開門')).toBeInTheDocument();
  });

   it('renders calculator for walk-in stopped store (停籌) with waiting groups', () => {
    const stoppedStore = {
      ...mockStore,
      storeStatus: 'OPEN' as const,
      netTicketStatus: 'ONLINE' as const,
      localTicketingStatus: 'OFF' as const,
      wait: 10,
      waitingGroup: 2,
    };
    render(<StoreDetailModal {...defaultProps} store={stoppedStore} />);

    expect(screen.getByText('請使用下方數字鍵盤輸入您手中的籌號')).toBeInTheDocument();
  });

  it('shows 即時入座 when store is open but has no queues', () => {
    const noQueueQueue: GroupQueue = {
      storeQueue: [],
      boothQueue: [],
      counterQueue: [],
      mixedQueue: [],
      reservationQueue: [],
    };
    render(<StoreDetailModal {...defaultProps} queue={noQueueQueue} />);

    // Shows no-queue message — 即時入座 directly
    expect(screen.getByText('目前無輪候，可即時入座')).toBeInTheDocument();
  });

  it('shows 即時入座 and 約0分 when entering ticket with no queues', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const noQueueQueue: GroupQueue = {
      storeQueue: [],
      boothQueue: [],
      counterQueue: [],
      mixedQueue: [],
      reservationQueue: [],
    };
    render(<StoreDetailModal {...defaultProps} queue={noQueueQueue} />);

    // Enter a ticket number
    await user.click(screen.getByText('2'));
    await user.click(screen.getByText('2'));
    await user.click(screen.getByText('2'));

    // Should show 即時入座 and 約0分鐘
    expect(screen.getByText('即時入座')).toBeInTheDocument();
    expect(screen.getByText('約0分鐘')).toBeInTheDocument();
    expect(screen.getByText('目前無輪候，可即時入座')).toBeInTheDocument();
  });

  it('fetches and displays busyness data when store is selected', async () => {
    const mockBusyness = {
      success: true,
      busyness: {
        live: 65,
        popularTimes: Array.from({ length: 24 }, (_, i) => ({ hour: i, busy: 50 })),
        currentHour: 14,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockBusyness),
    }) as any;

    render(
      <StoreDetailModal
        store={mockStore}
        queue={null}
        loading={false}
        isBookmarked={false}
        onClose={vi.fn()}
        onRefreshQueue={vi.fn()}
        onToggleBookmark={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('live-busyness-badge')).toBeInTheDocument();
      expect(screen.getByTestId('busyness-chart')).toBeInTheDocument();
    });
  });
});
