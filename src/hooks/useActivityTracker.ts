import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Track user activity and auto-logout after 30 days of inactivity
 */
export function useActivityTracker() {
  const { updateLastActivity, checkInactivityLogout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check for inactivity on mount
    checkInactivityLogout();

    // Update activity on user interactions
    const updateActivity = () => {
      updateLastActivity();
    };

    // Track various user activities
    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity every hour
    const inactivityCheck = setInterval(() => {
      checkInactivityLogout();
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheck);
    };
  }, [isAuthenticated, updateLastActivity, checkInactivityLogout]);
}
