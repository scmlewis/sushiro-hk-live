import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonTabs } from './PersonTabs';
import { Person } from '../hooks/useFareCalculator';

const person = (name: string, tiers: [number, number][] = []): Person => ({
  name,
  selectedTiers: new Map(tiers),
});

const makePeople = () =>
  new Map<string, Person>([
    ['a', person('你', [[12, 1]])],
    ['b', person('Alice', [[17, 1]])],
  ]);

type Overrides = Partial<{
  people: Map<string, Person>;
  activePersonId: string;
  personTotals: Map<string, number>;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}>;

const renderTabs = (overrides: Overrides = {}) =>
  render(
    <PersonTabs
      people={makePeople()}
      activePersonId="a"
      personTotals={new Map([['a', 13], ['b', 19]])}
      onSelect={vi.fn()}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onRename={vi.fn()}
      {...overrides}
    />,
  );

describe('PersonTabs', () => {
  it('renders nothing with a single person', () => {
    const { container } = render(
      <PersonTabs
        people={new Map<string, Person>([['a', person('你')]])}
        activePersonId="a"
        personTotals={new Map([['a', 0]])}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onRename={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows each person name and their total', () => {
    renderTabs();
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getAllByText('$13').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$19').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSelect when tapping a person tab', () => {
    const onSelect = vi.fn();
    renderTabs({ onSelect });
    fireEvent.click(screen.getByRole('button', { name: /Alice/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('adds a member with an incrementing default name', () => {
    const onAdd = vi.fn();
    renderTabs({ onAdd });
    fireEvent.click(screen.getByRole('button', { name: '新增成員' }));
    expect(onAdd).toHaveBeenCalledWith('成員 3');
  });

  it('renames a person via edit mode', () => {
    const onRename = vi.fn();
    renderTabs({ onRename });
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.click(screen.getByRole('button', { name: '重新命名 Alice' }));
    const input = screen.getByLabelText('成員名稱');
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRename).toHaveBeenCalledWith('b', 'Bob');
  });

  it('removes a person after a two-step confirm', () => {
    const onRemove = vi.fn();
    renderTabs({ onRemove });
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.click(screen.getByRole('button', { name: '刪除 Alice' }));
    fireEvent.click(screen.getByRole('button', { name: '確認刪除 Alice' }));
    expect(onRemove).toHaveBeenCalledWith('b');
  });
});
