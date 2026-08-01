import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import type { SushiroStore } from './types';

const mockStores: SushiroStore[] = [
  {
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
  },
  {
    id: 2,
    name: '銅鑼灣店',
    nameEn: 'Causeway Bay',
    area: '銅鑼灣',
    address: '銅鑼灣軒尼詩道',
    latitude: 22.2783,
    longitude: 114.1747,
    wait: 5,
    waitingGroup: 3,
    storeStatus: 'OPEN',
    netTicketStatus: 'MANUAL',
    localTicketingStatus: 'ON',
    waitTimeCap: 60,
  },
  {
    id: 3,
    name: '荃灣店',
    nameEn: 'Tsuen Wan',
    area: '荃灣',
    address: '荃灣青山公路',
    latitude: 22.3708,
    longitude: 114.1141,
    wait: 0,
    waitingGroup: 0,
    storeStatus: 'OPEN',
    netTicketStatus: 'ONLINE',
    localTicketingStatus: 'ON',
    waitTimeCap: 60,
  },
];

describe('App integration flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/stores')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, stores: mockStores, timestamp: Date.now() }),
        });
      }
      if (url.includes('/api/queue')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              queue: {
                storeQueue: [],
                boothQueue: ['#105', '#106'],
                counterQueue: ['#88'],
                mixedQueue: [],
                reservationQueue: [],
              },
              timestamp: Date.now(),
            }),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  it('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText('壽司郎 HK')).toBeInTheDocument();
  });

  it('loads and displays stores', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('旺角店')).toBeInTheDocument();
    });
    expect(screen.getByText('銅鑼灣店')).toBeInTheDocument();
    expect(screen.getByText('荃灣店')).toBeInTheDocument();
  });

  it('can switch between tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('旺角店')).toBeInTheDocument();
    });

    // Switch to About tab
    await user.click(screen.getAllByText('關於')[0].closest('button')!);

    // AnimatePresence delays rendering, wait for it
    await waitFor(() => {
      expect(screen.getByText('系統簡介與使用說明')).toBeInTheDocument();
    });

    // Switch back to All Stores
    await user.click(screen.getByText('門市'));
    await waitFor(() => {
      expect(screen.getByText('旺角店')).toBeInTheDocument();
    });
  });

  it('can switch to bookmarks tab and see empty state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('旺角店')).toBeInTheDocument();
    });

    // Click the bookmarks tab
    const bookmarkBtns = screen.getAllByText(/關注/);
    // The bookmarks tab button contains both desktop and mobile text
    const bookmarkBtn = bookmarkBtns[0].closest('button')!;
    await user.click(bookmarkBtn);

    await waitFor(() => {
      expect(screen.getByText('尚未加入關注門市')).toBeInTheDocument();
    });
  });

  it('can search for stores', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('旺角店')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/搜尋門市/);
    await user.type(searchInput, '旺角');

    await waitFor(() => {
      expect(screen.getByText('旺角店')).toBeInTheDocument();
      expect(screen.queryByText('銅鑼灣店')).not.toBeInTheDocument();
    });
  });

  it('can toggle text size in about page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('旺角店')).toBeInTheDocument();
    });

    // Go to About
    await user.click(screen.getAllByText('關於')[0].closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('文字大小')).toBeInTheDocument();
    });

    // Click Large
    await user.click(screen.getByText('大'));
    // The root div should have fontSize 19px
    const rootDiv = document.querySelector('.min-h-screen');
    expect(rootDiv?.getAttribute('style')).toContain('19px');
  });
});
