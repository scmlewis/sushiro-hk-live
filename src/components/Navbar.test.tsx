import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from './Navbar';
import { TOTAL_STORE_COUNT } from '../config';

const defaultProps = {
  lastUpdated: Date.now(),
  loading: false,
  bookmarkCount: 2,
  compareCount: 1,
  storeCount: TOTAL_STORE_COUNT,
  activeMainTab: 'all' as const,
  onSelectTab: vi.fn(),
  onGlobalRefresh: vi.fn(),
};

describe('Navbar', () => {
  it('renders the brand name', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('壽司郎 HK')).toBeInTheDocument();
  });

  it('renders LIVE badge', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('門市')).toBeInTheDocument();
    expect(screen.getAllByText(/關注/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/比較/).length).toBeGreaterThan(0);
    expect(screen.getByText('價格')).toBeInTheDocument();
    expect(screen.getAllByText('關於').length).toBeGreaterThan(0);
  });

  it('displays formatted time', () => {
    render(<Navbar {...defaultProps} />);
    // Should show a time format like HH:MM:SS
    const timeElements = screen.getAllByText(/--:--:--|\d{2}:\d{2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('shows --:--:-- when lastUpdated is null', () => {
    render(<Navbar {...defaultProps} lastUpdated={null} />);
    expect(screen.getAllByText('--:--:--').length).toBeGreaterThan(0);
  });

  it('calls onSelectTab with correct tab when clicked', async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    render(<Navbar {...defaultProps} onSelectTab={onSelectTab} />);

    // Click the first "關於" element (button contains both mobile/desktop labels)
    await user.click(screen.getAllByText('關於')[0].closest('button')!);
    expect(onSelectTab).toHaveBeenCalledWith('about');
  });

  it('calls onGlobalRefresh when refresh button clicked', async () => {
    const user = userEvent.setup();
    const onGlobalRefresh = vi.fn();
    render(<Navbar {...defaultProps} onGlobalRefresh={onGlobalRefresh} />);

    const refreshBtn = screen.getByTitle('重新載入全港門市即時資料');
    await user.click(refreshBtn);
    expect(onGlobalRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows 更新中… text when loading', () => {
    render(<Navbar {...defaultProps} loading={true} />);
    expect(screen.getByText('更新中…')).toBeInTheDocument();
  });

  it('shows 更新資料 text when not loading', () => {
    render(<Navbar {...defaultProps} loading={false} />);
    expect(screen.getByText('更新資料')).toBeInTheDocument();
  });

  it('disables refresh button when loading', () => {
    render(<Navbar {...defaultProps} loading={true} />);
    const refreshBtn = screen.getByTitle('重新載入全港門市即時資料');
    expect(refreshBtn).toBeDisabled();
  });

  it('shows bookmark count in tab', () => {
    render(<Navbar {...defaultProps} bookmarkCount={5} />);
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('shows compare count in tab', () => {
    render(<Navbar {...defaultProps} compareCount={3} />);
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });
});
