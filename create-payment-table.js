const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "shop.db"));

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
`, err => {
  if (err) {
    console.error("Table creation failed:", err);
  } else {
    console.log("✅ payment_receipts table created successfully");
  }

  db.close();
});