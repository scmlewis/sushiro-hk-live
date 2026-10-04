import React from 'react';
import { Share2 } from 'lucide-react';

interface Props {
  storeId: number;
  storeName: string;
  onToast: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ShareButton: React.FC<Props> = ({ storeId, storeName, onToast }) => {
  const handleShare = async () => {
    const url = `${window.location.origin}/?store=${storeId}`;
    const text = `壽司郎 ${storeName} 即時輪候`;
    try {
      const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
      if (nav.share) {
        await nav.share({ title: text, text, url });
        return;
      }
      throw new Error('no-share');
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        onToast('連結已複製，可用 WhatsApp 分享', 'success');
      } catch {
        onToast(url, 'info');
      }
    }
  };
  return (
    <button onClick={handleShare} title="分享門市"
      className="p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all cursor-pointer active:scale-90">
      <Share2 className="w-5 h-5" />
    </button>
  );
};
