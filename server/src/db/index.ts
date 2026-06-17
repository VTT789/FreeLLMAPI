```ts
import crypto from 'crypto';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrateDbSchema } from './migrations.js';
import { encrypt } from '../lib/crypto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/freeapi.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function seedProviderKeys() {
  const providers = [
    ['google', process.env.GOOGLE_API_KEY]],
    ['groq', process.env.GROQ_API_KEY],
    ['openrouter', process.env.OPENROUTER_API_KEY],
    ['cohere', process.env.COHERE_API_KEY],
    ['cloudflare', process.env.CLOUDFLARE_API_KEY],
    ['github', process.env.GITHUB_TOKEN],
    ['mistral', process.env.MISTRAL_API_KEY],
    ['nvidia', process.env.NVIDIA_API_KEY],
    ['cerebras', process.env.CEREBRAS_API_KEY],
    ['zhipu', process.env.ZHIPU_API_KEY],
    ['huggingface', process.env.HUGGINGFACE_API_KEY],
  ];

  for (const [platform, key] of providers) {
    if (!key) continue;

    const exists = db.prepare(
      'SELECT id FROM api_keys WHERE platform = ? LIMIT 1'
    ).get(platform);

    if (exists) continue;

    const { encrypted, iv, authTag } = encrypt(key);

    db.prepare(`
      INSERT INTO api_keys
      (platform, label, encrypted_key, iv, auth_tag, status, enabled)
      VALUES (?, ?, ?, ?, ?, 'unknown', 1)
    `).run(
      platform,
      'Auto',
      encrypted,
      iv,
      authTag
    );

    console.log(`Added provider: ${platform}`);
  }
}

export function initDb(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? DB_PATH;
  const isMemory = resolvedPath === ':memory:';

  if (!isMemory) {
    const dataDir = path.dirname(resolvedPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  db = new Database(resolvedPath);

  if (!isMemory) db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  migrateDbSchema(db);

  seedProviderKeys();

  console.log(`Database initialized at ${resolvedPath}`);

  return db;
}

export function getUnifiedApiKey(): string {
  const db = getDb();
  const row = db.prepare(
    "SELECT value FROM settings WHERE key = 'unified_api_key'"
  ).get() as { value: string };

  return row.value;
}

export function regenerateUnifiedKey(): string {
  const db = getDb();

  const key = `freellmapi-${crypto.randomBytes(24).toString('hex')}`;

  db.prepare(
    "UPDATE settings SET value = ? WHERE key = 'unified_api_key'"
  ).run(key);

  return key;
}

export function getSetting(key: string): string | undefined {
  const db = getDb();

  const row = db.prepare(
    'SELECT value FROM settings WHERE key = ?'
  ).get(key) as { value: string } | undefined;

  return row?.value;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();

  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value
  `).run(key, value);
}
```
