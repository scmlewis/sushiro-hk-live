import type { GroupQueue } from '../../src/types';

export interface NotificationTier {
  shouldNotify: boolean;
  tier: 'called' | 'almost' | 'close' | 'none';
  position: number;
  message: string;
}

export function calculateTicketPosition(
  ticketNumber: number,
  queue: Pick<GroupQueue, 'boothQueue' | 'counterQueue' | 'storeBoothQueue' | 'storeCounterQueue' | 'storeQueue' | 'mixedQueue'>
): number {
  const calledNumbers = [
    ...(queue.boothQueue || []),
    ...(queue.counterQueue || []),
    ...(queue.storeBoothQueue || []),
    ...(queue.storeCounterQueue || []),
    ...(queue.storeQueue || []),
    ...(queue.mixedQueue || []),
  ]
    .map((n) => parseInt(n.replace(/^#/, ''), 10))
    .filter((n) => !isNaN(n) && n < 1000);

  if (calledNumbers.length === 0) return ticketNumber;

  const maxCalled = Math.max(...calledNumbers);
  return ticketNumber - maxCalled;
}

export function getNotificationTier(position: number): NotificationTier {
  if (position <= 0) {
    return {
      shouldNotify: true,
      tier: 'called',
      position,
      message: '已經到你了！/ Your ticket is being called!',
    };
  }
  if (position <= 1) {
    return {
      shouldNotify: true,
      tier: 'almost',
      position,
      message: '快到你了！/ Almost your turn!',
    };
  }
  if (position <= 3) {
    return {
      shouldNotify: true,
      tier: 'close',
      position,
      message: `你排前面還有 ${position} 組 / ${position} groups ahead of you`,
    };
  }
  return {
    shouldNotify: false,
    tier: 'none',
    position,
    message: '',
  };
}
