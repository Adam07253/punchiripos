/**
 * Real-Time Client - Handles WebSocket connection and UI updates
 * Automatically reconnects on disconnect
 */

class RealtimeClient {
  constructor(options = {}) {
    this.ws = null;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.reconnectTimer = null;
    this.handlers = new Map();
    this.isConnected = false;
    this.url = options.url || `ws://${window.location.hostname}:3000`;
    
    // Auto-connect
    this.connect();
  }
  
  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('✓ Real-time sync connected');
        this.isConnected = true;
        
        // Clear reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Trigger connection handlers
        this.trigger('connected', { timestamp: new Date().toISOString() });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('✗ Real-time sync disconnected');
        this.isConnected = false;
        this.trigger('disconnected', {});
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Connection error:', error);
      this.scheduleReconnect();
    }
  }
  
  scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    console.log(`Reconnecting in ${this.reconnectInterval / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }
  
  handleMessage(message) {
    const { type, data, timestamp } = message;
    
    // Trigger specific handlers
    this.trigger(type, data);
    
    // Trigger wildcard handlers
    this.trigger('*', { type, data, timestamp });
  }
  
  /**
   * Register a handler for a specific event type
   * @param {string} type - Event type (e.g., 'product:added', 'bill:created')
   * @param {function} handler - Handler function
   */
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }
  
  /**
   * Remove a handler
   */
  off(type, handler) {
    if (!this.handlers.has(type)) return;
    const handlers = this.handlers.get(type);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * Trigger all handlers for a specific type
   */
  trigger(type, data) {
    if (!this.handlers.has(type)) return;
    
    this.handlers.get(type).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in handler for ${type}:`, error);
      }
    });
  }
  
  /**
   * Close the connection
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
  }
}

// Create global instance
window.realtimeClient = new RealtimeClient();
