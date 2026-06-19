import crypto from 'crypto';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrateDbSchema } from './migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../data/freeapi.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    console.log('🔄 Database not initialized, auto-initializing...');
    initDb();
  }
  return db;
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

  if (!isMemory) {
    db.pragma('journal_mode = WAL');
  }

  db.pragma('foreign_keys = ON');
  migrateDbSchema(db);
  
  // Ensure tables exist
  ensureTables(db);
  
  console.log(`Database initialized at ${resolvedPath}`);
  return db;
}

// 🔧 NEW: Ensure all required tables exist
export function ensureTables(db: Database.Database) {
  // Create api_keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider)
    )
  `);

  // Create models table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      model_id TEXT NOT NULL,
      display_name TEXT,
      context_length INTEGER,
      max_tokens INTEGER,
      input_price_per_1k REAL DEFAULT 0,
      output_price_per_1k REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, model_id)
    )
  `);

  console.log('✅ Database tables ensured (api_keys, models)');
}

export function getUnifiedApiKey(): string {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = 'unified_api_key'")
    .get() as { value: string };
  return row.value;
}

export function regenerateUnifiedKey(): string {
  const key = `freellmapi-${crypto.randomBytes(24).toString('hex')}`;
  getDb()
    .prepare("UPDATE settings SET value = ? WHERE key = 'unified_api_key'")
    .run(key);
  return key;
}

export function getSetting(key: string): string | undefined {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  const stmt = getDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  stmt.run(key, value);
}

// 🔧 NEW: Load API keys from environment variables into the database
export function loadKeysFromEnv(): void {
  try {
    const db = getDb();
    
    const providerEnvMap: Record<string, string> = {
      google: 'GOOGLE_API_KEY',
      groq: 'GROQ_API_KEY',
      cerebras: 'CEREBRAS_API_KEY',
      nvidia: 'NVIDIA_API_KEY',
      mistral: 'MISTRAL_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      github: 'GITHUB_API_KEY',
      cohere: 'COHERE_API_KEY',
      cloudflare: 'CLOUDFLARE_API_KEY',
      zhipu: 'ZHIPU_API_KEY',
      ollama: 'OLLAMA_API_KEY',
      kilo: 'KILO_API_KEY',
      pollinations: 'POLLINATIONS_API_KEY',
      llm7: 'LLM7_API_KEY',
      huggingface: 'HUGGINGFACE_API_KEY',
      opencode: 'OPENCODE_API_KEY',
      ovh: 'OVH_API_KEY',
      agnes: 'AGNES_API_KEY',
      custom: 'CUSTOM_API_KEY'
    };

    // Ensure tables exist first
    ensureTables(db);

    let count = 0;
    for (const [provider, envVar] of Object.entries(providerEnvMap)) {
      const key = process.env[envVar];
      if (key && key.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO api_keys (provider, api_key) 
          VALUES (?, ?) 
          ON CONFLICT(provider) 
          DO UPDATE SET api_key = excluded.api_key, updated_at = CURRENT_TIMESTAMP
        `);
        stmt.run(provider, key);
        count++;
        console.log(`✅ Loaded ${provider} API key from environment`);
      }
    }
    
    console.log(`✅ Loaded ${count} API keys from environment variables`);
  } catch (error) {
    console.error('❌ Failed to load API keys from environment:', error);
  }
}

// 🔧 NEW: Auto-load keys on module import
loadKeysFromEnv();

export async function fetchApiData(): Promise<any> {
  const url = 'https://opensheet.elk.sh/14TIknZTVUyw40Suhj74UzgzXRZaJVX_qg17EeCBsZWM/Sheet1';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch API data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching API data:', error);
    throw error;
  }
}

export async function fetchAndStoreApiKeys(): Promise<void> {
  try {
    console.log('🔄 Fetching API keys from Google Sheets...');
    const db = getDb();
    
    const data = await fetchApiData();
    if (!data || data.length === 0) {
      console.error('❌ No data received from Google Sheets');
      return;
    }

    console.log(`✅ Successfully fetched ${data.length} rows of data`);

    const header = data[0];
    let apiColumnIndex = -1;
    let platformColumnIndex = -1;

    for (let i = 0; i < header.length; i++) {
      if (header[i] === 'API') apiColumnIndex = i;
      if (header[i] === 'PlatForm') platformColumnIndex = i;
    }

    if (apiColumnIndex === -1 || platformColumnIndex === -1) {
      console.warn('⚠️ Could not find API or PlatForm columns');
      return;
    }

    const providers = ['google', 'groq', 'cerebras', 'nvidia', 'mistral', 'openrouter', 'github', 'cohere', 'cloudflare', 'zhipu', 'ollama', 'kilo', 'pollinations', 'llm7', 'huggingface', 'opencode', 'ovh', 'agnes', 'custom'];
    let inserted = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const provider = row[platformColumnIndex]?.trim();
      const apiKey = row[apiColumnIndex]?.trim();

      if (provider && apiKey && providers.includes(provider.toLowerCase())) {
        const stmt = db.prepare(`
          INSERT INTO api_keys (provider, api_key) 
          VALUES (?, ?) 
          ON CONFLICT(provider) 
          DO UPDATE SET api_key = excluded.api_key, updated_at = CURRENT_TIMESTAMP
        `);
        stmt.run(provider.toLowerCase(), apiKey);
        inserted++;
        console.log(`✅ Added ${provider} API key`);
      }
    }

    console.log(`✅ API key import complete! Added ${inserted} keys`);
  } catch (error) {
    console.error('❌ Failed to fetch API keys:', error);
    throw error;
  }
}

export async function initializeApiKeys(): Promise<void> {
  console.log('🔑 Initializing API keys...');
  try {
    const existingKey = getSetting('groq_api_key');
    if (existingKey) {
      console.log('✅ API keys already exist, skipping initialization');
      return;
    }

    console.log('📡 No API keys found, fetching from Google Sheets...');
    await fetchAndStoreApiKeys();
    
    const verifyKey = getSetting('groq_api_key');
    if (verifyKey) {
      console.log('✅ API keys initialized successfully!');
    } else {
      console.warn('⚠️ API key initialization may have failed, check logs');
    }
  } catch (error) {
    console.error('❌ Failed to initialize API keys:', error);
    throw error;
  }
}

export async function autoInitApiKeys(): Promise<void> {
  console.log('🔄 Auto-initializing API keys...');
  try {
    getDb();
    await initializeApiKeys();
  } catch (error) {
    console.error('❌ Auto-initialization of API keys failed:', error);
  }
}

export function initApiKeysSync(): void {
  console.log('🔑 Synchronously initializing API keys...');
  try {
    const existingKey = getSetting('groq_api_key');
    if (existingKey) {
      console.log('✅ API keys already exist');
      return;
    }

    console.log('📡 Triggering async fetch of API keys...');
    fetchAndStoreApiKeys().catch(error => {
      console.error('❌ Async fetch of API keys failed:', error);
    });
  } catch (error) {
    console.error('❌ Sync initialization of API keys failed:', error);
  }
}

export function getApiKey(provider: string): string | undefined {
  const keyMap: Record<string, string> = {
    google: 'google_api_key',
    groq: 'groq_api_key',
    cerebras: 'cerebras_api_key',
    nvidia: 'nvidia_api_key',
    mistral: 'mistral_api_key',
    openrouter: 'openrouter_api_key',
    github: 'github_api_key',
    cohere: 'cohere_api_key',
    cloudflare: 'cloudflare_api_key',
    zhipu: 'zhipu_api_key',
    ollama: 'ollama_api_key',
    kilo: 'kilo_api_key',
    pollinations: 'pollinations_api_key',
    llm7: 'llm7_api_key',
    huggingface: 'huggingface_api_key',
    opencode: 'opencode_api_key',
    ovh: 'ovh_api_key',
    agnes: 'agnes_api_key',
    custom: 'custom_api_key'
  };

  const settingKey = keyMap[provider.toLowerCase()];
  if (!settingKey) {
    return undefined;
  }

  return getSetting(settingKey);
}