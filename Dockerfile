FROM node:20-alpine

WORKDIR /app

# Copy all source code
COPY . .

# Install all dependencies (workspaces will be handled by npm)
RUN npm install

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
