# Backend API Setup Guide

## 🚀 **Quick Setup**

### 1. **Install Dependencies**
```bash
# Install Stripe and Next.js
npm install stripe next

# Or copy the backend-package.json
cp backend-package.json package.json
npm install
```

### 2. **Environment Variables**
Create `.env.local` with:
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. **Deploy Backend**
Choose one of these options:

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### Option B: Netlify Functions
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Option C: Railway/Render
- Upload your code
- Set environment variables
- Deploy

## 🔧 **API Endpoints**

### **POST /api/create-checkout-session**
Creates a Stripe checkout session for subscription.

**Request:**
```json
{
  "priceId": "price_1SKp0iCg4QXnIurl31pTViJU",
  "userId": "user123",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_123..."
}
```

### **POST /api/cancel-subscription**
Cancels an active subscription.

**Request:**
```json
{
  "subscriptionId": "sub_123..."
}
```

**Response:**
```json
{
  "success": true,
  "subscription": { ... }
}
```

### **GET /api/subscriptions/[userId]**
Gets subscription status for a user.

**Response:**
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "id": "sub_123...",
    "status": "active",
    "currentPeriodStart": 1234567890,
    "currentPeriodEnd": 1234567890,
    "planId": "price_1SKp0iCg4QXnIurl31pTViJU",
    "planName": "Pro Plan"
  }
}
```

### **POST /api/webhook**
Handles Stripe webhook events.

## 🔗 **Webhook Setup**

### 1. **Create Webhook in Stripe Dashboard**
- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://your-domain.com/api/webhook`
- Select events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 2. **Get Webhook Secret**
- Copy the webhook signing secret
- Add to your environment variables as `STRIPE_WEBHOOK_SECRET`

## 🧪 **Testing**

### **Test Checkout Flow**
1. Go to `/pricing` page
2. Click "Subscribe" on Pro or Premium
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify redirect to success page

### **Test Webhooks**
1. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`
2. Trigger test events: `stripe trigger checkout.session.completed`

## 🔒 **Security Notes**

- ✅ **Publishable Key:** Safe for frontend (starts with `pk_live_`)
- ❌ **Secret Key:** Never expose in frontend (starts with `sk_live_`)
- ✅ **Webhook Secret:** Keep secure on backend
- ✅ **HTTPS:** Required for production webhooks

## 📝 **Next Steps**

1. **Deploy backend** to your chosen platform
2. **Update frontend** to use your backend URL
3. **Test checkout flow** with real cards
4. **Set up webhooks** for automatic updates
5. **Monitor payments** in Stripe Dashboard

## 🆘 **Troubleshooting**

### **Common Issues:**
- **CORS errors:** Add proper CORS headers
- **Webhook failures:** Check webhook secret and URL
- **Payment failures:** Verify price IDs and currency
- **Environment variables:** Ensure all keys are set correctly

### **Debug Tips:**
- Check Stripe Dashboard logs
- Use Stripe CLI for local testing
- Monitor browser console for errors
- Check server logs for API errors
