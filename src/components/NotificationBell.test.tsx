import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { NotificationBell } from './NotificationBell';

vi.mock('../utils/push', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/push')>();
  return {
    ...actual,
    isPushSupported: () => false,
    getStoredRegistration: () => null,
  };
});

const iOSUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function renderWithIOS() {
  const userAgentSpy = vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(iOSUserAgent);
  render(<NotificationBell storeId={1} ticketNumber={50} groupsAhead={5} onToast={() => {}} />);
  return userAgentSpy;
}

describe('NotificationBell iOS install prompt', () => {
  beforeEach(() => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(iOSUserAgent);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows Add to Home Screen instructions in a modal on iOS when push is unsupported', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    renderWithIOS();

    await user.click(screen.getByText(/通知我/));

    expect(screen.getAllByText(/加入主畫面/).length).toBeGreaterThan(0);
    expect(screen.getByText(/分享按鈕/)).toBeInTheDocument();
    expect(screen.getByText(/知道了/)).toBeInTheDocument();
  });

  it('closes the install prompt modal', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    renderWithIOS();

    await user.click(screen.getByText(/通知我/));
    await user.click(screen.getByText(/知道了/));

    expect(screen.queryAllByText(/加入主畫面/)).toHaveLength(0);
  });
});
