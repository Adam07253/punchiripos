const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./store.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to SQLite database.');
});

// Create products table
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    quantity INTEGER
  )
`);

module.exports = db;