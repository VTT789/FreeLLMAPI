import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../../data/freeapi.db');

console.log('🔄 Loading API keys from environment variables...');
console.log('📁 Database path:', dbPath);
console.log('🔑 GOOGLE_API_KEY exists?', !!process.env.GOOGLE_API_KEY);
console.log('🔑 GROQ_API_KEY exists?', !!process.env.GROQ_API_KEY);

function loadKeys() {
  try {
    const db = new Database(dbPath);
    console.log('✅ Database connected');

    const keys: Record<string, string> = {
      google: process.env.GOOGLE_API_KEY || '',
      groq: process.env.GROQ_API_KEY || '',
    };

    // Create tables
    db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);

    // Insert provider keys
    let count = 0;
    for (const [provider, key] of Object.entries(keys)) {
      if (key && key.length > 0) {
        db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key);
        console.log(`✅ Inserted ${provider}`);
        count++;
      } else {
        console.log(`⚠️ No key found for ${provider}`);
      }
    }

    // Insert unified key
    const unifiedKey = process.env.UNIFIED_API_KEY || `freellmapi-${Date.now()}`;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('unified_api_key', unifiedKey);
    console.log(`✅ Unified key: ${unifiedKey}`);
    console.log(`✅ Loaded ${count} API keys`);

    db.close();
  } catch (error) {
    console.error('❌ Failed to load keys:', error);
  }
}

loadKeys();