FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Load API keys from environment variables into the database
# Using the correct path to better-sqlite3 in the server workspace
RUN node -e "
const db = require('/app/server/node_modules/better-sqlite3')('/app/data/freeapi.db');
const keys = {
  google: process.env.GOOGLE_API_KEY || '',
  groq: process.env.GROQ_API_KEY || '',
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

// Create table if it doesn't exist
db.exec('CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, api_key TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(provider))');

// Insert or update keys
let count = 0;
for (const [provider, key] of Object.entries(keys)) {
  if (key && key.length > 0) {
    db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key);
    console.log('✅ Inserted ' + provider);
    count++;
  } else {
    console.log('⚠️ No key found for ' + provider);
  }
}
console.log('✅ Loaded ' + count + ' API keys from environment variables');
"

EXPOSE 3001

# Start the server
CMD ["node", "--import", "tsx", "server/src/index.ts"]