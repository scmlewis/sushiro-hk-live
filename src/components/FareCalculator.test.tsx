import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FareCalculator } from './FareCalculator';

describe('FareCalculator', () => {
  it('renders the calculator with default budget', () => {
    render(<FareCalculator />);
    expect(screen.getByText('價格計算器')).toBeInTheDocument();
    expect(screen.getByDisplayValue('80')).toBeInTheDocument();
  });

  it('renders main plate tiers section', () => {
    render(<FareCalculator />);
    expect(screen.getByText('主要碟子')).toBeInTheDocument();
  });

  it('renders other price tiers section', () => {
    render(<FareCalculator />);
    expect(screen.getByText('熱食 / 甜品 / 其他')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('$13')).toBeInTheDocument();
    expect(screen.getByText('$18')).toBeInTheDocument();
  });

  it('renders custom price input', () => {
    render(<FareCalculator />);
    expect(screen.getByPlaceholderText('自訂 $')).toBeInTheDocument();
  });

  it('renders service charge label', () => {
    render(<FareCalculator />);
    expect(screen.getByText('實際賬單 (+10%)')).toBeInTheDocument();
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

  it('renders quick budget buttons', () => {
    render(<FareCalculator />);
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('updates budget when quick budget button is clicked', () => {
    render(<FareCalculator />);
    const hundredButton = screen.getByText('$100').closest('button')!;
    fireEvent.click(hundredButton);
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('renders input/output groups', () => {
    render(<FareCalculator />);
    expect(screen.getByText('輸入')).toBeInTheDocument();
    expect(screen.getByText('輸出')).toBeInTheDocument();
  });

  it('allows incrementing tier quantity', () => {
    render(<FareCalculator />);
    const incrementBtns = screen.getAllByRole('button');
    const plusBtn = incrementBtns.find((btn) => btn.querySelector('.lucide-plus'));
    if (plusBtn) {
      fireEvent.click(plusBtn);
      expect(screen.getByText('已選 1 項')).toBeInTheDocument();
    }
  });

  it('shows over-budget warning when exceeding target', () => {
    render(<FareCalculator />);
    const budgetInput = screen.getByDisplayValue('80') as HTMLInputElement;
    fireEvent.change(budgetInput, { target: { value: '5' } });
    const incrementBtns = screen.getAllByRole('button');
    const plusBtn = incrementBtns.find((btn) => btn.querySelector('.lucide-plus'));
    if (plusBtn) {
      fireEvent.click(plusBtn);
    }
    expect(screen.getByText(/已超出預算/)).toBeInTheDocument();
  });
});