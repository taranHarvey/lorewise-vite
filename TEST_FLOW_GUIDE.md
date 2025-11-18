# 🧪 Complete Test Flow Guide

## 🚀 **Step 1: Set Up Environment Variables**

### **Get Your Stripe Secret Key:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **"Developers"** → **"API Keys"**
3. Copy your **Secret Key** (starts with `sk_live_`)

### **Update server.env:**
```bash
# Replace with your actual secret key
STRIPE_SECRET_KEY=sk_live_51SKVFRCg4QXnIurl_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 🏃 **Step 2: Start the Servers**

### **Option A: Run Both Servers Together**
```bash
npm run dev:full
```

### **Option B: Run Servers Separately**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
npm run server
```

## 🔍 **Step 3: Verify Setup**

### **Check API Health:**
Open: http://localhost:3001/api/health
Should show: `{"status":"OK","timestamp":"..."}`

### **Check Frontend:**
Open: http://localhost:5173
Should load your Lorewise app

## 💳 **Step 4: Test Complete Payment Flow**

### **4.1: Go to Pricing Page**
1. Navigate to: http://localhost:5173/pricing
2. You should see Pro ($9.99) and Premium ($19.99) plans

### **4.2: Test Pro Plan Checkout**
1. Click **"Subscribe"** on Pro plan
2. You should be redirected to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
4. Fill in:
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVC:** Any 3 digits (e.g., 123)
   - **Name:** Any name
   - **Email:** Your email
5. Click **"Subscribe"**

### **4.3: Verify Success**
1. Should redirect to: http://localhost:5173/dashboard?success=true
2. Check Stripe Dashboard → **Customers** → Should see new customer
3. Check Stripe Dashboard → **Subscriptions** → Should see active subscription

### **4.4: Test Subscription Management**
1. Go to Settings page
2. Should see subscription details
3. Test cancel subscription (optional)

## 🔧 **Step 5: Test API Endpoints Directly**

### **Test Checkout Session Creation:**
```bash
curl -X POST http://localhost:3001/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1SKp0iCg4QXnIurl31pTViJU",
    "userId": "test-user-123",
    "userEmail": "test@example.com"
  }'
```

### **Test Subscription Status:**
```bash
curl http://localhost:3001/api/subscriptions/test-user-123
```

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **"Stripe not loaded" Error:**
- Check if Stripe publishable key is set in `.env.local`
- Verify the key starts with `pk_live_`

#### **"Failed to create checkout session" Error:**
- Check if backend server is running on port 3001
- Verify Stripe secret key is correct
- Check server logs for detailed errors

#### **CORS Errors:**
- Backend has CORS enabled for localhost:5173
- If testing from different port, update CORS settings

#### **Price ID Errors:**
- Verify price IDs are correct:
  - Pro: `price_1SKp0iCg4QXnIurl31pTViJU`
  - Premium: `price_1SKp29Cg4QXnIurl70Pwtjnr`

### **Debug Steps:**
1. **Check Server Logs:** Look at terminal running `npm run server`
2. **Check Browser Console:** Open DevTools → Console
3. **Check Network Tab:** See API requests/responses
4. **Check Stripe Dashboard:** Verify customers/subscriptions

## ✅ **Success Indicators**

### **Frontend Working:**
- ✅ Pricing page loads
- ✅ Subscribe buttons work
- ✅ Redirects to Stripe Checkout
- ✅ Success page shows after payment

### **Backend Working:**
- ✅ Health check returns OK
- ✅ Checkout session creation works
- ✅ Subscription status API works
- ✅ No CORS errors

### **Stripe Integration Working:**
- ✅ Test payments succeed
- ✅ Customers created in Stripe Dashboard
- ✅ Subscriptions active in Stripe Dashboard
- ✅ Webhook events received (if webhooks set up)

## 🎯 **Next Steps After Testing**

1. **Set up webhooks** for production
2. **Deploy backend** to Vercel/Railway
3. **Update frontend** to use production API URL
4. **Test with real cards** (small amounts)
5. **Monitor payments** in Stripe Dashboard

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Look at server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Test API endpoints individually with curl/Postman
