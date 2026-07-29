import { describe, it, expect } from 'vitest';
import { getMarkerColor } from '../utils/status';

describe('getMarkerColor', () => {
  it('returns green for emerald (直入)', () => {
    expect(getMarkerColor('emerald')).toBe('#10b981');
  });

  it('returns amber for amber (<15min)', () => {
    expect(getMarkerColor('amber')).toBe('#f59e0b');
  });

  it('returns violet for violet (15-29min)', () => {
    expect(getMarkerColor('violet')).toBe('#8b5cf6');
  });

  it('returns orange for orange (30-59min)', () => {
    expect(getMarkerColor('orange')).toBe('#f97316');
  });

  it('returns accent red for red (60+min)', () => {
    expect(getMarkerColor('red')).toBe('#aa151b');
  });

  it('returns gray for neutral (休息/收工)', () => {
    expect(getMarkerColor('neutral')).toBe('#6b7280');
  });

  it('returns gray for unknown accent color', () => {
    expect(getMarkerColor('unknown')).toBe('#6b7280');
  });
});
