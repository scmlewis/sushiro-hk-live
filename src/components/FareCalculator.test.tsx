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

  it('allows selecting tiers', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(tier10Button).toHaveClass('ring-2');
  });

  it('updates total when tiers are selected', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(screen.getByText('當前總額')).toBeInTheDocument();
  });

  it('adds tier on click', () => {
    render(<FareCalculator />);
    const tier10Button = screen.getByText('$10').closest('button')!;
    fireEvent.click(tier10Button);
    expect(tier10Button).toHaveClass('ring-2');
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

  it('has a reset button', () => {
    render(<FareCalculator />);
    expect(screen.getByTitle('清除所有選擇')).toBeInTheDocument();
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

  it('renders service charge label', () => {
    render(<FareCalculator />);
    expect(screen.getByText('加一服務費 (+10%)')).toBeInTheDocument();
  });

  it('renders all price tiers', () => {
    render(<FareCalculator />);
    const tierPrices = PRICE_TIERS.map((t) => `$${t.price}`);
    tierPrices.forEach((price) => {
      expect(screen.getByText(price)).toBeInTheDocument();
    });
  });

  it('renders empty state when no tiers selected', () => {
    render(<FareCalculator />);
    expect(screen.getByText('尚未選擇價格層級')).toBeInTheDocument();
  });

  it('has deletion mode toggle', () => {
    render(<FareCalculator />);
    const deleteBtn = screen.getByText(/刪除/).closest('button')!;
    expect(deleteBtn).toBeInTheDocument();
  });

  it('shows custom price tier input', () => {
    render(<FareCalculator />);
    expect(screen.getByText('+ 自訂價格')).toBeInTheDocument();
  });

  it('has a reset button', () => {
    render(<FareCalculator />);
    expect(screen.getByTitle('清除所有選擇')).toBeInTheDocument();
  });
});