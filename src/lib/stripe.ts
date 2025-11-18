import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe configuration
export const STRIPE_CONFIG = {
  // Your Stripe publishable key (starts with pk_test_ or pk_live_)
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  
  // Currency for payments
  currency: 'usd',
  
  // Payment methods to accept
  paymentMethods: ['card'],
  
  // Appearance customization
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#111827',
      colorDanger: '#dc2626',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  },
};

// Subscription plans for Lorewise
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out Lorewise',
    features: [
      'Up to 3 books',
      '10,000 words per book',
      '5 GPT-5.1 requests per month',
      'Unlimited GPT-5 requests',
      'Auto-save',
      'Cloud storage',
    ],
    limits: {
      maxBooks: 3,
      aiRequests: 25, // Total requests (5 GPT-5.1 + unlimited GPT-5 Mini/Nano)
      wordsPerBook: 10000, // 10k words per book (enough for short stories)
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    priceId: 'price_1SKVntE6dLzzZxhrCi97lMAl', // Your actual Stripe Price ID
    description: 'For serious writers',
    features: [
      'Up to 15 books',
      '200,000 words per book',
      'GPT-5.1 for complex tasks',
      'Unlimited GPT-5 requests',
      'Priority support',
      'Export options',
      'Advanced editing tools',
    ],
    limits: {
      maxBooks: 15,
      aiRequests: 200, // Total requests (GPT-5.1 limited, GPT-5 Mini/Nano unlimited)
      wordsPerBook: 200000, // 200k words per book
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    priceId: 'price_1SKW94E6dLzzZxhrhBn4cqLB', // Your actual Stripe Price ID
    description: 'Unlimited creative freedom',
    features: [
      'Unlimited books',
      'Unlimited word count',
      'Enhanced GPT-5.1 allocation',
      'Unlimited GPT-5 requests',
      'Priority support',
      'All Pro features',
      'Early access to new features',
    ],
    limits: {
      maxBooks: 'unlimited',
      aiRequests: 500, // Total requests (GPT-5.1 limited, GPT-5 Mini/Nano unlimited)
      wordsPerBook: 'unlimited',
    },
  },
};

// Helper function to get plan by ID
export const getPlanById = (planId: string) => {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.id === planId);
};

// Helper function to format price
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};
