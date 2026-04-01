// Test script for Cloudflare R2 Backup System
const path = require('path');
const { scheduleAutomaticBackup, performStoreClosingBackup } = require('./backup-manager');

// Simulate database path
const DB_DIR = path.join(process.env.APPDATA, 'ShopSystem');
const DB_FILE = path.join(DB_DIR, 'shop.db');

console.log('Testing Cloudflare R2 Backup System...');
console.log('Database path:', DB_FILE);
console.log('');

// Test manual backup
console.log('Testing manual store closing backup...');
performStoreClosingBackup(DB_FILE)
  .then(result => {
    console.log('Manual backup result:', result);
    console.log('');
    
    if (result.success) {
      console.log('✓ Manual backup test PASSED');
      console.log('  Filename:', result.filename);
      console.log('  R2 Key:', result.r2Key);
    } else {
      console.log('✗ Manual backup test FAILED');
      console.log('  Error:', result.error);
    }
  })
  .catch(error => {
    console.error('✗ Manual backup test ERROR:', error);
  });

// Note: Automatic backup scheduling would be tested by waiting until 12 PM
console.log('');
console.log('Note: Automatic backup is scheduled for 12 PM daily');
console.log('To test automatic backup, wait until scheduled time or modify BACKUP_TIME_CRON in .env');
