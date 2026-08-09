import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFareCalculator, Person } from './useFareCalculator';

const person = (name: string, tiers: [number, number][] = []): Person => ({
  name,
  selectedTiers: new Map(tiers),
});

describe('useFareCalculator', () => {
  it('starts with a single default person named 你 and zero totals', () => {
    const { result } = renderHook(() => useFareCalculator());
    expect(result.current.people.size).toBe(1);
    expect(result.current.activePersonId).toBe(result.current.people.keys().next().value);
    expect(result.current.people.get(result.current.activePersonId)!.name).toBe('你');
    expect(result.current.subtotal).toBe(0);
    expect(result.current.serviceCharge).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('addTier targets the active person only', () => {
    const { result } = renderHook(() => useFareCalculator());
    const firstId = result.current.activePersonId;
    act(() => result.current.addPerson('Alice'));
    act(() => result.current.addTier(12));
    expect(result.current.people.get(result.current.activePersonId)!.selectedTiers.get(12)).toBe(1);
    expect(result.current.people.get(firstId)!.selectedTiers.size).toBe(0);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.total).toBe(13);
  });

  it('sums per-person service charges so combined totals stay consistent', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 1]])],
      ['b', person('Alice', [[13, 1]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'a'));
    expect(result.current.subtotal).toBe(25);
    expect(result.current.serviceCharge).toBe(2);
    expect(result.current.total).toBe(27);
  });

  it('switches the active person to the first remaining when the active one is removed', () => {
    const people = new Map<string, Person>([
      ['a', person('你')],
      ['b', person('Alice')],
      ['c', person('Bob')],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'c'));
    act(() => result.current.removePerson('c'));
    expect(result.current.activePersonId).toBe('a');
    expect(result.current.people.size).toBe(2);
  });

  it('does not allow removing the last person', () => {
    const { result } = renderHook(() => useFareCalculator());
    const id = result.current.activePersonId;
    act(() => result.current.removePerson(id));
    expect(result.current.people.size).toBe(1);
  });

  it('renames a person and ignores empty names', () => {
    const { result } = renderHook(() => useFareCalculator());
    const id = result.current.activePersonId;
    act(() => result.current.renamePerson(id, '  Alice  '));
    expect(result.current.people.get(id)!.name).toBe('Alice');
    act(() => result.current.renamePerson(id, '   '));
    expect(result.current.people.get(id)!.name).toBe('Alice');
  });

  it('clearAll clears only the active person', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 2]])],
      ['b', person('Alice', [[17, 1]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'a'));
    act(() => result.current.clearAll());
    expect(result.current.people.get('a')!.selectedTiers.size).toBe(0);
    expect(result.current.people.get('b')!.selectedTiers.size).toBe(1);
  });

  it('exposes per-person totals and restores people from initial state', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 1]])],
      ['b', person('Alice', [[17, 2]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'b'));
    expect(result.current.people.size).toBe(2);
    expect(result.current.activePersonId).toBe('b');
    expect(result.current.personTotals.get('a')).toBe(13);
    expect(result.current.personTotals.get('b')).toBe(37);
    expect(result.current.subtotal).toBe(46);
  });

  it('merges quantities across people in the combined selected list', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 2]])],
      ['b', person('Alice', [[12, 1]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'a'));
    expect(result.current.totalItems).toBe(3);
    const entry = result.current.selectedList.find((e) => e.tier.price === 12)!;
    expect(entry.quantity).toBe(3);
    expect(entry.subtotal).toBe(36);
  });
});
