import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isPushSupported,
  getNotificationPermission,
  serializeSubscription,
  getStoredRegistration,
  storeRegistration,
  removeRegistration,
} from './push';

const REGISTRATION_STORAGE_KEY = 'sushiro_hk_push_registrations';

describe('isPushSupported', () => {
  it('returns false when navigator is undefined (SSR)', () => {
    const originalNavigator = globalThis.navigator;
    // @ts-expect-error - simulating SSR
    delete (globalThis as any).navigator;
    expect(isPushSupported()).toBe(false);
    globalThis.navigator = originalNavigator;
  });

  it('returns false when serviceWorker is missing', () => {
    const originalNavigator = globalThis.navigator;
    // @ts-expect-error - simulating partial navigator
    globalThis.navigator = {} as Navigator;
    expect(isPushSupported()).toBe(false);
    globalThis.navigator = originalNavigator;
  });

  it('returns true when all required APIs exist', () => {
    const originalNavigator = globalThis.navigator;

    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: {} },
      writable: true,
      configurable: true,
    });
    vi.stubGlobal('PushManager', function () {});
    vi.stubGlobal('Notification', function () {});

    expect(isPushSupported()).toBe(true);

    globalThis.navigator = originalNavigator;
    vi.unstubAllGlobals();
  });
});

describe('getNotificationPermission', () => {
  it('returns "denied" when Notification is not available', () => {
    vi.stubGlobal('Notification', undefined);
    expect(getNotificationPermission()).toBe('denied');
    vi.unstubAllGlobals();
  });

  it('returns current permission when Notification is available', () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    expect(getNotificationPermission()).toBe('granted');
    vi.unstubAllGlobals();
  });
});

describe('serializeSubscription', () => {
  it('serializes endpoint and keys from PushSubscription', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      getKey: (name: string) => {
        if (name === 'p256dh') return new Uint8Array([1, 2, 3]);
        if (name === 'auth') return new Uint8Array([4, 5, 6]);
        return null;
      },
    } as unknown as PushSubscription;

    const result = serializeSubscription(mockSubscription);
    expect(result).toEqual({
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: expect.any(String),
        auth: expect.any(String),
      },
    });
    expect(result.keys.p256dh).toBeTruthy();
    expect(result.keys.auth).toBeTruthy();
  });
});

describe('getStoredRegistration', () => {
  beforeEach(() => {
    localStorage.removeItem(REGISTRATION_STORAGE_KEY);
  });

  it('returns null when localStorage is empty', () => {
    expect(getStoredRegistration(1)).toBeNull();
  });

  it('returns null for non-existent storeId', () => {
    storeRegistration(1, 'reg-1', 42);
    expect(getStoredRegistration(999)).toBeNull();
  });

  it('returns stored registration for matching storeId', () => {
    storeRegistration(1, 'reg-1', 42);
    const result = getStoredRegistration(1);
    expect(result).toEqual({
      storeId: 1,
      registrationId: 'reg-1',
      ticketNumber: 42,
      timestamp: expect.any(Number),
    });
  });

  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem(REGISTRATION_STORAGE_KEY, 'not-json');
    expect(getStoredRegistration(1)).toBeNull();
  });
});

describe('storeRegistration', () => {
  beforeEach(() => {
    localStorage.removeItem(REGISTRATION_STORAGE_KEY);
  });

  it('stores registration in localStorage', () => {
    storeRegistration(1, 'reg-1', 42);
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const map = JSON.parse(raw!);
    expect(map['1'].registrationId).toBe('reg-1');
    expect(map['1'].ticketNumber).toBe(42);
    expect(map['1'].timestamp).toBeTypeOf('number');
  });

  it('preserves existing registrations when adding new one', () => {
    storeRegistration(1, 'reg-1', 42);
    storeRegistration(2, 'reg-2', 99);
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    const map = JSON.parse(raw!);
    expect(map['1'].registrationId).toBe('reg-1');
    expect(map['2'].registrationId).toBe('reg-2');
  });

  it('overwrites registration for same storeId', () => {
    storeRegistration(1, 'reg-1', 42);
    storeRegistration(1, 'reg-new', 100);
    const result = getStoredRegistration(1);
    expect(result?.registrationId).toBe('reg-new');
    expect(result?.ticketNumber).toBe(100);
  });
});

describe('removeRegistration', () => {
  beforeEach(() => {
    localStorage.removeItem(REGISTRATION_STORAGE_KEY);
  });

  it('removes specific registration from localStorage', () => {
    storeRegistration(1, 'reg-1', 42);
    storeRegistration(2, 'reg-2', 99);
    removeRegistration(1);
    expect(getStoredRegistration(1)).toBeNull();
    expect(getStoredRegistration(2)).not.toBeNull();
  });

  it('does not throw when localStorage is empty', () => {
    expect(() => removeRegistration(1)).not.toThrow();
  });

  it('does not throw when storeId does not exist', () => {
    storeRegistration(1, 'reg-1', 42);
    expect(() => removeRegistration(999)).not.toThrow();
    expect(getStoredRegistration(1)).not.toBeNull();
  });
});
