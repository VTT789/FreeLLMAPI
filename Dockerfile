FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

# Create database directory and insert keys
RUN mkdir -p /app/data && \
    cd /app && \
    node -e "const db = require('./node_modules/better-sqlite3')('/app/data/freeapi.db'); const keys = { google: process.env.GOOGLE_API_KEY, groq: process.env.GROQ_API_KEY, cerebras: process.env.CEREBRAS_API_KEY, nvidia: process.env.NVIDIA_API_KEY, mistral: process.env.MISTRAL_API_KEY, openrouter: process.env.OPENROUTER_API_KEY, github: process.env.GITHUB_API_KEY, cohere: process.env.COHERE_API_KEY, cloudflare: process.env.CLOUDFLARE_API_KEY, zhipu: process.env.ZHIPU_API_KEY, ollama: process.env.OLLAMA_API_KEY, kilo: process.env.KILO_API_KEY, pollinations: process.env.POLLINATIONS_API_KEY, llm7: process.env.LLM7_API_KEY, huggingface: process.env.HUGGINGFACE_API_KEY, opencode: process.env.OPENCODE_API_KEY, ovh: process.env.OVH_API_KEY, agnes: process.env.AGNES_API_KEY, custom: process.env.CUSTOM_API_KEY }; db.exec('CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, api_key TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(provider))'); for (const [provider, key] of Object.entries(keys)) { if (key) { db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key); console.log('Inserted ' + provider); } } console.log('✅ API keys loaded');"

EXPOSE 3001

CMD ["node", "--import", "tsx", "server/src/index.ts"]