import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { SUBSCRIPTION_PLANS, getPlanById } from '../lib/stripe';
import { API_ENDPOINTS } from '../config/api';

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
  // If subscription is canceled and expired, treat as free
  const getCurrentPlan = () => {
    if (!subscription) return SUBSCRIPTION_PLANS.free;
    
    const now = new Date();
    const isExpired = subscription.status === 'canceled' && 
                     subscription.currentPeriodEnd && 
                     new Date(subscription.currentPeriodEnd) <= now;
    
    if (isExpired) {
      return SUBSCRIPTION_PLANS.free;
    }
    
    return getPlanById(subscription.planId) || SUBSCRIPTION_PLANS.free;
  };
  
  const currentPlan = getCurrentPlan();

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

      // Check subscription status from backend
      const response = await fetch(API_ENDPOINTS.getSubscription(user.uid));
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasActiveSubscription && data.subscription) {
          setSubscription({
            id: data.subscription.id,
            planId: data.subscription.planId || 'free',
            status: data.subscription.status,
            currentPeriodStart: new Date(data.subscription.currentPeriodStart * 1000),
            currentPeriodEnd: new Date(data.subscription.currentPeriodEnd * 1000),
            cancelAtPeriodEnd: false,
          });
        } else {
          setSubscription(null);
        }
      } else {
        // No subscription found is not an error
        setSubscription(null);
      }
    } catch (err) {
      // Silently handle errors - user might not have a subscription
      // Only log if it's not a network/CORS error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // Network error - backend might not be running
        // Don't show error to user
      } else {
        console.error('Error checking subscription status:', err);
      }
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

      const plan = getPlanById(planId);
      if (!plan || !plan.priceId) {
        throw new Error('Invalid plan selected');
      }

      const response = await fetch(API_ENDPOINTS.createCheckout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.uid,
          userEmail: user.email || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
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

      const response = await fetch(API_ENDPOINTS.cancelSubscription, {
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
