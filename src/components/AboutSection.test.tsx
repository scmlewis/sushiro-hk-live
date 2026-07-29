import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutSection } from './AboutSection';

const defaultProps = {
  textSize: 'M' as const,
  onTextSizeChange: vi.fn(),
};

describe('AboutSection', () => {
  it('renders the about header', () => {
    render(<AboutSection {...defaultProps} />);
    expect(screen.getByText('關於系統與使用說明')).toBeInTheDocument();
  });

  it('renders all four feature cards', () => {
    render(<AboutSection {...defaultProps} />);
    expect(screen.getByText('全港門市即時列表')).toBeInTheDocument();
    expect(screen.getByText('我的關注門市')).toBeInTheDocument();
    expect(screen.getByText('門市比對')).toBeInTheDocument();
    expect(screen.getByText('籌號進度估算')).toBeInTheDocument();
  });

  it('renders text size buttons', () => {
    render(<AboutSection {...defaultProps} />);
    expect(screen.getByText('細')).toBeInTheDocument();
    expect(screen.getByText('中（預設）')).toBeInTheDocument();
    expect(screen.getByText('大')).toBeInTheDocument();
  });

  it('calls onTextSizeChange when a size button is clicked', async () => {
    const user = userEvent.setup();
    const onTextSizeChange = vi.fn();
    render(<AboutSection {...defaultProps} onTextSizeChange={onTextSizeChange} />);

    await user.click(screen.getByText('大'));
    expect(onTextSizeChange).toHaveBeenCalledWith('L');
  });

  it('calls onTextSizeChange with S when small button clicked', async () => {
    const user = userEvent.setup();
    const onTextSizeChange = vi.fn();
    render(<AboutSection {...defaultProps} onTextSizeChange={onTextSizeChange} />);

    await user.click(screen.getByText('細'));
    expect(onTextSizeChange).toHaveBeenCalledWith('S');
  });

  it('highlights the active text size button', () => {
    render(<AboutSection {...defaultProps} textSize="L" />);
    const largeBtn = screen.getByText('大');
    expect(largeBtn.className).toContain('bg-[#aa151b]');
  });

  it('renders Sushiro official website link', () => {
    render(<AboutSection {...defaultProps} />);
    const link = screen.getByText('壽司郎官方網站').closest('a');
    expect(link).toHaveAttribute('href', 'https://sushirohk.com.hk/');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders GitHub repo link', () => {
    render(<AboutSection {...defaultProps} />);
    const link = screen.getByText('GitHub Repo').closest('a');
    expect(link).toHaveAttribute('href', 'https://github.com/scmlewis/sushiro-hk-live');
  });

  it('renders author profile link', () => {
    render(<AboutSection {...defaultProps} />);
    const link = screen.getByText('@scmlewis').closest('a');
    expect(link).toHaveAttribute('href', 'https://github.com/scmlewis');
  });
});
