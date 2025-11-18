# Firebase Deployment Guide for Lorewise

## 🚀 Quick Deploy Steps

### 1. Set Production Environment Variables

Before building, make sure your `.env` file has production values:

```bash
# Production API URL (your backend server)
VITE_API_URL=https://your-backend-domain.com

# Production Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
VITE_OPENAI_API_KEY=sk-proj-YOUR_KEY
```

### 2. Build for Production

```bash
cd lorewise-vite
npm run build
```

This creates the `dist` folder with optimized production files.

### 3. Deploy to Firebase Hosting

```bash
# Deploy frontend
firebase deploy --only hosting

# Or deploy everything (hosting + firestore rules)
firebase deploy
```

### 4. Your Site Will Be Live At

- **Production URL**: `https://lorewise-89533.web.app` or `https://lorewise-89533.firebaseapp.com`
- **Custom Domain**: You can add a custom domain in Firebase Console → Hosting → Add Custom Domain

---

## 📋 Pre-Deployment Checklist

- [ ] **Environment Variables**: Updated `.env` with production values
- [ ] **Stripe Keys**: Using live keys (`pk_live_` and `sk_live_`)
- [ ] **Backend Deployed**: Your `server.js` is deployed and accessible
- [ ] **Firestore Rules**: Already deployed (we did this earlier)
- [ ] **Build Tested**: Ran `npm run build` successfully
- [ ] **Preview Tested**: Ran `npm run preview` and tested locally

---

## 🔧 Backend Deployment (Required!)

Your backend server (`server.js`) needs to be deployed separately. Firebase Hosting only serves static files.

### Recommended: Railway (Easiest)

1. **Sign up**: https://railway.app
2. **Create new project**: "New Project" → "Deploy from GitHub repo"
3. **Select your repo**: Choose `lorewise2.0`
4. **Configure**:
   - **Root Directory**: `lorewise-vite`
   - **Start Command**: `node server.js`
   - **Environment Variables**: Add all from `server.env`:
     - `STRIPE_SECRET_KEY=sk_live_...`
     - `STRIPE_WEBHOOK_SECRET=whsec_...`
     - `PORT=3001` (or let Railway set it)
     - `FRONTEND_URL=https://lorewise-89533.web.app`
     - `NODE_ENV=production`
5. **Deploy**: Railway will auto-deploy
6. **Get URL**: Railway gives you a URL like `https://your-app.up.railway.app`
7. **Update Frontend**: Set `VITE_API_URL` in `.env` to Railway URL
8. **Rebuild & Redeploy**: `npm run build && firebase deploy --only hosting`

### Alternative: Render

1. **Sign up**: https://render.com
2. **New Web Service**: Connect GitHub repo
3. **Settings**:
   - **Build Command**: `npm install` (or leave empty)
   - **Start Command**: `node server.js`
   - **Environment Variables**: Add from `server.env`
4. **Deploy**: Render auto-deploys
5. **Get URL**: `https://your-app.onrender.com`

---

## 🔗 Stripe Webhook Setup (Critical!)

After deploying backend, set up Stripe webhooks:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Add Endpoint**: 
   - **URL**: `https://your-backend-url.com/api/webhook`
   - **Events**: Select all subscription events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
3. **Get Webhook Secret**: Copy the `whsec_...` secret
4. **Update Backend**: Add `STRIPE_WEBHOOK_SECRET` to your backend environment variables
5. **Redeploy Backend**: Restart your backend service

---

## 🧪 Post-Deployment Testing

After deployment, test:

1. **Frontend**: Visit your Firebase Hosting URL
   - [ ] Landing page loads
   - [ ] Can sign up/login
   - [ ] Dashboard loads
   - [ ] Can create series/books
   - [ ] AI features work

2. **Stripe Integration**:
   - [ ] Can click "Upgrade" button
   - [ ] Stripe checkout opens
   - [ ] Test payment succeeds
   - [ ] Subscription status updates in app

3. **Backend**:
   - [ ] Health check: `https://your-backend-url.com/api/health`
   - [ ] Webhook receives events (check Stripe Dashboard → Webhooks → Recent events)

---

## 🔄 Updating After Deployment

### Update Frontend

```bash
# 1. Make changes to code
# 2. Update .env if needed
# 3. Build
npm run build

# 4. Deploy
firebase deploy --only hosting
```

### Update Backend

- **Railway**: Push to GitHub, Railway auto-deploys
- **Render**: Push to GitHub, Render auto-deploys
- **Manual**: SSH into server, pull changes, restart

### Update Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## 🐛 Troubleshooting

### Frontend Not Loading

- Check Firebase Console → Hosting → Check deployment status
- Verify `dist` folder exists and has files
- Check browser console for errors

### Backend Not Responding

- Check Railway/Render logs
- Verify environment variables are set
- Test health endpoint: `curl https://your-backend-url.com/api/health`

### Stripe Not Working

- Verify you're using live keys (not test keys)
- Check Stripe Dashboard → Logs for errors
- Verify webhook endpoint is accessible
- Check webhook secret matches

### CORS Errors

- Verify `FRONTEND_URL` in backend matches your Firebase Hosting URL
- Check `server.js` CORS configuration

---

## 📝 Environment Variables Summary

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend-url.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_OPENAI_API_KEY=sk-proj-...
```

### Backend (Railway/Render Environment Variables)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://lorewise-89533.web.app
PORT=3001
NODE_ENV=production
```

---

## ✅ You're Ready!

Once backend is deployed and webhooks are configured, your app is live! 🎉

