/**
 * Real-Time Synchronization Module
 * Handles WebSocket connections and broadcasts database changes to all connected clients
 */

const WebSocket = require('ws');

class RealtimeSync {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    
    this.wss.on('connection', (ws) => {
      console.log('Client connected to real-time sync');
      this.clients.add(ws);
      
      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Real-time sync established',
        timestamp: new Date().toISOString()
      }));
      
      ws.on('close', () => {
        console.log('Client disconnected from real-time sync');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }
  
  /**
   * Broadcast an update to all connected clients
   * @param {string} type - Type of update (product, bill, customer, stock, etc.)
   * @param {object} data - Data to broadcast
   */
  broadcast(type, data) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Error sending to client:', error);
        }
      }
    });
  }
  
  // Specific broadcast methods for different entity types
  
  productAdded(product) {
    this.broadcast('product:added', product);
  }
  
  productUpdated(product) {
    this.broadcast('product:updated', product);
  }
  
  productDeleted(productId) {
    this.broadcast('product:deleted', { id: productId });
  }
  
  productToggled(productId, active) {
    this.broadcast('product:toggled', { id: productId, active });
  }
  
  stockAdded(data) {
    this.broadcast('stock:added', data);
  }
  
  stockUpdated(data) {
    this.broadcast('stock:updated', data);
  }
  
  priceUpdated(data) {
    this.broadcast('price:updated', data);
  }
  
  billCreated(bill) {
    this.broadcast('bill:created', bill);
  }
  
  billUpdated(bill) {
    this.broadcast('bill:updated', bill);
  }
  
  billDeleted(billId) {
    this.broadcast('bill:deleted', { id: billId });
  }
  
  customerAdded(customer) {
    this.broadcast('customer:added', customer);
  }
  
  customerUpdated(customer) {
    this.broadcast('customer:updated', customer);
  }
  
  customerDeleted(customerId) {
    this.broadcast('customer:deleted', { id: customerId });
  }
  
  paymentAdded(payment) {
    this.broadcast('payment:added', payment);
  }
}

module.exports = RealtimeSync;
