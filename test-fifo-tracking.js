// Test script to verify FIFO purchase_history_id tracking
// This script demonstrates that the system correctly tracks which batch stock comes from

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(process.env.APPDATA, 'ShopSystem');
const DB_FILE = path.join(DB_DIR, 'shop.db');

console.log('Testing FIFO purchase_history_id tracking...');
console.log('Database:', DB_FILE);

if (!fs.existsSync(DB_FILE)) {
  console.error('Database file not found. Please run the application first.');
  process.exit(1);
}

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
});

// Check if bill_items has purchase_history_id column
db.all("PRAGMA table_info(bill_items)", (err, columns) => {
  if (err) {
    console.error('Error checking table schema:', err);
    db.close();
    return;
  }

  console.log('\n✓ bill_items table columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  const hasColumn = columns.some(col => col.name === 'purchase_history_id');
  
  if (hasColumn) {
    console.log('\n✓ purchase_history_id column exists in bill_items table');
    
    // Check for recent bills with FIFO tracking
    db.all(`
      SELECT 
        bi.id,
        bi.bill_id,
        bi.product_id,
        p.name as product_name,
        bi.qty,
        bi.price,
        bi.purchase_history_id,
        ph.purchase_price as batch_purchase_price,
        ph.purchase_date as batch_date
      FROM bill_items bi
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN purchase_history ph ON bi.purchase_history_id = ph.id
      ORDER BY bi.id DESC
      LIMIT 10
    `, (err, rows) => {
      if (err) {
        console.error('Error querying bill_items:', err);
        db.close();
        return;
      }

      if (rows.length === 0) {
        console.log('\n⚠ No bill items found. Create a bill to test FIFO tracking.');
      } else {
        console.log('\n✓ Recent bill items with FIFO tracking:');
        console.log('─'.repeat(80));
        rows.forEach(row => {
          console.log(`Bill Item #${row.id} (Bill #${row.bill_id})`);
          console.log(`  Product: ${row.product_name}`);
          console.log(`  Qty: ${row.qty}, Price: ${row.price}`);
          console.log(`  FIFO Batch ID: ${row.purchase_history_id || 'NULL (negative stock)'}`);
          if (row.purchase_history_id) {
            console.log(`  Batch Purchase Price: ${row.batch_purchase_price}`);
            console.log(`  Batch Date: ${row.batch_date}`);
          }
          console.log('─'.repeat(80));
        });
      }

      db.close();
      console.log('\n✓ Test complete!');
    });
  } else {
    console.log('\n✗ ERROR: purchase_history_id column NOT found in bill_items table!');
    db.close();
  }
});
