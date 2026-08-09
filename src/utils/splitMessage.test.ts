import { describe, it, expect } from 'vitest';
import { buildSplitMessage } from './splitMessage';

describe('buildSplitMessage', () => {
  it('formats a split message with per-person totals and a summed grand total', () => {
    const message = buildSplitMessage([
      { name: '你', total: 132 },
      { name: 'Alice', total: 85 },
    ]);
    expect(message).toBe('🍣 壽司郎分帳\n你: $132\nAlice: $85\n總額 (含服務費): $217');
  });

  it('grand total always equals the sum of per-person totals', () => {
    const message = buildSplitMessage([
      { name: '你', total: 13 },
      { name: 'Alice', total: 14 },
    ]);
    expect(message).toContain('總額 (含服務費): $27');
  });

  it('includes a person with zero plates as $0', () => {
    const message = buildSplitMessage([
      { name: '你', total: 13 },
      { name: 'Bob', total: 0 },
    ]);
    expect(message).toContain('Bob: $0');
  });
});
