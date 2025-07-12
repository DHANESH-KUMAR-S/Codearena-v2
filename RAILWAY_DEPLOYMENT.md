# Railway Deployment Guide for MERN + Docker

## Prerequisites

1. **GitHub Account**: Your code should be on GitHub
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **MongoDB Atlas**: Free tier account for database

## Step 1: Prepare Your Repository

### 1.1 Environment Variables
Create a `.env.example` file:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codearena
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=production
PORT=5000
```

### 1.2 Update package.json
Make sure your root `package.json` has:
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "cd client && npm install && npm run build"
  }
}
```

## Step 2: Deploy to Railway

### 2.1 Connect GitHub Repository
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2.2 Configure Environment Variables
In Railway dashboard, go to your project → Variables tab:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codearena
JWT_SECRET=your-super-secret-jwt-key-change-this
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production
PORT=5000
```

### 2.3 Deploy
Railway will automatically:
1. Detect the Dockerfile
2. Build your application
3. Deploy it
4. Provide a URL

## Step 3: Database Setup

### Option A: Railway MongoDB (Recommended)
1. In Railway dashboard, click "New"
2. Select "Database" → "MongoDB"
3. Copy the connection string
4. Update `MONGODB_URI` in your variables

### Option B: MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string
4. Add to Railway variables

## Step 4: Custom Domain (Optional)

1. In Railway dashboard, go to Settings
2. Click "Custom Domains"
3. Add your domain
4. Configure DNS records

## Step 5: Monitoring

### Check Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Monitor Usage
- Railway dashboard shows usage
- Free tier: $5 credit/month
- Monitor in "Usage" tab

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Dockerfile syntax
   - Verify all files are committed
   - Check Railway logs

2. **Environment Variables**
   - Ensure all variables are set in Railway
   - Check for typos in variable names

3. **Database Connection**
   - Verify MongoDB URI is correct
   - Check network access in MongoDB Atlas

4. **Docker Issues**
   - Ensure Dockerfile is in root directory
   - Check if Docker-in-Docker is needed

### Debug Commands:
```bash
# View build logs
railway logs --build

# Restart deployment
railway service restart

# Check service status
railway service status
```

## Cost Optimization

### Free Tier Limits:
- **$5 credit/month** (usually sufficient)
- **512MB RAM** per service
- **Shared CPU**

### Tips to Stay Free:
1. **Optimize Docker image size**
2. **Use production builds only**
3. **Monitor usage in dashboard**
4. **Use efficient database queries**

## Alternative: Render (Completely Free)

If Railway free tier isn't enough:

1. **Sign up at [render.com](https://render.com)**
2. **Connect GitHub repository**
3. **Select "Web Service"**
4. **Use Dockerfile**
5. **Set environment variables**
6. **Deploy**

**Render Advantages:**
- ✅ Completely free (750 hours/month)
- ✅ Full Docker support
- ✅ Auto-deploy from GitHub
- ✅ Custom domains

**Render Limitations:**
- ⚠️ Sleeps after 15 minutes (cold start)
- ⚠️ 750 hours/month limit

## Success Checklist

- [ ] Repository connected to Railway
- [ ] Environment variables set
- [ ] Database connected
- [ ] Application builds successfully
- [ ] Health check passes
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

Your MERN + Docker app should now be live! 🚀 