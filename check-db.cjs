const Database = require('better-sqlite3');

const db = new Database('C:/data/freeapi.db');

console.log('Creating api_keys table...');
db.exec(
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider)
  )
);
console.log('✅ api_keys table created');

// Insert test data if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM api_keys').get();
if (count.count === 0) {
  console.log('Inserting test API key...');
  db.prepare('INSERT OR IGNORE INTO api_keys (provider, api_key) VALUES (?, ?)').run('test', 'test-key-123');
  console.log('✅ Test API key inserted');
}

console.log('Database ready!');
