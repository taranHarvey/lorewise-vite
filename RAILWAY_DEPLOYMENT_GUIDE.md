# 🚂 Railway Backend Deployment Guide

This guide will walk you through deploying your Lorewise backend to Railway.

## Prerequisites

- ✅ GitHub account (with your code pushed)
- ✅ Railway account (free tier available)
- ✅ Stripe account (for payment processing)
- ✅ Firebase project (already set up)

---

## Step 1: Sign Up for Railway

1. **Go to**: https://railway.app
2. **Sign up** with GitHub (recommended) or email
3. **Verify your email** if needed

---

## Step 2: Create New Project

1. **Click** "New Project" button
2. **Select** "Deploy from GitHub repo"
3. **Authorize Railway** to access your GitHub (if first time)
4. **Select your repository**: `lorewise2.0` (or whatever your repo is named)
5. **Click** "Deploy Now"

---

## Step 3: Configure Project Settings

After Railway detects your project:

### 3.1 Set Root Directory

1. Click on your **service** (should be named after your repo)
2. Go to **Settings** tab
3. Scroll to **"Root Directory"**
4. Set to: `lorewise-vite`
5. Click **"Save"**

### 3.2 Set Start Command

1. Still in **Settings** tab
2. Scroll to **"Start Command"**
3. Set to: `node server.js`
4. Click **"Save"**

---

## Step 4: Add Environment Variables

This is critical! Railway needs all your backend secrets.

### 4.1 Go to Variables Tab

1. Click on your **service**
2. Click **"Variables"** tab
3. Click **"New Variable"** for each one below

### 4.2 Add These Variables

Add each variable one by one:

```bash
# Stripe Configuration (USE LIVE KEYS FOR PRODUCTION)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend URL (your Firebase Hosting URL)
FRONTEND_URL=https://lorewise-89533.web.app

# Firebase Admin SDK (we'll add this next)
```

**Important Notes:**
- Use **live Stripe keys** (`sk_live_...`) for production
- `STRIPE_WEBHOOK_SECRET` will be set up after deployment (see Step 7)
- `PORT` can be left as 3001, but Railway will auto-assign one if you don't set it

---

## Step 5: Add Firebase Admin SDK Credentials

Your backend needs Firebase Admin SDK to update Firestore.

### 5.1 Get Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com/project/lorewise-89533/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Click **"Generate key"** (downloads JSON file)
4. **Keep this file secure!** Never commit it to git.

### 5.2 Add to Railway

**Option A: Add as Environment Variable (Recommended)**

1. Open the downloaded `serviceAccountKey.json` file
2. Copy the **entire JSON content**
3. In Railway, add a new variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Paste the entire JSON content
   - Click **"Add"**

**Option B: Upload File (Alternative)**

Railway doesn't directly support file uploads, so Option A is better.

### 5.3 Update server.js to Use Environment Variable

We need to modify `server.js` to read Firebase credentials from the environment variable instead of a file. I'll help you with this next.

---

## Step 6: Deploy

1. Railway will **auto-deploy** when you push to GitHub
2. Or click **"Deploy"** button in Railway dashboard
3. Watch the **logs** to see deployment progress
4. Wait for **"Deploy successful"** message

---

## Step 7: Get Your Backend URL

After deployment:

1. Go to your **service** in Railway
2. Click **"Settings"** tab
3. Scroll to **"Domains"** section
4. Railway auto-generates a domain like: `https://your-app-name.up.railway.app`
5. **Copy this URL** - this is your backend API URL!

---

## Step 8: Update Frontend with Backend URL

Now update your frontend to use the Railway backend:

1. **Edit** `.env` file in your project:
   ```bash
   VITE_API_URL=https://your-app-name.up.railway.app
   ```

2. **Rebuild** frontend:
   ```bash
   npm run build
   ```

3. **Redeploy** to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

---

## Step 9: Set Up Stripe Webhook

Now that your backend is live, configure Stripe webhooks:

### 9.1 Go to Stripe Dashboard

1. Visit: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**

### 9.2 Configure Webhook

- **Endpoint URL**: `https://your-railway-url.up.railway.app/api/webhook`
- **Description**: "Lorewise Production Webhooks"
- **Events to send**: Select these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 9.3 Get Webhook Secret

1. After creating webhook, click on it
2. Find **"Signing secret"**
3. Copy the `whsec_...` value

### 9.4 Add to Railway

1. Go back to Railway → Variables
2. Update `STRIPE_WEBHOOK_SECRET` with the `whsec_...` value
3. Railway will **auto-redeploy** with new variable

---

## Step 10: Test Your Backend

### 10.1 Health Check

Visit: `https://your-railway-url.up.railway.app/api/health`

Should return: `{ "status": "ok" }`

### 10.2 Test Stripe Checkout

1. Go to your live site: https://lorewise-89533.web.app
2. Click "Upgrade" or go to Pricing page
3. Try a test checkout (use Stripe test card: `4242 4242 4242 4242`)
4. Check Railway logs to see webhook events

---

## Troubleshooting

### Backend Not Starting

- **Check logs**: Railway → Service → Logs tab
- **Verify start command**: Should be `node server.js`
- **Check root directory**: Should be `lorewise-vite`

### Environment Variables Not Working

- **Verify variable names**: Must match exactly (case-sensitive)
- **Check for typos**: Especially in Stripe keys
- **Redeploy**: Railway → Service → Deployments → Redeploy

### Firebase Admin Not Working

- **Verify FIREBASE_SERVICE_ACCOUNT**: Must be valid JSON
- **Check logs**: Look for Firebase initialization errors
- **Verify service account**: Make sure key is from correct Firebase project

### Webhooks Not Working

- **Verify webhook URL**: Must match Railway domain exactly
- **Check webhook secret**: Must match Stripe dashboard
- **Check logs**: Railway logs show incoming webhook requests
- **Test endpoint**: Use Stripe CLI or dashboard to send test events

### CORS Errors

- **Verify FRONTEND_URL**: Must match your Firebase Hosting URL exactly
- **Check server.js**: CORS should allow your frontend domain
- **No trailing slash**: `https://lorewise-89533.web.app` (not `/` at end)

---

## Cost Estimate

Railway free tier includes:
- **$5 credit/month** (enough for small apps)
- **500 hours** of runtime
- **1GB** storage

For Lorewise backend:
- **Estimated cost**: $0-5/month (likely free tier is enough)
- **If you exceed**: ~$0.01/hour after free tier

---

## Next Steps

After backend is deployed:

1. ✅ Update frontend `.env` with Railway URL
2. ✅ Rebuild and redeploy frontend
3. ✅ Set up Stripe webhooks
4. ✅ Test full payment flow
5. ✅ Switch to live Stripe keys (if not already)

---

## Quick Reference

**Railway Dashboard**: https://railway.app/dashboard
**Your Backend URL**: Check Railway → Service → Settings → Domains
**Stripe Dashboard**: https://dashboard.stripe.com/webhooks
**Firebase Console**: https://console.firebase.google.com/project/lorewise-89533

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check Railway logs for detailed error messages

