import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to update user subscription in Firestore
async function updateUserSubscription(firebaseUserId, subscriptionData) {
  if (!firebaseUserId) {
    console.error('❌ No Firebase user ID provided');
    return;
  }

  try {
    const subscriptionRef = db.collection('userSubscriptions').doc(firebaseUserId);
    await subscriptionRef.set({
      ...subscriptionData,
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log(`✅ Updated subscription for user ${firebaseUserId}:`, subscriptionData);
  } catch (error) {
    console.error('❌ Error updating user subscription:', error);
    throw error;
  }
}

// Helper function to get plan ID from Stripe price ID
function getPlanIdFromPriceId(priceId) {
  const priceToPlanMap = {
    'price_1SKVntE6dLzzZxhrCi97lMAl': 'pro',    // Test Pro price
    'price_1SKW94E6dLzzZxhrhBn4cqLB': 'premium', // Test Premium price
    // Add live price IDs when you switch to production
  };
  
  return priceToPlanMap[priceId] || 'free';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔔 Received webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('✅ Checkout session completed:', session.id);
        console.log('   Customer:', session.customer);
        console.log('   Subscription:', session.subscription);
        console.log('   Metadata:', session.metadata);
        
        // Update user subscription status in Firestore
        if (session.metadata?.firebaseUserId) {
          const planId = getPlanIdFromPriceId(session.metadata.priceId);
          await updateUserSubscription(session.metadata.firebaseUserId, {
            planId: planId,
            status: 'active',
            stripeSubscriptionId: session.subscription,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            cancelAtPeriodEnd: false,
          });
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('✅ Subscription created:', subscription.id);
        console.log('   Customer:', subscription.customer);
        console.log('   Status:', subscription.status);
        console.log('   Plan:', subscription.items.data[0]?.price?.id);
        
        // Update subscription with more detailed info
        if (subscription.metadata?.firebaseUserId) {
          const priceId = subscription.items.data[0]?.price?.id;
          const planId = getPlanIdFromPriceId(priceId);
          await updateUserSubscription(subscription.metadata.firebaseUserId, {
            planId: planId,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('🔄 Subscription updated:', updatedSubscription.id);
        console.log('   Status:', updatedSubscription.status);
        console.log('   Cancel at period end:', updatedSubscription.cancel_at_period_end);
        
        // Update subscription status
        if (updatedSubscription.metadata?.firebaseUserId) {
          const priceId = updatedSubscription.items.data[0]?.price?.id;
          const planId = getPlanIdFromPriceId(priceId);
          await updateUserSubscription(updatedSubscription.metadata.firebaseUserId, {
            planId: planId,
            status: updatedSubscription.status,
            stripeSubscriptionId: updatedSubscription.id,
            currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          });
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('❌ Subscription deleted:', deletedSubscription.id);
        console.log('   Customer:', deletedSubscription.customer);
        
        // Update user subscription status to canceled
        if (deletedSubscription.metadata?.firebaseUserId) {
          await updateUserSubscription(deletedSubscription.metadata.firebaseUserId, {
            planId: 'free',
            status: 'canceled',
            stripeSubscriptionId: null,
            cancelAtPeriodEnd: false,
          });
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('💰 Payment succeeded:', invoice.id);
        console.log('   Customer:', invoice.customer);
        console.log('   Amount:', invoice.amount_paid);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('💸 Payment failed:', failedInvoice.id);
        console.log('   Customer:', failedInvoice.customer);
        console.log('   Amount:', failedInvoice.amount_due);
        
        // TODO: Handle failed payment - maybe send email notification
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
