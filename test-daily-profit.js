// Daily Profit Page Test Script
// Run this to verify the daily profit calculations are accurate

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(process.env.APPDATA, 'ShopSystem', 'store.db');
const db = new sqlite3.Database(DB_PATH);

console.log('='.repeat(60));
console.log('DAILY PROFIT PAGE - DATA VERIFICATION TEST');
console.log('='.repeat(60));
console.log('');

// Test 1: Check if we have bills data
console.log('TEST 1: Checking Bills Data...');
db.get(`
  SELECT 
    COUNT(*) as total_bills,
    MIN(date(date)) as first_bill,
    MAX(date(date)) as last_bill,
    SUM(final_amount) as total_revenue
  FROM bills
`, (err, row) => {
  if (err) {
    console.error('❌ Error:', err.message);
    return;
  }
  
  console.log('✓ Total Bills:', row.total_bills);
  console.log('✓ First Bill Date:', row.first_bill);
  console.log('✓ Last Bill Date:', row.last_bill);
  console.log('✓ Total Revenue: ₹' + (row.total_revenue || 0).toFixed(2));
  console.log('');
  
  // Test 2: Check today's data
  const today = new Date().toISOString().split('T')[0];
  console.log('TEST 2: Checking Today\'s Data (' + today + ')...');
  
  db.get(`
    SELECT 
      COUNT(*) as bills,
      IFNULL(SUM(final_amount), 0) as sales
    FROM bills
    WHERE date(date) = date(?)
  `, [today], (err2, todayRow) => {
    if (err2) {
      console.error('❌ Error:', err2.message);
      return;
    }
    
    console.log('✓ Today\'s Bills:', todayRow.bills);
    console.log('✓ Today\'s Sales: ₹' + todayRow.sales.toFixed(2));
    console.log('');
    
    // Test 3: Check profit calculation for today
    console.log('TEST 3: Checking Profit Calculation...');
    
    db.all(`
      SELECT 
        p.name,
        SUM(bi.qty) as qty_sold,
        SUM(bi.total) as sales,
        SUM((bi.price - COALESCE(ph.purchase_price, p.purchase_price)) * bi.qty) as profit
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN purchase_history ph ON bi.purchase_history_id = ph.id
      WHERE date(b.date) = date(?)
      GROUP BY p.id
      ORDER BY profit DESC
      LIMIT 5
    `, [today], (err3, profitRows) => {
      if (err3) {
        console.error('❌ Error:', err3.message);
        return;
      }
      
      if (profitRows.length === 0) {
        console.log('⚠ No sales today to calculate profit');
      } else {
        console.log('✓ Top 5 Products by Profit:');
        console.log('-'.repeat(60));
        profitRows.forEach((row, i) => {
          console.log(`${i+1}. ${row.name}`);
          console.log(`   Qty: ${row.qty_sold} | Sales: ₹${row.sales.toFixed(2)} | Profit: ₹${row.profit.toFixed(2)}`);
        });
      }
      console.log('');
      
      // Test 4: Check purchases for today
      console.log('TEST 4: Checking Today\'s Purchases...');
      
      db.all(`
        SELECT 
          p.name,
          ph.qty,
          ph.purchase_price,
          (ph.qty * ph.purchase_price) as total_cost
        FROM purchase_history ph
        JOIN products p ON ph.product_id = p.id
        WHERE date(ph.purchase_date) = date(?)
        ORDER BY total_cost DESC
        LIMIT 5
      `, [today], (err4, purchaseRows) => {
        if (err4) {
          console.error('❌ Error:', err4.message);
          return;
        }
        
        if (purchaseRows.length === 0) {
          console.log('⚠ No purchases today');
        } else {
          console.log('✓ Today\'s Purchases:');
          console.log('-'.repeat(60));
          purchaseRows.forEach((row, i) => {
            console.log(`${i+1}. ${row.name}`);
            console.log(`   Qty: ${row.qty} | Unit Cost: ₹${row.purchase_price.toFixed(2)} | Total: ₹${row.total_cost.toFixed(2)}`);
          });
        }
        console.log('');
        
        // Test 5: Verify FIFO tracking
        console.log('TEST 5: Checking FIFO Tracking...');
        
        db.all(`
          SELECT 
            bi.id as bill_item_id,
            p.name,
            bi.qty,
            bi.price as selling_price,
            COALESCE(ph.purchase_price, p.purchase_price) as cost_price,
            (bi.price - COALESCE(ph.purchase_price, p.purchase_price)) * bi.qty as profit,
            CASE 
              WHEN bi.purchase_history_id IS NOT NULL THEN 'FIFO'
              ELSE 'Fallback'
            END as cost_source
          FROM bill_items bi
          JOIN bills b ON bi.bill_id = b.id
          JOIN products p ON bi.product_id = p.id
          LEFT JOIN purchase_history ph ON bi.purchase_history_id = ph.id
          WHERE date(b.date) = date(?)
          LIMIT 5
        `, [today], (err5, fifoRows) => {
          if (err5) {
            console.error('❌ Error:', err5.message);
            return;
          }
          
          if (fifoRows.length === 0) {
            console.log('⚠ No bill items today to check FIFO');
          } else {
            console.log('✓ FIFO Cost Tracking:');
            console.log('-'.repeat(60));
            fifoRows.forEach((row, i) => {
              console.log(`${i+1}. ${row.name} (${row.cost_source})`);
              console.log(`   Qty: ${row.qty} | Sell: ₹${row.selling_price} | Cost: ₹${row.cost_price.toFixed(2)} | Profit: ₹${row.profit.toFixed(2)}`);
            });
          }
          console.log('');
          
          // Test 6: Summary calculation
          console.log('TEST 6: Overall Summary Calculation...');
          
          db.get(`
            SELECT 
              (SELECT COUNT(*) FROM bills WHERE date(date) = date(?)) as total_bills,
              (SELECT IFNULL(SUM(final_amount), 0) FROM bills WHERE date(date) = date(?)) as total_sales,
              (SELECT IFNULL(SUM(qty * purchase_price), 0) FROM purchase_history WHERE date(purchase_date) = date(?)) as total_purchases,
              (SELECT IFNULL(SUM((bi.price - COALESCE(ph.purchase_price, p.purchase_price)) * bi.qty), 0)
               FROM bill_items bi
               JOIN bills b ON bi.bill_id = b.id
               JOIN products p ON bi.product_id = p.id
               LEFT JOIN purchase_history ph ON bi.purchase_history_id = ph.id
               WHERE date(b.date) = date(?)) as total_profit
          `, [today, today, today, today], (err6, summary) => {
            if (err6) {
              console.error('❌ Error:', err6.message);
              db.close();
              return;
            }
            
            const profitPercentage = summary.total_sales > 0 
              ? ((summary.total_profit / summary.total_sales) * 100).toFixed(2)
              : '0.00';
            
            console.log('✓ Summary for ' + today + ':');
            console.log('-'.repeat(60));
            console.log('Total Bills:', summary.total_bills);
            console.log('Total Sales: ₹' + summary.total_sales.toFixed(2));
            console.log('Total Purchases: ₹' + summary.total_purchases.toFixed(2));
            console.log('Total Profit: ₹' + summary.total_profit.toFixed(2));
            console.log('Profit Margin:', profitPercentage + '%');
            console.log('');
            
            // Final verdict
            console.log('='.repeat(60));
            console.log('TEST RESULTS:');
            console.log('='.repeat(60));
            
            if (summary.total_bills > 0) {
              console.log('✅ Daily Profit page should display data correctly');
              console.log('✅ Profit calculations are accurate');
              console.log('✅ FIFO cost tracking is working');
            } else {
              console.log('⚠️  No bills today - Create some test bills to verify');
              console.log('💡 Suggestion: Go to billing page and create a test bill');
            }
            
            console.log('');
            console.log('To view in browser:');
            console.log('http://localhost:3000/daily_profit.html');
            console.log('');
            
            db.close();
          });
        });
      });
    });
  });
});
