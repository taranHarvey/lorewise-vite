# 🚂 Railway Quick Start - Copy/Paste Guide

## Step 1: Sign Up & Create Project

1. Go to: https://railway.app
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with **GitHub** (recommended)
4. Click **"New Project"**
5. Select **"Deploy from GitHub repo"**
6. Choose your repository: `lorewise2.0` (or your repo name)
7. Click **"Deploy Now"**

---

## Step 2: Configure Settings

After Railway detects your project:

### A. Set Root Directory
1. Click on your **service** (repo name)
2. Click **"Settings"** tab
3. Find **"Root Directory"**
4. Set to: `lorewise-vite`
5. Click **"Save"**

### B. Set Start Command
1. Still in **Settings** tab
2. Find **"Start Command"**
3. Set to: `node server.js`
4. Click **"Save"**

---

## Step 3: Get Firebase Service Account Key

1. Go to: https://console.firebase.google.com/project/lorewise-89533/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Click **"Generate key"** in popup
4. **Copy the entire JSON** from the downloaded file

---

## Step 4: Add Environment Variables

In Railway, go to **Variables** tab and add these **one by one**:

### Variable 1: Firebase Service Account
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: Paste the **entire JSON** you copied
- Click **"Add"**

### Variable 2: Stripe Secret Key
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe **live** key (`sk_live_...`)
- Get it from: https://dashboard.stripe.com/apikeys
- Click **"Add"**

### Variable 3: Stripe Webhook Secret (Temporary)
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_placeholder` (we'll update after webhook setup)
- Click **"Add"**

### Variable 4: Frontend URL
- **Name**: `FRONTEND_URL`
- **Value**: `https://lorewise-89533.web.app`
- Click **"Add"**

### Variable 5: Node Environment
- **Name**: `NODE_ENV`
- **Value**: `production`
- Click **"Add"**

---

## Step 5: Deploy

Railway will **auto-deploy** when you add variables. Watch the **Logs** tab to see progress.

Wait for: ✅ **"Deploy successful"**

---

## Step 6: Get Your Backend URL

1. Go to **Settings** tab
2. Scroll to **"Domains"** section
3. Copy the URL (e.g., `https://your-app.up.railway.app`)

**This is your backend API URL!**

---

## Step 7: Test Backend

Visit: `https://your-railway-url.up.railway.app/api/health`

Should return: `{"status":"OK","timestamp":"..."}`

---

## Step 8: Update Frontend

Once backend is working:

1. Edit `.env` file:
   ```bash
   VITE_API_URL=https://your-railway-url.up.railway.app
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Redeploy:
   ```bash
   firebase deploy --only hosting
   ```

---

## Step 9: Set Up Stripe Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-railway-url.up.railway.app/api/webhook`
4. **Events**: Select:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **webhook secret** (`whsec_...`)
6. Update `STRIPE_WEBHOOK_SECRET` in Railway Variables

---

## ✅ Done!

Your backend is now live! 🎉

