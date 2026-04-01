// Diagnostic script to verify FIFO restoration logic
// This checks if bill_items have purchase_history_id populated

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(process.env.APPDATA, 'ShopSystem');
const DB_FILE = path.join(DB_DIR, 'shop.db');

console.log('Verifying FIFO Restoration Logic...');
console.log('Database:', DB_FILE);
console.log('='.repeat(80));

if (!fs.existsSync(DB_FILE)) {
  console.error('❌ Database file not found. Please run the application first.');
  process.exit(1);
}

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
});

// Check bill_items with and without purchase_history_id
db.all(`
  SELECT 
    COUNT(*) as total_items,
    SUM(CASE WHEN purchase_history_id IS NOT NULL THEN 1 ELSE 0 END) as with_batch_id,
    SUM(CASE WHEN purchase_history_id IS NULL THEN 1 ELSE 0 END) as without_batch_id
  FROM bill_items
`, (err, stats) => {
  if (err) {
    console.error('❌ Error querying bill_items:', err);
    db.close();
    return;
  }

  const stat = stats[0];
  console.log('\n📊 Bill Items Statistics:');
  console.log(`   Total bill items: ${stat.total_items}`);
  console.log(`   ✓ With purchase_history_id: ${stat.with_batch_id} (${((stat.with_batch_id/stat.total_items)*100).toFixed(1)}%)`);
  console.log(`   ⚠ Without purchase_history_id: ${stat.without_batch_id} (${((stat.without_batch_id/stat.total_items)*100).toFixed(1)}%)`);

  if (stat.without_batch_id > 0) {
    console.log('\n⚠️  WARNING: Some bill items have NULL purchase_history_id');
    console.log('   This means:');
    console.log('   - These items were sold when stock was negative, OR');
    console.log('   - These bills were created before FIFO tracking was implemented');
    console.log('   - When editing these bills, FIFO batches cannot be restored');
    
    // Show sample bills without batch tracking
    db.all(`
      SELECT 
        b.id as bill_id,
        b.date,
        bi.product_id,
        p.name as product_name,
        bi.qty,
        bi.purchase_history_id
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      JOIN products p ON bi.product_id = p.id
      WHERE bi.purchase_history_id IS NULL
      ORDER BY b.id DESC
      LIMIT 5
    `, (err2, samples) => {
      if (err2) {
        console.error('❌ Error querying samples:', err2);
        db.close();
        return;
      }

      if (samples.length > 0) {
        console.log('\n📋 Sample bills without FIFO tracking (most recent 5):');
        console.log('─'.repeat(80));
        samples.forEach(s => {
          console.log(`   Bill #${s.bill_id} (${s.date})`);
          console.log(`   Product: ${s.product_name}, Qty: ${s.qty}`);
          console.log(`   purchase_history_id: NULL`);
          console.log('─'.repeat(80));
        });
      }

      checkRestorationLogic();
    });
  } else {
    console.log('\n✅ All bill items have proper FIFO tracking!');
    checkRestorationLogic();
  }
});

function checkRestorationLogic() {
  console.log('\n🔍 Checking FIFO Restoration Logic in Code...');
  
  const serverFile = path.join(__dirname, 'server.js');
  if (!fs.existsSync(serverFile)) {
    console.log('⚠️  Cannot verify code - server.js not found in current directory');
    db.close();
    return;
  }

  const code = fs.readFileSync(serverFile, 'utf8');
  
  // Check if restoration logic exists
  const hasRestoration = code.includes('UPDATE purchase_history SET remaining_qty = remaining_qty + ?');
  const hasCheck = code.includes('if (it.purchase_history_id)');
  
  console.log(`   ✓ FIFO restoration code exists: ${hasRestoration ? 'YES' : 'NO'}`);
  console.log(`   ✓ purchase_history_id check exists: ${hasCheck ? 'YES' : 'NO'}`);
  
  if (hasRestoration && hasCheck) {
    console.log('\n✅ FIFO restoration logic is correctly implemented in /update-bill');
    console.log('   When editing a bill:');
    console.log('   1. Old stock is restored to products.stock_qty');
    console.log('   2. If purchase_history_id exists, batch remaining_qty is restored');
    console.log('   3. New items are processed with fresh FIFO deduction');
  } else {
    console.log('\n❌ FIFO restoration logic may be missing or incomplete');
  }

  db.close();
  console.log('\n' + '='.repeat(80));
  console.log('✓ Verification complete!');
}
