/**
 * GLOBAL FOCUS FIX - Prevents UI freeze after validation popups
 * Monitors DOM for modal removal and restores focus/pointer events
 */

(function() {
  'use strict';
  
  // Force cleanup of blocking overlays
  function forceCleanupOverlays() {
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (
        style.position === 'fixed' &&
        parseInt(style.zIndex) > 9000
      ) {
        // Remove leftover overlays without interactive content
        if (!el.querySelector('button') && !el.querySelector('input') && !el.querySelector('select')) {
          el.remove();
        } else {
          // Ensure hidden modals don't block pointer events
          if (style.display === 'none' || style.visibility === 'hidden') {
            el.style.pointerEvents = 'none';
          }
        }
      }
    });
  }
  
  // Force restore pointer events globally
  function forceRestorePointerEvents() {
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.pointerEvents = 'auto';
    
    // Restore on all containers and form elements
    document.querySelectorAll('main, section, div, form, input, select, textarea, button').forEach(el => {
      if (window.getComputedStyle(el).pointerEvents === 'none') {
        el.style.pointerEvents = 'auto';
      }
    });
  }
  
  // Complete cleanup function
  function forceCompleteCleanup() {
    forceCleanupOverlays();
    forceRestorePointerEvents();
    
    // Force reflow
    void document.body.offsetHeight;
  }
  
  // Monitor for modal/dialog removal from DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          const style = window.getComputedStyle(node);
          if (style.position === 'fixed' || node.classList.contains('modal') || node.getAttribute('role') === 'dialog') {
            forceCompleteCleanup();
          }
        }
      });
    });
  });
  
  // Start observing when DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
  
  // Periodic safety cleanup (every 500ms)
  setInterval(() => {
    // Only cleanup if no visible modals
    const visibleModals = Array.from(document.querySelectorAll('.modal-overlay, [role="dialog"], [style*="position: fixed"]'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    
    if (visibleModals.length === 0) {
      forceRestorePointerEvents();
    }
  }, 500);
  
  // Force cleanup on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setTimeout(forceCompleteCleanup, 100);
    }
  }, true);
  
  console.log('✓ Global focus fix loaded - UI freeze prevention active');
})();
