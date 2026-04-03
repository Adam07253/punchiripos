/**
 * NON-BLOCKING UI SYSTEM - ELECTRON-SAFE
 * Replaces alert(), confirm(), prompt() with non-blocking alternatives
 * Automatically restores focus after dialog closes
 */

(function() {
  'use strict';
  
  // Track the element that had focus before alert
  let lastFocusedElement = null;
  
  // Track focus changes
  document.addEventListener('focusin', (e) => {
    if (e.target && e.target.matches('input, select, textarea, button')) {
      lastFocusedElement = e.target;
    }
  }, true);
  
  // Create notification container
  const createContainer = () => {
    if (document.getElementById('nb-container')) return;
    
    const container = document.createElement('div');
    container.id = 'nb-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  };
  
  // Restore focus to last focused element
  const restoreFocus = () => {
    // Force pointer events restoration
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.pointerEvents = 'auto';
    
    // Restore all form elements
    document.querySelectorAll('input, select, textarea, button, div, form').forEach(el => {
      el.style.pointerEvents = 'auto';
    });
    
    // Force reflow
    void document.body.offsetHeight;
    
    // Restore focus with multiple attempts
    const attemptFocus = () => {
      if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
        // Trigger click to ensure it's active
        try {
          lastFocusedElement.click();
        } catch (e) {
          // Ignore click errors
        }
      } else {
        // Find first visible input
        const firstInput = document.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
        if (firstInput) {
          firstInput.focus();
        }
      }
    };
    
    // Multiple restoration attempts
    setTimeout(attemptFocus, 10);
    setTimeout(attemptFocus, 50);
    setTimeout(attemptFocus, 100);
  };
  
  // Non-blocking alert
  window.nbAlert = function(message, title = 'Validation') {
    return new Promise((resolve) => {
      createContainer();
      
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
      `;
      
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideIn 0.2s ease-out;
      `;
      
      dialog.innerHTML = `
        <style>
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        </style>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #333;">
          ${title}
        </div>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5;">
          ${message}
        </div>
        <div style="text-align: right;">
          <button id="nb-ok-btn" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">OK</button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      const okBtn = document.getElementById('nb-ok-btn');
      
      const close = () => {
        overlay.remove();
        restoreFocus();
        resolve();
      };
      
      okBtn.onclick = close;
      overlay.onclick = (e) => {
        if (e.target === overlay) close();
      };
      
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          close();
          document.removeEventListener('keydown', escHandler);
        }
      });
      
      // Auto-focus OK button
      setTimeout(() => okBtn.focus(), 100);
    });
  };
  
  // Non-blocking confirm
  window.nbConfirm = function(message, title = 'Confirm') {
    return new Promise((resolve) => {
      createContainer();
      
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
      `;
      
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideIn 0.2s ease-out;
      `;
      
      dialog.innerHTML = `
        <style>
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        </style>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #333;">
          ${title}
        </div>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5;">
          ${message}
        </div>
        <div style="text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
          <button id="nb-cancel-btn" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Cancel</button>
          <button id="nb-confirm-btn" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">OK</button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      const confirmBtn = document.getElementById('nb-confirm-btn');
      const cancelBtn = document.getElementById('nb-cancel-btn');
      
      const close = (result) => {
        overlay.remove();
        restoreFocus();
        resolve(result);
      };
      
      confirmBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
      overlay.onclick = (e) => {
        if (e.target === overlay) close(false);
      };
      
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          close(false);
          document.removeEventListener('keydown', escHandler);
        }
      });
      
      // Auto-focus Cancel button (safer default)
      setTimeout(() => cancelBtn.focus(), 100);
    });
  };
  
  // Toast notification (for quick messages)
  window.nbToast = function(message, type = 'info', duration = 3000) {
    createContainer();
    
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      margin-bottom: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      pointer-events: auto;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
      font-size: 14px;
    `;
    
    toast.innerHTML = `
      <style>
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      </style>
      ${message}
    `;
    
    document.getElementById('nb-container').appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };
  
  // Override native alert/confirm (for compatibility)
  window.alert = window.nbAlert;
  window.confirm = window.nbConfirm;
  
  console.log('✓ Non-blocking UI system loaded - Electron-safe with auto focus restoration!');
})();
