const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_FILE = path.join(__dirname, "shop.db");

const db = new sqlite3.Database(DB_FILE, err => {
  if (err) {
    console.error("DB open error:", err);
    return;
  }
  console.log("DB opened successfully");
});

db.serialize(() => {
  console.log("\n--- TABLE LIST ---");
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table'",
    (err, rows) => {
      if (err) {
        console.error("Table list error:", err);
      } else {
        console.log(rows.map(r => r.name));
      }
    }
  );

  console.log("\n--- TEST INSERT (payment_receipts) ---");
  db.run(
    `INSERT INTO payment_receipts
     (customer_id, customer_name, old_ob, paid_amount, new_ob)
     VALUES (1, 'DB TEST', 100, 10, 90)`,
    err => {
      if (err) {
        console.error("Insert error:", err);
      } else {
        console.log("Insert SUCCESS");
      }
    }
  );

  console.log("\n--- TEST UPDATE (customers) ---");
  db.run(
    `UPDATE customers SET old_balance = old_balance WHERE id = 1`,
    err => {
      if (err) {
        console.error("Update error:", err);
      } else {
        console.log("Update SUCCESS");
      }
    }
  );
});

setTimeout(() => {
  db.close(() => console.log("\nDB closed"));
}, 1500);