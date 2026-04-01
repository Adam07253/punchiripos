/**
 * Script to add real-time broadcast calls to server.js
 * This adds WebSocket broadcasts after successful database operations
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Track if we made any changes
let modified = false;

// Helper function to add broadcast after a specific pattern
function addBroadcastAfter(pattern, broadcastCode) {
  const regex = new RegExp(pattern, 'g');
  const matches = content.match(regex);
  
  if (matches) {
    content = content.replace(regex, (match) => {
      // Check if broadcast already exists nearby
      const checkArea = content.substring(
        content.indexOf(match),
        content.indexOf(match) + 500
      );
      
      if (checkArea.includes('realtimeSync')) {
        return match; // Already has broadcast
      }
      
      modified = true;
      return match + '\n' + broadcastCode;
    });
  }
}

console.log('Adding real-time broadcasts to server.js...\n');

// 1. Add product broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*status:\\s*"success",\\s*id:\\s*productId`,
  `                // Real-time broadcast
                if (realtimeSync) {
                  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
                    if (!err && product) realtimeSync.productAdded(product);
                  });
                }`
);

// 2. Add stock broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*status:\\s*"success",\\s*product_id:\\s*prod\\.id,\\s*added_qty`,
  `                // Real-time broadcast
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
                }`
);

// 3. Add price update broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*status:\\s*"success"\\s*\\}\\);\\s*\\}\\s*\\);\\s*\\};\\s*\\/\\/ -------------------------\\s*\\/\\/ Update customer OB`,
  `    // Real-time broadcast
    if (realtimeSync) {
      db.get("SELECT * FROM products WHERE id = ?", [p.id], (err, product) => {
        if (!err && product) realtimeSync.priceUpdated(product);
      });
    }`
);

// 4. Add bill creation broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*status:\\s*"success",\\s*bill_id:\\s*billId,\\s*subtotal,\\s*finalAmount\\s*\\}\\)`,
  `        // Real-time broadcast
        if (realtimeSync) {
          db.get("SELECT * FROM bills WHERE id = ?", [billId], (err, bill) => {
            if (!err && bill) {
              db.all("SELECT * FROM bill_items WHERE bill_id = ?", [billId], (err2, items) => {
                if (!err2) realtimeSync.billCreated({ ...bill, items });
              });
            }
          });
        }`
);

// 5. Add customer broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*status:\\s*"ok",\\s*id:\\s*this\\.lastID\\s*\\}\\);\\s*\\}\\s*\\);\\s*\\};\\s*\\/\\/ -------------------------\\s*\\/\\/ Get all customers`,
  `      // Real-time broadcast
      const customerId = this.lastID;
      if (realtimeSync) {
        db.get("SELECT * FROM customers WHERE id = ?", [customerId], (err, customer) => {
          if (!err && customer) realtimeSync.customerAdded(customer);
        });
      }`
);

// 6. Add customer update broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*status:\\s*"ok"\\s*\\}\\)\\s*\\)\\s*\\);\\s*\\}\\s*if\\s*\\(old_balance\\s*!==\\s*undefined\\)`,
  `        // Real-time broadcast
        if (realtimeSync) {
          db.get("SELECT * FROM customers WHERE id = ?", [id], (err, customer) => {
            if (!err && customer) realtimeSync.customerUpdated(customer);
          });
        }`
);

// 7. Add customer delete broadcasts
addBroadcastAfter(
  `res\\.send\\(\\{\\s*success:\\s*true\\s*\\}\\);\\s*\\}\\s*\\);\\s*\\};\\s*\\/\\/ -------------------------\\s*\\/\\/ Toggle product`,
  `      // Real-time broadcast
      if (realtimeSync) {
        realtimeSync.customerDeleted(customer_id);
      }`
);

// 8. Add payment broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*success:\\s*true,\\s*receipt_id:\\s*receiptId\\s*\\}\\);`,
  `          // Real-time broadcast
          if (realtimeSync) {
            db.get("SELECT * FROM payment_receipts WHERE id = ?", [receiptId], (err, receipt) => {
              if (!err && receipt) realtimeSync.paymentAdded(receipt);
            });
          }`
);

// 9. Add product toggle broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*success:\\s*true\\s*\\}\\);\\s*\\}\\s*\\);\\s*\\};\\s*app\\.post\\("/payments/add"`,
  `      // Real-time broadcast
      if (realtimeSync) {
        db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
          if (!err && product) realtimeSync.productToggled(id, product.active);
        });
      }`
);

// 10. Add product name update broadcasts
addBroadcastAfter(
  `res\\.json\\(\\{\\s*status:\\s*"success"\\s*\\}\\);\\s*\\}\\s*\\);\\s*\\}\\s*\\);\\s*\\};\\s*\\/\\/ -------------------------\\s*\\/\\/ Create bill`,
  `          // Real-time broadcast
          if (realtimeSync) {
            db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
              if (!err && product) realtimeSync.productUpdated(product);
            });
          }`
);

// Write the modified content back
if (modified) {
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('✓ Successfully added real-time broadcasts to server.js');
  console.log('✓ WebSocket integration complete');
} else {
  console.log('✓ Real-time broadcasts already present or patterns not found');
  console.log('  Manual integration may be required');
}

console.log('\nNext steps:');
console.log('1. Restart the server: node server.js');
console.log('2. Open any page in the application');
console.log('3. Real-time updates will sync automatically across all clients');
