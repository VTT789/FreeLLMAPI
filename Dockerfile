FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

EXPOSE 3001

# Run the script on container start, then start the server
CMD ["sh", "-c", "npx tsx server/src/scripts/loadKeys.ts && node --import tsx server/src/index.ts"]