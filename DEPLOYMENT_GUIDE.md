# Production Deployment Guide

This guide covers deploying Lorewise to production, including environment setup, backend deployment, frontend deployment, and Stripe webhook configuration.

## Table of Contents
1. [Environment Variables Setup](#environment-variables-setup)
2. [Backend Server Deployment](#backend-server-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Stripe Webhook Configuration](#stripe-webhook-configuration)
5. [Post-Deployment Testing](#post-deployment-testing)

---

## Environment Variables Setup

### Backend Environment Variables (`server.env`)

Create a `server.env` file on your backend server with the following variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...  # Your production Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your production webhook secret (get from Stripe dashboard)

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://lorewise.io  # Your production frontend URL
```

### Frontend Environment Variables (`.env`)

Create a `.env` file in your frontend build directory or set these in your hosting platform:

```bash
# API Configuration
VITE_API_URL=https://api.lorewise.io  # Your production backend URL

# Firebase Configuration (already in firebase.ts, but verify)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important**: 
- Never commit `.env` or `server.env` files to git
- Use your hosting platform's environment variable settings
- For Firebase Hosting, use the Firebase Console to set environment variables
- For Vercel/Netlify, use their dashboard settings

---

## Backend Server Deployment

### Option 1: Deploy to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Lorewise repository

3. **Configure Service**
   - Railway will auto-detect Node.js
   - Set the start command: `node server.js`
   - Set the root directory: `lorewise-vite`

4. **Set Environment Variables**
   - Go to Variables tab
   - Add all variables from `server.env`
   - Also add: `NODE_ENV=production`

5. **Deploy**
   - Railway will automatically deploy on push
   - Get your backend URL from the service settings

### Option 2: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   cd lorewise-vite
   heroku create lorewise-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set STRIPE_SECRET_KEY=sk_live_...
   heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
   heroku config:set FRONTEND_URL=https://lorewise.io
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3001
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Add Firebase Admin SDK**
   - Upload `serviceAccountKey.json` to Heroku
   - Or use Heroku Config Vars to store Firebase credentials

### Option 3: Deploy to DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Select the `lorewise-vite` directory

2. **Configure Build Settings**
   - Build Command: (leave empty, we're deploying server.js)
   - Run Command: `node server.js`
   - Environment: Node.js

3. **Set Environment Variables**
   - Add all variables from `server.env` in the App Settings

4. **Deploy**
   - DigitalOcean will auto-deploy on push

### Option 4: Deploy to VPS (Ubuntu/Debian)

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js and PM2**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Clone and Setup**
   ```bash
   git clone https://github.com/your-username/lorewise.git
   cd lorewise/lorewise-vite
   npm install --production
   ```

4. **Create `server.env` file**
   ```bash
   nano server.env
   # Add all environment variables
   ```

5. **Upload `serviceAccountKey.json`**
   ```bash
   # Use scp or upload via SFTP
   scp serviceAccountKey.json user@your-server-ip:/path/to/lorewise-vite/
   ```

6. **Start with PM2**
   ```bash
   pm2 start server.js --name lorewise-api
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

7. **Setup Nginx Reverse Proxy** (optional but recommended)
   ```nginx
   server {
       listen 80;
       server_name api.lorewise.io;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.lorewise.io
   ```

---

## Frontend Deployment

### Option 1: Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Hosting**
   ```bash
   cd lorewise-vite
   firebase init hosting
   # Select your Firebase project
   # Set public directory to: dist
   # Configure as single-page app: Yes
   # Don't overwrite index.html: No
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Set Environment Variables in Firebase**
   - Go to Firebase Console > Project Settings > Hosting
   - Add environment variables or use `.env` file (not recommended for production)
   - Better: Build with environment variables:
     ```bash
     VITE_API_URL=https://api.lorewise.io npm run build
     ```

5. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

6. **Custom Domain Setup**
   - In Firebase Console > Hosting > Add custom domain
   - Follow DNS configuration instructions
   - Firebase will provision SSL automatically

### Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   cd lorewise-vite
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add `VITE_API_URL` and other VITE_ variables

4. **Custom Domain**
   - In Vercel Dashboard > Settings > Domains
   - Add your custom domain
   - Configure DNS as instructed

### Option 3: Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. **Create `netlify.toml`**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Set Environment Variables**
   - In Netlify Dashboard > Site Settings > Environment Variables
   - Add all `VITE_` prefixed variables

---

## Stripe Webhook Configuration

### 1. Get Your Production Backend URL

After deploying your backend, note the webhook URL:
- Example: `https://api.lorewise.io/api/webhook`

### 2. Configure Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Navigate to: [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)

2. **Add Endpoint**
   - Click "Add endpoint"
   - Enter your webhook URL: `https://api.lorewise.io/api/webhook`
   - Select events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Get Webhook Secret**
   - After creating the endpoint, click on it
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add this to your backend environment variables as `STRIPE_WEBHOOK_SECRET`

4. **Test Webhook**
   - Use Stripe CLI to test:
     ```bash
     stripe listen --forward-to https://api.lorewise.io/api/webhook
     stripe trigger checkout.session.completed
     ```

### 3. Update Production Price IDs

In `server.js`, update the `getPlanIdFromPriceId` function with your **production** Stripe price IDs:

```javascript
const getPlanIdFromPriceId = (priceId) => {
  const priceIdMap = {
    'price_PROD_PRO_PRICE_ID': 'pro',      // Production Pro price
    'price_PROD_PREMIUM_PRICE_ID': 'premium', // Production Premium price
  };
  return priceIdMap[priceId] || 'free';
};
```

**Important**: Test price IDs (starting with `price_1SKV...`) will not work in production. You need to create production prices in Stripe Dashboard.

---

## Post-Deployment Testing

### 1. Health Check
```bash
curl https://api.lorewise.io/api/health
# Should return: {"status":"OK","timestamp":"..."}
```

### 2. Test Authentication
- [ ] Sign up with a new account
- [ ] Sign in with existing account
- [ ] Sign in with Google

### 3. Test Subscription Flow
- [ ] Navigate to pricing page
- [ ] Select a plan
- [ ] Complete checkout (use Stripe test card: `4242 4242 4242 4242`)
- [ ] Verify subscription appears in dashboard
- [ ] Verify limits are enforced correctly

### 4. Test Core Features
- [ ] Create a new series
- [ ] Create a new book/document
- [ ] Edit document content
- [ ] Use AI features (if within limits)
- [ ] Delete series/book
- [ ] Verify usage tracking

### 5. Test Error Handling
- [ ] Try to create more than your plan allows
- [ ] Verify error boundary works (intentionally break something)
- [ ] Check that rate limiting works (make many rapid requests)

### 6. Test Webhooks
- [ ] Complete a test subscription
- [ ] Check Firestore `userSubscriptions` collection
- [ ] Verify subscription status is correct
- [ ] Cancel a subscription
- [ ] Verify cancellation is reflected in Firestore

---

## Monitoring & Maintenance

### 1. Set Up Error Monitoring
- Consider integrating Sentry or similar service
- Monitor backend logs for errors
- Set up alerts for critical errors

### 2. Monitor Performance
- Track API response times
- Monitor database query performance
- Set up uptime monitoring (e.g., UptimeRobot)

### 3. Regular Backups
- Backup Firestore data regularly
- Keep backups of environment variables (securely)
- Document your deployment process

### 4. Security Checklist
- [ ] All environment variables are set correctly
- [ ] `.env` and `server.env` are in `.gitignore`
- [ ] Firebase security rules are production-ready
- [ ] CORS is restricted to production domain
- [ ] Rate limiting is enabled
- [ ] SSL certificates are valid
- [ ] Stripe webhooks are using production secrets

---

## Troubleshooting

### Backend Not Starting
- Check environment variables are set correctly
- Verify `serviceAccountKey.json` is present
- Check server logs for errors
- Ensure port is not already in use

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` is set correctly
- Check CORS configuration in backend
- Verify backend is running and accessible
- Check browser console for CORS errors

### Webhooks Not Working
- Verify webhook URL is correct
- Check webhook secret matches
- Test with Stripe CLI first
- Check backend logs for webhook errors
- Verify webhook events are selected in Stripe dashboard

### Subscription Issues
- Verify production price IDs are correct
- Check Firestore rules allow writes to `userSubscriptions`
- Verify Firebase Admin SDK is initialized
- Check backend logs for subscription errors

---

## Quick Reference

### Environment Variables Checklist

**Backend (`server.env`):**
- [ ] `STRIPE_SECRET_KEY` (production key)
- [ ] `STRIPE_WEBHOOK_SECRET` (production webhook secret)
- [ ] `FRONTEND_URL` (production frontend URL)
- [ ] `PORT` (usually 3001)
- [ ] `NODE_ENV=production`

**Frontend (`.env` or hosting platform):**
- [ ] `VITE_API_URL` (production backend URL)
- [ ] Firebase config variables (if not hardcoded)

### URLs to Update
- [ ] Backend API URL in frontend config
- [ ] Frontend URL in backend CORS config
- [ ] Webhook URL in Stripe dashboard
- [ ] Success/cancel URLs in checkout session creation

---

**Need Help?** Check the main `PRODUCTION_DEPLOYMENT_GUIDE.md` for more details on specific issues.
