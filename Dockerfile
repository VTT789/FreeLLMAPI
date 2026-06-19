FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

# Copy all source code
COPY . .

# Build the project with esbuild (mark zod as external)
RUN npx esbuild server/src/index.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --format=esm --external:better-sqlite3 --external:cors --external:express --external:helmet --external:undici --external:socks-proxy-agent --external:zod --loader:.ts=ts

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "dist/server.js"]