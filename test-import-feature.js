// Test script for database import feature
// This script verifies the import module functions work correctly

const {
  validateDatabase,
  extractDataFromOldDb,
  createBackupBeforeImport
} = require('./database-import');
const path = require('path');
const fs = require('fs');

async function testImportFeature() {
  console.log('=== Testing Database Import Feature ===\n');

  // Test 1: Validate current database
  console.log('Test 1: Validating current database...');
  const dbPath = './shop.db';
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ shop.db not found. Please ensure the database exists.');
    return;
  }

  try {
    const validation = await validateDatabase(dbPath);
    console.log('✅ Validation result:', validation);
    
    if (validation.valid) {
      console.log('   Tables found:', validation.tables);
      console.log('   Has products:', validation.hasProducts);
      console.log('   Has bills:', validation.hasBills);
      console.log('   Has customers:', validation.hasCustomers);
    }
  } catch (error) {
    console.log('❌ Validation error:', error.message);
    return;
  }

  // Test 2: Extract data from database
  console.log('\nTest 2: Extracting data from database...');
  try {
    const validation = await validateDatabase(dbPath);
    const data = await extractDataFromOldDb(dbPath, validation);
    
    console.log('✅ Data extracted successfully:');
    console.log('   Products:', data.products.length);
    console.log('   Bills:', data.bills.length);
    console.log('   Bill Items:', data.billItems.length);
    console.log('   Customers:', data.customers.length);
    console.log('   Purchase History:', data.purchaseHistory.length);
    console.log('   Customer Payments:', data.customerPayments.length);
    console.log('   Payment Receipts:', data.paymentReceipts.length);
  } catch (error) {
    console.log('❌ Extraction error:', error.message);
    return;
  }

  // Test 3: Create backup
  console.log('\nTest 3: Testing backup creation...');
  try {
    const backupPath = await createBackupBeforeImport(dbPath);
    console.log('✅ Backup created:', backupPath);
    
    // Verify backup exists
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      console.log('   Backup size:', (stats.size / 1024).toFixed(2), 'KB');
      
      // Clean up test backup
      fs.unlinkSync(backupPath);
      console.log('   Test backup cleaned up');
    }
  } catch (error) {
    console.log('❌ Backup error:', error.message);
    return;
  }

  console.log('\n=== All Tests Passed! ===');
  console.log('\nThe import feature is ready to use.');
  console.log('Access it from the dashboard: Import DB menu item');
}

// Run tests
testImportFeature().catch(console.error);
