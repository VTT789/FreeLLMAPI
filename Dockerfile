FROM node:20-alpine

RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

# Create database directory and insert keys using sqlite3
RUN mkdir -p /app/data && \
    sqlite3 /app/data/freeapi.db "CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, api_key TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(provider));" && \
    sqlite3 /app/data/freeapi.db "INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES ('google', 'AIzaSyAHokiOWr2O_Nhi5c9-O9k599DUaIHtqCI');" && \
    sqlite3 /app/data/freeapi.db "INSERT OR REPLACE INTO api_keys (provider, api_key) VALUES ('groq', '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');" && \
    sqlite3 /app/data/freeapi.db "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);" && \
    sqlite3 /app/data/freeapi.db "INSERT OR REPLACE INTO settings (key, value) VALUES ('unified_api_key', 'freellmapi-unified-123');" && \
    echo "✅ Keys inserted successfully"

EXPOSE 3001

CMD ["node", "--import", "tsx", "server/src/index.ts"]