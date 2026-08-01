import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FareCalculator } from './FareCalculator';

describe('FareCalculator', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('renders the calculator with default target budget', () => {
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
    expect(screen.getAllByText('$10').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$13').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$18').length).toBeGreaterThanOrEqual(1);
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
    expect(screen.queryByText('已選擇')).not.toBeInTheDocument();
  });

  it('updates actual bill when target budget changes', () => {
    render(<FareCalculator />);
    fireEvent.change(screen.getByDisplayValue('80'), { target: { value: '100' } });
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('110')).toBeInTheDocument();
  });

  it('updates target budget when actual bill changes', () => {
    render(<FareCalculator />);
    const targetInput = screen.getByDisplayValue('80') as HTMLInputElement;
    fireEvent.change(targetInput, { target: { value: '110' } });
    const actualInput = screen.getByLabelText('實際賬單') as HTMLInputElement;
    fireEvent.change(actualInput, { target: { value: '110' } });
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('allows incrementing tier quantity', () => {
    render(<FareCalculator />);
    const buttons = screen.getAllByRole('button');
    const plusBtn = buttons.find((btn) => btn.querySelector('.lucide-plus'));
    expect(plusBtn).toBeDefined();
    fireEvent.click(plusBtn!);
    expect(screen.getAllByText(/1 項/).length).toBeGreaterThanOrEqual(1);
  });

  it('allows decrementing tier quantity to zero', () => {
    render(<FareCalculator />);
    const buttons = screen.getAllByRole('button');
    const plusBtn = buttons.find((btn) => btn.querySelector('.lucide-plus'));
    fireEvent.click(plusBtn!);
    expect(screen.getAllByText(/1 項/).length).toBeGreaterThanOrEqual(1);
    const minusBtn = Array.from(buttons).find(
      (btn) => btn.querySelector('.lucide-minus') && !(btn as HTMLButtonElement).disabled
    );
    expect(minusBtn).toBeDefined();
    fireEvent.click(minusBtn!);
    expect(screen.queryByText('已選擇')).not.toBeInTheDocument();
  });

  it('shows over-budget warning when exceeding target', () => {
    render(<FareCalculator />);
    const budgetInput = screen.getByDisplayValue('80') as HTMLInputElement;
    fireEvent.change(budgetInput, { target: { value: '5' } });
    const buttons = screen.getAllByRole('button');
    const plusBtn = buttons.find((btn) => btn.querySelector('.lucide-plus'));
    fireEvent.click(plusBtn!);
    expect(screen.getByText('已超出（對比目標）')).toBeInTheDocument();
  });

  it('clears all selections', () => {
    render(<FareCalculator />);
    const buttons = screen.getAllByRole('button');
    const plusBtn = buttons.find((btn) => btn.querySelector('.lucide-plus'));
    fireEvent.click(plusBtn!);
    expect(screen.getAllByText(/1 項/).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByText('清空'));
    expect(screen.queryByText('已選擇')).not.toBeInTheDocument();
  });

  it('adds a custom price tier', () => {
    const onToast = vi.fn();
    render(<FareCalculator onToast={onToast} />);
    const customInput = screen.getByPlaceholderText('自訂 $') as HTMLInputElement;
    fireEvent.change(customInput, { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: /新增自訂價格/i }));
    expect(customInput.value).toBe('');
    expect(onToast).toHaveBeenCalledWith('已新增 $99 價格層級', 'success');
    expect(screen.getAllByText('$99').length).toBeGreaterThanOrEqual(1);
  });

  it('allows entering digits via the in-app keypad on touch', () => {
    render(<FareCalculator />);
    window.dispatchEvent(new Event('touchstart'));
    fireEvent.focus(screen.getByLabelText('目標價格'));
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByLabelText('目標價格')).toHaveDisplayValue('801');
    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    expect(screen.getByDisplayValue('801')).toBeInTheDocument();
  });

  it('expands and collapses the running total list from the sticky bar', () => {
    render(<FareCalculator />);
    const buttons = screen.getAllByRole('button');
    const plusBtn = buttons.find((btn) => btn.querySelector('.lucide-plus'));
    fireEvent.click(plusBtn!);

    fireEvent.click(screen.getByRole('button', { name: '展開項目清單' }));
    expect(screen.getByRole('button', { name: '收起項目清單' })).toBeInTheDocument();
    expect(screen.getByText('×1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '收起項目清單' }));
    expect(screen.getByRole('button', { name: '展開項目清單' })).toBeInTheDocument();
  });

  it('shows 追加建議 collapsed by default', () => {
    render(<FareCalculator />);
    const toggle = screen.getByRole('button', { name: /追加建議/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/^共 \$/)).not.toBeInTheDocument();
  });

  it('expands 追加建議 to reveal combination suggestions', () => {
    render(<FareCalculator />);
    const toggle = screen.getByRole('button', { name: /追加建議/ });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(/^共 \$/).length).toBeGreaterThanOrEqual(1);
  });

  it('adds a custom price tier via the keypad on touch', () => {
    const onToast = vi.fn();
    render(<FareCalculator onToast={onToast} />);
    window.dispatchEvent(new Event('touchstart'));
    const customInput = screen.getByPlaceholderText('自訂 $') as HTMLInputElement;
    fireEvent.focus(customInput);
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    expect(customInput).toHaveDisplayValue('99');
    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    expect(onToast).toHaveBeenCalledWith('已新增 $99 價格層級', 'success');
    expect(screen.getAllByText('$99').length).toBeGreaterThanOrEqual(1);
  });
});
