FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies
RUN npm install

# Expose the port
EXPOSE 3001

# Run with tsx
CMD ["npx", "tsx", "server/src/index.ts"]
