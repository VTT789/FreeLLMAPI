FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies
RUN npm install

# Build shared package if it exists
RUN if [ -d shared ]; then (cd shared && npm run build || true); fi

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
