import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { SUBSCRIPTION_PLANS, getPlanById } from '../lib/stripe';

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

interface StripeContextType {
  subscription: Subscription | null;
  currentPlan: typeof SUBSCRIPTION_PLANS.free;
  loading: boolean;
  error: string | null;
  upgradeSubscription: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current plan based on subscription status
  const currentPlan = subscription 
    ? getPlanById(subscription.planId) || SUBSCRIPTION_PLANS.free
    : SUBSCRIPTION_PLANS.free;

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to your backend
      const response = await fetch(`/api/subscriptions/${user.uid}`);
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError('Failed to check subscription status');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  // Upgrade subscription
  const upgradeSubscription = async (planId: string) => {
    if (!user) {
      throw new Error('User must be logged in to upgrade subscription');
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      // This will be handled by the Stripe Checkout component
      return sessionId;
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError('Failed to upgrade subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!subscription) {
      throw new Error('No active subscription to cancel');
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to cancel subscription
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Update local state
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true,
      } : null);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check subscription status when user changes
  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const value = {
    subscription,
    currentPlan,
    loading,
    error,
    upgradeSubscription,
    cancelSubscription,
    checkSubscriptionStatus,
  };

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}
