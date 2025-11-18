# 🚀 Deploy to Railway - Right Now!

I can't directly access Railway for you, but here's the fastest way to deploy:

## Option A: Railway Web Dashboard (Easiest - 5 minutes)

### 1. Go to Railway
Visit: https://railway.app and sign in

### 2. Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"** (if you have GitHub)
- OR select **"Empty Project"** then we'll add your code

### 3. If Using GitHub:
- Authorize Railway
- Select your repo
- Railway auto-detects and starts deploying

### 4. Configure Settings:
- **Root Directory**: `lorewise-vite`
- **Start Command**: `node server.js`

### 5. Add Environment Variables (see below)

---

## Option B: Railway CLI (Fast - 3 minutes)

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login
```bash
railway login
```

### 3. Initialize Project
```bash
cd lorewise-vite
railway init
```

### 4. Set Variables
```bash
# Add each variable one by one
railway variables set FIREBASE_SERVICE_ACCOUNT='<paste JSON here>'
railway variables set STRIPE_SECRET_KEY='sk_live_...'
railway variables set STRIPE_WEBHOOK_SECRET='whsec_placeholder'
railway variables set FRONTEND_URL='https://lorewise-89533.web.app'
railway variables set NODE_ENV='production'
```

### 5. Deploy
```bash
railway up
```

---

## Environment Variables You Need

Copy these values before starting:

### 1. Firebase Service Account
Get from: https://console.firebase.google.com/project/lorewise-89533/settings/serviceaccounts/adminsdk
- Click "Generate new private key"
- Copy entire JSON

### 2. Stripe Secret Key
Get from: https://dashboard.stripe.com/apikeys
- Copy your **live** secret key (`sk_live_...`)

### 3. Other Variables
- `STRIPE_WEBHOOK_SECRET`: `whsec_placeholder` (update later)
- `FRONTEND_URL`: `https://lorewise-89533.web.app`
- `NODE_ENV`: `production`

---

## Which Option Do You Prefer?

**Tell me:**
1. Do you have a GitHub repo set up?
2. Do you want to use Railway web dashboard or CLI?
3. Do you have your Stripe keys ready?

Then I can guide you through the specific steps!

