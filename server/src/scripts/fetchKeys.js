const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data/freeapi.db');
const db = new Database(dbPath);

async function fetchKeys() {
  try {
    console.log('🔄 Fetching API keys from Google Sheets...');
    const response = await fetch('https://opensheet.elk.sh/14TIknZTVUyw40Suhj74UzgzXRZaJVX_qg17EeCBsZWM/Sheet1');
    const data = await response.json();
    
    // Ensure the table exists
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

    // Find the API and Platform columns
    const header = data[0];
    let apiColumnIndex = -1;
    let platformColumnIndex = -1;

    for (let i = 0; i < header.length; i++) {
      if (header[i] === 'API') apiColumnIndex = i;
      if (header[i] === 'PlatForm') platformColumnIndex = i;
    }

    if (apiColumnIndex === -1 || platformColumnIndex === -1) {
      console.error('Could not find API or PlatForm columns');
      return;
    }

    const providers = [
      'google', 'groq', 'cerebras', 'nvidia', 'mistral', 
      'openrouter', 'github', 'cohere', 'cloudflare', 
      'zhipu', 'ollama', 'kilo', 'pollinations', 'llm7', 
      'huggingface', 'opencode', 'ovh', 'agnes', 'custom'
    ];

    let inserted = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const provider = row[platformColumnIndex]?.trim();
      const apiKey = row[apiColumnIndex]?.trim();

      if (provider && apiKey && providers.includes(provider.toLowerCase())) {
        const stmt = db.prepare(
          INSERT INTO api_keys (provider, api_key) 
          VALUES (?, ?) 
          ON CONFLICT(provider) 
          DO UPDATE SET api_key = excluded.api_key, updated_at = CURRENT_TIMESTAMP
        );
        stmt.run(provider.toLowerCase(), apiKey);
        inserted++;
        console.log('✅ ' + provider + ': ' + apiKey.substring(0, 15) + '...');
      }
    }

    console.log('✅ Inserted/Updated ' + inserted + ' API keys');
    
    // Verify
    const count = db.prepare('SELECT COUNT(*) as count FROM api_keys').get();
    console.log('📊 Total keys in database: ' + count.count);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

fetchKeys();
