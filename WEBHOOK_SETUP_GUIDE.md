# 🔗 Complete Stripe Webhook Setup Guide

## Overview
This guide will help you set up Stripe webhooks to test the complete purchase flow, including subscription creation, updates, and cancellations.

## 🚀 Method 1: Local Testing with Stripe CLI (Recommended)

### Step 1: Install and Login to Stripe CLI
```bash
# Install Stripe CLI (already done)
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login
```

### Step 2: Start Webhook Forwarding
```bash
# Forward webhooks to your local server
stripe listen --forward-to localhost:3001/api/webhook
```

This will:
- ✅ Create a webhook endpoint in your Stripe Dashboard
- ✅ Forward all events to your local server
- ✅ Provide a webhook signing secret
- ✅ Show real-time webhook events in your terminal

### Step 3: Update Environment Variables
Copy the webhook signing secret from the CLI output and add it to your `server.env`:

```bash
# Add to server.env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_cli
```

### Step 4: Test the Complete Flow
1. **Start your servers:**
   ```bash
   npm run dev:full
   ```

2. **In another terminal, start webhook forwarding:**
   ```bash
   stripe listen --forward-to localhost:3001/api/webhook
   ```

3. **Test a purchase:**
   - Go to `http://localhost:5174/pricing`
   - Click "Upgrade" on Pro plan
   - Use test card: `4242 4242 4242 4242`
   - Complete the payment

4. **Watch webhook events in real-time:**
   You'll see events like:
   ```
   🔔 Received webhook event: checkout.session.completed
   ✅ Checkout session completed: cs_test_...
   🔔 Received webhook event: customer.subscription.created
   ✅ Subscription created: sub_test_...
   🔔 Received webhook event: invoice.payment_succeeded
   💰 Payment succeeded: in_test_...
   ```

## 🌐 Method 2: Stripe Dashboard Setup

### Step 1: Create Webhook Endpoint
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `http://localhost:3001/api/webhook` (for local testing)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Step 2: Get Webhook Secret
1. Click on your webhook endpoint
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add it to your `server.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Step 3: Test Webhook Delivery
1. In the webhook endpoint page, click "Send test webhook"
2. Select "checkout.session.completed"
3. Click "Send test webhook"
4. Check your server logs for the webhook event

## 🧪 Testing Scenarios

### 1. Complete Purchase Flow
**What to test:**
- User clicks "Upgrade" → Checkout session created
- User completes payment → Subscription created
- User gets upgraded features → Status updated

**Expected webhook events:**
```
checkout.session.completed
customer.subscription.created
invoice.payment_succeeded
```

### 2. Subscription Cancellation
**What to test:**
- User cancels subscription in Settings
- User retains access until period end
- User reverts to Free plan after period end

**Expected webhook events:**
```
customer.subscription.updated (cancel_at_period_end: true)
customer.subscription.deleted (at period end)
```

### 3. Payment Failures
**What to test:**
- Use declined test card: `4000 0000 0000 0002`
- Handle failed payment gracefully
- Notify user of payment issues

**Expected webhook events:**
```
invoice.payment_failed
customer.subscription.updated (status: past_due)
```

### 4. Plan Changes
**What to test:**
- User upgrades from Pro to Premium
- User downgrades from Premium to Pro
- Handle proration correctly

**Expected webhook events:**
```
customer.subscription.updated
invoice.payment_succeeded (for proration)
```

## 🔍 Webhook Event Details

### checkout.session.completed
```javascript
{
  id: "cs_test_...",
  customer: "cus_test_...",
  subscription: "sub_test_...",
  metadata: {
    firebaseUserId: "user123",
    planId: "pro"
  }
}
```

### customer.subscription.created
```javascript
{
  id: "sub_test_...",
  customer: "cus_test_...",
  status: "active",
  items: {
    data: [{
      price: {
        id: "price_1SKVntE6dLzzZxhrCi97lMAl"
      }
    }]
  }
}
```

### customer.subscription.updated
```javascript
{
  id: "sub_test_...",
  status: "active" | "canceled" | "past_due",
  cancel_at_period_end: true | false,
  current_period_end: 1640995200
}
```

## 🛠️ Integration with Your App

### Update User Subscription Status
Add this to your webhook handler:

```javascript
// In api/webhook.js
case 'checkout.session.completed':
  const session = event.data.object;
  
  // Update user subscription in Firestore
  await updateUserSubscription(session.metadata.firebaseUserId, {
    planId: session.metadata.planId,
    status: 'active',
    stripeSubscriptionId: session.subscription,
    currentPeriodStart: new Date(session.subscription_details.current_period_start * 1000),
    currentPeriodEnd: new Date(session.subscription_details.current_period_end * 1000)
  });
  break;
```

### Handle Subscription Cancellation
```javascript
case 'customer.subscription.deleted':
  const deletedSubscription = event.data.object;
  
  // Update user to free plan
  await updateUserSubscription(deletedSubscription.metadata.firebaseUserId, {
    planId: 'free',
    status: 'canceled',
    stripeSubscriptionId: null
  });
  break;
```

## 🚨 Troubleshooting

### Webhook Not Received
1. **Check webhook URL:** Make sure it's accessible
2. **Verify webhook secret:** Must match in environment variables
3. **Check server logs:** Look for signature verification errors
4. **Test endpoint:** Use `curl` to test webhook endpoint

### Signature Verification Failed
```bash
# Test webhook endpoint
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

### Events Not Processing
1. **Check event types:** Make sure you're listening for the right events
2. **Verify webhook secret:** Must be correct
3. **Check server logs:** Look for processing errors
4. **Test with Stripe CLI:** Use `stripe events resend` to retry events

## 📊 Monitoring Webhooks

### Stripe Dashboard
- **Webhooks page:** Monitor delivery status
- **Events page:** View all webhook events
- **Logs:** Check for delivery failures

### Your Server Logs
```bash
# Watch webhook logs in real-time
tail -f server.log | grep webhook
```

### Stripe CLI Events
```bash
# View recent events
stripe events list

# Resend failed events
stripe events resend evt_failed_event_id
```

## 🎯 Production Considerations

### Before Going Live
1. **Update webhook URL:** Change to production URL
2. **Use live webhook secret:** Get from live webhook endpoint
3. **Test with real cards:** Use small amounts
4. **Monitor closely:** Watch for errors in production

### Webhook Security
- ✅ Always verify webhook signatures
- ✅ Use HTTPS endpoints
- ✅ Validate webhook data
- ✅ Handle duplicate events (idempotency)

## 🆘 Quick Commands

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3001/api/webhook

# Test webhook endpoint
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'

# View recent events
stripe events list --limit 10

# Resend failed event
stripe events resend evt_event_id
```

---

**Ready to test!** Start with Method 1 (Stripe CLI) for the easiest local testing experience. 🚀
