
// server.js — Final FIFO-enabled backend with report-folder + save-report
// Default report folder set from user: D:\reports dec 2025

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const http = require('http');
const RealtimeSync = require('./realtime-sync');
const { scheduleAutomaticBackup, performStoreClosingBackup } = require('./backup-manager');
const {
  validateDatabase,
  extractDataFromOldDb,
  importDataToCurrentDb,
  createBackupBeforeImport,
  restoreFromBackup
} = require('./database-import');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static('frontend'));

// Multer for file uploads
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Real-time sync instance (will be set after server creation)
let realtimeSync = null;
const setRealtimeSync = (sync) => { realtimeSync = sync; };

const DB_DIR = path.join(process.env.APPDATA, 'ShopSystem');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_FILE = path.join(DB_DIR, 'store.db');

// --- Automatic Daily Database Backup ---
try {
  if (fs.existsSync(DB_FILE)) {
    const BACKUP_DIR = path.join(DB_DIR, 'backups');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const backupFileName = `store_backup_${yyyy}${mm}${dd}.db`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);

    if (!fs.existsSync(backupFilePath)) {
      fs.copyFileSync(DB_FILE, backupFilePath);
      console.log("Database backup created:", backupFileName);
    } else {
      console.log("Database backup already exists for today");
    }
  }
} catch (backupErr) {
  console.error("Database backup failed:", backupErr);
}
// ---------------------------------------

console.log("Database path:", DB_FILE);
const SETTINGS_FILE = path.join(DB_DIR, 'settings.json');

// default folder (from your reply)
const DEFAULT_REPORT_FOLDER = "D:\\reports dec 2025";

// -------------------------
// Helper: settings file
// -------------------------
function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      const init = { report_folder: DEFAULT_REPORT_FOLDER };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(init, null, 2));
      return init;
    }
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8') || '{}');
  } catch (e) {
    console.error('settings load error', e);
    return { report_folder: DEFAULT_REPORT_FOLDER };
  }
}
function saveSettings(s) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

let SETTINGS = loadSettings();
if (!SETTINGS.report_folder) SETTINGS.report_folder = DEFAULT_REPORT_FOLDER;
if (!fs.existsSync(SETTINGS.report_folder)) {
  try { fs.mkdirSync(SETTINGS.report_folder, { recursive: true }); } catch (e) { console.error('mkdir failed', e); }
}

// -------------------------
// DB
// -------------------------
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error('DB ERROR:', err);
  else console.log('Database connected.');
});
function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}
// ✅ APPLY AFTER CREATION
db.configure("busyTimeout", 5000);
db.run("PRAGMA journal_mode = WAL;");

// create tables if not exists (safe)
db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS payment_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    old_ob REAL NOT NULL,
    paid_amount REAL NOT NULL,
    new_ob REAL NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  )
`);
  db.run(
    "ALTER TABLE payment_receipts ADD COLUMN bill_id INTEGER",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding bill_id column:", err.message);
      }
    }
  );
  db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL CHECK(unit IN ('kg', 'pc')),
    purchase_price REAL NOT NULL,
    retail_price REAL NOT NULL,
    wholesale_price REAL NOT NULL,
    wholesale_min_qty REAL DEFAULT 0,
    stock_qty REAL DEFAULT 0,
    expiry_date TEXT,
    extra_expenses REAL DEFAULT 0,
    purchased_from TEXT,
    purchase_date TEXT,
    active INTEGER DEFAULT 1
  )
`);
  db.run(
    "ALTER TABLE products ADD COLUMN special_price REAL",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding special_price:", err.message);
      }
    }
  );
  
  // Add barcode columns
  db.run(
    "ALTER TABLE products ADD COLUMN barcode TEXT",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding barcode:", err.message);
      }
    }
  );
  db.run(
    "ALTER TABLE products ADD COLUMN barcode_type TEXT",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding barcode_type:", err.message);
      }
    }
  );
  db.run(
    "ALTER TABLE products ADD COLUMN created_by_barcode INTEGER DEFAULT 0",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding created_by_barcode:", err.message);
      }
    }
  );
  
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      qty REAL,
      remaining_qty REAL,
      purchase_price REAL,
      extra_expenses REAL,
      expiry_date TEXT,
      purchased_from TEXT,
      purchase_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(
    "ALTER TABLE purchase_history ADD COLUMN retail_price_at_purchase REAL",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding retail_price_at_purchase:", err.message);
      }
    }
  );

  db.run(
    "ALTER TABLE purchase_history ADD COLUMN wholesale_price_at_purchase REAL",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding wholesale_price_at_purchase:", err.message);
      }
    }
  );

  db.run(
    "ALTER TABLE purchase_history ADD COLUMN special_price_at_purchase REAL",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding special_price_at_purchase:", err.message);
      }
    }
  );
  db.run(`
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subtotal REAL,
    payment_mode TEXT,
    final_amount REAL,
    date TEXT,
    customer_id INTEGER,
    previous_ob REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    new_ob REAL DEFAULT 0,
    is_edited INTEGER DEFAULT 0,
    edited_at TEXT
  )
`);

  db.run(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      product_id INTEGER,
      qty REAL,
      price REAL,
      total REAL,
      purchase_history_id INTEGER NULL
    )
  `);
  db.run(
    "ALTER TABLE bill_items ADD COLUMN price_type TEXT",
    err => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Failed adding price_type column:", err.message);
      }
    }
  );
  db.run(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT,
  old_balance REAL DEFAULT 0
)
`);
  db.run(`
CREATE TABLE IF NOT EXISTS customer_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT DEFAULT 'cash',
  note TEXT,
  date TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
)
`);

});

// -------------------------
// Simple test route
// -------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// -------------------------
// Admin Authentication Endpoints
// -------------------------

// Initialize admin credentials table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime'))
    )
  `);

  // Insert default credentials if table is empty
  db.get("SELECT COUNT(*) as count FROM admin_credentials", (err, row) => {
    if (!err && row.count === 0) {
      db.run(
        "INSERT INTO admin_credentials (username, password) VALUES (?, ?)",
        ["Adam", "AdStore@07"],
        (err) => {
          if (err) console.error("Failed to create default admin:", err);
          else console.log("Default admin credentials created: Adam / AdStore@07");
        }
      );
    }
  });
});

// Admin Login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(
    "SELECT * FROM admin_credentials WHERE username = ? AND password = ?",
    [username, password],
    (err, admin) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      res.json({ success: true, username: admin.username });
    }
  );
});

// Reset Password
app.post('/admin/reset-password', (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  db.run(
    "UPDATE admin_credentials SET password = ?, updated_at = datetime('now','localtime') WHERE id = 1",
    [password],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({ success: true, message: 'Password updated successfully' });
    }
  );
});

// Change Username
app.post('/admin/change-username', (req, res) => {
  const { newUsername, currentPassword } = req.body || {};

  if (!newUsername || !currentPassword) {
    return res.status(400).json({ error: 'New username and current password required' });
  }

  if (newUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  // Verify current password
  db.get(
    "SELECT * FROM admin_credentials WHERE id = 1 AND password = ?",
    [currentPassword],
    (err, admin) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Update username
      db.run(
        "UPDATE admin_credentials SET username = ?, updated_at = datetime('now','localtime') WHERE id = 1",
        [newUsername],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update username' });
          }

          res.json({ success: true, message: 'Username updated successfully' });
        }
      );
    }
  );
});

// -------------------------
// Report folder endpoints
// -------------------------
app.get('/report-folder', (req, res) => {
  SETTINGS = loadSettings();
  res.json({ report_folder: SETTINGS.report_folder });
});

app.post('/report-folder', (req, res) => {
  const folder = String((req.body && req.body.report_folder) || '').trim();
  if (!folder) return res.status(400).json({ error: 'report_folder required' });
  try {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    SETTINGS.report_folder = folder;
    saveSettings(SETTINGS);
    return res.json({ status: 'ok', report_folder: folder });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Accept base64 PDF and save
app.post('/save-report', (req, res) => {
  const { filename, data } = req.body || {};
  if (!filename || !data) return res.status(400).json({ error: 'filename and data required' });
  SETTINGS = loadSettings();
  const folder = SETTINGS.report_folder || DEFAULT_REPORT_FOLDER;
  try {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    const safeName = filename.replace(/[<>:"\\/\\|?*\x00-\x1F]/g, '_');
    const target = path.join(folder, safeName);
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(target, buf);
    return res.json({ status: 'ok', path: target });
  } catch (e) {
    console.error('save-report error', e);
    return res.status(500).json({ error: e.message });
  }
});

// -------------------------
// Add product (creates purchase_history batch)
// Expects purchase_price = TOTAL cost for provided quantity
// -------------------------
app.post('/add-product', (req, res) => {
  db.serialize(() => {
    const p = req.body || {};

    const required = [
      'name', 'unit', 'quantity',
      'purchase_price', 'retail_price',
      'wholesale_price', 'purchase_date'
    ];

    for (let f of required) {
      if (!p[f] || String(p[f]).trim() === '') {
        return res.status(400).json({ error: `${f} is required` });
      }
    }

    // ✅ Name validation
    const name = String(p.name).trim();
    if (name.length > 100) {
      return res.status(400).json({ error: 'Product name too long (max 100 chars)' });
    }

    // ✅ Barcode validation (if provided)
    let barcode = null;
    let barcodeType = null;
    
    if (p.barcode && String(p.barcode).trim()) {
      barcode = String(p.barcode).trim().toUpperCase();
      
      // Length validation (6-20 characters)
      if (barcode.length < 6 || barcode.length > 20) {
        return res.status(400).json({ error: 'Barcode must be 6-20 characters' });
      }
      
      // Whitespace-only validation
      if (/^\s*$/.test(barcode)) {
        return res.status(400).json({ error: 'Barcode cannot be only whitespace' });
      }
      
      barcodeType = p.barcode_type || null;
    }

    // ✅ Unit validation
    if (!['kg', 'pc'].includes(p.unit)) {
      return res.status(400).json({ error: 'Unit must be kg or pc' });
    }

    const qty = Number(p.quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    // ✅ Prevent decimal pieces
    if (p.unit === 'pc' && !Number.isInteger(qty)) {
      return res.status(400).json({ error: 'Pieces cannot be decimal' });
    }

    const purchaseTotal = Number(p.purchase_price);
    const retail = Number(p.retail_price);
    const wholesale = Number(p.wholesale_price);

    // ✅ Price validations
    if (purchaseTotal <= 0) {
      return res.status(400).json({ error: 'Purchase price must be greater than 0' });
    }
    if (retail <= 0) {
      return res.status(400).json({ error: 'Retail price must be greater than 0' });
    }
    if (wholesale <= 0) {
      return res.status(400).json({ error: 'Wholesale price must be greater than 0' });
    }

    // ✅ Date validation
    if (isNaN(Date.parse(p.purchase_date))) {
      return res.status(400).json({ error: 'Invalid purchase date' });
    }

    const extraExpenses = Number(p.extra_expenses || 0);
    const perUnit = Number(((purchaseTotal + extraExpenses) / qty).toFixed(4));

    const initialStock = Number(p.initial_stock || 0);

    db.run("BEGIN TRANSACTION");

    // ✅ Duplicate name check (case insensitive)
    db.get(
      "SELECT id FROM products WHERE LOWER(name) = LOWER(?)",
      [name],
      (dupErr, existing) => {

        if (dupErr) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: dupErr.message });
        }

        if (existing) {
          db.run("ROLLBACK");
          return res.status(409).json({ error: "Product already exists" });
        }

        // ✅ Duplicate barcode check (if barcode provided)
        if (barcode) {
          db.get(
            "SELECT id, name FROM products WHERE barcode = ?",
            [barcode],
            (barcodeErr, existingBarcode) => {
              if (barcodeErr) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: barcodeErr.message });
              }

              if (existingBarcode) {
                db.run("ROLLBACK");
                return res.status(409).json({ error: `Barcode already exists for product: ${existingBarcode.name}` });
              }

              insertProduct();
            }
          );
        } else {
          insertProduct();
        }

        function insertProduct() {
          // Insert product with barcode fields
          db.run(
            `INSERT INTO products
            (name, unit, purchase_price,
             retail_price, wholesale_price, special_price,
             wholesale_min_qty, stock_qty,
             expiry_date, extra_expenses,
             purchased_from, purchase_date,
             barcode, barcode_type, created_by_barcode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              name,
              p.unit,
              perUnit,
              retail,
              wholesale,
              p.special_price ? Number(p.special_price) : null,
              Number(p.wholesale_min_qty || 0),
              qty + initialStock,
              p.expiry_date || null,
              extraExpenses,
              p.purchased_from || '',
              p.purchase_date,
              barcode,
              barcodeType,
              0 // created_by_barcode = 0 (normal product creation)
            ],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
              }

              const productId = this.lastID;

              // ✅ Create FIFO batch for purchase quantity
              db.run(
                `INSERT INTO purchase_history
                (product_id, qty, remaining_qty,
                 purchase_price,
                 retail_price_at_purchase,
                 wholesale_price_at_purchase,
                 special_price_at_purchase,
                 extra_expenses, expiry_date,
                 purchased_from, purchase_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  productId,
                  qty,
                  qty,
                  perUnit,
                  retail,
                  wholesale,
                  p.special_price ? Number(p.special_price) : null,
                  extraExpenses,
                  p.expiry_date || null,
                  p.purchased_from || '',
                  p.purchase_date
                ],
                (err2) => {

                  if (err2) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err2.message });
                  }

                  // ✅ If initial_stock exists, create separate zero-cost batch
                  if (initialStock > 0) {
                    db.run(
                      `INSERT INTO purchase_history
                      (product_id, qty, remaining_qty,
                       purchase_price,
                       retail_price_at_purchase,
                       wholesale_price_at_purchase,
                       special_price_at_purchase,
                       extra_expenses, purchase_date)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        productId,
                        initialStock,
                        initialStock,
                        perUnit, // or 0 if you prefer no cost
                        retail,
                        wholesale,
                        p.special_price ? Number(p.special_price) : null,
                        0,
                        p.purchase_date
                      ],
                      (err3) => {
                        if (err3) {
                          db.run("ROLLBACK");
                          return res.status(500).json({ error: err3.message });
                        }

                        db.run("COMMIT");
                        
                        // Real-time broadcast
                        if (realtimeSync) {
                          db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
                            if (!err && product) realtimeSync.productAdded(product);
                          });
                        }
                        
                        res.json({
                          status: "success",
                          id: productId,
                          stock: qty + initialStock,
                          per_unit_purchase_price: perUnit
                        });
                      }
                    );
                  } else {
                    db.run("COMMIT");
                    
                    // Real-time broadcast
                    if (realtimeSync) {
                      db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
                        if (!err && product) realtimeSync.productAdded(product);
                      });
                    }
                    
                    res.json({
                      status: "success",
                      id: productId,
                      stock: qty,
                      per_unit_purchase_price: perUnit
                    });
                  }

                }
              );
            }
          );
        }
      }
    );
  });
});
// -------------------------
// Get all products (FOR BILLING)
// -------------------------
app.get("/products", (req, res) => {
  db.all(
    "SELECT * FROM products WHERE active = 1 ORDER BY name",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});
// -------------------------
// Get ALL products (for products.html)
// -------------------------
app.get("/products/all", (req, res) => {
  db.all(
    "SELECT * FROM products ORDER BY name",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// -------------------------
// Update product barcode
// PUT /products/:id/barcode
// -------------------------
app.put("/products/:id/barcode", (req, res) => {
  const productId = Number(req.params.id);
  const { barcode } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: "Invalid product ID" });
  }
  
  // Check for barcode uniqueness if barcode is provided
  if (barcode && barcode.trim()) {
    db.get(
      "SELECT id FROM products WHERE barcode = ? AND id != ?",
      [barcode.trim(), productId],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (row) {
          return res.status(400).json({ error: "Barcode already exists for another product" });
        }
        
        // Barcode is unique, proceed with update
        updateBarcode();
      }
    );
  } else {
    // No barcode or empty barcode, proceed with update
    updateBarcode();
  }
  
  function updateBarcode() {
    db.run(
      "UPDATE products SET barcode = ? WHERE id = ?",
      [barcode || null, productId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        res.json({ success: true, message: "Barcode updated successfully" });
      }
    );
  }
});

// -------------------------
// Search customers by name/mobile (for OB)
// GET /customers?q=...
// -------------------------
app.get("/customers", (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  db.all(
    `
    SELECT *
    FROM customers
    WHERE
      lower(name) LIKE ?
      OR mobile LIKE ?
    ORDER BY name
    LIMIT 50
    `,
    [`%${q}%`, `%${q}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});


// product-details
app.get('/product-details/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, prod) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    db.get('SELECT * FROM purchase_history WHERE product_id = ? ORDER BY created_at DESC LIMIT 1', [id], (err2, last) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ product: prod, last_purchase: last || null });
    });
  });
});
app.get("/api/purchase-history/:product_id", (req, res) => {
  const productId = Number(req.params.product_id);
  if (!productId) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const sql = `
  SELECT
    ph.id,
    p.name AS product_name,
    ph.qty,
    (ph.qty * ph.purchase_price) AS total_purchase_price,
    ph.purchase_price AS per_unit_purchase_price,
    COALESCE(ph.retail_price_at_purchase, p.retail_price) AS retail_price_at_purchase,
    COALESCE(ph.wholesale_price_at_purchase, p.wholesale_price) AS wholesale_price_at_purchase,
    ph.special_price_at_purchase,
    ph.purchase_date
  FROM purchase_history ph
  JOIN products p ON ph.product_id = p.id
  WHERE ph.product_id = ?
  ORDER BY ph.id DESC
`;

  db.all(sql, [productId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const data = rows.map((r, i) => ({
      sl_no: i + 1,
      product_name: r.product_name,
      qty: Number(r.qty),
      total_purchase_price: Number(
        Number(r.total_purchase_price || 0).toFixed(2)
      ),
      per_unit_purchase_price: Number(
        Number(r.per_unit_purchase_price || 0).toFixed(4)
      ),
      retail_price_at_purchase: Number(
        Number(r.retail_price_at_purchase || 0).toFixed(2)
      ),
      wholesale_price_at_purchase: Number(
        Number(r.wholesale_price_at_purchase || 0).toFixed(2)
      ),
      special_price_at_purchase:
        r.special_price_at_purchase !== null
          ? Number(Number(r.special_price_at_purchase).toFixed(2))
          : null,
      purchase_date: r.purchase_date
    }));

    res.json(data);
  });
});
// -------------------------
// Add stock (FIFO) — creates purchase_history batch
// purchase_price = TOTAL cost for provided qty
// -------------------------
app.post('/add-stock', (req, res) => {
  db.serialize(() => {
    const p = req.body || {};
    const productId = Number(p.product_id);

    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product_id' });
    }
    db.run("BEGIN TRANSACTION");

    db.get(
      'SELECT * FROM products WHERE id = ?',
      [productId],
      (err, prod) => {
        if (err || !prod) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: 'Product not found' });
        }

        let qty = Number(p.qty || 0);

        if (isNaN(qty) || qty <= 0) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: 'Invalid quantity' });
        }

        // ✅ Strict block for pieces (NO decimal allowed)
        if (prod.unit === 'pc' && !Number.isInteger(qty)) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: 'Pieces cannot be decimal' });
        }

        const totalPurchase = Number(p.purchase_price || 0);
        if (isNaN(totalPurchase) || totalPurchase <= 0) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Invalid purchase price" });
        }
        const extraExpenses = Number(p.extra_expenses || 0);
        if (isNaN(extraExpenses) || extraExpenses < 0) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Invalid extra expenses" });
        }
        if (p.purchase_date && isNaN(Date.parse(p.purchase_date))) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Invalid purchase date" });
        }
        const perUnit = Number(((totalPurchase + extraExpenses) / qty).toFixed(4));
        const currentStock = Number(prod.stock_qty || 0);
        const newStock = Number((currentStock + qty).toFixed(3));

        db.run(
          `UPDATE products
           SET stock_qty = ?, purchase_price = ?, expiry_date = ?,
               extra_expenses = ?, purchased_from = ?, purchase_date = ?
           WHERE id = ?`,
          [
            newStock,
            perUnit,
            p.expiry_date || null,
            extraExpenses,
            p.purchased_from || '',
            p.purchase_date || null,
            prod.id
          ],
          err2 => {
            if (err2) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: err2.message });
            }

            db.run(
              `INSERT INTO purchase_history
(product_id, qty, remaining_qty, purchase_price,
 retail_price_at_purchase, wholesale_price_at_purchase,
 special_price_at_purchase,
 extra_expenses, expiry_date, purchased_from, purchase_date)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                prod.id,
                qty,
                qty,
                perUnit,
                prod.retail_price,
                prod.wholesale_price,
                prod.special_price,
                extraExpenses,
                p.expiry_date || null,
                p.purchased_from || '',
                p.purchase_date || null
              ],
              err3 => {
                if (err3) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: err3.message });
                }

                db.run("COMMIT");
                
                // Real-time broadcast
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
                
                res.json({
                  status: "success",
                  product_id: prod.id,
                  added_qty: qty,
                  new_stock: newStock,
                  per_unit_purchase_price: perUnit
                });
              }
            );
          }
        );
      }
    );
  });
});

// -------------------------
// Update prices
// -------------------------
app.post('/update-price', (req, res) => {
  const p = req.body || {};

  if (!p.id) {
    return res.status(400).json({ error: 'Product ID required' });
  }

  const fields = [];
  const values = [];

  if (p.retail_price !== undefined) {
    const retailPrice = Number(p.retail_price);
    if (isNaN(retailPrice) || retailPrice <= 0) {
      return res.status(400).json({ error: 'Retail price must be greater than 0' });
    }
    fields.push("retail_price = ?");
    values.push(retailPrice);
  }

  if (p.wholesale_price !== undefined) {
    const wholesalePrice = Number(p.wholesale_price);
    if (isNaN(wholesalePrice) || wholesalePrice <= 0) {
      return res.status(400).json({ error: 'Wholesale price must be greater than 0' });
    }
    fields.push("wholesale_price = ?");
    values.push(wholesalePrice);
  }
  if (p.special_price !== undefined) {
    if (p.special_price === null || p.special_price === "") {
      fields.push("special_price = ?");
      values.push(null);
    } else {
      const specialPrice = Number(p.special_price);
      if (isNaN(specialPrice) || specialPrice <= 0) {
        return res.status(400).json({ error: 'Special price must be greater than 0' });
      }
      fields.push("special_price = ?");
      values.push(specialPrice);
    }
  }
  if (p.wholesale_min_qty !== undefined) {
    fields.push("wholesale_min_qty = ?");
    values.push(Number(p.wholesale_min_qty));
  }

  // 🚫 nothing to update
  if (fields.length === 0) {
    return res.json({ status: "nothing_to_update" });
  }

  values.push(p.id);

  const sql = `
    UPDATE products
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

  db.run(sql, values, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Real-time broadcast
    if (realtimeSync) {
      db.get("SELECT * FROM products WHERE id = ?", [p.id], (err, product) => {
        if (!err && product) realtimeSync.priceUpdated(product);
      });
    }
    
    res.json({ status: "success" });
  });
});
// -------------------------
// Update customer OB
// -------------------------
app.post("/customer/update-ob", (req, res) => {
  const { customer_id, old_balance } = req.body || {};

  if (!customer_id) {
    return res.status(400).json({ error: "customer_id required" });
  }

  db.run(
    "UPDATE customers SET old_balance = ? WHERE id = ?",
    [Number(old_balance) || 0, Number(customer_id)],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "ok" });
    }
  );
});
// -------------------------
// Add customer
// -------------------------
// -------------------------
// Update product name
// -------------------------
app.post("/update-product-name", (req, res) => {
  const { id, name } = req.body || {};

  if (!id || !name || !name.trim()) {
    return res.status(400).json({ error: "Product ID and name required" });
  }

  // check duplicate name (case insensitive)
  db.get(
    "SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND id != ?",
    [name.trim(), id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (row) {
        return res.status(409).json({ error: "Product name already exists" });
      }

      db.run(
        "UPDATE products SET name = ? WHERE id = ?",
        [name.trim(), id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          
          // Real-time broadcast
          if (realtimeSync) {
            db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
              if (!err && product) realtimeSync.productUpdated(product);
            });
          }
          
          res.json({ status: "success" });
        }
      );
    }
  );
});

// -------------------------
// Create bill — FIFO costing
// Expects { items: [{ product_id, qty }], payment_mode }
// -------------------------
app.post('/create-bill', (req, res) => {
  const { items, payment_mode, customer_id, paid_amount } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });
  for (let it of items) {
    it.product_id = Number(it.product_id);
    it.qty = Number(it.qty);
    if (!it.product_id || isNaN(it.qty) || it.qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) return res.status(500).json({ error: 'Failed to begin transaction' });
      let subtotal = 0;
      const billLineRecords = []; // { product_id, qty, selling_price, purchase_history_id }

      const processItem = (idx) => {
        if (idx >= items.length) return finalizeBill();
        const it = items[idx];
        db.get('SELECT * FROM products WHERE id = ?', [it.product_id], (err, prod) => {
          if (err || !prod) { db.run('ROLLBACK'); return res.status(400).json({ error: `Product not found: ${it.product_id}` }); }
          const wholesale = Number(prod.wholesale_min_qty) > 0 && Number(it.qty) >= Number(prod.wholesale_min_qty);


          // If client included item.price prefer it (trusting front-end to send correct value)
          let sellingPrice;

          if (it.price !== undefined && !isNaN(Number(it.price))) {
            sellingPrice = Number(it.price); // retail / wholesale / special from frontend
          } else {
            sellingPrice = wholesale
              ? Number(prod.wholesale_price)
              : Number(prod.retail_price);
          }

          const qtyToSell = it.qty;
          subtotal += Math.ceil(Number(qtyToSell) * Number(sellingPrice));
          db.all('SELECT * FROM purchase_history WHERE product_id = ? AND remaining_qty > 0 ORDER BY id ASC', [it.product_id], (err2, fifoRows) => {
            if (err2) { db.run('ROLLBACK'); return res.status(500).json({ error: err2.message }); }
            let left = qtyToSell;
            let fIndex = 0;
            const consume = () => {
              if (left <= 0) {
                db.run('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?', [qtyToSell, prod.id], (errUpd) => {
                  if (errUpd) { db.run('ROLLBACK'); return res.status(500).json({ error: 'Failed to update product stock' }); }
                  processItem(idx + 1);
                });
                return;
              }
              if (fIndex >= fifoRows.length) {

                // allow negative stock
                db.run(
                  'UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?',
                  [qtyToSell, prod.id],
                  (errNeg) => {
                    if (errNeg) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: errNeg.message });
                    }
                    billLineRecords.push({
                      product_id: it.product_id,
                      qty: left,
                      selling_price: sellingPrice,
                      price_type: it.price_type || "retail",
                      purchase_history_id: null
                    });
                    processItem(idx + 1);
                  }
                );

                return; // ⛔ stop FIFO loop
              }
              const row = fifoRows[fIndex];
              const canUse = Math.min(left, row.remaining_qty);
              const newRem = Number((row.remaining_qty - canUse).toFixed(4));
              db.run('UPDATE purchase_history SET remaining_qty = ? WHERE id = ?', [newRem, row.id], (err3) => {
                if (err3) { db.run('ROLLBACK'); return res.status(500).json({ error: err3.message }); }
                billLineRecords.push({
                  product_id: it.product_id,
                  qty: canUse,
                  selling_price: sellingPrice,
                  price_type: it.price_type || "retail",
                  purchase_history_id: row.id
                });
                left -= canUse; fIndex++; consume();
              });
            };
            consume();
          });
        });
      };

      const finalizeBill = () => {
        const finalAmount = Math.ceil(subtotal - 1e-9);

        let oldOB = 0;
        let newOB = 0;

        const insertBill = () => {
          db.run(
            `
      INSERT INTO bills (
        subtotal,
        payment_mode,
        final_amount,
        date,
        customer_id,
        previous_ob,
        paid_amount,
        new_ob
      )
      VALUES (?, ?, ?, datetime('now','localtime'), ?, ?, ?, ?)
      `,
            [
              subtotal,
              payment_mode || 'cash',
              finalAmount,
              customer_id || null,
              oldOB,
              paid_amount || 0,
              newOB
            ],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
              }

              const billId = this.lastID;
              let j = 0;

              const insertItems = () => {
                if (j >= billLineRecords.length) {

                  const finishTransaction = () => {
                    db.run("COMMIT", () => {
                      // Real-time broadcast
                      if (realtimeSync) {
                        db.get("SELECT * FROM bills WHERE id = ?", [billId], (err, bill) => {
                          if (!err && bill) {
                            db.all("SELECT * FROM bill_items WHERE bill_id = ?", [billId], (err2, items) => {
                              if (!err2) realtimeSync.billCreated({ ...bill, items });
                            });
                          }
                        });
                      }
                      
                      res.json({ status: "success", bill_id: billId, subtotal, finalAmount });
                    });
                  };
                  if (customer_id) {
                    db.run(
                      `
      INSERT INTO payment_receipts
      (customer_id, customer_name, old_ob, paid_amount, new_ob, bill_id)
      VALUES (
        ?,
        (SELECT name FROM customers WHERE id = ?),
        ?, ?, ?, ?
      )
      `,
                      [
                        customer_id,
                        customer_id,
                        oldOB,
                        Number(paid_amount || 0),
                        newOB,
                        billId
                      ],
                      errPR => {
                        if (errPR) {
                          db.run("ROLLBACK");
                          return res.status(500).json({ error: errPR.message });
                        }
                        finishTransaction();
                      }
                    );
                  } else {
                    finishTransaction();
                  }

                  return;
                }

                const l = billLineRecords[j];
                const total = Math.ceil(Number(l.qty) * Number(l.selling_price));

                db.run(
                  `INSERT INTO bill_items
  (bill_id, product_id, qty, price, total, price_type, purchase_history_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    billId,
                    l.product_id,
                    l.qty,
                    l.selling_price,
                    total,
                    l.price_type || "retail",
                    l.purchase_history_id
                  ],
                  err2 => {
                    if (err2) {
                      db.run("ROLLBACK");
                      return res.status(500).json({ error: err2.message });
                    }
                    j++;
                    insertItems();
                  }
                );
              };

              insertItems();
            }
          );
        };

        if (!customer_id) {
          return insertBill();
        }

        db.get(
          "SELECT old_balance FROM customers WHERE id = ?",
          [customer_id],
          (err, row) => {
            if (err || !row) {
              db.run("ROLLBACK");
              return res.status(400).json({ error: "Customer not found" });
            }

            oldOB = Number(row.old_balance || 0);
            newOB = oldOB + finalAmount - Number(paid_amount || 0);

            db.run(
              "UPDATE customers SET old_balance = ? WHERE id = ?",
              [newOB, customer_id],
              err2 => {
                if (err2) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: err2.message });
                }
                insertBill();
              }
            );
          }
        );
      };
      processItem(0);
    });
  });
});
app.post("/customers/update", (req, res) => {
  const { id, name, old_balance } = req.body;

  if (!id) return res.status(400).json({ error: "id required" });

  if (name !== undefined) {
    return db.run(
      "UPDATE customers SET name = ? WHERE id = ?",
      [name.trim(), id],
      err => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Real-time broadcast
        if (realtimeSync) {
          db.get("SELECT * FROM customers WHERE id = ?", [id], (err, customer) => {
            if (!err && customer) realtimeSync.customerUpdated(customer);
          });
        }
        
        res.json({ status: "ok" });
      }
    );
  }

  if (old_balance !== undefined) {
    return db.run(
      "UPDATE customers SET old_balance = ? WHERE id = ?",
      [Number(old_balance) || 0, id],
      err => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Real-time broadcast
        if (realtimeSync) {
          db.get("SELECT * FROM customers WHERE id = ?", [id], (err, customer) => {
            if (!err && customer) realtimeSync.customerUpdated(customer);
          });
        }
        
        res.json({ status: "ok" });
      }
    );
  }

  res.json({ status: "ok" });
});

// -------------------------
// last-bill
// -------------------------
app.get('/last-bill', (req, res) => {
  db.get('SELECT * FROM bills ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// -------------------------
// daily-report (simple)
// -------------------------
app.get('/daily-report', (req, res) => {
  db.all("SELECT * FROM bills WHERE date(date) = date('now','localtime')", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = (rows || []).reduce((s, b) => s + Number(b.final_amount || 0), 0);
    res.json({ total_bills: rows.length, total_sales: total, bills: rows });
  });
});

// -------------------------
// daily-profit (single date) — includes purchases for that date
// GET /daily-profit?date=YYYY-MM-DD
// -------------------------
app.get('/daily-profit', (req, res) => {
  const date =
    req.query.date ||
    new Date().toLocaleDateString('en-CA');
  db.serialize(() => {
    db.get('SELECT COUNT(*) AS total_bills, IFNULL(SUM(final_amount),0) AS total_sales FROM bills WHERE date(date) = date(?)', [date], (err, summaryRow) => {
      if (err) return res.status(500).json({ error: err.message });
      const itemsSql = `SELECT p.id AS product_id, p.name,p.stock_qty,SUM(bi.qty) AS total_qty, SUM(bi.total) AS total_sales, SUM( (bi.price - COALESCE(ph.purchase_price, p.purchase_price)) * bi.qty ) AS profit,SUM(
  CASE
    WHEN ABS(bi.price - p.retail_price) < 0.0001
    THEN bi.qty
    ELSE 0
  END
) AS retail_qty,

SUM(
  CASE
    WHEN bi.price < p.retail_price
    THEN bi.qty
    ELSE 0
  END
) AS wholesale_qty FROM bill_items bi JOIN bills b ON bi.bill_id = b.id JOIN products p ON bi.product_id = p.id LEFT JOIN purchase_history ph ON bi.purchase_history_id = ph.id WHERE date(b.date) = date(?) GROUP BY p.id ORDER BY p.name`;
      db.all(itemsSql, [date], (err2, itemRows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const round3 = n => Number((Number(n || 0)).toFixed(3));

        const items = (itemRows || []).map(r => ({
          product_id: r.product_id,
          name: r.name,

          retail_qty: round3(r.retail_qty),
          wholesale_qty: round3(r.wholesale_qty),
          total_qty: round3(r.total_qty),

          total_sales: Number((Number(r.total_sales || 0)).toFixed(2)),
          profit: Number((Number(r.profit || 0)).toFixed(2)),

          // ✅ ADD THIS
          remaining_stock: Number(r.stock_qty ?? 0)
        }));

        // purchases for the date
        db.all(`SELECT
          
  ph.id,
  ph.product_id,
  p.name,
  p.stock_qty AS remaining_stock,
  ph.qty,
  ph.remaining_qty,
  ph.purchase_price,
  (
  SELECT ph2.purchase_price
  FROM purchase_history ph2
  WHERE ph2.product_id = ph.product_id
    AND (
      ph2.purchase_date < ph.purchase_date
      OR
      (ph2.purchase_date = ph.purchase_date AND ph2.id < ph.id)
    )
  ORDER BY ph2.purchase_date DESC, ph2.id DESC
  LIMIT 1
) AS previous_per_unit_price,
  ph.extra_expenses,
  ph.expiry_date,
  ph.purchased_from,
  ph.purchase_date,

  -- ✅ ADD THESE TWO LINES
  p.retail_price   AS current_retail_price,
  p.wholesale_price AS current_wholesale_price

FROM purchase_history ph
JOIN products p ON ph.product_id = p.id
WHERE date(ph.purchase_date) = date(?)
ORDER BY ph.created_at`, [date], (err3, purchases) => {
          if (err3) return res.status(500).json({ error: err3.message });
          const purchasesMapped = (purchases || []).map(pr => ({
            id: pr.id,
            product_id: pr.product_id,
            name: pr.name,

            // ✅ THIS FIX
            remaining_stock: Number(pr.remaining_stock ?? 0),

            qty: Number(pr.qty || 0),
            remaining_qty: Number(pr.remaining_qty || 0),
            per_unit_cost: Number(pr.purchase_price || 0),
            previous_per_unit_price: Number(pr.previous_per_unit_price ?? 0),

            total_cost: Number(
              (Number(pr.qty || 0) * Number(pr.purchase_price || 0)).toFixed(2)
            ),

            current_retail_price: Number(pr.current_retail_price || 0),
            current_wholesale_price: Number(pr.current_wholesale_price || 0),

            extra_expenses: Number(pr.extra_expenses || 0),
            expiry_date: pr.expiry_date,
            purchased_from: pr.purchased_from,
            purchase_date: pr.purchase_date
          }));
          const total_purchase_cost = purchasesMapped.reduce((s, px) => s + px.total_cost, 0);
          const total_profit = items.reduce((s, i) => s + i.profit, 0);
          res.json({ summary: { date, total_bills: summaryRow.total_bills || 0, total_sales: Number(summaryRow.total_sales || 0), total_purchase_cost, total_profit }, items, purchases: purchasesMapped });
        });
      });
    });
  });
});

// -------------------------
// daily-profit-range — includes purchases in the range
// GET /daily-profit-range?from=YYYY-MM-DD&to=YYYY-MM-DD
// -------------------------
app.get('/daily-profit-range', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  db.serialize(() => {
    db.get('SELECT COUNT(*) AS total_bills, IFNULL(SUM(final_amount),0) AS total_sales FROM bills WHERE date(date) BETWEEN date(?) AND date(?)', [from, to], (err, summaryRow) => {
      if (err) return res.status(500).json({ error: err.message });
      const sql = `
SELECT 
  p.id AS product_id,
  p.name,
  p.stock_qty AS remaining_stock,
  SUM(bi.qty) AS total_qty,
  SUM(bi.total) AS total_sales,
  SUM( (bi.price - COALESCE(ph.purchase_price, p.purchase_price)) * bi.qty ) AS profit,

  SUM(
    CASE WHEN ABS(bi.price - p.retail_price) < 0.0001
    THEN bi.qty ELSE 0
    END
  ) AS retail_qty,

  SUM(
    CASE WHEN bi.price < p.retail_price
    THEN bi.qty ELSE 0
    END
  ) AS wholesale_qty

FROM bill_items bi
JOIN bills b ON bi.bill_id = b.id
JOIN products p ON bi.product_id = p.id
LEFT JOIN purchase_history ph ON bi.purchase_history_id = ph.id
WHERE date(b.date) BETWEEN date(?) AND date(?)
GROUP BY p.id
ORDER BY p.name
`;
      db.all(sql, [from, to], (err2, rows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const items = (rows || []).map(r => ({
          product_id: r.product_id,
          name: r.name,

          retail_qty: Number(r.retail_qty || 0),
          wholesale_qty: Number(r.wholesale_qty || 0),
          total_qty: Number(r.total_qty || 0),

          total_sales: Number(r.total_sales || 0),
          profit: Number(r.profit || 0),

          remaining_stock: Number(r.remaining_stock ?? 0)  // ✅ ADD THIS
        }));
        // purchases in range
        db.all(`SELECT ph.id, ph.product_id, p.name,p.stock_qty AS remaining_stock,p.stock_qty,ph.qty, ph.remaining_qty, ph.purchase_price,(
  SELECT ph2.purchase_price
  FROM purchase_history ph2
  WHERE ph2.product_id = ph.product_id
    AND (
      ph2.purchase_date < ph.purchase_date
      OR
      (ph2.purchase_date = ph.purchase_date AND ph2.id < ph.id)
    )
  ORDER BY ph2.purchase_date DESC, ph2.id DESC
  LIMIT 1
) AS previous_per_unit_price, ph.extra_expenses, ph.expiry_date, ph.purchased_from, ph.purchase_date FROM purchase_history ph JOIN products p ON ph.product_id = p.id WHERE date(ph.purchase_date) BETWEEN date(?) AND date(?) ORDER BY ph.created_at`, [from, to], (err3, purchases) => {
          if (err3) return res.status(500).json({ error: err3.message });
          const purchasesMapped = (purchases || []).map(pr => ({
            id: pr.id,
            product_id: pr.product_id,
            name: pr.name,

            remaining_stock: Number(pr.stock_qty ?? pr.remaining_stock ?? 0),

            qty: Number(pr.qty || 0),
            remaining_qty: Number(pr.remaining_qty || 0),
            per_unit_cost: Number(pr.purchase_price || 0),
            previous_per_unit_price: Number(pr.previous_per_unit_price ?? 0),

            total_cost: Number(
              (Number(pr.qty || 0) * Number(pr.purchase_price || 0)).toFixed(2)
            ),

            extra_expenses: Number(pr.extra_expenses || 0),
            expiry_date: pr.expiry_date,
            purchased_from: pr.purchased_from,
            purchase_date: pr.purchase_date
          }));
          const total_purchase_cost = purchasesMapped.reduce((s, px) => s + px.total_cost, 0);
          const total_profit = items.reduce((s, i) => s + i.profit, 0);
          res.json({ summary: { from, to, total_bills: summaryRow.total_bills || 0, total_sales: Number(summaryRow.total_sales || 0), total_purchase_cost, total_profit }, items, purchases: purchasesMapped });
        });
      });
    });
  });
});
// -------------------------
// Daily profit chart data (grouped by date)
// GET /daily-profit-chart?from=YYYY-MM-DD&to=YYYY-MM-DD
// -------------------------
app.get("/daily-profit-chart", (req, res) => {

  const from = req.query.from;
  const to = req.query.to;

  if (!from || !to) {
    return res.status(400).json({ error: "from and to required" });
  }

  const sql = `
  WITH RECURSIVE dates(d) AS (
    SELECT date(?)
    UNION ALL
    SELECT date(d, '+1 day')
    FROM dates
    WHERE d < date(?)
  )

  SELECT 
    d as report_date,

    -- Sales
    IFNULL((
      SELECT SUM(bi.total)
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE date(b.date) = d
    ), 0) AS total_sales,

    -- Profit
    IFNULL((
      SELECT SUM(
        (bi.price - COALESCE(ph.purchase_price, p.purchase_price)) * bi.qty
      )
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN purchase_history ph ON bi.purchase_history_id = ph.id
      WHERE date(b.date) = d
    ), 0) AS profit,

    -- Purchase
    IFNULL((
      SELECT SUM(qty * purchase_price)
      FROM purchase_history
      WHERE date(purchase_date) = d
    ), 0) AS total_purchase

  FROM dates
  ORDER BY d
  `;

  db.all(sql, [from, to], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const data = rows
      .map(r => ({
        date: r.report_date,
        total_sales: Number(r.total_sales || 0),
        total_purchase: Number(r.total_purchase || 0),
        profit: Number(r.profit || 0)
      }))
      .filter(d =>
        d.total_sales !== 0 ||
        d.total_purchase !== 0 ||
        d.profit !== 0
      );

    res.json(data);
  });
});
// -------------------------
// Full bills (for view-bills.html)
// Supports:
//   - by single date  -> /bills/full?from=YYYY-MM-DD&to=YYYY-MM-DD
//   - by bill no      -> /bills/full?bill_no=123
// -------------------------
app.get("/bills/full", (req, res) => {
  const { from, to, bill_no } = req.query;

  // if no bill_no, require from + to
  if (!bill_no && (!from || !to)) {
    return res.status(400).json({ error: "from and to dates required" });
  }

  let billsSql;
  let params;

  if (bill_no) {
    billsSql = `
    SELECT 
      bills.*,
      customers.name AS customer_name
    FROM bills
    LEFT JOIN customers 
      ON bills.customer_id = customers.id
    WHERE bills.id = ?
    ORDER BY bills.id DESC
  `;
    params = [Number(bill_no)];
  } else {
    billsSql = `
    SELECT 
      bills.*,
      customers.name AS customer_name
    FROM bills
    LEFT JOIN customers 
      ON bills.customer_id = customers.id
    WHERE DATE(bills.date) BETWEEN DATE(?) AND DATE(?)
    ORDER BY bills.id DESC
  `;
    params = [from, to];
  }

  db.all(billsSql, params, (err, bills) => {
    if (err) return res.status(500).json(err);

    if (!bills.length) return res.json([]);

    const billIds = bills.map(b => b.id);
    const placeholders = billIds.map(() => "?").join(",");

    const itemsSql = `
      SELECT bi.*, p.name, p.unit
      FROM bill_items bi
      JOIN products p ON bi.product_id = p.id
      WHERE bi.bill_id IN (${placeholders})
      ORDER BY bi.bill_id, bi.id
    `;

    db.all(itemsSql, billIds, (err2, items) => {
      if (err2) return res.status(500).json(err2);

      // attach items to each bill
      bills.forEach(b => {
        b.items = items.filter(i => i.bill_id === b.id);
      });

      res.json(bills);
    });
  });
});

// -------------------------
// GET ALL BILLS FOR EXCEL EXPORT
// Returns all bills with items for export
// -------------------------
app.get("/bills/all-for-export", (req, res) => {
  const billsSql = `
    SELECT 
      bills.*,
      customers.name AS customer_name
    FROM bills
    LEFT JOIN customers 
      ON bills.customer_id = customers.id
    ORDER BY bills.id ASC
  `;

  db.all(billsSql, [], (err, bills) => {
    if (err) return res.status(500).json(err);

    if (!bills.length) return res.json([]);

    const billIds = bills.map(b => b.id);
    const placeholders = billIds.map(() => "?").join(",");

    const itemsSql = `
      SELECT bi.*, p.name, p.unit
      FROM bill_items bi
      JOIN products p ON bi.product_id = p.id
      WHERE bi.bill_id IN (${placeholders})
      ORDER BY bi.bill_id, bi.id
    `;

    db.all(itemsSql, billIds, (err2, items) => {
      if (err2) return res.status(500).json(err2);

      // attach items to each bill
      bills.forEach(b => {
        b.items = items.filter(i => i.bill_id === b.id);
      });

      res.json(bills);
    });
  });
});

app.post("/customers/add", (req, res) => {
  const { name, mobile, old_balance } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name required" });
  }

  db.run(
    "INSERT INTO customers (name, mobile, old_balance) VALUES (?, ?, ?)",
    [name.trim(), mobile || "", Number(old_balance) || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const customerId = this.lastID;
      
      // Real-time broadcast
      if (realtimeSync) {
        db.get("SELECT * FROM customers WHERE id = ?", [customerId], (err, customer) => {
          if (!err && customer) realtimeSync.customerAdded(customer);
        });
      }
      
      res.json({ status: "ok", id: customerId });
    }
  );
});
// -------------------------
// Get all customers
// -------------------------
app.get("/customers/all", (req, res) => {
  db.all(
    "SELECT * FROM customers ORDER BY name",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});
app.post("/customers/delete", (req, res) => {
  const { customer_id } = req.body;
  if (!customer_id) {
    return res.status(400).send("Customer ID required");
  }

  db.run(
    "DELETE FROM customers WHERE id = ?",
    [customer_id],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      
      // Real-time broadcast
      if (realtimeSync) {
        realtimeSync.customerDeleted(customer_id);
      }
      
      res.send({ success: true });
    }
  );
});
// -------------------------
// Toggle product active/inactive
// -------------------------
app.post("/product/toggle-active", (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Product ID required" });
  }

  db.run(
    `UPDATE products 
     SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END
     WHERE id = ?`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Real-time broadcast
      if (realtimeSync) {
        db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
          if (!err && product) realtimeSync.productToggled(id, product.active);
        });
      }
      
      res.json({ success: true });
    }
  );
});
app.post("/payments/add", (req, res) => {
  const {
    customer_id,
    customer_name,
    old_ob,
    paid_amount,
    new_ob
  } = req.body || {};

  if (!customer_id || paid_amount === undefined || paid_amount === null || isNaN(Number(paid_amount))) {
    return res.status(400).json({ error: "Invalid payment data" });
  }

  db.run(
    `INSERT INTO payment_receipts
     (customer_id, customer_name, old_ob, paid_amount, new_ob)
     VALUES (?, ?, ?, ?, ?)`,
    [
      Number(customer_id),
      String(customer_name || ""),
      Number(old_ob || 0),
      Number(paid_amount),
      Number(new_ob)
    ],
    function (err) {
      if (err) {
        console.error("Payment insert error:", err);
        return res.status(500).json({ error: "Payment save failed" });
      }

      const receiptId = this.lastID;

      db.run(
        `UPDATE customers SET old_balance = ? WHERE id = ?`,
        [Number(new_ob), Number(customer_id)],
        err2 => {
          if (err2) {
            console.error("OB update error:", err2);
            return res.status(500).json({ error: "Customer OB update failed" });
          }

          // Real-time broadcast
          if (realtimeSync) {
            db.get("SELECT * FROM payment_receipts WHERE id = ?", [receiptId], (err, receipt) => {
              if (!err && receipt) realtimeSync.paymentAdded(receipt);
            });
          }

          res.json({
            success: true,
            receipt_id: receiptId
          });
        }
      );
    }
  );
});
// -------------------------
// Get payment settlements by customer
// -------------------------
app.get("/payments/by-customer/:customer_id", (req, res) => {
  const customerId = Number(req.params.customer_id);

  if (!customerId) {
    return res.status(400).json({ error: "Invalid customer id" });
  }

  db.all(
    `
    SELECT
  id,
  bill_id,
  old_ob,
  paid_amount,
  new_ob,
  created_at
FROM payment_receipts
WHERE customer_id = ?
ORDER BY datetime(created_at) DESC
    `,
    [customerId],
    (err, rows) => {
      if (err) {
        console.error("Fetch settlements error:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(rows || []);
    }
  );
});
app.get("/payments/receipt/:id", (req, res) => {
  const receiptId = Number(req.params.id);

  if (!receiptId) {
    return res.status(400).json({ error: "Invalid receipt id" });
  }

  db.get(
    `
    SELECT
  id,
  bill_id,
  customer_name,
  old_ob,
  paid_amount,
  new_ob,
  created_at
FROM payment_receipts
WHERE id = ?
    `,
    [receiptId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!row) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      res.json(row);
    }
  );
});
// -------------------------
// Get bill for editing
// -------------------------
app.get("/bill/edit/:bill_id", (req, res) => {
  const billId = Number(req.params.bill_id);
  if (!billId) return res.status(400).json({ error: "Invalid bill id" });

  db.get(
    "SELECT * FROM bills WHERE id = ?",
    [billId],
    (err, bill) => {
      if (err || !bill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      db.all(
        `SELECT bi.*, p.name, p.unit
         FROM bill_items bi
         JOIN products p ON bi.product_id = p.id
         WHERE bi.bill_id = ?`,
        [billId],
        (err2, items) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({
            bill,
            items
          });
        }
      );
    }
  );
});
app.post("/update-bill/:bill_id", (req, res) => {
  const billId = Number(req.params.bill_id);
  const { items, payment_mode, customer_id, paid_amount } = req.body || {};
  const safePaidAmount = Number(paid_amount || 0);
  if (!Number.isFinite(safePaidAmount) || safePaidAmount < 0) {
    return res.status(400).json({ error: "Invalid paid_amount" });
  }

  if (!billId) return res.status(400).json({ error: "Invalid bill id" });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items" });
  }
  for (let it of items) {
    it.product_id = Number(it.product_id);
    it.qty = Number(it.qty);
    if (!it.product_id || isNaN(it.qty) || it.qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION", err => {
      if (err) return res.status(500).json({ error: "Transaction failed" });

      // 1️⃣ Load bill
      db.get("SELECT * FROM bills WHERE id = ?", [billId], (err1, bill) => {
        if (err1 || !bill) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Bill not found" });
        }

        // ⛔ only today
        if (!isToday(bill.date)) {
          db.run("ROLLBACK");
          return res.status(403).json({ error: "Only today bills can be edited" });
        }

        // 2️⃣ Load old bill items
        db.all(
          "SELECT * FROM bill_items WHERE bill_id = ?",
          [billId],
          (err2, oldItems) => {
            if (err2) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: err2.message });
            }

            // 3️⃣ REVERT STOCK + FIFO
            const revertItem = (i) => {
              if (i >= oldItems.length) return deleteOldItems();

              const it = oldItems[i];

              // restore product stock
              db.run(
                "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
                [it.qty, it.product_id],
                err3 => {
                  if (err3) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err3.message });
                  }

                  // restore FIFO batch if exists
                  if (it.purchase_history_id) {
                    db.run(
                      "UPDATE purchase_history SET remaining_qty = remaining_qty + ? WHERE id = ?",
                      [it.qty, it.purchase_history_id],
                      err4 => {
                        if (err4) {
                          db.run("ROLLBACK");
                          return res.status(500).json({ error: err4.message });
                        }
                        revertItem(i + 1);
                      }
                    );
                  } else {
                    revertItem(i + 1);
                  }
                }
              );
            };

            const deleteOldItems = () => {
              db.run(
                "DELETE FROM bill_items WHERE bill_id = ?",
                [billId],
                err5 => {
                  if (err5) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err5.message });
                  }
                  applyNewItems();
                }
              );
            };

            // 4️⃣ APPLY NEW ITEMS (FIFO AGAIN)
            let subtotal = 0;
            const billLineRecords = [];

            const applyNewItems = () => {
              const processItem = (idx) => {
                if (idx >= items.length) return finalizeBill(subtotal, billLineRecords);

                const it = items[idx];
                db.get("SELECT * FROM products WHERE id = ?", [it.product_id], (err6, prod) => {
                  if (err6 || !prod) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ error: "Product not found" });
                  }

                  const sellingPrice =
                    it.price !== undefined
                      ? Number(it.price)
                      : Number(prod.retail_price);

                  subtotal += Math.ceil(Number(it.qty) * Number(sellingPrice));
                  db.all(
                    "SELECT * FROM purchase_history WHERE product_id = ? AND remaining_qty > 0 ORDER BY id ASC",
                    [it.product_id],
                    (err7, fifoRows) => {
                      if (err7) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: err7.message });
                      }

                      let left = it.qty;
                      let f = 0;

                      const consume = () => {
                        if (left <= 0) {
                          db.run(
                            "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?",
                            [it.qty, prod.id],
                            err8 => {
                              if (err8) {
                                db.run("ROLLBACK");
                                return res.status(500).json({ error: err8.message });
                              }
                              processItem(idx + 1);
                            }
                          );
                          return;
                        }

                        if (f >= fifoRows.length) {

                          db.run(
                            "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?",
                            [it.qty, prod.id],
                            errNeg => {
                              if (errNeg) {
                                db.run("ROLLBACK");
                                return res.status(500).json({ error: errNeg.message });
                              }
                              billLineRecords.push({
                                product_id: it.product_id,
                                qty: left,
                                selling_price: sellingPrice,
                                price_type: it.price_type || "retail",
                                purchase_history_id: null
                              });
                              processItem(idx + 1);
                            }
                          );
                          return;
                        }

                        const row = fifoRows[f];
                        const use = Math.min(left, row.remaining_qty);

                        db.run(
                          "UPDATE purchase_history SET remaining_qty = remaining_qty - ? WHERE id = ?",
                          [use, row.id],
                          errPH => {
                            if (errPH) {
                              db.run("ROLLBACK");
                              return res.status(500).json({ error: errPH.message });
                            }
                            billLineRecords.push({
                              product_id: it.product_id,
                              qty: use,
                              selling_price: sellingPrice,
                              price_type: it.price_type || "retail",
                              purchase_history_id: row.id
                            });
                            left -= use;
                            f++;
                            consume();
                          }
                        );
                      };

                      consume();
                    }
                  );
                });
              };

              processItem(0);
            };

            const finalizeBill = (subtotal, lines) => {
              const finalAmount = Math.ceil(subtotal - 1e-9);

              let newCustomerOB = bill.new_ob;

              if (customer_id) {
                newCustomerOB =
                  Number(bill.previous_ob || 0) +
                  Number(finalAmount || 0) -
                  safePaidAmount
              }

              db.run(
                `
  UPDATE bills SET
    subtotal = ?,
    final_amount = ?,
    payment_mode = ?,
    customer_id = ?,
    previous_ob = ?,
    paid_amount = ?,
    new_ob = ?,
    is_edited = 1,
    edited_at = datetime('now','localtime')
  WHERE id = ?
  `,
                [
                  subtotal,
                  finalAmount,
                  payment_mode || bill.payment_mode,
                  customer_id || bill.customer_id || null,
                  bill.previous_ob || 0,
                  safePaidAmount,
                  newCustomerOB,
                  billId
                ],
                err9 => {
                  if (err9) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err9.message });
                  }

                  if (customer_id) {
                    db.run(
                      "UPDATE customers SET old_balance = ? WHERE id = ?",
                      [newCustomerOB, customer_id]
                    );

                    db.run(
                      `
        UPDATE payment_receipts
        SET
          old_ob = ?,
          paid_amount = ?,
          new_ob = ?,
          created_at = datetime('now','localtime')
        WHERE bill_id = ?
        `,
                      [
                        bill.previous_ob || 0,
                        safePaidAmount,
                        newCustomerOB,
                        billId
                      ]
                    );
                  }

                  let k = 0;
                  const insertLine = () => {
                    if (k >= lines.length) {
                      return db.run("COMMIT", commitErr => {
                        if (commitErr) {
                          db.run("ROLLBACK");
                          return res.status(500).json({ error: commitErr.message });
                        }
                        res.json({ status: "success", bill_id: billId });
                      });
                    }

                    const l = lines[k];
                    const total = Math.ceil(Number(l.qty) * Number(l.selling_price));

                    db.run(
                      `INSERT INTO bill_items
        (bill_id, product_id, qty, price, total, price_type, purchase_history_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                      [
                        billId,
                        l.product_id,
                        l.qty,
                        l.selling_price,
                        total,
                        l.price_type || "retail",
                        l.purchase_history_id
                      ],
                      () => {
                        k++;
                        insertLine();
                      }
                    );
                  };

                  insertLine();
                }
              );
            };

            revertItem(0);
          }
        );
      });
    });
  });
});

// -------------------------
// Barcode System API Endpoints
// -------------------------

// GET /api/product/barcode/:barcode - Lookup product by barcode
app.get('/api/product/barcode/:barcode', (req, res) => {
  const barcode = String(req.params.barcode || '').trim().toUpperCase();
  
  // Validate barcode length (6-20 characters)
  if (barcode.length < 6 || barcode.length > 20) {
    return res.status(400).json({ error: 'Invalid barcode length (must be 6-20 characters)' });
  }
  
  // Validate not empty/whitespace
  if (!barcode || /^\s*$/.test(barcode)) {
    return res.status(400).json({ error: 'Barcode cannot be empty' });
  }
  
  db.get(
    'SELECT * FROM products WHERE barcode = ? AND active = 1',
    [barcode],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    }
  );
});

// GET /api/barcode/validate/:barcode - Check if barcode exists
app.get('/api/barcode/validate/:barcode', (req, res) => {
  const barcode = String(req.params.barcode || '').trim().toUpperCase();
  
  // Validate barcode length
  if (barcode.length < 6 || barcode.length > 20) {
    return res.status(400).json({ error: 'Invalid barcode length (must be 6-20 characters)' });
  }
  
  db.get(
    'SELECT id, name FROM products WHERE barcode = ?',
    [barcode],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        exists: !!product,
        product_id: product ? product.id : null,
        product_name: product ? product.name : null
      });
    }
  );
});

// GET /api/barcode/cache - Get all products with barcodes for client-side caching
app.get('/api/barcode/cache', (req, res) => {
  db.all(
    `SELECT id, name, barcode, retail_price, wholesale_price, 
            special_price, wholesale_min_qty, unit, stock_qty
     FROM products 
     WHERE active = 1 AND barcode IS NOT NULL
     ORDER BY name`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

// -------------------------
// End Barcode System API Endpoints
// -------------------------

// -------------------------
// Cloudflare R2 Backup - Store Closing Endpoint
// -------------------------
app.post('/api/store-closing-backup', async (req, res) => {
  try {
    const result = await performStoreClosingBackup(DB_FILE);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        filename: result.filename,
        r2Key: result.r2Key
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[Store Closing] Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Backup failed',
      error: error.message
    });
  }
});

// -------------------------
// Database Import Endpoint
// -------------------------
app.post('/api/import-database', upload.single('database'), async (req, res) => {
  let backupPath = null;
  let uploadedFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No database file uploaded'
      });
    }

    uploadedFilePath = req.file.path;
    console.log('[Import] Database file uploaded:', uploadedFilePath);

    // Step 1: Validate uploaded database
    console.log('[Import] Validating uploaded database...');
    const validation = await validateDatabase(uploadedFilePath);
    
    if (!validation.valid) {
      // Clean up uploaded file
      fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    console.log('[Import] Database validated. Tables found:', validation.tables);

    // Step 2: Create backup of current database
    console.log('[Import] Creating backup of current database...');
    backupPath = await createBackupBeforeImport(DB_FILE);
    console.log('[Import] Backup created:', backupPath);

    // Step 3: Extract data from old database
    console.log('[Import] Extracting data from uploaded database...');
    const extractedData = await extractDataFromOldDb(uploadedFilePath, validation);
    console.log('[Import] Data extracted:', {
      products: extractedData.products.length,
      bills: extractedData.bills.length,
      billItems: extractedData.billItems.length,
      customers: extractedData.customers.length,
      purchaseHistory: extractedData.purchaseHistory.length,
      customerPayments: extractedData.customerPayments.length,
      paymentReceipts: extractedData.paymentReceipts.length
    });

    // Step 4: Import data into current database
    console.log('[Import] Importing data into current database...');
    const importStats = await importDataToCurrentDb(db, extractedData);
    console.log('[Import] Import completed:', importStats);

    // Clean up uploaded file
    fs.unlinkSync(uploadedFilePath);

    // Send success response
    res.json({
      success: true,
      message: 'Data imported successfully',
      stats: {
        products: importStats.products,
        customers: importStats.customers,
        bills: importStats.bills,
        billItems: importStats.billItems,
        purchaseHistory: importStats.purchaseHistory,
        customerPayments: importStats.customerPayments,
        paymentReceipts: importStats.paymentReceipts
      },
      errors: importStats.errors.length > 0 ? importStats.errors : undefined,
      backupPath: path.basename(backupPath)
    });

  } catch (error) {
    console.error('[Import] Import failed:', error);

    // Clean up uploaded file if exists
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {
        console.error('[Import] Failed to clean up uploaded file:', cleanupErr);
      }
    }

    // Attempt to restore from backup if it was created
    if (backupPath && fs.existsSync(backupPath)) {
      try {
        console.log('[Import] Attempting to restore from backup...');
        await restoreFromBackup(backupPath, DB_FILE);
        console.log('[Import] Database restored from backup');
        
        res.status(500).json({
          success: false,
          message: 'Import failed. Database restored from backup.',
          error: error.message
        });
      } catch (restoreErr) {
        console.error('[Import] Failed to restore from backup:', restoreErr);
        res.status(500).json({
          success: false,
          message: 'Import failed and backup restoration failed. Please restore manually.',
          error: error.message,
          restoreError: restoreErr.message,
          backupPath: path.basename(backupPath)
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Import failed',
        error: error.message
      });
    }
  }
});

process.on('SIGTERM', () => {
  console.log("Server shutting down...");
  process.exit(0);
});
// start server with WebSocket support
const server = http.createServer(app);
realtimeSync = new RealtimeSync(server);

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Real-time sync enabled via WebSocket');
  
  // Initialize Cloudflare R2 Backup System
  scheduleAutomaticBackup(DB_FILE);
});

// Export realtimeSync for use in routes
module.exports = { realtimeSync };

function shutdown() {
  console.log("Shutting down server...");
  server.close(() => {
    db.close(() => {
      process.exit(0);
    });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
