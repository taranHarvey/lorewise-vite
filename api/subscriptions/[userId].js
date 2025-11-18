const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get all subscriptions for the user
    const subscriptions = await stripe.subscriptions.list({
      customer: userId, // Assuming userId is the Stripe customer ID
      status: 'all',
    });

    // Get the active subscription
    const activeSubscription = subscriptions.data.find(sub => sub.status === 'active');

    if (!activeSubscription) {
      return res.status(200).json({ 
        hasActiveSubscription: false,
        subscription: null 
      });
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(activeSubscription.id);

    res.status(200).json({ 
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        planId: subscription.items.data[0].price.id,
        planName: subscription.items.data[0].price.nickname || 'Unknown Plan',
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
