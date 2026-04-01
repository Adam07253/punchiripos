const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./shop.db');

db.get("SELECT datetime('now','localtime') as now", [], (err, row) => {
  console.log("SQLite thinks now is:", row.now);

  db.all(
    "SELECT id, date FROM bills WHERE date(date) = date('now','localtime')",
    [],
    (err2, rows) => {
      console.log("Bills matching today condition:", rows.length);
      db.close();
    }
  );
});