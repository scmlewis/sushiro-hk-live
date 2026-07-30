import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarksSection } from './BookmarksSection';
import type { SushiroStore, StoreQueueMap } from '../types';

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
  bookmarkedStores: [] as SushiroStore[],
  queues: {} as StoreQueueMap,
  compareList: [] as number[],
  autoRefreshTimer: 5,
  onToggleBookmark: vi.fn(),
  onToggleCompare: vi.fn(),
  onRefreshQueue: vi.fn(),
  onSelectStore: vi.fn(),
  onGoToAllStores: vi.fn(),
  onCompareAllBookmarks: vi.fn(),
  onClearAllBookmarks: vi.fn(),
};

describe('BookmarksSection', () => {
  it('shows empty state when no bookmarks', () => {
    render(<BookmarksSection {...defaultProps} />);
    expect(screen.getByText('尚未加入關注門市')).toBeInTheDocument();
  });

  it('shows "瀏覽全港門市列表" button in empty state', async () => {
    const user = userEvent.setup();
    const onGoToAllStores = vi.fn();
    render(<BookmarksSection {...defaultProps} onGoToAllStores={onGoToAllStores} />);

    await user.click(screen.getByText('瀏覽全港門市列表'));
    expect(onGoToAllStores).toHaveBeenCalledTimes(1);
  });

  it('renders bookmarked stores when provided', () => {
    render(<BookmarksSection {...defaultProps} bookmarkedStores={[mockStore]} />);
    expect(screen.getByText('旺角店')).toBeInTheDocument();
  });

  it('shows store count badge', () => {
    render(<BookmarksSection {...defaultProps} bookmarkedStores={[mockStore]} />);
    expect(screen.getByText('1 間')).toBeInTheDocument();
  });

  it('shows auto-refresh timer', () => {
    render(<BookmarksSection {...defaultProps} bookmarkedStores={[mockStore]} autoRefreshTimer={7} />);
    expect(screen.getByText('7S')).toBeInTheDocument();
  });

  it('renders clear all button when callback provided', () => {
    render(<BookmarksSection {...defaultProps} bookmarkedStores={[mockStore]} onClearAllBookmarks={vi.fn()} />);
    expect(screen.getByText(/清空關注/)).toBeInTheDocument();
  });

  it('calls onClearAllBookmarks when clear button clicked', async () => {
    const user = userEvent.setup();
    const onClearAllBookmarks = vi.fn();
    render(<BookmarksSection {...defaultProps} bookmarkedStores={[mockStore]} onClearAllBookmarks={onClearAllBookmarks} />);

    await user.click(screen.getByText(/清空關注/));
    expect(onClearAllBookmarks).toHaveBeenCalledTimes(1);
  });

  it('renders compare all button when >1 bookmarked stores', () => {
    const store2 = { ...mockStore, id: 2, name: '荃灣店' };
    render(<BookmarksSection {...defaultProps} bookmarkedStores={[mockStore, store2]} />);
    expect(screen.getByText('比對關注')).toBeInTheDocument();
  });

  it('does not render compare all button with only 1 store', () => {
    render(<BookmarksSection {...defaultProps} bookmarkedStores={[mockStore]} />);
    expect(screen.queryByText('比對關注')).not.toBeInTheDocument();
  });
});
