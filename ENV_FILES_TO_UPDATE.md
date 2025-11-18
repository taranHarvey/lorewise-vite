# ✅ Environment Files Update Checklist

## Files You Need to Manually Update

Since `.env` is protected, you need to update it manually. Here's exactly what to do:

---

## 📝 Step 1: Update `.env` File

**Open `.env` in your editor** and make sure it contains:

```bash
VITE_OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# Stripe Configuration (TEST MODE - for local development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SKVFYE6dLzzZxhruc8giD4JVewHNEI5KMJtiarXOP2kNoyV3u1RI5ZOOdzzQ8dyvMQlGBi5UvRQYYrcV4oTvDgB006mRDDh2v

# Backend API URL
VITE_API_URL=http://localhost:3001
```

**Replace the `VITE_STRIPE_PUBLISHABLE_KEY` line** if it still has a placeholder.

---

## ✅ Step 2: Verify `server.env` is Updated

I've already updated `server.env` with your test secret key! ✅

It should now contain:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
```

---

## ✅ Step 3: Verify Everything

After updating `.env`, run:

```bash
node verify-env.js
```

You should see all ✅ green checkmarks!

---

## 📋 Summary

**For Local Development (NOW):**
- ✅ `server.env` - Updated with test secret key
- ⏳ `.env` - You need to update with test publishable key: `pk_test_51SKVFYE6dLzzZxhruc8giD4JVewHNEI5KMJtiarXOP2kNoyV3u1RI5ZOOdzzQ8dyvMQlGBi5UvRQYYrcV4oTvDgB006mRDDh2v`

**For Production (LATER):**
- `.env` - Use live publishable key: `pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE`
- `server.env` - Use live secret key: `sk_live_YOUR_LIVE_SECRET_KEY_HERE`

---

## 🎯 Next Steps After Updating

Once `.env` is updated and verified:

1. ✅ Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. ✅ Test build: `npm run build && npm run preview`
3. ✅ Start backend: `npm run server`
4. ✅ Start frontend: `npm run dev`
5. ✅ Test Stripe checkout!

Let me know when you've updated `.env` and we can verify everything!

