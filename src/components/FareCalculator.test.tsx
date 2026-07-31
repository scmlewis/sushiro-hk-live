import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FareCalculator } from './FareCalculator';
import { PRICE_TIERS } from '../data/menu';

describe('FareCalculator', () => {
  it('renders the calculator with default budget', () => {
    render(<FareCalculator />);
    expect(screen.getByText('價格計算器')).toBeInTheDocument();
    expect(screen.getByDisplayValue('80')).toBeInTheDocument();
  });

  it('renders price tier buttons', () => {
    render(<FareCalculator />);
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('$12')).toBeInTheDocument();
    expect(screen.getByText('$13')).toBeInTheDocument();
  });

  it('shows item count per tier', () => {
    render(<FareCalculator />);
    expect(screen.getAllByText(/款/).length).toBeGreaterThan(0);
  });

  it('allows selecting and deselecting tiers', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText('已選 1 項')).toBeInTheDocument();
  });

  it('updates total when tiers are selected', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText('當前總額')).toBeInTheDocument();
  });

  it('toggles tier selection on click', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(tier10Button).toHaveClass('border-[#aa151b]');
    fireEvent.click(tier10Button);
    expect(tier10Button).not.toHaveClass('border-[#aa151b]');
  });

  it('updates remaining budget correctly', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText('剩餘金額')).toBeInTheDocument();
  });

  it('shows over-budget warning when exceeding target', () => {
    render(<FareCalculator />);
    const budgetInput = screen.getByDisplayValue('80') as HTMLInputElement;
    fireEvent.change(budgetInput, { target: { value: '5' } });
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText(/已超出預算/)).toBeInTheDocument();
  });

  it('clears all selections', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    const clearButton = screen.getByText('清除').closest('button')!;
    fireEvent.click(clearButton);
    expect(screen.getByText('尚未選擇壽司')).toBeInTheDocument();
  });

  it('renders quick budget buttons', () => {
    render(<FareCalculator />);
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('shows combination suggestions when budget is set and tiers are selected', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText(/接近預算的組合/)).toBeInTheDocument();
  });

  it('updates budget when quick budget button is clicked', () => {
    render(<FareCalculator />);
    const hundredButton = screen.getByText('$100').closest('button')!;
    fireEvent.click(hundredButton);
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('renders tax calculation correctly', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText('含稅 (+10%)')).toBeInTheDocument();
  });

  it('renders all price tiers', () => {
    render(<FareCalculator />);
    const tierPrices = PRICE_TIERS.map((t) => t.label);
    tierPrices.forEach((price) => {
      expect(screen.getByText(price)).toBeInTheDocument();
    });
  });

  it('renders empty state when no tiers selected', () => {
    render(<FareCalculator />);
    expect(screen.getByText('尚未選擇壽司')).toBeInTheDocument();
  });

  it('shows selected count badge on tier buttons', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});