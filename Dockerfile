FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app


# root package
COPY package*.json ./

# workspace packages
COPY server/package*.json ./server/
COPY client/package*.json ./client/


RUN npm install


WORKDIR /app/server
RUN npm install


WORKDIR /app/client
RUN npm install


WORKDIR /app

COPY . .


# expose native modules
RUN cp -R /app/server/node_modules/* /app/node_modules/ || true


# Build server
RUN npx esbuild server/src/index.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile=dist/server.cjs \
    --format=cjs \
    --external:better-sqlite3 \
    --external:socks-proxy-agent \
    --loader:.ts=ts


# check output
RUN ls -la dist


EXPOSE 3001


CMD ["node","dist/server.cjs"]