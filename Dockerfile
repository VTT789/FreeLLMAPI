FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/
# Copy shared package.json if it exists
COPY shared/package*.json ./shared/ 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
