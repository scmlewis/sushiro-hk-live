import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  requestPushSubscription,
  serializeSubscription,
  getStoredRegistration,
  storeRegistration,
  removeRegistration,
} from '../utils/push';

interface NotificationBellProps {
  storeId: number;
  ticketNumber: number;
  groupsAhead: number;
  onToast: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  storeId,
  ticketNumber,
  groupsAhead,
  onToast,
}) => {
  const [state, setState] = useState<'idle' | 'loading' | 'subscribed'>('idle');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    const existing = getStoredRegistration(storeId);
    if (existing && existing.ticketNumber === ticketNumber) {
      setState('subscribed');
    }
  }, [storeId, ticketNumber]);

  const handleSubscribe = useCallback(async () => {
    if (!supported) {
      onToast('您的瀏覽器不支援推播通知', 'warning');
      return;
    }

    const permission = getNotificationPermission();
    if (permission === 'denied') {
      onToast('請在瀏覽器設定中開啟通知權限', 'warning');
      return;
    }

    setState('loading');

    try {
      const subscription = await requestPushSubscription();
      if (!subscription) {
        onToast('通知權限被拒絕', 'warning');
        setState('idle');
        return;
      }

      const serialized = serializeSubscription(subscription);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: serialized,
          storeId,
          ticketNumber,
        }),
      });

      const data = await res.json();
      if (data.success) {
        storeRegistration(storeId, data.registrationId, ticketNumber);
        setState('subscribed');
        onToast('已開啟通知 / Notifications enabled', 'success');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('[NotificationBell] Subscribe error:', err);
      const detail = err?.message || String(err);
      onToast(`註冊通知失敗：${detail}`, 'error');
      setState('idle');
    }
  }, [supported, storeId, ticketNumber, onToast]);

  const handleUnsubscribe = useCallback(() => {
    removeRegistration(storeId);
    setState('idle');
    onToast('已關閉通知 / Notifications disabled', 'info');
  }, [storeId, onToast]);

  if (groupsAhead <= 0) return null;

  if (state === 'subscribed') {
    return (
      <button
        onClick={handleUnsubscribe}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-[#aa151b] hover:text-[#aa151b] transition-all text-sm font-bold cursor-pointer"
      >
        <BellOff className="w-4 h-4" />
        <span>通知中 ✓ / Notifying</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={state === 'loading'}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#aa151b] hover:bg-red-700 text-white transition-all text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {state === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      <span>通知我 / Notify me</span>
    </button>
  );
};
