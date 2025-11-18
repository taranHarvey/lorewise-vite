# 🔗 Stripe Webhook Setup Guide

After your Railway backend is deployed, set up Stripe webhooks to sync subscription changes.

## Step 1: Get Your Railway Backend URL

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Click on your **service**
3. Go to **Settings** tab
4. Scroll to **"Domains"** section
5. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

**Your webhook endpoint will be**: `https://your-railway-url.up.railway.app/api/webhook`

---

## Step 2: Create Webhook Endpoint in Stripe

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click** "Add endpoint" button
3. **Fill in the form**:
   - **Endpoint URL**: `https://your-railway-url.up.railway.app/api/webhook`
     - Replace `your-railway-url.up.railway.app` with your actual Railway domain
   - **Description**: "Lorewise Production Webhooks"
   - **Events to send**: Click "Select events" and choose:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
4. **Click** "Add endpoint"

---

## Step 3: Get Webhook Signing Secret

After creating the webhook:

1. **Click on your webhook** in the list
2. **Find** "Signing secret" section
3. **Click** "Reveal" button
4. **Copy** the secret (starts with `whsec_...`)

**Example**: `whsec_1234567890abcdefghijklmnopqrstuvwxyz`

---

## Step 4: Add Webhook Secret to Railway

1. **Go back to Railway Dashboard**
2. **Click** on your service
3. **Click** "Variables" tab
4. **Find** `STRIPE_WEBHOOK_SECRET` variable
5. **Click** "Edit" (or create it if it doesn't exist)
6. **Replace** `whsec_placeholder` with the real `whsec_...` value you copied
7. **Click** "Save"

Railway will **auto-redeploy** with the new webhook secret.

---

## Step 5: Test Your Webhook

### Option A: Test via Stripe Dashboard

1. **Go to Stripe Dashboard** → Webhooks
2. **Click** on your webhook endpoint
3. **Click** "Send test webhook" button
4. **Select** `checkout.session.completed` event
5. **Click** "Send test webhook"
6. **Check Railway logs** to see if webhook was received

### Option B: Test via Real Checkout

1. **Go to your live site**: https://lorewise-89533.web.app
2. **Click** "Upgrade" or go to Pricing page
3. **Complete a test checkout** (use Stripe test card: `4242 4242 4242 4242`)
4. **Check Stripe Dashboard** → Webhooks → Your endpoint → "Recent events"
5. **Verify** you see `checkout.session.completed` event
6. **Check Railway logs** to see webhook processing

---

## Step 6: Verify Webhook Processing

### Check Railway Logs

1. **Go to Railway** → Your Service → **Logs** tab
2. **Look for**:
   - ✅ `Webhook received: checkout.session.completed`
   - ✅ `Updated subscription for user...`
   - ✅ No error messages

### Check Stripe Dashboard

1. **Go to Stripe Dashboard** → Webhooks
2. **Click** on your webhook endpoint
3. **Check** "Recent events" section
4. **Verify**:
   - ✅ Events show "Succeeded" status
   - ✅ No "Failed" events
   - ✅ Response time is reasonable (< 1 second)

### Check Your App

1. **Go to your site**: https://lorewise-89533.web.app
2. **Complete a test checkout**
3. **Go to Settings page**
4. **Verify** subscription status updated correctly

---

## 🐛 Troubleshooting

### Webhook Not Received

**Symptoms**: No events in Railway logs

**Solutions**:
1. **Check webhook URL**: Must match Railway domain exactly
2. **Check Railway is running**: Visit `https://your-railway-url/api/health`
3. **Check webhook secret**: Must match Stripe dashboard exactly
4. **Check Railway logs**: Look for errors

### Webhook Received But Failed

**Symptoms**: Events show "Failed" in Stripe Dashboard

**Solutions**:
1. **Check Railway logs**: Look for error messages
2. **Check webhook secret**: Must be correct
3. **Check Firebase credentials**: `FIREBASE_SERVICE_ACCOUNT` must be valid JSON
4. **Check Stripe secret key**: `STRIPE_SECRET_KEY` must be correct

### Subscription Not Updating

**Symptoms**: Webhook succeeds but subscription doesn't update in app

**Solutions**:
1. **Check Firestore**: Verify subscription document was created/updated
2. **Check user ID**: Make sure user ID matches between Stripe and Firestore
3. **Check frontend**: Refresh page, check if subscription service is fetching correctly

---

## ✅ Success Checklist

After setup, verify:

- [ ] Webhook endpoint created in Stripe
- [ ] Webhook secret added to Railway variables
- [ ] Railway redeployed successfully
- [ ] Test webhook sent and received
- [ ] Railway logs show webhook processing
- [ ] Stripe Dashboard shows "Succeeded" events
- [ ] Test checkout completes successfully
- [ ] Subscription status updates in app

---

## 📝 Quick Reference

**Stripe Dashboard**: https://dashboard.stripe.com/webhooks
**Railway Dashboard**: https://railway.app/dashboard
**Your Backend URL**: Railway → Service → Settings → Domains
**Webhook Endpoint**: `https://your-railway-url.up.railway.app/api/webhook`

---

## 🎉 You're Done!

Once webhooks are working:
- ✅ Subscriptions will sync automatically
- ✅ Users' plan status will update in real-time
- ✅ Cancellations will be processed automatically
- ✅ Payment failures will be handled

Your backend is now fully connected! 🚀

