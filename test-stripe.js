#!/usr/bin/env node

/**
 * Stripe Integration Test Script
 * Run this to verify your Stripe setup is working correctly
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  try {
    // Test 1: Verify API key
    console.log('1. Testing API key...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ API key valid. Account: ${account.display_name || account.id}`);
    console.log(`   Mode: ${account.livemode ? 'LIVE' : 'TEST'}\n`);

    // Test 2: Check Price IDs
    console.log('2. Testing Price IDs...');
    const testPrices = [
      'price_1SKVntE6dLzzZxhrCi97lMAl', // Pro
      'price_1SKW94E6dLzzZxhrhBn4cqLB'  // Premium
    ];

    for (const priceId of testPrices) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log(`✅ Price ${priceId}: ${price.nickname || 'Unnamed'} - $${price.unit_amount / 100}/month`);
      } catch (error) {
        console.log(`❌ Price ${priceId}: ${error.message}`);
      }
    }
    console.log('');

    // Test 3: Create test customer
    console.log('3. Testing customer creation...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: {
        firebaseUserId: 'test-user-123',
        source: 'lorewise-test'
      }
    });
    console.log(`✅ Test customer created: ${customer.id}\n`);

    // Test 4: Create test checkout session
    console.log('4. Testing checkout session creation...');
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1SKVntE6dLzzZxhrCi97lMAl', // Pro plan
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:5174/success',
      cancel_url: 'http://localhost:5174/cancel',
      metadata: {
        firebaseUserId: 'test-user-123',
        planId: 'pro'
      }
    });
    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`   URL: ${session.url}\n`);

    // Test 5: Test webhook endpoint
    console.log('5. Testing webhook endpoint...');
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        console.log('✅ Webhook endpoint is accessible');
      } else {
        console.log('❌ Webhook endpoint returned:', response.status);
      }
    } catch (error) {
      console.log('❌ Webhook endpoint not accessible:', error.message);
      console.log('   Make sure your server is running: npm run server');
    }
    console.log('');

    // Test 6: Clean up test data
    console.log('6. Cleaning up test data...');
    await stripe.customers.del(customer.id);
    console.log('✅ Test customer deleted\n');

    console.log('🎉 All tests passed! Your Stripe integration is ready for testing.');
    console.log('\n📋 Next steps:');
    console.log('1. Start your servers: npm run dev:full');
    console.log('2. Go to http://localhost:5174/pricing');
    console.log('3. Use test card: 4242 4242 4242 4242');
    console.log('4. Complete a test upgrade');
    console.log('5. Check your Stripe Dashboard for the test payment');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your STRIPE_SECRET_KEY in server.env');
    console.log('2. Make sure you\'re using test keys (sk_test_...)');
    console.log('3. Verify your Price IDs are correct');
    console.log('4. Check your internet connection');
  }
}

// Run the test
testStripeIntegration();
