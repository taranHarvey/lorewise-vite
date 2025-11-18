# ✅ Railway Environment Variables Checklist

Use this checklist to verify all variables are set correctly in Railway.

## Required Variables

Copy these exact variable names and values:

### 1. Firebase Service Account ✅
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: [You've already added this - entire JSON from Firebase Console]
- **Status**: ✅ Added

### 2. Stripe Secret Key ✅
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_live_YOUR_LIVE_SECRET_KEY_HERE` (see note below)
- **Status**: ⏳ Add this now

### 3. Stripe Webhook Secret ⏳
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_placeholder` (update after webhook setup)
- **Status**: ⏳ Add placeholder now, update after webhook setup

### 4. Frontend URL ✅
- **Name**: `FRONTEND_URL`
- **Value**: `https://lorewise-89533.web.app`
- **Status**: ⏳ Add this

### 5. Node Environment ✅
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Status**: ⏳ Add this

---

## Quick Copy-Paste for Railway

Go to Railway → Variables → Add each:

```
FIREBASE_SERVICE_ACCOUNT = [Your Firebase JSON - already added ✅]
STRIPE_SECRET_KEY = sk_live_YOUR_LIVE_SECRET_KEY_HERE (use your actual key)
STRIPE_WEBHOOK_SECRET = whsec_placeholder
FRONTEND_URL = https://lorewise-89533.web.app
NODE_ENV = production
```

---

## After Adding Variables

1. ✅ Railway will auto-redeploy
2. ✅ Check Logs tab for success messages
3. ✅ Get your backend URL from Settings → Domains
4. ✅ Update frontend `.env` with Railway URL
5. ✅ Set up Stripe webhook (see STRIPE_WEBHOOK_SETUP.md)

---

## Next: Webhook Setup

Once Railway is running, follow: `STRIPE_WEBHOOK_SETUP.md`

