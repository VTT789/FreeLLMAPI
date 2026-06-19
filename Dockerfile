FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

# Build with esbuild – keep only native modules external
RUN npx esbuild server/src/index.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --format=esm --external:better-sqlite3 --external:socks-proxy-agent --loader:.ts=ts

EXPOSE 3001

# Set NODE_PATH to help resolve bare imports, and use specifier resolution
ENV NODE_PATH=/app/node_modules:/app/server/node_modules
CMD ["node", "--es-module-specifier-resolution=node", "dist/server.js"]