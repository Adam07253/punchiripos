// Database Import Module
// Imports data from old single database into current system

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * Validate uploaded database file
 * @param {string} dbPath - Path to uploaded database
 * @returns {Promise<object>} - Validation result
 */
async function validateDatabase(dbPath) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        resolve({ valid: false, error: 'Invalid SQLite database file' });
        return;
      }

      // Check for required tables
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        [],
        (err, tables) => {
          if (err) {
            db.close();
            resolve({ valid: false, error: 'Failed to read database schema' });
            return;
          }

          const tableNames = tables.map(t => t.name);
          const hasProducts = tableNames.includes('products');
          const hasBills = tableNames.includes('bills');

          db.close();

          if (!hasProducts && !hasBills) {
            resolve({
              valid: false,
              error: 'Database must contain at least products or bills table'
            });
          } else {
            resolve({
              valid: true,
              tables: tableNames,
              hasProducts,
              hasBills,
              hasCustomers: tableNames.includes('customers'),
              hasBillItems: tableNames.includes('bill_items'),
              hasPurchaseHistory: tableNames.includes('purchase_history')
            });
          }
        }
      );
    });
  });
}

/**
 * Read all data from old database
 * @param {string} dbPath - Path to old database
 * @param {object} schema - Schema information from validation
 * @returns {Promise<object>} - Extracted data
 */
async function extractDataFromOldDb(dbPath, schema) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(new Error('Failed to open database: ' + err.message));
        return;
      }

      const data = {
        products: [],
        bills: [],
        billItems: [],
        customers: [],
        purchaseHistory: [],
        customerPayments: [],
        paymentReceipts: []
      };

      const queries = [];

      // Extract products
      if (schema.hasProducts) {
        queries.push(
          new Promise((res, rej) => {
            db.all('SELECT * FROM products', [], (err, rows) => {
              if (err) rej(err);
              else {
                data.products = rows;
                res();
              }
            });
          })
        );
      }

      // Extract bills
      if (schema.hasBills) {
        queries.push(
          new Promise((res, rej) => {
            db.all('SELECT * FROM bills', [], (err, rows) => {
              if (err) rej(err);
              else {
                data.bills = rows;
                res();
              }
            });
          })
        );
      }

      // Extract bill_items
      if (schema.hasBillItems) {
        queries.push(
          new Promise((res, rej) => {
            db.all('SELECT * FROM bill_items', [], (err, rows) => {
              if (err) rej(err);
              else {
                data.billItems = rows;
                res();
              }
            });
          })
        );
      }

      // Extract customers
      if (schema.hasCustomers) {
        queries.push(
          new Promise((res, rej) => {
            db.all('SELECT * FROM customers', [], (err, rows) => {
              if (err) rej(err);
              else {
                data.customers = rows;
                res();
              }
            });
          })
        );
      }

      // Extract purchase_history
      if (schema.hasPurchaseHistory) {
        queries.push(
          new Promise((res, rej) => {
            db.all('SELECT * FROM purchase_history', [], (err, rows) => {
              if (err) rej(err);
              else {
                data.purchaseHistory = rows;
                res();
              }
            });
          })
        );
      }

      // Extract customer_payments if exists
      queries.push(
        new Promise((res) => {
          db.all('SELECT * FROM customer_payments', [], (err, rows) => {
            if (!err && rows) {
              data.customerPayments = rows;
            }
            res();
          });
        })
      );

      // Extract payment_receipts if exists
      queries.push(
        new Promise((res) => {
          db.all('SELECT * FROM payment_receipts', [], (err, rows) => {
            if (!err && rows) {
              data.paymentReceipts = rows;
            }
            res();
          });
        })
      );

      Promise.all(queries)
        .then(() => {
          db.close();
          resolve(data);
        })
        .catch((err) => {
          db.close();
          reject(err);
        });
    });
  });
}

/**
 * Import data into current database
 * @param {object} currentDb - Current database connection
 * @param {object} data - Data to import
 * @returns {Promise<object>} - Import statistics
 */
async function importDataToCurrentDb(currentDb, data) {
  return new Promise((resolve, reject) => {
    const stats = {
      products: 0,
      customers: 0,
      bills: 0,
      billItems: 0,
      purchaseHistory: 0,
      customerPayments: 0,
      paymentReceipts: 0,
      errors: []
    };

    // ID mapping for foreign key relationships
    const idMaps = {
      products: {},
      customers: {},
      bills: {},
      purchaseHistory: {}
    };

    currentDb.serialize(() => {
      currentDb.run('BEGIN TRANSACTION');

      // Import customers first (needed for bills)
      if (data.customers.length > 0) {
        const customerStmt = currentDb.prepare(`
          INSERT INTO customers (name, mobile, old_balance)
          VALUES (?, ?, ?)
        `);

        data.customers.forEach((customer) => {
          customerStmt.run(
            customer.name,
            customer.mobile || null,
            customer.old_balance || 0,
            function (err) {
              if (err) {
                stats.errors.push(`Customer import error: ${err.message}`);
              } else {
                idMaps.customers[customer.id] = this.lastID;
                stats.customers++;
              }
            }
          );
        });

        customerStmt.finalize();
      }

      // Import products (needed for bill_items and purchase_history)
      if (data.products.length > 0) {
        const productStmt = currentDb.prepare(`
          INSERT INTO products (
            name, unit, purchase_price, retail_price, wholesale_price,
            wholesale_min_qty, stock_qty, expiry_date, extra_expenses,
            purchased_from, purchase_date, active, special_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        data.products.forEach((product) => {
          productStmt.run(
            product.name,
            product.unit || 'pc',
            product.purchase_price || 0,
            product.retail_price || 0,
            product.wholesale_price || 0,
            product.wholesale_min_qty || 0,
            product.stock_qty || 0,
            product.expiry_date || null,
            product.extra_expenses || 0,
            product.purchased_from || null,
            product.purchase_date || null,
            product.active !== undefined ? product.active : 1,
            product.special_price || null,
            function (err) {
              if (err) {
                stats.errors.push(`Product import error: ${err.message}`);
              } else {
                idMaps.products[product.id] = this.lastID;
                stats.products++;
              }
            }
          );
        });

        productStmt.finalize();
      }

      // Import purchase_history (needed for bill_items)
      if (data.purchaseHistory.length > 0) {
        const purchaseStmt = currentDb.prepare(`
          INSERT INTO purchase_history (
            product_id, qty, remaining_qty, purchase_price, extra_expenses,
            expiry_date, purchased_from, purchase_date, created_at,
            retail_price_at_purchase, wholesale_price_at_purchase, special_price_at_purchase
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        data.purchaseHistory.forEach((ph) => {
          const newProductId = idMaps.products[ph.product_id] || ph.product_id;
          
          purchaseStmt.run(
            newProductId,
            ph.qty || 0,
            ph.remaining_qty || 0,
            ph.purchase_price || 0,
            ph.extra_expenses || 0,
            ph.expiry_date || null,
            ph.purchased_from || null,
            ph.purchase_date || null,
            ph.created_at || null,
            ph.retail_price_at_purchase || null,
            ph.wholesale_price_at_purchase || null,
            ph.special_price_at_purchase || null,
            function (err) {
              if (err) {
                stats.errors.push(`Purchase history import error: ${err.message}`);
              } else {
                idMaps.purchaseHistory[ph.id] = this.lastID;
                stats.purchaseHistory++;
              }
            }
          );
        });

        purchaseStmt.finalize();
      }

      // Import bills
      if (data.bills.length > 0) {
        const billStmt = currentDb.prepare(`
          INSERT INTO bills (
            subtotal, payment_mode, final_amount, date, customer_id,
            previous_ob, paid_amount, new_ob, is_edited, edited_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        data.bills.forEach((bill) => {
          const newCustomerId = bill.customer_id ? 
            (idMaps.customers[bill.customer_id] || bill.customer_id) : null;

          billStmt.run(
            bill.subtotal || 0,
            bill.payment_mode || 'cash',
            bill.final_amount || 0,
            bill.date || new Date().toISOString(),
            newCustomerId,
            bill.previous_ob || 0,
            bill.paid_amount || 0,
            bill.new_ob || 0,
            bill.is_edited || 0,
            bill.edited_at || null,
            function (err) {
              if (err) {
                stats.errors.push(`Bill import error: ${err.message}`);
              } else {
                idMaps.bills[bill.id] = this.lastID;
                stats.bills++;
              }
            }
          );
        });

        billStmt.finalize();
      }

      // Import bill_items
      if (data.billItems.length > 0) {
        const billItemStmt = currentDb.prepare(`
          INSERT INTO bill_items (
            bill_id, product_id, qty, price, total, purchase_history_id, price_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        data.billItems.forEach((item) => {
          const newBillId = idMaps.bills[item.bill_id] || item.bill_id;
          const newProductId = idMaps.products[item.product_id] || item.product_id;
          const newPurchaseHistoryId = item.purchase_history_id ?
            (idMaps.purchaseHistory[item.purchase_history_id] || item.purchase_history_id) : null;

          billItemStmt.run(
            newBillId,
            newProductId,
            item.qty || 0,
            item.price || 0,
            item.total || 0,
            newPurchaseHistoryId,
            item.price_type || null,
            function (err) {
              if (err) {
                stats.errors.push(`Bill item import error: ${err.message}`);
              } else {
                stats.billItems++;
              }
            }
          );
        });

        billItemStmt.finalize();
      }

      // Import customer_payments
      if (data.customerPayments.length > 0) {
        const paymentStmt = currentDb.prepare(`
          INSERT INTO customer_payments (
            customer_id, amount, payment_mode, note, date
          ) VALUES (?, ?, ?, ?, ?)
        `);

        data.customerPayments.forEach((payment) => {
          const newCustomerId = idMaps.customers[payment.customer_id] || payment.customer_id;

          paymentStmt.run(
            newCustomerId,
            payment.amount || 0,
            payment.payment_mode || 'cash',
            payment.note || null,
            payment.date || null,
            function (err) {
              if (err) {
                stats.errors.push(`Customer payment import error: ${err.message}`);
              } else {
                stats.customerPayments++;
              }
            }
          );
        });

        paymentStmt.finalize();
      }

      // Import payment_receipts
      if (data.paymentReceipts.length > 0) {
        const receiptStmt = currentDb.prepare(`
          INSERT INTO payment_receipts (
            customer_id, customer_name, old_ob, paid_amount, new_ob, created_at, bill_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        data.paymentReceipts.forEach((receipt) => {
          const newCustomerId = idMaps.customers[receipt.customer_id] || receipt.customer_id;
          const newBillId = receipt.bill_id ? 
            (idMaps.bills[receipt.bill_id] || receipt.bill_id) : null;

          receiptStmt.run(
            newCustomerId,
            receipt.customer_name || '',
            receipt.old_ob || 0,
            receipt.paid_amount || 0,
            receipt.new_ob || 0,
            receipt.created_at || null,
            newBillId,
            function (err) {
              if (err) {
                stats.errors.push(`Payment receipt import error: ${err.message}`);
              } else {
                stats.paymentReceipts++;
              }
            }
          );
        });

        receiptStmt.finalize();
      }

      currentDb.run('COMMIT', (err) => {
        if (err) {
          currentDb.run('ROLLBACK');
          reject(new Error('Transaction failed: ' + err.message));
        } else {
          resolve(stats);
        }
      });
    });
  });
}

/**
 * Create backup of current database before import
 * @param {string} dbPath - Path to current database
 * @returns {Promise<string>} - Path to backup file
 */
async function createBackupBeforeImport(dbPath) {
  return new Promise((resolve, reject) => {
    const backupDir = path.join(path.dirname(dbPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `shop_backup_before_import_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    const readStream = fs.createReadStream(dbPath);
    const writeStream = fs.createWriteStream(backupPath);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', () => resolve(backupPath));

    readStream.pipe(writeStream);
  });
}

/**
 * Restore database from backup
 * @param {string} backupPath - Path to backup file
 * @param {string} targetPath - Path to restore to
 * @returns {Promise<void>}
 */
async function restoreFromBackup(backupPath, targetPath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(backupPath);
    const writeStream = fs.createWriteStream(targetPath);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    readStream.pipe(writeStream);
  });
}

module.exports = {
  validateDatabase,
  extractDataFromOldDb,
  importDataToCurrentDb,
  createBackupBeforeImport,
  restoreFromBackup
};
