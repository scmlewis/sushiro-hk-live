const REGISTRATION_STORAGE_KEY = 'sushiro_hk_push_registrations';

export function isPushSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

export async function requestPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
    ),
  });

  return subscription;
}

export function serializeSubscription(subscription: PushSubscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.getKey('p256dh')
        ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!)))
        : '',
      auth: subscription.getKey('auth')
        ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        : '',
    },
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface StoredRegistration {
  storeId: number;
  registrationId: string;
  ticketNumber: number;
  timestamp: number;
}

export function getStoredRegistration(storeId: number): StoredRegistration | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    if (!raw) return null;
    const map: Record<number, StoredRegistration> = JSON.parse(raw);
    return map[storeId] || null;
  } catch {
    return null;
  }
}

export function storeRegistration(storeId: number, registrationId: string, ticketNumber: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    const map: Record<number, StoredRegistration> = raw ? JSON.parse(raw) : {};
    map[storeId] = { storeId, registrationId, ticketNumber, timestamp: Date.now() };
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage full or unavailable
  }
}

export function removeRegistration(storeId: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    if (!raw) return;
    const map: Record<number, StoredRegistration> = JSON.parse(raw);
    delete map[storeId];
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
