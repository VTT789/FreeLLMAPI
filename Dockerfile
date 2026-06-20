FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install root dependencies
RUN npm install

# Explicitly install server dependencies
RUN cd server && npm install

COPY . .

RUN mkdir -p /app/data

# Now better-sqlite3 should be available
RUN node -e "try { const db = require('/app/server/node_modules/better-sqlite3')('/app/data/freeapi.db'); console.log('✅ Database connected'); const keys = { google: 'AIzaSyAHokiOWr2O_Nhi5c9-O9k599DUaIHtqCI', groq: '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' }; db.exec('CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, api_key TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(provider))'); for (const [provider, key] of Object.entries(keys)) { db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES (?, ?)').run(provider, key); console.log('Inserted ' + provider); } const unifiedKey = 'freellmapi-' + Date.now(); db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'); db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('unified_api_key', unifiedKey); console.log('Unified key created: ' + unifiedKey); } catch (error) { console.error('❌ Error:', error.message); process.exit(1); }"

EXPOSE 3001

CMD ["node", "--import", "tsx", "server/src/index.ts"]