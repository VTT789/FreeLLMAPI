# ... your existing Dockerfile ...

# Create api_keys table and insert keys on startup
RUN node -e "
const db = require('better-sqlite3')('/app/data/freeapi.db');
const keys = {
  google: 'AIzaSyAHokiOWr2O_Nhi5c9-O9k599DUaIHtqCI',
  groq: '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',
  cerebras: 'ccccccccccc',
  nvidia: 'ddddddddddd',
  mistral: 'eeeeeeeeeee',
  openrouter: 'ffffffffffffff',
  github: 'gggggggggggg',
  cohere: 'hhhhhhhhhhhh',
  cloudflare: 'iiiiiiiiiiiiiii',
  zhipu: 'kkkkkkkkkkkkk',
  ollama: 'lllllllllll',
  kilo: 'mmmmmmmmmmmmmm',
  pollinations: 'nnnnnnnn',
  llm7: 'ooooooo',
  huggingface: 'ppppppppppp',
  opencode: 'qqqqqqqqqqqq',
  ovh: 'rrrrrrrrrr',
  agnes: 'ssssssssss',
  custom: 'tttttttttttttt'
};
db.exec('CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, api_key TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(provider))');
for (const [provider, key] of Object.entries(keys)) {
  db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key);
}
console.log('✅ API keys loaded');
"