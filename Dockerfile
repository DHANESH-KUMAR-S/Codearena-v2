FROM node:16-alpine

# Create app directory and set permissions
WORKDIR /app

# Install Docker client and other dependencies
RUN apk add --no-cache docker-cli curl

# Copy package files for server
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React client
WORKDIR /app/client
COPY client/package*.json ./

# Install all dependencies (including dev dependencies) for client build
RUN npm ci

# Copy client source code
COPY client/ ./

# Fix permissions and run build with npx
RUN chmod +x node_modules/.bin/react-scripts
RUN npx react-scripts build

# Back to main directory
WORKDIR /app

# Create tmp directory for code execution
RUN mkdir -p /app/tmp

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 
