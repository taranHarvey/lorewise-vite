# 🚀 Backend Setup - Step by Step

Follow these steps to deploy your backend to Railway.

## ✅ Pre-Flight Checklist

Before starting, make sure you have:
- [ ] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] Stripe account (with live keys ready)
- [ ] Firebase project access

---

## Step 1: Install Backend Dependencies Locally (Optional)

First, let's make sure all backend dependencies are installed:

```bash
cd lorewise-vite
npm install express cors dotenv firebase-admin express-rate-limit stripe
```

This ensures your `package.json` has all the backend dependencies Railway needs.

---

## Step 2: Sign Up for Railway

1. **Visit**: https://railway.app
2. **Click** "Start a New Project"
3. **Sign up** with GitHub (recommended - easier integration)
4. **Authorize Railway** to access your GitHub account

---

## Step 3: Create New Project in Railway

1. **Click** "New Project" button
2. **Select** "Deploy from GitHub repo"
3. **Choose your repository**: `lorewise2.0` (or your repo name)
4. **Click** "Deploy Now"

Railway will start detecting your project automatically.

---

## Step 4: Configure Project Settings

After Railway detects your project:

### 4.1 Set Root Directory

1. Click on your **service** (should show your repo name)
2. Click **"Settings"** tab
3. Find **"Root Directory"** section
4. Set to: `lorewise-vite`
5. Click **"Save"**

### 4.2 Set Start Command

1. Still in **Settings** tab
2. Find **"Start Command"** section
3. Set to: `node server.js`
4. Click **"Save"**

**Note**: Railway might auto-detect this, but verify it's correct.

---

## Step 5: Get Firebase Service Account Key

Your backend needs Firebase Admin SDK credentials to update Firestore.

### 5.1 Download Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com/project/lorewise-89533/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"** button
3. Click **"Generate key"** in the popup
4. A JSON file will download - **keep this secure!**

### 5.2 Copy the JSON Content

1. Open the downloaded JSON file
2. **Copy the entire contents** (all of it, including `{` and `}`)
3. You'll paste this into Railway in the next step

---

## Step 6: Add Environment Variables to Railway

This is the most important step!

### 6.1 Go to Variables Tab

1. In Railway, click on your **service**
2. Click **"Variables"** tab
3. Click **"New Variable"** button

### 6.2 Add Each Variable

Add these variables **one by one**:

#### Variable 1: Firebase Service Account
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: Paste the **entire JSON** from the service account file
- **Click** "Add"

#### Variable 2: Stripe Secret Key
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe **live** secret key (`sk_live_...`)
- **Click** "Add"

**Get your Stripe keys**: https://dashboard.stripe.com/apikeys

#### Variable 3: Stripe Webhook Secret (Temporary)
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_placeholder` (we'll update this after deployment)
- **Click** "Add"

#### Variable 4: Frontend URL
- **Name**: `FRONTEND_URL`
- **Value**: `https://lorewise-89533.web.app`
- **Click** "Add"

#### Variable 5: Node Environment
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Click** "Add"

#### Variable 6: Port (Optional)
- **Name**: `PORT`
- **Value**: `3001` (or leave empty - Railway will auto-assign)
- **Click** "Add"

---

## Step 7: Deploy

Railway should auto-deploy when you add variables, but you can also:

1. Click **"Deployments"** tab
2. Click **"Redeploy"** button (if needed)
3. Watch the **logs** to see deployment progress
4. Wait for **"Deploy successful"** ✅

---

## Step 8: Get Your Backend URL

After successful deployment:

1. Go to **Settings** tab
2. Scroll to **"Domains"** section
3. Railway auto-generates a domain like: `https://your-app-name.up.railway.app`
4. **Copy this URL** - this is your backend API URL!

**Example**: `https://lorewise-backend-production.up.railway.app`

---

## Step 9: Test Your Backend

### 9.1 Health Check

Visit: `https://your-railway-url.up.railway.app/api/health`

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-01-27T..."
}
```

### 9.2 Check Logs

1. Go to Railway → Your Service → **"Logs"** tab
2. Look for:
   - ✅ `Firebase Admin initialized successfully`
   - ✅ `Stripe API server running on port...`
   - ✅ `Production mode: CORS restricted, rate limiting enabled`

If you see errors, check the troubleshooting section below.

---

## Step 10: Update Frontend with Backend URL

Now connect your frontend to the backend:

### 10.1 Update .env File

Edit `lorewise-vite/.env`:

```bash
# Update this line with your Railway backend URL
VITE_API_URL=https://your-railway-url.up.railway.app
```

### 10.2 Rebuild Frontend

```bash
cd lorewise-vite
npm run build
```

### 10.3 Redeploy Frontend

```bash
firebase deploy --only hosting
```

---

## Step 11: Set Up Stripe Webhooks

Now that your backend is live, configure Stripe to send webhooks:

### 11.1 Go to Stripe Dashboard

1. Visit: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"** button

### 11.2 Configure Webhook

- **Endpoint URL**: `https://your-railway-url.up.railway.app/api/webhook`
- **Description**: "Lorewise Production Webhooks"
- **Events to send**: Click "Select events" and choose:
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.created`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.payment_succeeded`
  - ✅ `invoice.payment_failed`

### 11.3 Get Webhook Secret

1. After creating webhook, click on it
2. Find **"Signing secret"** section
3. Click **"Reveal"** and copy the `whsec_...` value

### 11.4 Update Railway Variable

1. Go back to Railway → Variables
2. Find `STRIPE_WEBHOOK_SECRET`
3. Click **"Edit"**
4. Replace `whsec_placeholder` with the real `whsec_...` value
5. Click **"Save"**

Railway will **auto-redeploy** with the new webhook secret.

---

## Step 12: Test Full Flow

### 12.1 Test Checkout

1. Go to your live site: https://lorewise-89533.web.app
2. Click "Upgrade" or go to Pricing page
3. Select a plan and click "Subscribe"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout

### 12.2 Verify Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Check **"Recent events"** - you should see `checkout.session.completed`
4. Check Railway logs - should show webhook received

### 12.3 Verify Subscription

1. Go back to your Lorewise site
2. Check Settings page - should show your subscription status
3. Try creating a book - should respect subscription limits

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check logs** (Railway → Logs tab):
- ❌ `Error: Cannot find module 'express'` → Dependencies not installed
  - **Fix**: Make sure `package.json` has all dependencies (we added them)
- ❌ `Firebase Admin error` → Service account issue
  - **Fix**: Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON
- ❌ `Stripe error` → Invalid Stripe key
  - **Fix**: Check `STRIPE_SECRET_KEY` is correct

### Health Check Returns 404

- **Check**: Start command is `node server.js`
- **Check**: Root directory is `lorewise-vite`
- **Check**: `server.js` exists in root directory

### CORS Errors in Browser

- **Check**: `FRONTEND_URL` matches your Firebase Hosting URL exactly
- **Check**: No trailing slash: `https://lorewise-89533.web.app` (not `/`)

### Webhooks Not Working

- **Check**: Webhook URL matches Railway domain exactly
- **Check**: `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- **Check**: Railway logs show incoming webhook requests
- **Test**: Use Stripe Dashboard → Webhooks → Send test webhook

### Firebase Admin Not Working

- **Check**: `FIREBASE_SERVICE_ACCOUNT` contains full JSON (including outer `{}`)
- **Check**: Service account key is from correct Firebase project
- **Check**: Service account has Firestore permissions

---

## ✅ Success Checklist

After setup, verify:

- [ ] Backend health check works: `/api/health`
- [ ] Railway logs show "Firebase Admin initialized"
- [ ] Railway logs show "Stripe API server running"
- [ ] Frontend `.env` updated with Railway URL
- [ ] Frontend rebuilt and redeployed
- [ ] Stripe webhook configured
- [ ] Webhook secret added to Railway
- [ ] Test checkout completes successfully
- [ ] Subscription status updates in app

---

## 📝 Quick Reference

**Railway Dashboard**: https://railway.app/dashboard
**Your Backend URL**: Railway → Service → Settings → Domains
**Stripe Dashboard**: https://dashboard.stripe.com/webhooks
**Firebase Console**: https://console.firebase.google.com/project/lorewise-89533

---

## 🎉 You're Done!

Your backend is now live and connected to your frontend! 

**Next**: Test everything thoroughly, then switch to live Stripe keys if you haven't already.

