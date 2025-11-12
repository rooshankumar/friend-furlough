import { useState, useEffect } from 'react';

export const usePWABanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if PWA banner should be shown
    const checkPWABanner = () => {
      // Check if app is already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(false);
        return;
      }

      // Check if user dismissed recently (within 7 days)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < sevenDaysInMs) {
          setShowBanner(false);
          return;
        }
      }

      // Listen for beforeinstallprompt event
      const handler = (e: Event) => {
        e.preventDefault();
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handler);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    };

    const cleanup = checkPWABanner();
    return cleanup;
  }, []);

  return showBanner;
};
