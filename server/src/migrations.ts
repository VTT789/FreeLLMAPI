import Database from 'better-sqlite3';
import crypto from 'crypto';

export function migrateDbSchema(db: Database.Database): void {
  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Check if unified_api_key exists
  const keyExists = db
    .prepare("SELECT 1 FROM settings WHERE key = 'unified_api_key'")
    .get();

  if (!keyExists) {
    const key = `freellmapi-${crypto.randomBytes(24).toString('hex')}`;
    db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
      .run('unified_api_key', key);
    console.log('🔑 Created unified API key');
  }

  console.log('✅ Database schema migrated successfully');
}