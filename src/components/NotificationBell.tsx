import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2, Share, Home, Check, X } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  requestPushSubscription,
  serializeSubscription,
  getStoredRegistration,
  storeRegistration,
  removeRegistration,
} from '../utils/push';

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

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
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    const existing = getStoredRegistration(storeId);
    if (existing && existing.ticketNumber === ticketNumber) {
      setState('subscribed');
    }
  }, [storeId, ticketNumber]);

  const handleSubscribe = useCallback(async () => {
    if (!supported) {
      if (isIOSDevice()) {
        setShowInstallPrompt(true);
      } else {
        onToast('您的瀏覽器不支援推播通知', 'warning');
      }
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
    <>
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

      {showInstallPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowInstallPrompt(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Home className="w-5 h-5 text-[#aa151b]" />
                  加入主畫面
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  iOS 無法直接在 Safari 接收推播通知。請將本網站加入主畫面，即可在主畫面上收到最新叫號。
                </p>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                aria-label="Close"
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#aa151b]/10 text-[#aa151b] flex items-center justify-center text-xs font-black shrink-0">1</span>
                <div className="text-sm">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    點擊分享按鈕 <Share className="w-3.5 h-3.5 text-neutral-400" />
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Safari 下方的分享圖示</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#aa151b]/10 text-[#aa151b] flex items-center justify-center text-xs font-black shrink-0">2</span>
                <div className="text-sm">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    選擇加入主畫面 <Home className="w-3.5 h-3.5 text-neutral-400" />
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">向下滑動選單尋找「加入主畫面」</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#aa151b]/10 text-[#aa151b] flex items-center justify-center text-xs font-black shrink-0">3</span>
                <div className="text-sm">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    點擊新增 <Check className="w-3.5 h-3.5 text-neutral-400" />
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">右上角「新增」即可完成</p>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="w-full py-2.5 rounded-lg bg-[#aa151b] hover:bg-red-700 text-white text-sm font-bold transition-all cursor-pointer"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
