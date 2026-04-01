/**
 * Server Real-Time Integration Guide
 * 
 * This file contains code snippets to integrate real-time broadcasts
 * into existing server.js endpoints.
 * 
 * Add these broadcasts after successful database operations.
 */

// ============================================
// PRODUCT OPERATIONS
// ============================================

// After adding a product successfully:
if (realtimeSync) {
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (!err && product) {
      realtimeSync.productAdded(product);
    }
  });
}

// After updating product price:
if (realtimeSync) {
  db.get("SELECT * FROM products WHERE id = ?", [p.id], (err, product) => {
    if (!err && product) {
      realtimeSync.priceUpdated(product);
    }
  });
}

// After updating product name:
if (realtimeSync) {
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
    if (!err && product) {
      realtimeSync.productUpdated(product);
    }
  });
}

// After toggling product active status:
if (realtimeSync) {
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
    if (!err && product) {
      realtimeSync.productToggled(id, product.active);
    }
  });
}

// ============================================
// STOCK OPERATIONS
// ============================================

// After adding stock:
if (realtimeSync) {
  db.get("SELECT * FROM products WHERE id = ?", [prod.id], (err, product) => {
    if (!err && product) {
      realtimeSync.stockAdded({
        product_id: prod.id,
        product: product,
        added_qty: qty,
        new_stock: newStock
      });
    }
  });
}

// ============================================
// BILL OPERATIONS
// ============================================

// After creating a bill:
if (realtimeSync) {
  db.get("SELECT * FROM bills WHERE id = ?", [billId], (err, bill) => {
    if (!err && bill) {
      db.all("SELECT * FROM bill_items WHERE bill_id = ?", [billId], (err2, items) => {
        if (!err2) {
          realtimeSync.billCreated({ ...bill, items });
        }
      });
    }
  });
}

// After updating a bill:
if (realtimeSync) {
  db.get("SELECT * FROM bills WHERE id = ?", [billId], (err, bill) => {
    if (!err && bill) {
      db.all("SELECT * FROM bill_items WHERE bill_id = ?", [billId], (err2, items) => {
        if (!err2) {
          realtimeSync.billUpdated({ ...bill, items });
        }
      });
    }
  });
}

// ============================================
// CUSTOMER OPERATIONS
// ============================================

// After adding a customer:
if (realtimeSync) {
  db.get("SELECT * FROM customers WHERE id = ?", [this.lastID], (err, customer) => {
    if (!err && customer) {
      realtimeSync.customerAdded(customer);
    }
  });
}

// After updating customer:
if (realtimeSync) {
  db.get("SELECT * FROM customers WHERE id = ?", [id], (err, customer) => {
    if (!err && customer) {
      realtimeSync.customerUpdated(customer);
    }
  });
}

// After deleting customer:
if (realtimeSync) {
  realtimeSync.customerDeleted(customer_id);
}

// ============================================
// PAYMENT OPERATIONS
// ============================================

// After adding payment:
if (realtimeSync) {
  db.get("SELECT * FROM payment_receipts WHERE id = ?", [receiptId], (err, receipt) => {
    if (!err && receipt) {
      realtimeSync.paymentAdded(receipt);
    }
  });
}
