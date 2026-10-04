import { describe, it, expect } from 'vitest';
import { parseStoreIdFromUrl, buildStoreUrl } from './deepLink';

describe('deepLink', () => {
  it('parses ?store=21', () => {
    expect(parseStoreIdFromUrl('https://x/?store=21')).toBe(21);
    expect(parseStoreIdFromUrl('https://x/?a=1&store=5')).toBe(5);
  });
  it('rejects invalid', () => {
    expect(parseStoreIdFromUrl('https://x/')).toBeNull();
    expect(parseStoreIdFromUrl('https://x/?store=abc')).toBeNull();
    expect(parseStoreIdFromUrl('https://x/?store=-1')).toBeNull();
  });
  it('builds url', () => {
    expect(buildStoreUrl(21)).toBe('/?store=21');
  });
});
