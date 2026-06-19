FROM node:20-alpine

# Build tools required for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package manifests first for Docker cache
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install root dependencies
RUN npm install

# Install server dependencies (contains better-sqlite3)
WORKDIR /app/server
RUN npm install

# Install client dependencies if needed
WORKDIR /app/client
RUN npm install

# Back to root
WORKDIR /app

# Copy source code
COPY . .

# Make server node_modules visible to runtime
RUN cp -R /app/server/node_modules/* /app/node_modules/ || true

# Build server
RUN npx esbuild server/src/index.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile=dist/server.js \
    --format=esm \
    --external:better-sqlite3 \
    --external:socks-proxy-agent \
    --loader:.ts=ts
# Debug (remove later)
RUN find /app -name better-sqlite3 || true

EXPOSE 3001

CMD ["node", "dist/server.js"]