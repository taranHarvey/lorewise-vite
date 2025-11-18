# Environment Variables Setup Guide

## ✅ Current Status

Based on verification, here's what you have:

### Frontend (.env)
- ✅ `VITE_OPENAI_API_KEY` - Set ✓
- ❌ `VITE_STRIPE_PUBLISHABLE_KEY` - **MISSING** (added placeholder)
- ❌ `VITE_API_URL` - **MISSING** (added placeholder)

### Backend (server.env)
- ⚠️ `STRIPE_SECRET_KEY` - Has placeholder (needs real key)
- ⚠️ `STRIPE_WEBHOOK_SECRET` - Has placeholder (needs real key)
- ✅ `PORT` - Set to 3001
- ✅ `FRONTEND_URL` - Set

---

## 📝 How to Fill in Missing Values

### 1. Get Your Stripe Keys

Go to: **https://dashboard.stripe.com/apikeys**

You'll see two keys:

**Publishable key** (starts with `pk_test_` or `pk_live_`):
- Copy this → Add to `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`
- This is safe to expose in frontend code

**Secret key** (starts with `sk_test_` or `sk_live_`):
- Copy this → Add to `server.env` as `STRIPE_SECRET_KEY`
- **NEVER expose this** - backend only!

**For testing**: Use test keys (`pk_test_` and `sk_test_`)

**For production**: Use live keys (`pk_live_` and `sk_live_`)

---

### 2. Update Your `.env` File

Open `.env` and replace the placeholders:

```bash
# OpenAI (already set ✓)
VITE_OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# Stripe Publishable Key (REPLACE THIS!)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE

# Backend API URL (use localhost for local development)
VITE_API_URL=http://localhost:3001
```

---

### 3. Update Your `server.env` File

Open `server.env` and replace the placeholders:

```bash
# Stripe Configuration (REPLACE THESE!)
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
# Note: Webhook secret comes from setting up webhook endpoint (do this later)

# Server Configuration (already set ✓)
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

### 4. Verify Everything Works

Run the verification script:

```bash
node verify-env.js
```

You should see all green checkmarks ✅

---

## 🔐 Security Notes

1. **Never commit `.env` or `server.env`** - They're already in `.gitignore` ✓
2. **Test keys are safe** - Use `pk_test_` and `sk_test_` for development
3. **Live keys** - Only use `pk_live_` and `sk_live_` in production
4. **Webhook secret** - You'll get this after setting up the webhook endpoint (step 7 in deployment)

---

## 🧪 For Local Testing

Minimum working setup:

**`.env`**:
```bash
VITE_OPENAI_API_KEY=sk-proj-... (you have this)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (get from Stripe)
VITE_API_URL=http://localhost:3001
```

**`server.env`**:
```bash
STRIPE_SECRET_KEY=sk_test_... (get from Stripe)
PORT=3001
FRONTEND_URL=http://localhost:5173
# STRIPE_WEBHOOK_SECRET - can be added later
```

---

## 🚀 For Production

When deploying:

1. Change `VITE_API_URL` to your production backend URL:
   ```
   VITE_API_URL=https://your-backend-domain.com
   ```

2. Use production Stripe keys:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

3. Update `FRONTEND_URL` to your production frontend:
   ```
   FRONTEND_URL=https://your-frontend-domain.com
   ```

---

## ✅ Quick Checklist

- [ ] Get Stripe keys from dashboard
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` to `.env`
- [ ] Add `VITE_API_URL` to `.env` (use localhost for now)
- [ ] Update `STRIPE_SECRET_KEY` in `server.env`
- [ ] Run `node verify-env.js` to verify
- [ ] All variables show ✅ OK

Need help finding your Stripe keys? Let me know!

