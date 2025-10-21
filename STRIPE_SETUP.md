# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for your Lorewise application.

## 1. Stripe Account Setup

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get API Keys**: Navigate to [API Keys](https://dashboard.stripe.com/apikeys) in your Stripe dashboard
3. **Copy Keys**: Copy your publishable key (starts with `pk_test_` for test mode)

## 2. Environment Configuration

Create a `.env.local` file in your project root with:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## 3. Stripe Dashboard Configuration

### Create Products and Prices

1. Go to [Products](https://dashboard.stripe.com/products) in your Stripe dashboard
2. Create products for each plan:

**Pro Plan:**
- Product Name: "Lorewise Pro"
- Price: $9.99/month
- Copy the Price ID (starts with `price_`)

**Premium Plan:**
- Product Name: "Lorewise Premium" 
- Price: $19.99/month
- Copy the Price ID (starts with `price_`)

### Update Price IDs

Update the price IDs in `src/lib/stripe.ts`:

```typescript
export const SUBSCRIPTION_PLANS = {
  // ... existing plans
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    priceId: 'price_your_pro_price_id_here', // Update this
    // ... rest of config
  },
  premium: {
    id: 'premium', 
    name: 'Premium',
    price: 19.99,
    priceId: 'price_your_premium_price_id_here', // Update this
    // ... rest of config
  },
};
```

## 4. Backend API Setup

You'll need to create backend endpoints to handle Stripe operations. Here's what you need:

### Required Endpoints

1. **Create Checkout Session** (`/api/create-checkout-session`)
2. **Create Subscription** (`/api/create-subscription`) 
3. **Cancel Subscription** (`/api/cancel-subscription`)
4. **Get Subscription Status** (`/api/subscriptions/:userId`)

### Backend Dependencies

Install Stripe server-side SDK:

```bash
npm install stripe
```

### Example Backend Code (Node.js/Express)

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  const { userId, planId } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    payment_method_types: ['card'],
    line_items: [{
      price: SUBSCRIPTION_PLANS[planId].priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
    metadata: {
      userId: userId,
      planId: planId,
    },
  });

  res.json({ sessionId: session.id });
});

// Create subscription
app.post('/api/create-subscription', async (req, res) => {
  const { paymentMethodId, planId } = req.body;
  
  try {
    const customer = await stripe.customers.create({
      email: req.user.email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: SUBSCRIPTION_PLANS[planId].priceId }],
      default_payment_method: paymentMethodId,
    });

    res.json({ subscription });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## 5. Webhook Setup

Set up webhooks to handle subscription events:

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks) in Stripe dashboard
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 6. Testing

### Test Cards

Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

### Test Flow

1. Start your development server
2. Navigate to `/pricing`
3. Select a paid plan
4. Use test card: 4242 4242 4242 4242
5. Use any future expiry date and CVC

## 7. Production Deployment

### Environment Variables

For production, update your environment variables:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
```

### Security Considerations

- Never expose secret keys in frontend code
- Use HTTPS in production
- Validate webhook signatures
- Implement proper error handling
- Add rate limiting to API endpoints

## 8. Next Steps

1. **Complete Backend**: Implement all required API endpoints
2. **Add Webhooks**: Handle subscription lifecycle events
3. **User Management**: Integrate subscription status with user accounts
4. **Feature Gating**: Restrict features based on subscription level
5. **Billing Portal**: Add customer portal for subscription management

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
