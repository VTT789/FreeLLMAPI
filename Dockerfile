FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

# Bundle all packages (including better-sqlite3)
RUN npx esbuild server/src/index.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --format=esm --loader:.ts=ts

EXPOSE 3001

CMD ["node", "dist/server.js"]