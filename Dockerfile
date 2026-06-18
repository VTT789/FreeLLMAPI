FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies
RUN npm install

# Build shared
RUN cd shared && npm run build

# Expose the port
EXPOSE 3001

# Run directly with tsx (no build needed)
CMD ["npx", "tsx", "server/src/index.ts"]
