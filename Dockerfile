FROM node:16-alpine

WORKDIR /app

# Install Docker client and other dependencies
RUN apk add --no-cache docker-cli curl

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ .
RUN npm run build

# Back to main directory
WORKDIR /app

# Create tmp directory for code execution
RUN mkdir -p /app/tmp

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 