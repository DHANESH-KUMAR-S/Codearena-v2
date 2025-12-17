# Render Deployment Guide for MERN + Docker

## Prerequisites

1. **GitHub Account**: Your code should be on GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
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

### 1.2 Verify Files
Make sure you have these files in your root directory:
- ✅ `Dockerfile`
- ✅ `render.yaml`
- ✅ `package.json`
- ✅ `server.js`

## Step 2: Deploy to Render

### 2.1 Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub account
5. Choose your repository

### 2.2 Configure Service
- **Name**: `codearena-app` (or your preferred name)
- **Environment**: `Docker`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root)
- **Dockerfile Path**: `./Dockerfile`

### 2.3 Set Environment Variables
In Render dashboard, go to your service → Environment:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codearena
JWT_SECRET=your-super-secret-jwt-key-change-this
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production
PORT=5000
```

### 2.4 Deploy
Click "Create Web Service" - Render will:
1. Detect the Dockerfile
2. Build your application
3. Deploy it
4. Provide a URL (like `https://your-app.onrender.com`)

## Step 3: Database Setup

### MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free account
3. Create new cluster (free tier)
4. Create database user
5. Get connection string
6. Add to Render environment variables

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/codearena?retryWrites=true&w=majority
```

## Step 4: Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" tab
3. Scroll to "Custom Domains"
4. Add your domain
5. Configure DNS records as instructed

## Step 5: Monitoring

### Check Logs
- Go to your service in Render dashboard
- Click "Logs" tab
- View real-time logs

### Monitor Usage
- Free tier: 750 hours/month
- Check usage in "Usage" tab
- Monitor in "Metrics" tab

## Troubleshooting

### Common Issues:

1. **Build Fails**
   ```bash
   # Check Dockerfile syntax
   # Verify all files are committed
   # Check Render build logs
   ```

2. **Environment Variables**
   - Ensure all variables are set in Render
   - Check for typos in variable names
   - Verify MongoDB URI is correct

3. **Docker Issues**
   - Ensure Dockerfile is in root directory
   - Check if Docker-in-Docker is needed
   - Verify Docker commands work locally

4. **Cold Start Issues**
   - Free tier sleeps after 15 minutes
   - First request may take 30-60 seconds
   - Consider upgrading to paid plan for always-on

### Debug Commands:
```bash
# Test locally first
docker build -t codearena .
docker run -p 5000:5000 codearena

# Check if all files are committed
git status
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Render Free Tier Limits

### What's Included:
- ✅ **750 hours/month** (31 days)
- ✅ **512MB RAM**
- ✅ **Shared CPU**
- ✅ **Custom domains**
- ✅ **SSL certificates**
- ✅ **Auto-deploy from GitHub**

### Limitations:
- ⚠️ **Sleeps after 15 minutes** (cold start)
- ⚠️ **750 hours/month** limit
- ⚠️ **Limited resources** for heavy usage

## Cost Optimization

### Tips to Stay Free:
1. **Optimize Docker image size**
2. **Use production builds only**
3. **Monitor usage in dashboard**
4. **Use efficient database queries**
5. **Implement proper caching**

### If You Need More:
- **Paid plans**: Start at $7/month
- **Always-on**: No cold starts
- **More resources**: 1GB RAM, dedicated CPU

## Success Checklist

- [ ] Repository connected to Render
- [ ] Environment variables set
- [ ] Database connected
- [ ] Application builds successfully
- [ ] Health check passes (`/health` endpoint)
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

## Alternative: Railway

If Render doesn't work for you:

1. **Railway**: $5 credit/month (usually free)
2. **Full Docker support**
3. **Built-in MongoDB**
4. **No cold starts**

## Quick Commands

```bash
# Commit and push to GitHub
git add .
git commit -m "Ready for Render deployment"
git push origin main

# Check deployment status
# Go to Render dashboard → your service → Logs
```

Your MERN + Docker app should now be live on Render! 🚀

**Your app URL will be**: `https://your-app-name.onrender.com` 