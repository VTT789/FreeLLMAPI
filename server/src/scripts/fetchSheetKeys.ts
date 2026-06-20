import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../../data/freeapi.db');

async function fetchSheetKeys() {
  try {
    console.log('🔄 Fetching API keys from Google Sheet...');
    const response = await fetch('https://opensheet.elk.sh/14TIknZTVUyw40Suhj74UzgzXRZaJVX_qg17EeCBsZWM/Sheet1');
    const data = await response.json();
    
    // Find the API and Platform columns
    const header = data[0];
    let apiColumn = -1;
    let platformColumn = -1;
    
    for (let i = 0; i < header.length; i++) {
      if (header[i] === 'API') apiColumn = i;
      if (header[i] === 'PlatForm') platformColumn = i;
    }
    
    if (apiColumn === -1 || platformColumn === -1) {
      console.error('❌ Could not find API or PlatForm columns');
      return;
    }
    
    // Extract keys
    const providers = [
      'google', 'groq', 'cerebras', 'nvidia', 'mistral', 
      'openrouter', 'github', 'cohere', 'cloudflare', 
      'zhipu', 'ollama', 'kilo', 'pollinations', 'llm7', 
      'huggingface', 'opencode', 'ovh', 'agnes', 'custom'
    ];
    
    const keys = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const platform = row[platformColumn]?.trim().toLowerCase();
      const apiKey = row[apiColumn]?.trim();
      
      if (platform && apiKey && providers.includes(platform)) {
        keys[platform] = apiKey;
        console.log('✅ Found ' + platform + ': ' + apiKey.substring(0, 10) + '...');
      }
    }
    
    // Insert keys into database
    const db = new Database(dbPath);
    
    db.exec('CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, api_key TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(provider))');
    
    let count = 0;
    for (const [provider, key] of Object.entries(keys)) {
      if (key && key.length > 0) {
        db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key);
        console.log('✅ Inserted ' + provider);
        count++;
      }
    }
    
    console.log('✅ Successfully inserted ' + count + ' API keys');
    db.close();
    
  } catch (error) {
    console.error('❌ Error fetching keys:', error);
  }
}

fetchSheetKeys();
