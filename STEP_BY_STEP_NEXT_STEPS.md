# Your Next Steps - Production Deployment Checklist

## 🔴 PHASE 1: CRITICAL SECURITY FIXES (15 minutes)

### Step 1: Revoke Exposed NPM Token (URGENT - Do This First)

**Why**: Your `.npmrc` file contains an exposed authentication token that anyone with access to your repo can use.

**Action**:
1. Open your browser and go to: https://registry.tiptap.dev/
2. Log into your tiptap.dev account
3. Find the token: `[YOUR_NPM_TOKEN]`
4. **Revoke it** immediately
5. Generate a new token
6. Save the new token for later use on your deployment server

✅ **Done?** Move to Step 2

---

### Step 2: Create Production Environment File

**File**: Create a new `.env` file in your project root

1. Copy the example:
```bash
cp .env.example .env
```

2. Open `.env` and fill in your actual values:

```bash
# Frontend Configuration
VITE_API_URL=http://localhost:3001  # For local testing, change to production URL later
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY  # Use test key for testing

# Backend Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY  # Use test key for testing
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**For Production**, change to:
- `VITE_API_URL=https://your-production-api-domain.com`
- `STRIPE_SECRET_KEY=sk_live_YOUR_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY`
- `FRONTEND_URL=https://your-frontend-domain.com`

✅ **Done?** Move to Step 3

---

## 🟡 PHASE 2: FIREBASE SECURITY (30 minutes)

### Step 3: Update Firestore Security Rules

**Current Problem**: Your rules allow ANY authenticated user to read/write ANY data. This is a security risk!

**Action**:
1. Open `firestore.rules`
2. Replace the entire content with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user owns the resource
    function isOwner() {
      return request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // User subscriptions - users can only access their own
    match /userSubscriptions/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // User usage tracking - users can only access their own
    match /userUsage/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // User documents - users can only access their own
    match /userDocuments/{documentId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
    }
    
    // User series - users can only access their own
    match /userSeries/{seriesId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
      
      // Allow access to documents within a series if user owns the series
      match /documents/{documentId} {
        allow read, write: if isAuthenticated() && 
          request.auth.uid == get(/databases/$(database)/documents/userSeries/$(seriesId)).data.userId;
      }
      
      // Lore documents within series
      match /lore/{loreId} {
        allow read, write: if isAuthenticated() && 
          request.auth.uid == get(/databases/$(database)/documents/userSeries/$(seriesId)).data.userId;
      }
    }
  }
}
```

3. Deploy the updated rules:
```bash
firebase deploy --only firestore:rules
```

✅ **Done?** Move to Step 4

---

### Step 4: Set Up Firebase Admin SDK

**Current**: You have `serviceAccountKey.json` in your `.gitignore` ✅

**Action**: Ensure this file exists on your production server

1. If you haven't already:
   - Go to Firebase Console
   - Project Settings → Service Accounts
   - Generate new private key
   - Save as `serviceAccountKey.json` in your project root
   - **NEVER commit this to git**

2. For production deployment:
   - Add this file to your server deployment
   - Keep it secure and never expose it publicly

✅ **Done?** Move to Step 5

---

## 🟢 PHASE 3: TESTING (45 minutes)

### Step 5: Test Production Build Locally

**Action**:
```bash
# Build the production version
npm run build

# Preview the build
npm run preview
```

**Check**:
- Visit http://localhost:4173
- Test user login/signup
- Try creating a series
- Test AI features
- Check browser console for errors
- Verify all API calls work

**Expected Result**: No console errors, all features work

✅ **Passed?** Move to Step 6

---

### Step 6: Test Stripe Integration

**Action**:
1. Start your backend server:
```bash
npm run server
```

2. In a new terminal, start your frontend:
```bash
npm run dev
```

3. Visit http://localhost:5173
4. Go to pricing page
5. Try to upgrade to Pro/Premium
6. Use Stripe test card: `4242 4242 4242 4242`
7. Verify subscription syncs correctly

**Expected Result**: Checkout works, subscription updates in Firebase

✅ **Passed?** Move to Step 7

---

## 🔵 PHASE 4: DEPLOYMENT PREPARATION (1 hour)

### Step 7: Choose Your Deployment Platform

**Frontend Options**:
- **Firebase Hosting** (recommended, easy integration)
- **Vercel** (simple, automatic)
- **Netlify** (good for static sites)
- **Cloudflare Pages** (fast CDN)

**Backend Options**:
- **Railway** (simple Node.js hosting)
- **Render** (free tier available)
- **Fly.io** (good performance)
- **Heroku** (if you have existing account)

**Recommendation**: Firebase Hosting (frontend) + Railway (backend)

---

### Step 8: Deploy Backend

**Using Railway**:

1. Push your code to GitHub (if not already)
2. Go to https://railway.app/
3. New Project → Deploy from GitHub
4. Select your repository
5. Add environment variables:
   - `STRIPE_SECRET_KEY=sk_live_xxx`
   - `STRIPE_WEBHOOK_SECRET=whsec_xxx`
   - `PORT=3001`
   - `FRONTEND_URL=https://your-frontend.com`
6. Upload `serviceAccountKey.json` (in Railway dashboard → Variables → File)
7. Deploy!

8. **Get your backend URL** (e.g., `https://your-app.up.railway.app`)

**Update your frontend `.env`**:
```bash
VITE_API_URL=https://your-app.up.railway.app
```

✅ **Backend deployed?** Move to Step 9

---

### Step 9: Configure Stripe Webhook

**Action**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend-url.com/api/webhook`
3. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
4. Copy the **Signing secret**
5. Update your backend `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxx`
6. Redeploy backend

✅ **Webhook configured?** Move to Step 10

---

### Step 10: Deploy Frontend

**Using Firebase Hosting**:

1. Install Firebase CLI (if not installed):
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize hosting:
```bash
firebase init hosting
```
- Select existing project
- Public directory: `dist`
- Configure as single-page app: Yes
- Don't overwrite index.html

4. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

5. **Get your Firebase hosting URL** (e.g., `https://your-project.web.app`)

✅ **Frontend deployed?** Move to Step 11

---

### Step 11: Final Configuration

**Update environment variables**:

**Backend** (Railway):
- `FRONTEND_URL=https://your-firebase-app.web.app`

**Frontend** (Firebase):
- Add to `.env` and rebuild:
```bash
VITE_API_URL=https://your-railway-app.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
```

**Rebuild and redeploy frontend**:
```bash
npm run build
firebase deploy --only hosting
```

✅ **Done?** Move to Step 12

---

## 🎉 PHASE 5: GOING LIVE

### Step 12: Final Testing in Production

**Action**:
1. Visit your production site
2. **Test every major feature**:
   - [ ] User registration
   - [ ] Login
   - [ ] Create series
   - [ ] Create documents
   - [ ] AI features
   - [ ] Upgrade subscription (use real card or Stripe test mode)
   - [ ] Subscription syncing
   - [ ] Auto-save
   - [ ] Export features

3. **Monitor**:
   - Stripe Dashboard for webhooks
   - Firebase Console for Firestore usage
   - Server logs on Railway

✅ **Everything works?** You're LIVE! 🎊

---

### Step 13: Set Up Monitoring (Recommended)

**Action**:
1. Set up Sentry for error tracking:
   - Sign up at sentry.io
   - Add to your project
   - Track errors in production

2. Monitor usage:
   - Firebase Console → Usage
   - Stripe Dashboard → Metrics

3. Set up alerts for critical issues

---

## 📝 Quick Reference Commands

```bash
# Build production
npm run build

# Test production build
npm run preview

# Start backend server
npm run server

# Start frontend dev server
npm run dev

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy frontend
firebase deploy --only hosting

# Deploy everything
npm run build && firebase deploy
```

---

## ⏱️ Timeline Estimate

- **Phase 1** (Critical Security): 15 minutes
- **Phase 2** (Firebase Security): 30 minutes
- **Phase 3** (Testing): 45 minutes
- **Phase 4** (Deployment Prep): 1-2 hours
- **Phase 5** (Going Live): 30 minutes

**Total**: ~3-4 hours to production

---

## 🆘 If You Run Into Issues

1. Check `PRODUCTION_READINESS_REPORT.md` for known issues
2. Verify all environment variables are set
3. Check browser console for errors
4. Check server logs on Railway
5. Check Stripe webhook delivery status
6. Check Firebase console for Firestore errors

---

## ✨ You're Ready!

Start with **Phase 1, Step 1** - Revoke that token NOW, then work through the rest systematically.

Good luck! 🚀

