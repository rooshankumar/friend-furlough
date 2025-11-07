/**
 * Keyboard Handler - Improves keyboard behavior on mobile
 * Handles input focus, scroll positioning, and keyboard events
 */

import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export const isMobileApp = () => Capacitor.isNativePlatform();

/**
 * Initialize keyboard handling
 */
export const initKeyboardHandling = () => {
  if (!isMobileApp()) return;

  // Listen for keyboard show
  Keyboard.addListener('keyboardWillShow', (info) => {
    console.log('⌨️ Keyboard will show:', info.keyboardHeight);
    document.body.classList.add('keyboard-open');
    
    // Adjust viewport when keyboard opens
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      setTimeout(() => {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  });

  // Listen for keyboard hide
  Keyboard.addListener('keyboardWillHide', () => {
    console.log('⌨️ Keyboard will hide');
    document.body.classList.remove('keyboard-open');
  });

  console.log('✅ Keyboard handlers initialized');
};

/**
 * Clean up keyboard listeners
 */
export const cleanupKeyboardHandling = () => {
  if (!isMobileApp()) return;
  Keyboard.removeAllListeners();
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
