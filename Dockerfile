FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

# Load keys using the TypeScript script
RUN npx tsx server/src/scripts/loadKeys.ts

EXPOSE 3001

CMD ["node", "--import", "tsx", "server/src/index.ts"]