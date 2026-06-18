import crypto from 'crypto';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrateDbSchema } from './migrations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/freeapi.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
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
  console.log(`Database initialized at ${resolvedPath}`);
  return db;
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
  getDb()
    .prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key)
      DO UPDATE SET value = excluded.value
    `)
    .run(key, value);
}

// Function to find header and rows from the API data
export function findHeaderAndRows(
  data: any[],
  headerName: string,
  columnIndices: number[]
): { header: string; rows: any[] } {
  if (!data || data.length === 0) {
    return { header: '', rows: [] };
  }

  // Find the header row (first row of the data)
  const headerRow = data[0];
  let headerIndex = -1;

  // Find the column index matching the header name
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] && headerRow[i].toString().toLowerCase() === headerName.toLowerCase()) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return { header: '', rows: [] };
  }

  // Extract rows data based on column indices
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[headerIndex]) {
      const rowData: any = {};
      // Extract data for specified column indices
      for (const colIndex of columnIndices) {
        if (colIndex < row.length) {
          rowData[`col_${colIndex}`] = row[colIndex] || '';
        }
      }
      rows.push(rowData);
    }
  }

  return { header: headerRow[headerIndex], rows };
}

// Function to fetch API data from Google Sheets
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

// Function to fetch and store API keys from Google Sheets
export async function fetchAndStoreApiKeys(): Promise<void> {
  try {
    const data = await fetchApiData();
    if (!data || data.length === 0) {
      console.error('No data received from Google Sheets');
      return;
    }

    // Define all API providers and their column configurations
    const apiProviders = [
      { name: 'google', colIndex: 3, key: 'google_api_key' },
      { name: 'groq', colIndex: 4, key: 'groq_api_key' },
      { name: 'cerebras', colIndex: 5, key: 'cerebras_api_key' },
      { name: 'nvidia', colIndex: 6, key: 'nvidia_api_key' },
      { name: 'mistral', colIndex: 7, key: 'mistral_api_key' },
      { name: 'openrouter', colIndex: 8, key: 'openrouter_api_key' },
      { name: 'github', colIndex: 9, key: 'github_api_key' },
      { name: 'cohere', colIndex: 10, key: 'cohere_api_key' },
      { name: 'cloudflare', colIndex: 11, key: 'cloudflare_api_key' },
      { name: 'zhipu', colIndex: 12, key: 'zhipu_api_key' },
      { name: 'ollama', colIndex: 13, key: 'ollama_api_key' },
      { name: 'kilo', colIndex: 14, key: 'kilo_api_key' },
      { name: 'pollinations', colIndex: 15, key: 'pollinations_api_key' },
      { name: 'llm7', colIndex: 16, key: 'llm7_api_key' },
      { name: 'huggingface', colIndex: 17, key: 'huggingface_api_key' },
      { name: 'opencode', colIndex: 18, key: 'opencode_api_key' },
      { name: 'ovh', colIndex: 19, key: 'ovh_api_key' },
      { name: 'agnes', colIndex: 20, key: 'agnes_api_key' },
      { name: 'custom', colIndex: 21, key: 'custom_api_key' }
    ];

    // Process each API provider
    for (const provider of apiProviders) {
      const result = findHeaderAndRows(data, 'API', [1, provider.colIndex]);
      
      if (result.header && result.rows.length > 0) {
        // Extract API key from the first valid row
        const firstRow = result.rows[0];
        const apiKey = firstRow[`col_${provider.colIndex}`];
        
        if (apiKey && apiKey.trim() !== '') {
          // Store in database
          setSetting(provider.key, apiKey.trim());
          console.log(`✅ Stored ${provider.name} API key`);
        } else {
          console.log(`⚠️ No API key found for ${provider.name}`);
        }
      } else {
        console.log(`⚠️ No data found for ${provider.name}`);
      }
    }

    console.log('✅ All API keys fetched and stored successfully');
  } catch (error) {
    console.error('❌ Error fetching and storing API keys:', error);
    throw error;
  }
}

// Function to get a specific API key
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

// Function to refresh API keys from Google Sheets
export async function refreshApiKeys(): Promise<void> {
  console.log('🔄 Refreshing API keys from Google Sheets...');
  await fetchAndStoreApiKeys();
}

// Function to initialize the database with default API keys
export function initializeApiKeys(): void {
  console.log('🔑 Initializing API keys...');
  
  // Check if we have any API keys stored
  const sampleKey = getSetting('google_api_key');
  
  if (!sampleKey) {
    console.log('📡 No API keys found. Fetching from Google Sheets...');
    // Fetch asynchronously but don't block initialization
    fetchAndStoreApiKeys().catch(error => {
      console.error('Failed to fetch API keys:', error);
    });
  } else {
    console.log('✅ API keys already initialized');
  }
}