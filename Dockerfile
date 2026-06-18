FROM node:20-alpine

# Install Python and build tools
RUN apk add --no-cache python3 make g++ && \
    ln -sf python3 /usr/bin/python

WORKDIR /app

# Copy all source code
COPY . .

# Set Python environment variable
ENV PYTHON=/usr/bin/python3

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
