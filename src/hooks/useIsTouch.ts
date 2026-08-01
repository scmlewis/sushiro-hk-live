import { useRef, useEffect } from 'react';

export const useIsTouch = (): React.MutableRefObject<boolean> => {
  const isTouch = useRef(false);

  useEffect(() => {
    const handler = () => {
      isTouch.current = true;
    };
    window.addEventListener('touchstart', handler, { passive: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  return isTouch;
};
