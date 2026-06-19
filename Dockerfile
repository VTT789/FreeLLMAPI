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

RUN cp -R /app/server/node_modules/* /app/node_modules/ || true

RUN npx esbuild server/src/index.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile=dist/server.js \
    --format=esm \
    --external:better-sqlite3 \
    --external:socks-proxy-agent \
    --loader:.ts=ts

EXPOSE 3001

CMD ["node", "dist/server.js"]