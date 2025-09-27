# 1. Use Debian-based Node.js image (has glibc)
FROM node:18-bullseye-slim

# 2. Set working directory
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of your project files
COPY . .

# 6. Compile TypeScript
RUN npm run build

# 7. Expose port
EXPOSE 5000

# 8. Start the app
CMD ["node", "dist/src/server.js"]
