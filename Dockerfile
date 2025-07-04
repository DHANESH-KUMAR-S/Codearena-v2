FROM node:14-alpine

WORKDIR /app

# Install Docker client
RUN apk add --no-cache docker-cli

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"] 