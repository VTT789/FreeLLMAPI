import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../../data/freeapi.db');

function loadKeys() {
  try {
    const db = new Database(dbPath);
    console.log('✅ Database connected for key loading');

    const keys = {
      google: process.env.GOOGLE_API_KEY || 'AIzaSyAHokiOWr2O_Nhi5c9-O9k599DUaIHtqCI',
      groq: process.env.GROQ_API_KEY || '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'
    };

    db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider)
    )`);

    for (const [provider, key] of Object.entries(keys)) {
      if (key) {
        db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key);
        console.log(`✅ Inserted ${provider}`);
      }
    }

    const unifiedKey = process.env.UNIFIED_API_KEY || `freellmapi-${Date.now()}`;
    db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('unified_api_key', unifiedKey);
    console.log(`✅ Unified key: ${unifiedKey}`);

    db.close();
  } catch (error) {
    console.error('❌ Failed to load keys:', error);
  }
}

loadKeys();