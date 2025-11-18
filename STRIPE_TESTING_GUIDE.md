# 🧪 Complete Stripe Sandbox Testing Guide

## Overview
This guide will help you test all Stripe integrations safely in test mode without processing real payments.

## 🔧 Test Mode Setup

### 1. Environment Configuration
Make sure you're using Stripe test keys:

**Frontend (.env.local):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
```

**Backend (server.env):**
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here
```

### 2. Test Price IDs
Your current test Price IDs:
- **Pro Plan**: `price_1SKVntE6dLzzZxhrCi97lMAl`
- **Premium Plan**: `price_1SKW94E6dLzzZxhrhBn4cqLB`

## 💳 Test Card Numbers

Use these Stripe test card numbers for different scenarios:

### Successful Payments
```
4242 4242 4242 4242 - Visa (successful)
4000 0566 5566 5556 - Visa (successful)
5555 5555 5555 4444 - Mastercard (successful)
```

### Declined Payments
```
4000 0000 0000 0002 - Card declined
4000 0000 0000 9995 - Insufficient funds
4000 0000 0000 9987 - Lost card
4000 0000 0000 9979 - Stolen card
```

### 3D Secure Authentication
```
4000 0025 0000 3155 - Requires authentication
4000 0027 6000 3184 - Authentication fails
```

**For all test cards:**
- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 12345)

## 🧪 Testing Scenarios

### 1. Upgrade Flow Testing

#### Test Pro Plan Upgrade
1. **Start your servers:**
   ```bash
   npm run dev:full
   ```

2. **Navigate to pricing page:**
   - Go to `http://localhost:5174/pricing`
   - Click "Upgrade" on Pro plan

3. **Use test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`

4. **Expected results:**
   - ✅ Redirected to Stripe Checkout
   - ✅ Payment succeeds
   - ✅ Redirected back to your app
   - ✅ User subscription status updated to "Pro"
   - ✅ User can create more books (up to 15)
   - ✅ User gets 200 AI requests

#### Test Premium Plan Upgrade
1. Follow same steps as Pro plan
2. Use Premium plan instead
3. Expected: User gets unlimited books and 500 AI requests

### 2. Cancellation Flow Testing

#### Test Subscription Cancellation
1. **Navigate to Settings:**
   - Go to `http://localhost:5174/settings`
   - Find "Subscription Management" section

2. **Cancel subscription:**
   - Click "Cancel Subscription"
   - Confirm cancellation

3. **Expected results:**
   - ✅ Subscription status changes to "canceled"
   - ✅ User retains access until period end
   - ✅ User reverts to Free plan after period end

### 3. Webhook Testing

#### Test Webhook Events
1. **Install Stripe CLI:**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   ```

2. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3001/api/webhook
   ```

3. **Test webhook events:**
   - Complete a test payment
   - Check webhook logs in terminal
   - Verify webhook processing in your app

### 4. Subscription Status Testing

#### Test Subscription Status Updates
1. **Check subscription status:**
   - Go to Settings page
   - Verify current plan display
   - Check usage limits

2. **Test plan changes:**
   - Upgrade from Free to Pro
   - Verify limits update immediately
   - Test downgrade scenarios

### 5. Error Handling Testing

#### Test Payment Failures
1. **Use declined card:**
   - Card: `4000 0000 0000 0002`
   - Expected: Payment declined message

2. **Test insufficient funds:**
   - Card: `4000 0000 0000 9995`
   - Expected: Appropriate error message

#### Test Network Issues
1. **Disconnect internet during payment**
2. **Expected: Graceful error handling**

## 🔍 Monitoring & Debugging

### 1. Stripe Dashboard
- **Test Mode**: https://dashboard.stripe.com/test
- **Payments**: Monitor test payments
- **Customers**: Check customer creation
- **Subscriptions**: Track subscription changes
- **Webhooks**: Monitor webhook delivery

### 2. Browser Developer Tools
- **Network Tab**: Monitor API calls
- **Console**: Check for JavaScript errors
- **Application Tab**: Verify localStorage/sessionStorage

### 3. Server Logs
- **Backend logs**: Check server console
- **Webhook logs**: Monitor webhook processing
- **Database logs**: Verify data persistence

## 📊 Test Checklist

### ✅ Upgrade Flow
- [ ] Pro plan upgrade works
- [ ] Premium plan upgrade works
- [ ] Payment processing succeeds
- [ ] User subscription status updates
- [ ] User limits increase immediately
- [ ] Redirect back to app works

### ✅ Cancellation Flow
- [ ] Subscription cancellation works
- [ ] User retains access until period end
- [ ] Status updates to "canceled"
- [ ] User reverts to Free plan after period end

### ✅ Error Handling
- [ ] Declined payments handled gracefully
- [ ] Network errors handled properly
- [ ] User sees appropriate error messages
- [ ] App doesn't crash on errors

### ✅ Webhook Processing
- [ ] Webhooks received successfully
- [ ] Subscription events processed
- [ ] Database updates correctly
- [ ] User status syncs properly

### ✅ Edge Cases
- [ ] Multiple rapid upgrades
- [ ] Cancellation during trial
- [ ] Webhook retries handled
- [ ] Concurrent user actions

## 🚀 Production Readiness

### Before Going Live
1. **Switch to live keys:**
   - Update `VITE_STRIPE_PUBLISHABLE_KEY` to live key
   - Update `STRIPE_SECRET_KEY` to live key
   - Update Price IDs to live Price IDs

2. **Test with real cards:**
   - Use real card numbers (small amounts)
   - Test 3D Secure authentication
   - Verify webhook delivery

3. **Monitor closely:**
   - Watch for errors in production
   - Monitor webhook delivery
   - Check subscription status accuracy

## 🆘 Troubleshooting

### Common Issues
1. **Webhook not received:**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check server logs

2. **Payment fails:**
   - Verify test card numbers
   - Check API keys
   - Review error messages

3. **Subscription not updating:**
   - Check webhook processing
   - Verify database updates
   - Check user authentication

### Debug Commands
```bash
# Check Stripe CLI status
stripe --version

# Test webhook endpoint
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}' 

# Check server logs
tail -f server.log
```

## 📞 Support Resources
- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Testing Guide**: https://stripe.com/docs/testing
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

**Remember**: Always test thoroughly in sandbox mode before going live! 🛡️
