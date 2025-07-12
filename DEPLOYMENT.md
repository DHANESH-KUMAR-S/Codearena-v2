# Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup

Create a `.env` file in the root directory:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/codearena
# or for production: mongodb+srv://username:password@cluster.mongodb.net/codearena

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI Service API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=production

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### 2. Security Fixes Applied

✅ **API Keys**: Moved to environment variables
✅ **JWT Secret**: Configurable via environment
✅ **CORS**: Configurable for production domains

## Deployment Options

### Option 1: VPS/Cloud Server (Recommended)

**Requirements:**
- Ubuntu 20.04+ or CentOS 8+
- Docker installed
- Node.js 14+
- MongoDB (local or cloud)

**Steps:**
1. Clone your repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Install PM2: `npm install -g pm2`
5. Start the server: `pm2 start server.js`
6. Set up Nginx reverse proxy
7. Configure SSL with Let's Encrypt

### Option 2: Docker Deployment

**Using the existing docker-compose.yml:**

```bash
# Build and run
docker-compose up -d

# For production, modify docker-compose.yml:
# - Remove development volumes
# - Add environment variables
# - Configure proper networking
```

### Option 3: Cloud Platforms

#### Heroku
- ✅ Supports Node.js
- ✅ Has MongoDB add-ons
- ❌ Requires Docker-in-Docker for code execution
- ⚠️ Limited resources for code execution

#### Railway
- ✅ Good for Node.js apps
- ✅ Built-in MongoDB support
- ⚠️ Limited Docker support

#### DigitalOcean App Platform
- ✅ Supports Docker
- ✅ Managed databases
- ✅ Good for this type of app

#### AWS/GCP/Azure
- ✅ Full control
- ✅ Scalable
- ⚠️ More complex setup

## Production Considerations

### 1. Database
- Use MongoDB Atlas for managed database
- Set up proper authentication
- Configure network access

### 2. Code Execution Security
- Current Docker setup is good for security
- Consider additional sandboxing
- Monitor resource usage

### 3. Scaling
- Use Redis for session storage
- Consider load balancing for multiple instances
- Monitor WebSocket connections

### 4. Monitoring
- Set up logging (Winston/Morgan)
- Monitor API usage and costs
- Set up alerts for errors

## Cost Estimation

### Monthly Costs (Estimated):
- **VPS**: $5-20/month (DigitalOcean, Linode)
- **MongoDB Atlas**: $0-15/month (free tier available)
- **AI API Calls**: $0-50/month (depends on usage)
- **Domain**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)

**Total**: $5-85/month depending on scale

## Legal Considerations

### ✅ You Can Deploy Because:
- MIT License allows commercial use
- No proprietary dependencies
- Open source components
- Your own code

### ⚠️ Considerations:
- AI API usage costs
- User data privacy
- Terms of service for AI providers
- GDPR compliance if serving EU users

## Quick Start Commands

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your values

# Build client
cd client && npm run build && cd ..

# Start production server
NODE_ENV=production npm start

# Or with PM2
pm2 start server.js --name codearena
```

## Troubleshooting

### Common Issues:
1. **Docker not running**: Install Docker Desktop
2. **Port conflicts**: Change PORT in .env
3. **MongoDB connection**: Check MONGODB_URI
4. **AI API errors**: Verify API keys
5. **CORS issues**: Update CLIENT_URL

### Logs:
```bash
# View logs
pm2 logs codearena

# Restart app
pm2 restart codearena
``` 