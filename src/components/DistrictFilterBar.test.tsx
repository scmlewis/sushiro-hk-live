import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DistrictFilterBar } from './DistrictFilterBar';
import type { SortOption } from '../types';

const defaultProps = {
  selectedArea: '',
  regionCounts: { all: 44, hkIsland: 12, kowloon: 15, nt: 17 },
  searchQuery: '',
  sortBy: 'wait-asc' as SortOption,
  onlyIssuingTickets: false,
  userLocation: null,
  locationLoading: false,
  onSelectArea: vi.fn(),
  onSearchChange: vi.fn(),
  onSortChange: vi.fn(),
  onToggleOnlyIssuing: vi.fn(),
  onRequestLocation: vi.fn(),
  viewMode: 'list' as const,
  onViewModeChange: vi.fn(),
};

describe('DistrictFilterBar', () => {
  it('renders search input', () => {
    render(<DistrictFilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/搜尋門市/)).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<DistrictFilterBar {...defaultProps} onSearchChange={onSearchChange} />);

    await user.type(screen.getByPlaceholderText(/搜尋門市/), '旺角');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('renders region filter buttons with counts', () => {
    render(<DistrictFilterBar {...defaultProps} />);
    expect(screen.getByText(/全港/)).toBeInTheDocument();
    expect(screen.getByText(/港島/)).toBeInTheDocument();
    expect(screen.getByText(/九龍/)).toBeInTheDocument();
    expect(screen.getByText(/新界/)).toBeInTheDocument();
  });

  it('calls onSelectArea when region button clicked', async () => {
    const user = userEvent.setup();
    const onSelectArea = vi.fn();
    render(<DistrictFilterBar {...defaultProps} onSelectArea={onSelectArea} />);

    await user.click(screen.getByText(/港島/));
    expect(onSelectArea).toHaveBeenCalledWith('港島');
  });

  it('calls onToggleOnlyIssuing when filter toggled', async () => {
    const user = userEvent.setup();
    const onToggleOnlyIssuing = vi.fn();
    render(<DistrictFilterBar {...defaultProps} onToggleOnlyIssuing={onToggleOnlyIssuing} />);

    await user.click(screen.getByText('只看派籌中'));
    expect(onToggleOnlyIssuing).toHaveBeenCalledTimes(1);
  });

  it('calls onRequestLocation when GPS button clicked', async () => {
    const user = userEvent.setup();
    const onRequestLocation = vi.fn();
    render(<DistrictFilterBar {...defaultProps} onRequestLocation={onRequestLocation} />);

    await user.click(screen.getByTitle('開啟 GPS 尋找附近門市'));
    expect(onRequestLocation).toHaveBeenCalledTimes(1);
  });

  it('shows GPS 定位中... when loading', () => {
    render(<DistrictFilterBar {...defaultProps} locationLoading={true} />);
    expect(screen.getByText('GPS 定位中...')).toBeInTheDocument();
  });

  it('shows GPS 已定位 when location available', () => {
    render(<DistrictFilterBar {...defaultProps} userLocation={{ latitude: 22.3, longitude: 114.2 }} />);
    expect(screen.getByText('GPS 已定位')).toBeInTheDocument();
  });

  it('renders sort dropdown', () => {
    render(<DistrictFilterBar {...defaultProps} />);
    expect(screen.getByDisplayValue(/等候時間最短/)).toBeInTheDocument();
  });

  it('calls onSortChange when sort option selected', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<DistrictFilterBar {...defaultProps} onSortChange={onSortChange} />);

    await user.selectOptions(screen.getByDisplayValue(/等候時間最短/), 'wait-desc');
    expect(onSortChange).toHaveBeenCalledWith('wait-desc');
  });
});
