/**
 * Keyboard Handler - Improves keyboard behavior on mobile
 * Handles input focus, scroll positioning, and keyboard events
 */

import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

let keyboardListeners: any[] = [];

export const isMobileApp = () => Capacitor.isNativePlatform();

/**
 * Initialize keyboard handling
 */
export const initKeyboardHandling = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Show keyboard listener
    const showListener = await Keyboard.addListener('keyboardWillShow', info => {
      console.log('Keyboard will show with height:', info.keyboardHeight);
      
      // Adjust viewport for keyboard - match PWA behavior
      document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.body.classList.add('keyboard-open');
      
      // Better viewport adjustment for PWA-like experience
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
      
      // Scroll active input into view with better positioning
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          const rect = activeElement.getBoundingClientRect();
          const keyboardTop = window.innerHeight - info.keyboardHeight;
          const viewportHeight = window.innerHeight;
          
          // Calculate if input is hidden by keyboard
          if (rect.bottom > keyboardTop - 50) { // 50px buffer
            // Scroll to position input above keyboard with padding
            const targetPosition = keyboardTop - rect.height - 100; // 100px padding above keyboard
            const currentTop = rect.top;
            const scrollOffset = currentTop - targetPosition;
            
            window.scrollBy({
              top: scrollOffset,
              behavior: 'smooth'
            });
          }
        }, 200); // Slightly longer delay for better keyboard detection
      }
    });

    // Hide keyboard listener
    const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard will hide');
      
      // Reset viewport - match PWA behavior
      document.documentElement.style.removeProperty('--keyboard-height');
      document.body.classList.remove('keyboard-open');
      
      // Reset viewport meta tag
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0'
        );
      }
    });

    keyboardListeners = [showListener, hideListener];
    
    console.log('✅ Enhanced keyboard handling initialized');
  } catch (error) {
    console.error('❌ Keyboard handling failed:', error);
  }
};

/**
 * Clean up keyboard listeners
 */
export const cleanupKeyboardHandling = () => {
  keyboardListeners.forEach(listener => {
    if (listener?.remove) {
      listener.remove();
    }
  });
  keyboardListeners = [];
  
  // Clean up styles
  document.documentElement.style.removeProperty('--keyboard-height');
  document.body.classList.remove('keyboard-open');
  
  console.log('🧹 Keyboard handling cleaned up');
};

/**
 * Scroll element into view when focused (for inputs)
 */
export const scrollIntoViewOnFocus = (element: HTMLElement) => {
  if (!isMobileApp()) return;
  
  element.addEventListener('focus', () => {
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300); // Wait for keyboard to show
  });
};

/**
 * Prevent input zoom on iOS/Android
 * Apply to input elements to prevent auto-zoom
 */
export const preventInputZoom = (input: HTMLInputElement | HTMLTextAreaElement) => {
  // Set font size to 16px to prevent zoom on iOS
  input.style.fontSize = '16px';
};

/**
 * Hide keyboard programmatically
 */
export const hideKeyboard = async () => {
  if (!isMobileApp()) return;
  
  try {
    await Keyboard.hide();
  } catch (error) {
    console.error('Failed to hide keyboard:', error);
  }
};

/**
 * Show keyboard programmatically
 */
export const showKeyboard = async () => {
  if (!isMobileApp()) return;
  
  try {
    await Keyboard.show();
  } catch (error) {
    console.error('Failed to show keyboard:', error);
  }
};
