import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import rateLimit from 'express-rate-limit';

// Load environment variables - try server.env first (backend vars), then .env (frontend vars)
dotenv.config({ path: 'server.env' });
dotenv.config({ path: '.env' }); // Override with .env if it exists

// Conditional logging - only log in development
const isDevelopment = process.env.NODE_ENV !== 'production';
const log = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};
const logError = (...args) => {
  // Always log errors, even in production
  console.error(...args);
};

// Initialize Firebase Admin
let db = null;
try {
  // Try to get Firebase credentials from environment variable first (for Railway/cloud deployments)
  // If not found, try reading from file (for local development)
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Read from environment variable (Railway/cloud)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    log('✅ Firebase Admin: Using credentials from environment variable');
  } else {
    // Read from file (local development)
    try {
      serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
      log('✅ Firebase Admin: Using credentials from serviceAccountKey.json file');
    } catch (fileError) {
      throw new Error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT environment variable or provide serviceAccountKey.json file.');
    }
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  log('✅ Firebase Admin initialized successfully');
} catch (error) {
  logError('❌ Error initializing Firebase Admin:', error.message);
  log('⚠️  Webhooks will not update Firestore without Firebase Admin');
  log('📝 To enable webhook syncing:');
  log('   - For Railway: Set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON');
  log('   - For local: Create a serviceAccountKey.json file with your Firebase Admin SDK credentials');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Helper function to get plan ID from Stripe price ID
const getPlanIdFromPriceId = (priceId) => {
  // Map Stripe price IDs to our plan IDs
  const priceIdMap = {
    'price_1SKVntE6dLzzZxhrCi97lMAl': 'pro',    // Test Pro price
    'price_1SKW94E6dLzzZxhrhBn4cqLB': 'premium', // Test Premium price
  };
  return priceIdMap[priceId] || 'free';
};

// Helper function to update subscription in Firestore
const updateSubscriptionInFirestore = async (userId, subscriptionData) => {
  try {
    if (!db) {
      logError('Firestore not initialized, cannot update subscription');
      return;
    }

    // Helper to convert Date to Firestore Timestamp
    const toTimestamp = (date) => {
      if (!date) return admin.firestore.FieldValue.serverTimestamp();

      // Handle different date formats
      let dateObj;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'number') {
        // Unix timestamp in seconds or milliseconds
        dateObj = new Date(date > 9999999999 ? date : date * 1000);
      } else {
        dateObj = new Date(date);
      }

      // Validate the date
      if (isNaN(dateObj.getTime())) {
        logError('Invalid date:', date);
        return admin.firestore.FieldValue.serverTimestamp();
      }

      return admin.firestore.Timestamp.fromDate(dateObj);
    };

    await db.collection('userSubscriptions').doc(userId).set({
      planId: subscriptionData.planId,
      status: subscriptionData.status,
      currentPeriodStart: toTimestamp(subscriptionData.currentPeriodStart),
      currentPeriodEnd: toTimestamp(subscriptionData.currentPeriodEnd),
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    log(`✅ Updated subscription for user ${userId} to ${subscriptionData.planId}`);
  } catch (error) {
    logError('Error updating subscription in Firestore:', error);
    throw error;
  }
};

// Input validation helper
const validateRequest = (req, requiredFields = []) => {
  const missing = requiredFields.filter(field => !req.body[field]);
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  return { valid: true };
};

// CORS configuration - restrict to production frontend URL in production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173', // Development
      'http://localhost:3000', // Alternative dev port
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (isDevelopment) {
        // In development, allow all origins
        callback(null, true);
      } else {
        // In production, only allow whitelisted origins
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
};

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs (for sensitive endpoints)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// Create checkout session
app.post('/api/create-checkout-session', strictLimiter, async (req, res) => {
  try {
    // Input validation
    const validation = validateRequest(req, ['priceId', 'userId']);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { priceId, userId, userEmail } = req.body;

    // Validate priceId format (Stripe price IDs start with 'price_')
    if (typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      return res.status(400).json({ error: 'Invalid priceId format' });
    }

    // Validate userId format (should be a non-empty string)
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Validate email if provided
    if (userEmail && typeof userEmail === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        firebaseUserId: userId,
      },
      subscription_data: {
        metadata: {
          firebaseUserId: userId,
        },
      },
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    logError('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription at period end
app.post('/api/cancel-subscription', strictLimiter, async (req, res) => {
  try {
    // Input validation
    const validation = validateRequest(req, ['subscriptionId']);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { subscriptionId } = req.body;

    // Validate subscriptionId format (Stripe subscription IDs start with 'sub_')
    if (typeof subscriptionId !== 'string' || !subscriptionId.startsWith('sub_')) {
      return res.status(400).json({ error: 'Invalid subscriptionId format' });
    }

    // Cancel the subscription at period end (not immediately)
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.status(200).json({
      success: true,
      subscription: canceledSubscription,
      message: 'Subscription will be canceled at the end of the current billing period'
    });
  } catch (error) {
    logError('Error canceling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change subscription plan (upgrade or downgrade)
app.post('/api/change-plan', strictLimiter, async (req, res) => {
  try {
    // Input validation
    const validation = validateRequest(req, ['subscriptionId', 'newPriceId']);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { subscriptionId, newPriceId, userId } = req.body;

    // Validate subscriptionId format
    if (typeof subscriptionId !== 'string' || !subscriptionId.startsWith('sub_')) {
      return res.status(400).json({ error: 'Invalid subscriptionId format' });
    }

    // Validate priceId format
    if (typeof newPriceId !== 'string' || !newPriceId.startsWith('price_')) {
      return res.status(400).json({ error: 'Invalid newPriceId format' });
    }

    // Validate userId if provided
    if (userId && (typeof userId !== 'string' || userId.trim().length === 0)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Get current subscription
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPriceId = currentSubscription.items.data[0].price.id;
    const currentPlanId = getPlanIdFromPriceId(currentPriceId);
    const newPlanId = getPlanIdFromPriceId(newPriceId);

    // Define plan hierarchy: free < pro < premium
    const planHierarchy = { free: 0, pro: 1, premium: 2 };
    const isUpgrade = planHierarchy[newPlanId] > planHierarchy[currentPlanId];

    let updatedSubscription;

    if (isUpgrade) {
      // UPGRADE: Apply proration immediately
      log(`Upgrading from ${currentPlanId} to ${newPlanId} with proration`);
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations', // Stripe automatically credits unused time
        billing_cycle_anchor: 'unchanged', // Keep the same billing date
      });

      // Update Firestore immediately for upgrades
      if (userId) {
        await updateSubscriptionInFirestore(userId, {
          planId: newPlanId,
          status: updatedSubscription.status,
          currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: updatedSubscription.id,
        });
      }

      res.status(200).json({
        success: true,
        subscription: updatedSubscription,
        message: `Successfully upgraded to ${newPlanId}! You've been charged a prorated amount based on your remaining billing period.`,
        effectiveDate: 'immediate'
      });
    } else {
      // DOWNGRADE: Schedule change for end of period (no immediate charge)
      log(`Downgrading from ${currentPlanId} to ${newPlanId} at period end`);
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'none', // No proration on downgrade
        billing_cycle_anchor: 'unchanged',
      });

      // For downgrades, Firestore will be updated by webhook when period ends
      // But we set a flag to show pending change
      if (userId) {
        await updateSubscriptionInFirestore(userId, {
          planId: currentPlanId, // Keep current plan until period ends
          status: updatedSubscription.status,
          currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: updatedSubscription.id,
        });
      }

      const effectiveDate = new Date(updatedSubscription.current_period_end * 1000).toLocaleDateString();
      res.status(200).json({
        success: true,
        subscription: updatedSubscription,
        message: `Your plan will change to ${newPlanId} on ${effectiveDate}. You'll continue to have ${currentPlanId} features until then.`,
        effectiveDate: effectiveDate
      });
    }
  } catch (error) {
    logError('Error changing plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription status
app.get('/api/subscriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // First, try to find a customer by email or metadata
    let customer = null;
    try {
      // Search for customer by metadata (Firebase user ID)
      const customers = await stripe.customers.list({
        limit: 1,
      });
      
      customer = customers.data.find(c => c.metadata?.firebaseUserId === userId);
    } catch (customerError) {
      log('No customer found for user:', userId);
    }

    if (!customer) {
      return res.status(200).json({ 
        hasActiveSubscription: false,
        subscription: null 
      });
    }

    // Get all subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
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
    logError('Error fetching subscription:', error);
    // Return no subscription instead of error for better UX
    res.status(200).json({ 
      hasActiveSubscription: false,
      subscription: null 
    });
  }
});

// Webhook handler
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logError('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        log('Checkout session completed:', session.id);

        // Get the subscription from the session
        if (session.subscription && session.metadata?.firebaseUserId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const userId = session.metadata.firebaseUserId;
          const priceId = subscription.items.data[0].price.id;
          const planId = getPlanIdFromPriceId(priceId);

          await updateSubscriptionInFirestore(userId, {
            planId,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: subscription.id,
          });

          log(`✅ Subscription activated for user ${userId}`);
        }
        break;

      case 'customer.subscription.created':
        const createdSubscription = event.data.object;
        log('Subscription created:', createdSubscription.id);

        if (createdSubscription.metadata?.firebaseUserId) {
          const userId = createdSubscription.metadata.firebaseUserId;
          const priceId = createdSubscription.items.data[0].price.id;
          const planId = getPlanIdFromPriceId(priceId);

          await updateSubscriptionInFirestore(userId, {
            planId,
            status: createdSubscription.status,
            currentPeriodStart: new Date(createdSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(createdSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: createdSubscription.id,
          });
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        log('Subscription updated:', updatedSubscription.id);

        if (updatedSubscription.metadata?.firebaseUserId) {
          const userId = updatedSubscription.metadata.firebaseUserId;
          const priceId = updatedSubscription.items.data[0].price.id;
          const planId = getPlanIdFromPriceId(priceId);

          await updateSubscriptionInFirestore(userId, {
            planId,
            status: updatedSubscription.status,
            currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
            stripeSubscriptionId: updatedSubscription.id,
          });
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        log('Subscription deleted:', deletedSubscription.id);

        if (deletedSubscription.metadata?.firebaseUserId) {
          const userId = deletedSubscription.metadata.firebaseUserId;

          await updateSubscriptionInFirestore(userId, {
            planId: 'free',
            status: 'canceled',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: deletedSubscription.id,
          });
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        log('Payment succeeded:', invoice.id);
        // Payment successful - subscription will be updated via subscription.updated event
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        log('Payment failed:', failedInvoice.id);

        // Mark subscription as past_due
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
          if (subscription.metadata?.firebaseUserId) {
            const userId = subscription.metadata.firebaseUserId;
            const priceId = subscription.items.data[0].price.id;
            const planId = getPlanIdFromPriceId(priceId);

            await updateSubscriptionInFirestore(userId, {
              planId,
              status: 'past_due',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              stripeSubscriptionId: subscription.id,
            });
          }
        }
        break;

      default:
        log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logError('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual sync endpoint for testing - syncs a user's subscription from Stripe to Firestore
app.post('/api/sync-subscription', strictLimiter, async (req, res) => {
  try {
    // Input validation
    const validation = validateRequest(req, ['userId']);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { userId, userEmail } = req.body;

    // Validate userId format
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Validate email if provided
    if (userEmail && typeof userEmail === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Find customer by metadata or email
    const customers = await stripe.customers.list({ limit: 100 });
    let customer = customers.data.find(c => c.metadata?.firebaseUserId === userId);

    // If not found by metadata, try to find by email
    if (!customer && userEmail) {
      customer = customers.data.find(c => c.email === userEmail);

      // If found by email, update the customer with Firebase user ID metadata
      if (customer) {
        await stripe.customers.update(customer.id, {
          metadata: { firebaseUserId: userId }
        });
        log(`✅ Updated customer ${customer.id} with Firebase user ID`);
      }
    }

    if (!customer) {
      return res.status(404).json({ error: 'No Stripe customer found for this user' });
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
    });

    const activeSubscription = subscriptions.data.find(sub => sub.status === 'active');

    if (!activeSubscription) {
      return res.status(200).json({
        message: 'No active subscription found',
        synced: false
      });
    }

    // Sync to Firestore
    const priceId = activeSubscription.items.data[0].price.id;
    const planId = getPlanIdFromPriceId(priceId);

    await updateSubscriptionInFirestore(userId, {
      planId,
      status: activeSubscription.status,
      currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      stripeSubscriptionId: activeSubscription.id,
    });

    res.status(200).json({
      message: 'Subscription synced successfully',
      synced: true,
      planId,
      status: activeSubscription.status
    });
  } catch (error) {
    logError('Error syncing subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  log(`🚀 Stripe API server running on port ${PORT}`);
  log(`📡 Health check: http://localhost:${PORT}/api/health`);
  if (!isDevelopment) {
    log('🔒 Production mode: CORS restricted, rate limiting enabled');
  }
});
