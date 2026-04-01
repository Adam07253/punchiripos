/**
 * BarcodeCache - Client-side product cache for instant barcode lookups
 * Loads all products with barcodes into memory for fast scanning performance
 */
class BarcodeCache {
  constructor() {
    this.cache = new Map(); // barcode -> product
    this.loaded = false;
    this.loading = false;
  }

  /**
   * Load all products with barcodes from the server
   * @returns {Promise<boolean>} true if successful, false otherwise
   */
  async load() {
    if (this.loading) {
      console.log('Cache load already in progress');
      return false;
    }

    if (this.loaded) {
      console.log('Cache already loaded');
      return true;
    }

    this.loading = true;

    try {
      const response = await fetch('/api/barcode/cache');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json();

      // Build cache map
      this.cache.clear();
      products.forEach(product => {
        if (product.barcode) {
          // Store with uppercase barcode as key
          this.cache.set(product.barcode.toUpperCase(), product);
        }
      });

      this.loaded = true;
      this.loading = false;
      console.log(`Barcode cache loaded: ${this.cache.size} products`);
      return true;
    } catch (error) {
      console.error('Cache load error:', error);
      this.loaded = false;
      this.loading = false;
      return false;
    }
  }

  /**
   * Lookup a product by barcode
   * @param {string} barcode - The barcode to lookup
   * @returns {Object|null} Product object if found, null otherwise
   */
  lookup(barcode) {
    if (!barcode) return null;
    
    const key = barcode.toUpperCase();
    return this.cache.get(key) || null;
  }

  /**
   * Check if a barcode exists in the cache
   * @param {string} barcode - The barcode to check
   * @returns {boolean} true if barcode exists, false otherwise
   */
  has(barcode) {
    if (!barcode) return false;
    
    const key = barcode.toUpperCase();
    return this.cache.has(key);
  }

  /**
   * Get the number of products in the cache
   * @returns {number} Number of cached products
   */
  size() {
    return this.cache.size;
  }

  /**
   * Check if the cache has been loaded
   * @returns {boolean} true if loaded, false otherwise
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Clear the cache
   */
  clear() {
    this.cache.clear();
    this.loaded = false;
    this.loading = false;
  }

  /**
   * Reload the cache (clear and load again)
   * @returns {Promise<boolean>} true if successful, false otherwise
   */
  async reload() {
    this.clear();
    return await this.load();
  }
}

// Global instance
const barcodeCache = new BarcodeCache();
