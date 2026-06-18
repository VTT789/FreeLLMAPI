FROM node:20-alpine AS builder

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build shared package first
RUN cd shared && npm run build

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Install Python for better-sqlite3 runtime
RUN apk add --no-cache python3

WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Expose the port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
