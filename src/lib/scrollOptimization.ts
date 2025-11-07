/**
 * Scroll Optimization - Improves scrolling performance on mobile
 */

/**
 * Enable smooth scrolling with momentum on mobile
 */
export const enableSmoothScrolling = (element: HTMLElement) => {
  // Enable momentum scrolling on iOS
  (element.style as any).webkitOverflowScrolling = 'touch';
  element.style.overflowY = 'auto';
  
  // Add scroll snap for better UX (optional)
  // element.style.scrollSnapType = 'y proximity';
};

/**
 * Scroll to bottom of element smoothly
 */
export const scrollToBottom = (element: HTMLElement, smooth = true) => {
  if (!element) return;
  
  const scrollOptions: ScrollToOptions = {
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  };
  
  element.scrollTo(scrollOptions);
};

/**
 * Scroll to top of element smoothly
 */
export const scrollToTop = (element: HTMLElement, smooth = true) => {
  if (!element) return;
  
  const scrollOptions: ScrollToOptions = {
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  };
  
  element.scrollTo(scrollOptions);
};

/**
 * Check if scrolled to bottom
 */
export const isScrolledToBottom = (element: HTMLElement, threshold = 50): boolean => {
  if (!element) return false;
  
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop - clientHeight < threshold;
};

/**
 * Check if scrolled to top
 */
export const isScrolledToTop = (element: HTMLElement, threshold = 10): boolean => {
  if (!element) return false;
  return element.scrollTop < threshold;
};

/**
 * Optimize scroll event with throttling
 */
export const throttleScroll = (callback: () => void, delay = 100) => {
  let isThrottled = false;
  
  return () => {
    if (isThrottled) return;
    
    isThrottled = true;
    callback();
    
    setTimeout(() => {
      isThrottled = false;
    }, delay);
  };
};
