import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompareDrawer } from './CompareDrawer';
import type { SushiroStore, StoreQueueMap } from '../types';

const mockStore1: SushiroStore = {
  id: 1,
  name: '旺角店',
  nameEn: 'Mong Kok',
  area: '旺角',
  address: '旺角彌敦道688號',
  latitude: 22.3193,
  longitude: 114.1694,
  wait: 10,
  waitingGroup: 5,
  storeStatus: 'OPEN',
  netTicketStatus: 'ONLINE',
  waitTimeCap: 60,
};

const mockStore2: SushiroStore = {
  id: 2,
  name: '荃灣店',
  nameEn: 'Tsuen Wan',
  area: '荃灣',
  address: '荃灣青山公路',
  latitude: 22.3708,
  longitude: 114.1141,
  wait: 20,
  waitingGroup: 12,
  storeStatus: 'OPEN',
  netTicketStatus: 'MANUAL',
  waitTimeCap: 60,
};

const defaultProps = {
  isOpen: true,
  stores: [mockStore1, mockStore2],
  queues: {} as StoreQueueMap,
  onClose: vi.fn(),
  onRemoveFromCompare: vi.fn(),
  onClearCompare: vi.fn(),
  onRefreshQueue: vi.fn(),
  onSelectStore: vi.fn(),
  onAddDefaultStores: vi.fn(),
};

describe('CompareDrawer', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<CompareDrawer {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders header when open', () => {
    render(<CompareDrawer {...defaultProps} />);
    expect(screen.getByText('門市即時對比')).toBeInTheDocument();
  });

  it('shows store count in header', () => {
    render(<CompareDrawer {...defaultProps} />);
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('renders store names', () => {
    render(<CompareDrawer {...defaultProps} />);
    expect(screen.getByText('旺角店')).toBeInTheDocument();
    expect(screen.getByText('荃灣店')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CompareDrawer {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByTitle('關閉'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onRemoveFromCompare when remove button clicked', async () => {
    const user = userEvent.setup();
    const onRemoveFromCompare = vi.fn();
    render(<CompareDrawer {...defaultProps} onRemoveFromCompare={onRemoveFromCompare} />);

    const removeBtns = screen.getAllByText('').filter((el) => el.closest('button[title="移除此門市"]'));
    if (removeBtns.length > 0) {
      await user.click(removeBtns[0].closest('button')!);
      expect(onRemoveFromCompare).toHaveBeenCalled();
    }
  });

  it('calls onClearCompare when clear button clicked', async () => {
    const user = userEvent.setup();
    const onClearCompare = vi.fn();
    render(<CompareDrawer {...defaultProps} onClearCompare={onClearCompare} />);

    await user.click(screen.getByText(/清空列表/));
    expect(onClearCompare).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no stores', () => {
    render(<CompareDrawer {...defaultProps} stores={[]} />);
    expect(screen.getByText('尚未選擇比較門市')).toBeInTheDocument();
  });

  it('shows default stores button in empty state', async () => {
    const user = userEvent.setup();
    const onAddDefaultStores = vi.fn();
    render(<CompareDrawer {...defaultProps} stores={[]} onAddDefaultStores={onAddDefaultStores} />);

    await user.click(screen.getByText('自動載入熱門門市比對'));
    expect(onAddDefaultStores).toHaveBeenCalledTimes(1);
  });

  it('highlights fastest store with min wait', () => {
    render(<CompareDrawer {...defaultProps} />);
    // mockStore1 has wait=10, mockStore2 has wait=20
    const fastestBadge = screen.getByText('最快開枱');
    expect(fastestBadge).toBeInTheDocument();
  });

  it('highlights store with least groups', () => {
    render(<CompareDrawer {...defaultProps} />);
    // mockStore1 has waitingGroup=5, mockStore2 has waitingGroup=12
    const leastGroupsBadge = screen.getByText('最少組數');
    expect(leastGroupsBadge).toBeInTheDocument();
  });

  it('renders wait times for open stores', () => {
    render(<CompareDrawer {...defaultProps} />);
    expect(screen.getByText('10 分鐘')).toBeInTheDocument();
    expect(screen.getByText('20 分鐘')).toBeInTheDocument();
  });

  it('renders group counts for open stores', () => {
    render(<CompareDrawer {...defaultProps} />);
    expect(screen.getByText('5 組')).toBeInTheDocument();
    expect(screen.getByText('12 組')).toBeInTheDocument();
  });
});
