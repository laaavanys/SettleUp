# Deployment Guide - SettleUp

This guide will help you deploy SettleUp to Render.com

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at https://render.com (free tier available)

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/settleup.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repo containing this project
5. Render will automatically detect `render.yaml` and deploy both services

### Option B: Manual Deployment

#### Deploy Backend (Node.js API)
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `settleup-backend`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `JWT_SECRET`: Generate a random string (e.g., use online generator)
   - `DB_PATH`: `/var/data/app.db`
6. Click **Create Web Service**

#### Deploy Frontend (React)
1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `settleup-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `https://settleup-backend.onrender.com/api` (replace with your backend URL)
5. Click **Create Static Site**

## Step 3: Environment Variables

Set up these environment variables in Render dashboard:

### Backend
- `NODE_ENV`: `production`
- `JWT_SECRET`: Generate a secure random string (32+ characters)
- `GOOGLE_API_KEY`: (Optional, for AI features)

### Frontend
- `VITE_API_URL`: URL of your deployed backend API

## Step 4: Update API Endpoint (if needed)

After deployment, update the frontend's API endpoint:

Edit `frontend/src/lib/api.js` to point to your backend URL:
```javascript
const baseURL = import.meta.env.VITE_API_URL || 'https://your-backend-url.onrender.com/api';
```

## Step 5: Testing

1. Open your frontend URL: `https://settleup-frontend.onrender.com`
2. Test registration and login
3. Create a group and add expenses
4. Check the backend health: `https://settleup-backend.onrender.com/api/health`

## Troubleshooting

### Database Issues
- Render provides persistent storage at `/var/data/`
- Database migrations run automatically on first startup

### CORS Issues
- Backend CORS is configured to accept requests
- Verify `VITE_API_URL` environment variable is set correctly

### Slow First Load
- Free tier services on Render spin down after 15 minutes of inactivity
- Upgrade to paid plan for faster, always-on services

## Production Checklist

- [ ] JWT_SECRET is set to a strong random value
- [ ] VITE_API_URL points to your backend domain
- [ ] Database persists correctly
- [ ] Registration and login work
- [ ] Email invites are functional (if implemented)
- [ ] AI features work (if you set GOOGLE_API_KEY)

## Need Help?

- Render Docs: https://render.com/docs
- GitHub Actions: For CI/CD pipeline setup
- Postman: For API testing

---

**Note**: The free tier on Render is suitable for testing/demo purposes. For production use with significant traffic, consider upgrading to a paid plan.
