/**
 * FOCUS TRAP FIX - Prevents input freeze after validation popups
 * Wraps native alert/confirm/prompt to restore focus properly
 */

(function() {
  'use strict';
  
  // Store reference to input that triggered validation
  let lastFocusedInput = null;
  let alertInProgress = false;
  
  // Track focus on all inputs
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, select, textarea, button')) {
      lastFocusedInput = e.target;
    }
  }, true);
  
  // Force complete cleanup and focus restoration
  function forceCompleteCleanup() {
    // Remove any leftover blocking overlays
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (
        style.position === 'fixed' &&
        parseInt(style.zIndex) > 9000
      ) {
        if (!el.querySelector('button') && !el.querySelector('input') && !el.querySelector('select')) {
          el.remove();
        }
      }
    });
    
    // Force restore pointer events on everything
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.pointerEvents = 'auto';
    
    // Restore all form elements
    document.querySelectorAll('input, select, textarea, button, div, form').forEach(el => {
      el.style.pointerEvents = 'auto';
    });
    
    // Force reflow
    void document.body.offsetHeight;
    
    // CRITICAL: Multiple focus restoration attempts with increasing delays
    // This ensures focus is restored even if Electron is slow to release the alert
    const restoreFocus = () => {
      if (lastFocusedInput && document.body.contains(lastFocusedInput)) {
        lastFocusedInput.focus();
        lastFocusedInput.click(); // Extra trigger to ensure it's active
      } else {
        // Find first visible input
        const firstInput = document.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
        if (firstInput) {
          firstInput.focus();
          firstInput.click();
        }
      }
    };
    
    // Multiple restoration attempts at different timings
    setTimeout(restoreFocus, 10);
    setTimeout(restoreFocus, 50);
    setTimeout(restoreFocus, 100);
    setTimeout(restoreFocus, 200);
    
    alertInProgress = false;
  }
  
  // Override native alert
  const originalAlert = window.alert;
  window.alert = function(message) {
    alertInProgress = true;
    originalAlert.call(window, message);
    forceCompleteCleanup();
  };
  
  // Override native confirm
  const originalConfirm = window.confirm;
  window.confirm = function(message) {
    alertInProgress = true;
    const result = originalConfirm.call(window, message);
    forceCompleteCleanup();
    return result;
  };
  
  // Override native prompt
  const originalPrompt = window.prompt;
  window.prompt = function(message, defaultValue) {
    alertInProgress = true;
    const result = originalPrompt.call(window, message, defaultValue);
    forceCompleteCleanup();
    return result;
  };
  
  // Intercept any .focus() calls during alert to delay them
  const originalFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function() {
    if (alertInProgress) {
      // Delay focus calls that happen during alert
      setTimeout(() => {
        originalFocus.call(this);
      }, 250);
    } else {
      originalFocus.call(this);
    }
  };
  
  console.log('✓ Alert fix loaded - focus will restore after validation popups');
})();
