
# ? Stage 1: install dependencies
FROM node:lts-alpine AS deps

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ? Stage 2: Run the app
FROM node:lts-alpine AS runner

WORKDIR /usr/src/app

# Copy node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy the source code
COPY . .

ENV NODE_ENV=production

# Set the user because running as root is a security risk
USER node

# Expose the port
EXPOSE 3000 

# Run the app
CMD ["node", "dist/main.js"]