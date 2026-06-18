FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all package.json files first
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY shared/package*.json ./shared/ 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the shared package first (if it exists)
RUN if [ -d shared ]; then (cd shared && npm run build || true); fi

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
