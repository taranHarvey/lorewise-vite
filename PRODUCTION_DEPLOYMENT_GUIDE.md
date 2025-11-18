# Production Deployment Guide for Lorewise

## 🚨 BEFORE DEPLOYING - Complete These Steps

### Step 1: Fix Security Issues (CRITICAL)

1. **Revoke Exposed Token**
   - Go to https://registry.tiptap.dev/
   - Revoke token: `[YOUR_NPM_TOKEN]`
   - Generate new token
   - Update your deployment server with new token

2. **Update Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own data
       match /userSeries/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       match /userSubscriptions/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       match /userUsage/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

### Step 2: Set Up Environment Variables

1. **Create `.env` file** (copy from `.env.example`)
2. **Set these variables**:

```bash
# Frontend (Vite)
VITE_API_URL=https://your-production-api.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here

# Backend (server.js)
STRIPE_SECRET_KEY=sk_live_your_secret_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=3001
FRONTEND_URL=https://your-production-site.com
```

3. **Never commit `.env` to git** (already in `.gitignore`)

### Step 3: Update Hardcoded URLs

✅ **FIXED** - All hardcoded `localhost` URLs have been replaced with environment-based configuration.

Files updated:
- `src/contexts/StripeContext.tsx`
- `src/services/subscriptionService.ts`
- `src/pages/Dashboard.tsx`
- `src/components/DevTools/SubscriptionTester.tsx`

### Step 4: Build for Production

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# The build output will be in the `dist` directory
```

### Step 5: Deploy Backend Server

The backend server (`server.js`) needs to be deployed separately:

1. **Deploy to a service** (Heroku, Railway, Render, etc.)
2. **Set environment variables** on your hosting platform
3. **Ensure `serviceAccountKey.json` is uploaded** (keep it secure!)
4. **Update your frontend** with the production API URL

### Step 6: Deploy Frontend

1. **Deploy `dist` folder** to your hosting (Netlify, Vercel, Firebase Hosting, etc.)
2. **Set environment variables** in your hosting platform's dashboard
3. **Ensure all env vars are prefixed with `VITE_`** for Vite to pick them up

### Step 7: Configure Stripe Webhooks

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add webhook endpoint**: `https://your-api.com/api/webhook`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy webhook secret** and add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Step 8: Test Production Build Locally

```bash
# Build and preview
npm run build
npm run preview

# Test with production-like environment
# Visit http://localhost:4173
```

## 🧪 Testing Checklist

- [ ] User authentication works
- [ ] Can create series and documents
- [ ] Subscription checkout works
- [ ] Subscription status syncs correctly
- [ ] Webhooks are received and processed
- [ ] AI features work with API limits
- [ ] No console errors in browser
- [ ] All API calls use correct URLs
- [ ] Error handling works properly

## 📊 Monitoring Setup

**Recommended**:
- Set up error tracking (Sentry, LogRocket)
- Monitor API usage
- Set up Stripe webhook dashboard
- Use Firebase Analytics
- Set up uptime monitoring

## 🔐 Security Checklist

- [ ] Firestore rules updated and tested
- [ ] HTTPS enforced everywhere
- [ ] CORS configured properly
- [ ] API rate limiting added
- [ ] Input validation on all endpoints
- [ ] No hardcoded credentials
- [ ] .env files not in git
- [ ] Stripe webhook signature verified

## 📝 Post-Deployment

1. **Monitor logs** for errors
2. **Test critical user flows**
3. **Set up automated backups**
4. **Document known issues**
5. **Prepare support resources**

## 🆘 Troubleshooting

### Build Fails
```bash
npm install
npm run build
```

### API Calls Fail
- Check environment variables are set correctly
- Verify API server is running
- Check CORS configuration
- Look at browser console for errors

### Stripe Not Working
- Verify Stripe keys are correct (live mode for production)
- Check webhook endpoint is accessible
- Verify webhook secret matches
- Check Stripe dashboard for webhook delivery status

## 📚 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Stripe Production Checklist](https://stripe.com/docs/keys)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Remember**: Always test in a staging environment first before deploying to production!

