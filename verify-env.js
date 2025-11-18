#!/usr/bin/env node

// Environment Variable Verification Script
// Run: node verify-env.js

import fs from 'fs';
import path from 'path';

const requiredVars = {
  frontend: {
    'VITE_OPENAI_API_KEY': {
      description: 'OpenAI API key for AI features',
      required: true,
      pattern: /^sk-/,
      example: 'sk-proj-...',
    },
    'VITE_STRIPE_PUBLISHABLE_KEY': {
      description: 'Stripe publishable key (starts with pk_test_ or pk_live_)',
      required: true,
      pattern: /^pk_(test|live)_/,
      example: 'pk_test_51...',
    },
    'VITE_API_URL': {
      description: 'Backend API URL (use http://localhost:3001 for local)',
      required: true,
      pattern: /^https?:\/\//,
      example: 'http://localhost:3001',
    },
  },
  backend: {
    'STRIPE_SECRET_KEY': {
      description: 'Stripe secret key (starts with sk_test_ or sk_live_)',
      required: true,
      pattern: /^sk_(test|live)_/,
      example: 'sk_test_51...',
    },
    'STRIPE_WEBHOOK_SECRET': {
      description: 'Stripe webhook signing secret (starts with whsec_)',
      required: false, // Can be set up later
      pattern: /^whsec_/,
      example: 'whsec_...',
      note: 'Get this after setting up webhook endpoint',
    },
    'PORT': {
      description: 'Backend server port',
      required: false,
      default: '3001',
      example: '3001',
    },
    'FRONTEND_URL': {
      description: 'Frontend URL for CORS and redirects',
      required: false,
      default: 'http://localhost:5173',
      example: 'http://localhost:5173',
    },
  },
};

function loadEnvFile(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
  return env;
}

function checkVar(varName, config, env, type) {
  const value = env[varName];
  const exists = value !== undefined && value !== '';
  const valid = exists && (!config.pattern || config.pattern.test(value));
  
  let status = '❌ MISSING';
  let message = '';
  
  if (exists && valid) {
    status = '✅ OK';
    // Mask the value for display
    const masked = value.length > 20 ? value.substring(0, 10) + '...' + value.substring(value.length - 6) : '***';
    message = `  Value: ${masked}`;
  } else if (exists && !valid) {
    status = '⚠️  INVALID';
    message = `  Current: ${value.substring(0, 20)}... (doesn't match expected pattern)`;
  } else if (!exists && !config.required) {
    status = '⏭️  OPTIONAL';
    message = `  Default: ${config.default || 'not set'}`;
  } else {
    message = `  Example: ${config.example || 'see documentation'}`;
  }
  
  console.log(`  ${status} ${varName}`);
  console.log(`    ${config.description}`);
  if (message) console.log(message);
  if (config.note) console.log(`    Note: ${config.note}`);
  console.log('');
  
  return { exists, valid, required: config.required };
}

function main() {
  console.log('🔍 Environment Variable Verification\n');
  console.log('='.repeat(60));
  console.log('');
  
  const env = loadEnvFile('.env');
  const serverEnv = loadEnvFile('server.env');
  
  // Merge both (server.env can have backend vars for reference)
  const allEnv = { ...env, ...serverEnv };
  
  console.log('📱 FRONTEND VARIABLES (VITE_*)');
  console.log('   These are used by your React/Vite app\n');
  
  let frontendErrors = 0;
  Object.entries(requiredVars.frontend).forEach(([key, config]) => {
    const result = checkVar(key, config, allEnv, 'frontend');
    if (result.required && !result.exists) frontendErrors++;
    if (result.exists && !result.valid) frontendErrors++;
  });
  
  console.log('');
  console.log('⚙️  BACKEND VARIABLES');
  console.log('   These are used by server.js (you can put them in .env or server.env)\n');
  
  let backendErrors = 0;
  Object.entries(requiredVars.backend).forEach(([key, config]) => {
    const result = checkVar(key, config, allEnv, 'backend');
    if (result.required && !result.exists) backendErrors++;
    if (result.exists && !result.valid) backendErrors++;
  });
  
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  if (frontendErrors === 0 && backendErrors === 0) {
    console.log('✅ All required environment variables are set correctly!');
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Keep .env in .gitignore (already done ✓)');
    console.log('   - For production, use production Stripe keys (pk_live_/sk_live_)');
    console.log('   - Update VITE_API_URL to your production backend URL when deploying');
  } else {
    console.log(`⚠️  Found ${frontendErrors + backendErrors} issue(s) that need attention`);
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Add missing variables to your .env file');
    console.log('   2. Get your Stripe keys from: https://dashboard.stripe.com/apikeys');
    console.log('   3. For local testing, use test keys (pk_test_/sk_test_)');
    console.log('   4. Run this script again to verify');
  }
  console.log('');
}

main();

