import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../../data/freeapi.db');

// Load keys from environment variables
function loadKeysFromEnv() {
  try {
    const db = new Database(dbPath);
    
    // Create table if it doesn't exist
    db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider)
    )`);

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

    let count = 0;
    for (const [provider, envVar] of Object.entries(providerEnvMap)) {
      const key = process.env[envVar];
      if (key && key.length > 0) {
        db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key);
        console.log(`✅ Loaded ${provider} API key from environment`);
        count++;
      }
    }
    
    db.close();
    console.log(`✅ Loaded ${count} API keys from environment variables`);
    return count;
  } catch (error) {
    console.error('❌ Failed to load API keys from environment:', error);
    return 0;
  }
}

loadKeysFromEnv();