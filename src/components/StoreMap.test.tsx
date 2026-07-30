import { describe, it, expect } from 'vitest';
import { getMarkerColor } from '../utils/status';

describe('getMarkerColor', () => {
  it('returns blue for blue (即時入座)', () => {
    expect(getMarkerColor('blue')).toBe('#3b82f6');
  });

  it('returns green for emerald (<15min)', () => {
    expect(getMarkerColor('emerald')).toBe('#10b981');
  });

  it('returns yellow for yellow (15-29min)', () => {
    expect(getMarkerColor('yellow')).toBe('#eab308');
  });

  it('returns orange for orange (30-59min)', () => {
    expect(getMarkerColor('orange')).toBe('#f97316');
  });

  it('returns accent red for red (60+min)', () => {
    expect(getMarkerColor('red')).toBe('#aa151b');
  });

  it('returns gray for neutral (非營業中)', () => {
    expect(getMarkerColor('neutral')).toBe('#6b7280');
  });

  it('returns gray for unknown accent color', () => {
    expect(getMarkerColor('unknown')).toBe('#6b7280');
  });
});
