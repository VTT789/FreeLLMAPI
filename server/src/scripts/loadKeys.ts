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
      groq: process.env.GROQ_API_KEY || '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',
      cerebras: process.env.CEREBRAS_API_KEY || '',
      nvidia: process.env.NVIDIA_API_KEY || '',
      mistral: process.env.MISTRAL_API_KEY || '',
      openrouter: process.env.OPENROUTER_API_KEY || '',
      github: process.env.GITHUB_API_KEY || '',
      cohere: process.env.COHERE_API_KEY || '',
      cloudflare: process.env.CLOUDFLARE_API_KEY || '',
      zhipu: process.env.ZHIPU_API_KEY || '',
      ollama: process.env.OLLAMA_API_KEY || '',
      kilo: process.env.KILO_API_KEY || '',
      pollinations: process.env.POLLINATIONS_API_KEY || '',
      llm7: process.env.LLM7_API_KEY || '',
      huggingface: process.env.HUGGINGFACE_API_KEY || '',
      opencode: process.env.OPENCODE_API_KEY || '',
      ovh: process.env.OVH_API_KEY || '',
      agnes: process.env.AGNES_API_KEY || '',
      custom: process.env.CUSTOM_API_KEY || ''
    };

    db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider)
    )`);

    let count = 0;
    for (const [provider, key] of Object.entries(keys)) {
      if (key && key.length > 0) {
        db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key);
        console.log(`✅ Inserted ${provider}`);
        count++;
      }
    }

    const unifiedKey = process.env.UNIFIED_API_KEY || `freellmapi-${Date.now()}`;
    db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('unified_api_key', unifiedKey);
    console.log(`✅ Unified key: ${unifiedKey}`);
    console.log(`✅ Loaded ${count} API keys`);

    db.close();
  } catch (error) {
    console.error('❌ Failed to load keys:', error);
  }
}

loadKeys();