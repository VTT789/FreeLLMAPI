FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

WORKDIR /app/server
RUN npm install

WORKDIR /app/client
RUN npm install

WORKDIR /app

COPY . .


# Build client only if tsconfig exists
RUN if [ -f client/tsconfig.json ]; then \
      cd client && npm run build ; \
    else \
      echo "No client tsconfig.json - skipping frontend build"; \
    fi


# Build backend
RUN npx esbuild server/src/index.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile=dist/server.cjs \
    --format=cjs \
    --external:better-sqlite3 \
    --external:socks-proxy-agent \
    --loader:.ts=ts


# Create client fallback folder
RUN mkdir -p /app/client/dist


EXPOSE 3001


CMD ["node","dist/server.cjs"]