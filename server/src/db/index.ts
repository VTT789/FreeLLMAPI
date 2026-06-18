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

// --- Your existing functions (kept as is) ---
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

// --- NEW: API Fetching and Parsing Logic ---

/**
 * Fetches data from the opensheet API and extracts the "API" column
 * from rows where columns 1 to 22 contain data.
 * 
 * @returns A promise that resolves to an array of API strings.
 * @throws Will throw an error if the fetch fails or the response is invalid.
 */
export async function fetchApiDataFromSheet(): Promise<string[]> {
  const sheetUrl = 'https://opensheet.elk.sh/14TIknZTVUyw40Suhj74UzgzXRZaJVX_qg17EeCBsZWM/Sheet1';
  
  try {
    const response = await fetch(sheetUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Ensure the response is an array (expected format from opensheet)
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response format: expected an array of rows.');
    }

    // Find the header row containing "API"
    const headerRowIndex = data.findIndex(row => 
      row && typeof row === 'object' && Object.values(row).includes('API')
    );

    if (headerRowIndex === -1) {
      throw new Error('Could not find a header row with "API" column.');
    }

    const headerRow = data[headerRowIndex];
    // Find the exact column key for "API"
    const apiColumnKey = Object.keys(headerRow).find(key => headerRow[key] === 'API');
    
    if (!apiColumnKey) {
      throw new Error('Could not find the "API" column in the header row.');
    }

    // Define the row range: from row after header (index 1) up to row 22 (index 21)
    const startRowIndex = headerRowIndex + 1; // row index 1 (0-based)
    const endRowIndex = Math.min(startRowIndex + 21, data.length - 1); // row index 22 (0-based)

    const apiValues: string[] = [];
    for (let i = startRowIndex; i <= endRowIndex; i++) {
      const row = data[i];
      if (row && typeof row === 'object' && row[apiColumnKey]) {
        const value = String(row[apiColumnKey]).trim();
        if (value) {
          apiValues.push(value);
        }
      }
    }

    if (apiValues.length === 0) {
      console.warn('No API values found in the specified range.');
    } else {
      console.log(`Successfully fetched ${apiValues.length} API values.`);
    }

    return apiValues;

  } catch (error) {
    console.error('Failed to fetch or parse API data:', error);
    // Re-throw or handle as needed
    throw new Error(`Failed to fetch API data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Example function demonstrating how to use the fetched API data
 * with your database.
 */
export async function refreshApiKeysFromSheet(): Promise<void> {
  try {
    const apiKeys = await fetchApiDataFromSheet();
    const db = getDb();

    // Example: Store the keys in a table (you'll need to create this table)
    // For demonstration, we just print them.
    console.log('API Keys from sheet:');
    apiKeys.forEach((key, index) => {
      console.log(`${index + 1}: ${key}`);
      
      // Example: Insert or update a key-value pair in settings
      // setSetting(`api_key_${index + 1}`, key);
    });

    // You could also store all keys as a JSON array in a single setting
    setSetting('all_api_keys', JSON.stringify(apiKeys));
    
  } catch (error) {
    console.error('Failed to refresh API keys:', error);
    throw error;
  }
}