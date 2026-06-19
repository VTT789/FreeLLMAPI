FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install root and workspace dependencies
RUN npm install

# Ensure server dependencies are installed explicitly
RUN cd server && npm install

COPY . .

# Build with esbuild (all external packages will be resolved at runtime)
RUN npx esbuild server/src/index.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --format=esm --external:better-sqlite3 --external:cors --external:express --external:helmet --external:undici --external:socks-proxy-agent --external:zod --loader:.ts=ts

EXPOSE 3001

CMD ["node", "dist/server.js"]