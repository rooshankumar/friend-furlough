import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Track user activity and auto-logout after 24 hours of inactivity
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

    // Check for inactivity every 5 minutes
    const inactivityCheck = setInterval(() => {
      checkInactivityLogout();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheck);
    };
  }, [isAuthenticated, updateLastActivity, checkInactivityLogout]);
}
