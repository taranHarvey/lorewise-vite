# 🚨 Railway Environment Variables Setup - URGENT

Your Railway deployment is failing because environment variables are missing. Add these **NOW**:

## Step 1: Go to Railway Dashboard

1. Visit: https://railway.app/dashboard
2. Click on your **project** (lorewise-vite)
3. Click on your **service**
4. Click **"Variables"** tab

## Step 2: Add Required Variables

Add these variables **one by one**:

### ✅ Variable 1: Firebase Service Account

**Name**: `FIREBASE_SERVICE_ACCOUNT`

**Value**: Get this from Firebase Console:
1. Go to: https://console.firebase.google.com/project/lorewise-89533/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Click **"Generate key"** in popup
4. **Copy the ENTIRE JSON** (everything including `{` and `}`)
5. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT`

**Important**: The entire JSON must be on one line or properly formatted.

---

### ✅ Variable 2: Stripe Secret Key

**Name**: `STRIPE_SECRET_KEY`

**Value**: Your Stripe **live** secret key:
- Get from: https://dashboard.stripe.com/apikeys
- Copy the **Secret key** (starts with `sk_live_...`)
- Paste as value

**Your key**: `sk_live_YOUR_LIVE_SECRET_KEY_HERE` (add this to Railway)

---

### ✅ Variable 3: Stripe Webhook Secret (Temporary)

**Name**: `STRIPE_WEBHOOK_SECRET`

**Value**: `whsec_placeholder` (we'll update this after webhook setup)

---

### ✅ Variable 4: Frontend URL

**Name**: `FRONTEND_URL`

**Value**: `https://lorewise-89533.web.app`

---

### ✅ Variable 5: Node Environment

**Name**: `NODE_ENV`

**Value**: `production`

---

## Step 3: Verify Variables

After adding all variables, Railway will **auto-redeploy**. Check the **Logs** tab to see if it starts successfully.

You should see:
- ✅ `Firebase Admin initialized successfully`
- ✅ `Stripe API server running on port...`

---

## 🐛 Troubleshooting

### Still seeing "No Firebase credentials found"?

1. **Check variable name**: Must be exactly `FIREBASE_SERVICE_ACCOUNT` (case-sensitive)
2. **Check JSON format**: The entire JSON must be valid
3. **Try escaping**: If JSON has quotes, Railway might need escaping
4. **Check logs**: Railway → Logs tab shows exact error

### Still seeing "Neither apiKey nor config.authenticator provided"?

1. **Check variable name**: Must be exactly `STRIPE_SECRET_KEY` (case-sensitive)
2. **Check value**: Must start with `sk_live_` or `sk_test_`
3. **No spaces**: Make sure there are no spaces before/after the key
4. **Check logs**: Railway → Logs tab shows exact error

---

## 📝 Quick Checklist

- [ ] `FIREBASE_SERVICE_ACCOUNT` added (entire JSON)
- [ ] `STRIPE_SECRET_KEY` added (your live key)
- [ ] `STRIPE_WEBHOOK_SECRET` added (`whsec_placeholder`)
- [ ] `FRONTEND_URL` added (`https://lorewise-89533.web.app`)
- [ ] `NODE_ENV` added (`production`)
- [ ] Railway auto-redeployed
- [ ] Logs show success messages

---

## ✅ After Variables Are Set

Once Railway starts successfully:
1. Get your backend URL from Railway → Settings → Domains
2. Update frontend `.env` with Railway URL
3. Rebuild and redeploy frontend
4. Set up Stripe webhooks

---

**Need help?** Check Railway logs for specific error messages!

