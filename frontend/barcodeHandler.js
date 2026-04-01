/**
 * BarcodeHandler - Centralized barcode scanning logic for all pages
 * Handles both hardware scanner input and manual barcode entry
 */
class BarcodeHandler {
  constructor(options) {
    this.inputBuffer = '';
    this.lastKeyTime = 0;
    this.scanTimeout = 100; // ms between characters for scanner detection
    this.onScan = options.onScan || null; // callback when barcode scanned
    this.onError = options.onError || null; // callback for errors
    this.minLength = 6;
    this.maxLength = 20;
    this.hiddenInput = null;
  }

  /**
   * Initialize the barcode handler
   * Creates hidden input field and sets up event listeners
   */
  init() {
    // Create hidden input field for scanner
    this.hiddenInput = document.createElement('input');
    this.hiddenInput.type = 'text';
    this.hiddenInput.style.position = 'absolute';
    this.hiddenInput.style.left = '-9999px';
    this.hiddenInput.style.opacity = '0';
    this.hiddenInput.id = 'barcode-scanner-input';
    this.hiddenInput.setAttribute('autocomplete', 'off');
    this.hiddenInput.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.hiddenInput);

    // Keep focus on hidden input ONLY if no other input is focused
    this.hiddenInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (this.hiddenInput && !this.isUserInputFocused()) {
          this.hiddenInput.focus();
        }
      }, 10);
    });

    // Handle barcode input
    this.hiddenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.processBarcode();
      }
    });

    // Initial focus only if no other input is focused
    if (!this.isUserInputFocused()) {
      this.hiddenInput.focus();
    }

    // Restore focus when clicking on page (except on input fields)
    document.addEventListener('click', (e) => {
      if (!e.target.matches('input, textarea, select, button')) {
        if (this.hiddenInput && !this.isUserInputFocused()) {
          this.hiddenInput.focus();
        }
      }
    });

    // Restore focus when pressing Escape (only if not in an input field)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hiddenInput && !this.isUserInputFocused()) {
        this.hiddenInput.focus();
      }
    });
  }

  /**
   * Process the scanned/entered barcode
   * Validates and calls appropriate callback
   */
  processBarcode() {
    const rawBarcode = this.hiddenInput.value;
    
    // Normalize: trim whitespace and control characters, convert to uppercase
    const barcode = rawBarcode
      .replace(/[\r\n\t]/g, '') // Remove control characters
      .trim()
      .toUpperCase();
    
    // Clear input immediately
    this.hiddenInput.value = '';

    // Validate length
    if (barcode.length < this.minLength || barcode.length > this.maxLength) {
      if (this.onError) {
        this.onError(`Invalid barcode length: ${barcode.length} characters (must be ${this.minLength}-${this.maxLength})`);
      }
      return;
    }

    // Validate not empty/whitespace
    if (!barcode || /^\s*$/.test(barcode)) {
      if (this.onError) {
        this.onError('Barcode cannot be empty');
      }
      return;
    }

    // Call success callback
    if (this.onScan) {
      this.onScan(barcode);
    }
  }

  /**
   * Check if a user input field is currently focused
   * Returns true if user is typing in an input/textarea/select
   */
  isUserInputFocused() {
    const activeEl = document.activeElement;
    if (!activeEl) return false;
    
    const tagName = activeEl.tagName;
    
    // Check if it's a user input field (not the hidden scanner input)
    if ((tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') &&
        activeEl !== this.hiddenInput) {
      return true;
    }
    
    return false;
  }

  /**
   * Manually focus the barcode input
   * Useful after dialogs or other interactions
   */
  focus() {
    if (this.hiddenInput && !this.isUserInputFocused()) {
      this.hiddenInput.focus();
    }
  }

  /**
   * Clean up and remove the barcode handler
   */
  destroy() {
    if (this.hiddenInput) {
      this.hiddenInput.remove();
      this.hiddenInput = null;
    }
  }
}
