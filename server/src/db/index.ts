import crypto from 'crypto';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import { migrateDbSchema } from '../migrations.js';

const __dirname = process.cwd();
const DB_PATH = path.resolve(__dirname, '../../data/freeapi.db');

let db: Database.Database;

function initializeDatabaseImmediately(): void {
  if (!db) {
    try {
      const resolvedPath = DB_PATH;
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
      console.log('Database initialized at ' + resolvedPath);
    } catch (e) {
      console.error('Failed to auto-initialize database:', e);
      throw e;
    }
  }
}

initializeDatabaseImmediately();

export function getDb(): Database.Database {
  if (!db) {
    console.log('Database not initialized, initializing now...');
    initializeDatabaseImmediately();
  }
  return db;
}

export function initDb(dbPath?: string): Database.Database {
  if (db) {
    console.log('Database already initialized');
    return db;
  }
  
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
  console.log('Database initialized at ' + resolvedPath);
  return db;
}

export function getUnifiedApiKey(): string {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = 'unified_api_key'")
    .get() as { value: string };
  return row.value;
}

export function regenerateUnifiedKey(): string {
  const key = 'freellmapi-' + crypto.randomBytes(24).toString('hex');
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

export async function fetchApiData(): Promise<any> {
  const url = 'https://opensheet.elk.sh/14TIknZTVUyw40Suhj74UzgzXRZaJVX_qg17EeCBsZWM/Sheet1';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch API data: ' + response.statusText);
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
    console.log('Fetching API keys from Google Sheets...');
    
    const data = await fetchApiData();
    
    if (!data || data.length === 0) {
      console.error('No data received from Google Sheets');
      return;
    }

    console.log('Successfully fetched ' + data.length + ' rows of data');

    const providers = ['google', 'groq', 'cerebras', 'nvidia', 'mistral', 'openrouter', 'github', 'cohere', 'cloudflare', 'zhipu', 'ollama', 'kilo', 'pollinations', 'llm7', 'huggingface', 'opencode', 'ovh', 'agnes', 'custom'];

    let keysAdded = 0;

    for (const provider of providers) {
      let apiKey = '';
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row) continue;
        
        const rowStr = JSON.stringify(row).toLowerCase();
        if (rowStr.includes(provider.toLowerCase())) {
          for (const key of Object.keys(row)) {
            const value = row[key];
            if (value && typeof value === 'string' && value.length > 20) {
              const trimmed = value.trim();
              if (trimmed.startsWith('sk-') || 
                  trimmed.startsWith('api_') || 
                  trimmed.startsWith('hf_') ||
                  trimmed.match(/^[a-zA-Z0-9_-]{30,}$/)) {
                apiKey = trimmed;
                break;
              }
            }
          }
          if (apiKey) break;
        }
      }

      if (apiKey && apiKey !== '') {
        setSetting(provider + '_api_key', apiKey);
        keysAdded++;
        console.log('Added ' + provider + ' API key');
      } else {
        console.log('No API key found for ' + provider);
      }
    }

    console.log('API key import complete! Added ' + keysAdded + ' keys');
    
    const testKey = getSetting('groq_api_key');
    if (testKey) {
      console.log('Verification successful: Groq API key exists');
    } else {
      console.warn('Verification failed: No API keys found. Check Google Sheets data format.');
    }

  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    throw error;
  }
}

export async function initializeApiKeys(): Promise<void> {
  console.log('Initializing API keys...');
  
  try {
    const existingKey = getSetting('groq_api_key');
    
    if (existingKey) {
      console.log('API keys already exist, skipping initialization');
      return;
    }

    console.log('No API keys found, fetching from Google Sheets...');
    await fetchAndStoreApiKeys();
    
    const verifyKey = getSetting('groq_api_key');
    if (verifyKey) {
      console.log('API keys initialized successfully!');
    } else {
      console.warn('API key initialization may have failed, check logs');
    }
    
  } catch (error) {
    console.error('Failed to initialize API keys:', error);
    throw error;
  }
}

export async function autoInitApiKeys(): Promise<void> {
  console.log('Auto-initializing API keys...');
  try {
    getDb();
    await initializeApiKeys();
  } catch (error) {
    console.error('Auto-initialization of API keys failed:', error);
  }
}

export function initApiKeysSync(): void {
  console.log('Synchronously initializing API keys...');
  
  try {
    const existingKey = getSetting('groq_api_key');
    
    if (existingKey) {
      console.log('API keys already exist');
      return;
    }

    console.log('Triggering async fetch of API keys...');
    fetchAndStoreApiKeys().catch(error => {
      console.error('Async fetch of API keys failed:', error);
    });
    
  } catch (error) {
    console.error('Sync initialization of API keys failed:', error);
  }
}

export function getApiKey(provider: string): string | undefined {
  const keyMap: { [key: string]: string } = {
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
