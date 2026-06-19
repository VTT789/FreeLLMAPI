FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install root dependencies
RUN npm install

# Install server dependencies (includes better-sqlite3)
WORKDIR /app/server
RUN npm install

# Return to app root
WORKDIR /app

COPY . .

RUN npx esbuild server/src/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --outfile=dist/server.cjs \
  --format=cjs \
  --external:better-sqlite3 \
  --external:socks-proxy-agent \
  --loader:.ts=ts

EXPOSE 3001

CMD ["node", "dist/server.cjs"]