FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

EXPOSE 3001

# Use node with --import to load tsx
CMD ["node", "--import", "tsx", "server/src/index.ts"]