FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies
RUN npm install

# Build shared
RUN cd shared && npm run build || true

# Build server
RUN cd server && npm run build || true

# Expose the port
EXPOSE 3001

# Start the server directly
CMD ["node", "server/dist/index.js"]
