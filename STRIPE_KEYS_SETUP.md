# Stripe Keys Setup - Copy These to Your Files

## 🧪 For Local Development (USE NOW)

### Update `.env` file with TEST keys:

```bash
VITE_OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# Stripe Configuration (TEST MODE - for local development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE

# Backend API URL
VITE_API_URL=http://localhost:3001
```

### Update `server.env` file with TEST keys:

```bash
# Stripe Configuration (TEST MODE - for local development)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE

# Webhook secret (get this after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 For Production Deployment (USE LATER)

### `.env` file for production:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
VITE_API_URL=https://your-production-backend-url.com
```

### `server.env` file for production:

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
```

---

## ✅ Quick Action Steps

1. **Open `.env` file**
2. **Replace `VITE_STRIPE_PUBLISHABLE_KEY` line with:**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
   ```

3. **Open `server.env` file**
4. **Replace `STRIPE_SECRET_KEY` line with:**
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
   ```

5. **Save both files**

6. **Verify everything:**
   ```bash
   node verify-env.js
   ```

---

## 🔐 Key Summary

| Key Type | Test Key | Live Key | Use For |
|----------|----------|----------|---------|
| **Publishable** | `pk_test_...` | `pk_live_...` | Frontend (.env) |
| **Secret** | `sk_test_...` | `sk_live_...` | Backend (server.env) |

**Current Setup**: Use TEST keys for now (local development)

