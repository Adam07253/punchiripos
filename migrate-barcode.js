const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Use the same database path as server.js
const DB_DIR = path.join(process.env.APPDATA, 'ShopSystem');
const DB_FILE = path.join(DB_DIR, 'shop.db');

console.log('Database path:', DB_FILE);

// Connect to the database
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database for migration.');
});

// Migration script to add barcode columns
function migrateDatabase() {
  db.serialize(() => {
    console.log('Starting barcode system migration...');

    // Add barcode column (TEXT) - UNIQUE constraint will be added via index
    db.run(`ALTER TABLE products ADD COLUMN barcode TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding barcode column:', err.message);
      } else {
        console.log('✓ Added barcode column');
      }
    });

    // Add barcode_type column (TEXT, nullable)
    db.run(`ALTER TABLE products ADD COLUMN barcode_type TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding barcode_type column:', err.message);
      } else {
        console.log('✓ Added barcode_type column');
      }
    });

    // Add created_by_barcode column (INTEGER, DEFAULT 0)
    db.run(`ALTER TABLE products ADD COLUMN created_by_barcode INTEGER DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding created_by_barcode column:', err.message);
      } else {
        console.log('✓ Added created_by_barcode column');
      }
    });

    // Create unique index on barcode column for fast lookups and uniqueness
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`, (err) => {
      if (err) {
        console.error('Error creating barcode index:', err.message);
      } else {
        console.log('✓ Created unique index idx_products_barcode');
      }
    });

    console.log('\nMigration completed successfully!');
    console.log('Barcode system database schema is ready.');
    
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  });
}

// Run migration
migrateDatabase();
