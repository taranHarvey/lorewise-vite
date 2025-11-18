#!/usr/bin/env node

/**
 * Webhook Test Script
 * Tests your webhook endpoint to ensure it's working correctly
 */

import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:3001/api/webhook';

async function testWebhookEndpoint() {
  console.log('🧪 Testing Webhook Endpoint...\n');

  try {
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'test' })
    });

    if (response.ok) {
      console.log('✅ Webhook endpoint is accessible');
    } else {
      console.log(`❌ Webhook endpoint returned: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text}`);
    }

    // Test 2: Health check
    console.log('\n2. Testing health endpoint...');
    try {
      const healthResponse = await fetch('http://localhost:3001/api/health');
      if (healthResponse.ok) {
        console.log('✅ Health endpoint is working');
      } else {
        console.log('❌ Health endpoint not accessible');
      }
    } catch (error) {
      console.log('❌ Health endpoint error:', error.message);
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Start your server: npm run server');
    console.log('2. Start webhook forwarding: stripe listen --forward-to localhost:3001/api/webhook');
    console.log('3. Test a purchase flow');
    console.log('4. Watch webhook events in real-time');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your server is running: npm run server');
    console.log('2. Check if port 3001 is available');
    console.log('3. Verify your webhook endpoint is correct');
  }
}

// Run the test
testWebhookEndpoint();
