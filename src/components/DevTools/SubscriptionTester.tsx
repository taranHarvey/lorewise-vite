import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '../../lib/stripe';
import { API_ENDPOINTS } from '../../config/api';

/**
 * DEVELOPMENT ONLY: Subscription Testing Tool
 * Remove this component in production
 */
export const SubscriptionTester: React.FC = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [usage, setUsage] = useState<any>(null);
  const [currentBookCount, setCurrentBookCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const summary = await subscriptionService.getUsageSummary(user.uid);
      setCurrentPlan(summary.subscription.planId);
      setUsage(summary.usage);
      setCurrentBookCount(summary.currentBookCount);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSetPlan = async (planId: 'free' | 'pro' | 'premium') => {
    if (!user) return;

    setLoading(true);
    try {
      await subscriptionService.setTestSubscription(user.uid, planId);
      alert(`Subscription changed to ${planId.toUpperCase()}. Refreshing...`);
      window.location.reload();
    } catch (error) {
      console.error('Error setting plan:', error);
      alert('Failed to set plan. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAIUsage = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await subscriptionService.resetUsageForNewPeriod(user.uid);
      alert('AI usage reset successfully!');
      await loadData();
    } catch (error) {
      console.error('Error resetting usage:', error);
      alert('Failed to reset usage. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromStripe = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.syncSubscription, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync subscription');
      }

      const data = await response.json();

      if (data.synced) {
        alert(`✅ Subscription synced! Plan: ${data.planId.toUpperCase()}\n\nRefreshing page...`);
        window.location.reload();
      } else {
        alert('No active subscription found in Stripe');
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      alert('Failed to sync subscription. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">Please log in to test subscriptions</div>;
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg space-y-6">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>⚠️ DEVELOPMENT MODE</strong>
        <p className="text-sm mt-1">This tool is for testing only. Remove in production.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Current Status</h3>
        <div className="bg-white p-4 rounded border">
          <p><strong>Plan:</strong> {currentPlan.toUpperCase()}</p>
          {usage && (
            <>
              <p><strong>AI Requests Used:</strong> {usage.aiRequestsUsed} / {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.limits.maxAiRequests || 'N/A'}</p>
              <p><strong>Current Books:</strong> {currentBookCount} / {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.limits.maxBooks || 'N/A'}</p>
              <p><strong>Period Ends:</strong> {new Date(usage.currentPeriodEnd).toLocaleDateString()}</p>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Switch Plan (Testing)</h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleSetPlan('free')}
            disabled={loading || currentPlan === 'free'}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set to FREE
          </button>
          <button
            onClick={() => handleSetPlan('pro')}
            disabled={loading || currentPlan === 'pro'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set to PRO
          </button>
          <button
            onClick={() => handleSetPlan('premium')}
            disabled={loading || currentPlan === 'premium'}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set to PREMIUM
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Reset Usage (Testing)</h3>
        <button
          onClick={handleResetAIUsage}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Reset AI Usage Counter
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will reset your AI request count to 0 (does NOT reset book count)
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Sync from Stripe</h3>
        <button
          onClick={handleSyncFromStripe}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Sync Subscription from Stripe
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will fetch your actual subscription from Stripe and update Firestore
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Fix Corrupted Dates</h3>
        <button
          onClick={async () => {
            if (!user) return;
            setLoading(true);
            try {
              // Manually fix the subscription dates
              await subscriptionService.setTestSubscription(user.uid, currentPlan as 'free' | 'pro' | 'premium');
              alert('Dates fixed! Refreshing...');
              window.location.reload();
            } catch (error) {
              console.error('Error fixing dates:', error);
              alert('Failed to fix dates. Check console.');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Fix Subscription Dates
        </button>
        <p className="text-sm text-gray-600 mt-2">
          If your subscription shows today's date for both start and end, click this to fix it
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-semibold mb-2">Plan Limits Reference:</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Free:</strong> 25 AI requests/month, 3 books max, 10k words/book</div>
          <div><strong>Pro:</strong> 200 AI requests/month, 15 books max, 200k words/book</div>
          <div><strong>Premium:</strong> 500 AI requests/month, unlimited books, unlimited words</div>
        </div>
      </div>
    </div>
  );
};
