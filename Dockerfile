FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "--import", "tsx", "server/src/index.ts"]