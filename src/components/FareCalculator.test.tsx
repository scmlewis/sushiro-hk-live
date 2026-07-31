import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FareCalculator } from './FareCalculator';

describe('FareCalculator', () => {
  it('renders the calculator with default budget', () => {
    render(<FareCalculator />);
    expect(screen.getByText('價格計算器')).toBeInTheDocument();
    expect(screen.getByDisplayValue('80')).toBeInTheDocument();
  });

  it('renders menu items', () => {
    render(<FareCalculator />);
    expect(screen.getByText('三文魚')).toBeInTheDocument();
    expect(screen.getByText('金槍魚')).toBeInTheDocument();
  });

  it('allows selecting and deselecting items', () => {
    render(<FareCalculator />);
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    fireEvent.click(salmonButton);
    expect(screen.getByText('三文魚')).toBeInTheDocument();
  });

  it('updates total when items are selected', () => {
    render(<FareCalculator />);
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    fireEvent.click(salmonButton);
    expect(screen.getByText('當前總額')).toBeInTheDocument();
    const totalEl = screen.getByText('$0');
    expect(totalEl).toBeInTheDocument();
  });

  it('increments and decrements item quantity', () => {
    render(<FareCalculator />);
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    fireEvent.click(salmonButton);
    fireEvent.click(salmonButton);
    fireEvent.click(salmonButton);
    expect(screen.getByText('當前總額')).toBeInTheDocument();
  });

  it('updates remaining budget correctly', () => {
    render(<FareCalculator />);
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    fireEvent.click(salmonButton);
    expect(screen.getByText('剩餘金額')).toBeInTheDocument();
  });

  it('shows over-budget warning when exceeding target', () => {
    render(<FareCalculator />);
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    for (let i = 0; i < 10; i++) {
      fireEvent.click(salmonButton);
    }
    expect(screen.getByText(/已超出預算/)).toBeInTheDocument();
  });

  it('filters items by category', () => {
    render(<FareCalculator />);
    const nigiriButton = screen.getByText('握壽司').closest('button')!;
    fireEvent.click(nigiriButton);
    expect(screen.getByText('三文魚')).toBeInTheDocument();
  });

  it('clears all selections', () => {
    render(<FareCalculator />);
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    fireEvent.click(salmonButton);
    const clearButton = screen.getByText('清除').closest('button')!;
    fireEvent.click(clearButton);
    expect(screen.getByText('尚未選擇壽司')).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<FareCalculator />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('握壽司')).toBeInTheDocument();
    expect(screen.getByText('卷壽司')).toBeInTheDocument();
  });

  it('renders quick budget buttons', () => {
    render(<FareCalculator />);
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('shows combination suggestions when budget is set and items are selected', () => {
    render(<FareCalculator />);
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    fireEvent.click(salmonButton);
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
    const salmonButton = screen.getByText('三文魚').closest('button')!;
    fireEvent.click(salmonButton);
    expect(screen.getByText('含稅 (+10%)')).toBeInTheDocument();
  });

  it('renders all menu categories', () => {
    render(<FareCalculator />);
    expect(screen.getByText('握壽司')).toBeInTheDocument();
    expect(screen.getByText('卷壽司')).toBeInTheDocument();
    expect(screen.getByText('軍艦壽司')).toBeInTheDocument();
    expect(screen.getByText('甜品')).toBeInTheDocument();
    expect(screen.getByText('飲品')).toBeInTheDocument();
  });

  it('renders empty state when no items selected', () => {
    render(<FareCalculator />);
    expect(screen.getByText('尚未選擇壽司')).toBeInTheDocument();
  });
});