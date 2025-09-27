# 1. Use Node.js official Alpine image
FROM node:18-alpine

# 2. Set working directory inside the container
WORKDIR /usr/src/app

# 3. Install glibc (required by onnxruntime-node)
RUN apk add --no-cache libc6-compat curl \
    && curl -sSL https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r0/glibc-2.35-r0.apk -o glibc.apk \
    && apk add --no-cache --allow-untrusted glibc.apk \
    && rm glibc.apk


# Optional: install build tools in case we need to rebuild onnxruntime-node
RUN apk add --no-cache python3 make g++ bash

# 4. Copy package.json and package-lock.json first for caching
COPY package*.json ./

# 5. Install dependencies
RUN npm install

# 6. Copy the rest of your project files
COPY . .

# 7. Compile TypeScript
RUN npm run build

# 8. Expose the port (must match PORT in .env)
EXPOSE 5000

# 9. Start the app
CMD ["node", "/usr/src/app/dist/src/server.js"]
