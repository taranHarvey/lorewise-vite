# Manual .env Update Instructions

## ✅ Your Stripe Publishable Key (LIVE)

You provided:
```
pk_live_51SKVFRCg4QXnIurl9mRzVzk1SCSm7JsATcsQ10q13ub8nYCLjfd2XaA6Uh2Ac4RdKIJo586JuItrDHnGZdvTX8Ap002gwxrKO7
```

## 📝 Steps to Update

1. **Open your `.env` file** in your editor

2. **Find this line:**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```

3. **Replace it with:**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SKVFRCg4QXnIurl9mRzVzk1SCSm7JsATcsQ10q13ub8nYCLjfd2XaA6Uh2Ac4RdKIJo586JuItrDHnGZdvTX8Ap002gwxrKO7
   ```

4. **Save the file**

5. **Verify it worked:**
   ```bash
   node verify-env.js
   ```

## ⚠️ Important Note About LIVE vs TEST Keys

You're using a **LIVE** Stripe key (`pk_live_...`), which means:

✅ **Good for**: Production deployment  
⚠️ **Be careful**: This will process real payments

### For Local Testing (Recommended)

Consider using **TEST** keys instead:
- Test keys start with `pk_test_...`
- Test keys don't charge real money
- You can find test keys in Stripe Dashboard → Developers → API Keys → **Test mode**

**To switch to test mode:**
1. In Stripe Dashboard, toggle to "Test mode" (top right)
2. Copy the test publishable key
3. Use that in your `.env` for local development
4. Switch to live key only when deploying to production

### Current Recommendation

**For now (local testing)**: Use test key  
**For production**: Use live key (which you have)

---

## What's Next?

After updating `.env`:

1. ✅ Verify: `node verify-env.js`
2. ✅ Deploy Firestore rules: `firebase deploy --only firestore:rules`
3. ✅ Test build: `npm run build && npm run preview`

Let me know when you've updated it and we can verify!

