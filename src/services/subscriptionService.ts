import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { SUBSCRIPTION_PLANS } from '../lib/stripe';
import { getUserSeries, getUserDocuments } from '../documentService';
import { API_ENDPOINTS } from '../config/api';

export interface UserUsage {
  userId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  aiRequestsUsed: number;
  booksCreated: number;
  lastUpdated: Date;
}

export interface SubscriptionStatus {
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'free';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

export interface FeatureLimits {
  maxBooks: number | 'unlimited';
  maxAiRequests: number | 'unlimited';
  maxWordsPerBook: number | 'unlimited';
}

class SubscriptionService {
  private usageCollection = collection(db, 'userUsage');
  private subscriptionCollection = collection(db, 'userSubscriptions');

  /**
   * Get user's current subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const subscriptionDoc = await getDoc(doc(this.subscriptionCollection, userId));

      if (subscriptionDoc.exists()) {
        const data = subscriptionDoc.data();
        const start = data.currentPeriodStart?.toDate() || new Date();
        const end = data.currentPeriodEnd?.toDate() || new Date();

        return {
          planId: data.planId || 'free',
          status: data.status || 'free',
          currentPeriodStart: start,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          stripeSubscriptionId: data.stripeSubscriptionId,
        };
      }
      
      // Default to free plan if no subscription found
      return {
        planId: 'free',
        status: 'free',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      // Return free plan as fallback
      return {
        planId: 'free',
        status: 'free',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      };
    }
  }

  /**
   * Get user's current usage for the billing period
   */
  async getUserUsage(userId: string): Promise<UserUsage> {
    try {
      const usageDoc = await getDoc(doc(this.usageCollection, userId));

      if (usageDoc.exists()) {
        const data = usageDoc.data();
        return {
          userId,
          currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
          currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
          aiRequestsUsed: data.aiRequestsUsed || 0,
          booksCreated: data.booksCreated || 0,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        };
      }

      // Create new usage record if none exists
      const newUsage: UserUsage = {
        userId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        aiRequestsUsed: 0,
        booksCreated: 0,
        lastUpdated: new Date(),
      };

      await this.updateUserUsage(newUsage);
      return newUsage;
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw error;
    }
  }

  /**
   * Update user's usage data
   */
  async updateUserUsage(usage: UserUsage): Promise<void> {
    try {
      await setDoc(doc(this.usageCollection, usage.userId), {
        ...usage,
        currentPeriodStart: usage.currentPeriodStart,
        currentPeriodEnd: usage.currentPeriodEnd,
        lastUpdated: usage.lastUpdated,
      });
    } catch (error) {
      console.error('Error updating user usage:', error);
      throw error;
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(userId: string, status: SubscriptionStatus): Promise<void> {
    try {
      await setDoc(doc(this.subscriptionCollection, userId), {
        ...status,
        currentPeriodStart: status.currentPeriodStart,
        currentPeriodEnd: status.currentPeriodEnd,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  /**
   * Get feature limits for a user's current plan
   */
  async getFeatureLimits(userId: string): Promise<FeatureLimits> {
    const subscription = await this.getSubscriptionStatus(userId);
    
    // If subscription is canceled and period has ended, treat as free plan
    const now = new Date();
    const isExpired = subscription.status === 'canceled' && 
                     subscription.currentPeriodEnd && 
                     new Date(subscription.currentPeriodEnd) <= now;
    
    if (isExpired) {
      console.log('[getFeatureLimits] Subscription expired, using free plan limits');
      return SUBSCRIPTION_PLANS.free.limits;
    }
    
    const plan = SUBSCRIPTION_PLANS[subscription.planId as keyof typeof SUBSCRIPTION_PLANS];

    if (!plan) {
      // Fallback to free plan
      return SUBSCRIPTION_PLANS.free.limits;
    }

    return plan.limits;
  }

  /**
   * Check if user can create a new book
   */
  async canCreateBook(userId: string): Promise<{ canCreate: boolean; reason?: string }> {
    try {
      const [subscription, limits] = await Promise.all([
        this.getSubscriptionStatus(userId),
        this.getFeatureLimits(userId),
      ]);

      console.log('[canCreateBook] Subscription:', subscription);
      console.log('[canCreateBook] Limits:', limits);

      // Check if subscription is active or within billing period
      // Allow canceled subscriptions if they're still within their paid period
      // If expired, treat as free plan (allow creation with free limits)
      const now = new Date();
      const isWithinPeriod = subscription.currentPeriodEnd && 
                            new Date(subscription.currentPeriodEnd) > now;
      const isExpired = subscription.status === 'canceled' && 
                       subscription.currentPeriodEnd && 
                       new Date(subscription.currentPeriodEnd) <= now;
      
      const isActive = subscription.status === 'active' || 
                      subscription.status === 'free' ||
                      (subscription.status === 'canceled' && isWithinPeriod);
      
      // If expired canceled subscription, treat as free (don't block, but use free limits)
      if (isExpired) {
        console.log('[canCreateBook] Subscription expired, treating as free plan');
        // Continue to check limits (which will be free plan limits)
      } else if (!isActive) {
        console.log('[canCreateBook] Subscription not active:', subscription.status, 'Period end:', subscription.currentPeriodEnd);
        return { canCreate: false, reason: 'Subscription is not active' };
      }

      // Count actual current books (documents across all series)
      // Force a fresh query from server to bypass cache
      let currentBookCount = 0;
      try {
        const userDocuments = await getUserDocuments(userId, true); // Force server fetch
        currentBookCount = userDocuments.length;
        console.log('[canCreateBook] Current book count:', currentBookCount, 'Limit:', limits.maxBooks);
        console.log('[canCreateBook] Documents:', userDocuments.map(d => ({ id: d.id, title: d.title })));
      } catch (error) {
        console.error('[canCreateBook] Error counting books:', error);
        // On error, allow creation (optimistic)
        return { canCreate: true };
      }

      // Check book limit against actual current count
      if (limits.maxBooks !== 'unlimited' && currentBookCount >= limits.maxBooks) {
        console.log('[canCreateBook] Limit reached:', currentBookCount, '>=', limits.maxBooks);
        return {
          canCreate: false,
          reason: `You've reached your limit of ${limits.maxBooks} books. Delete a book or upgrade to create more.`
        };
      }

      console.log('[canCreateBook] Can create book');
      return { canCreate: true };
    } catch (error) {
      console.error('[canCreateBook] Unexpected error:', error);
      // On error, allow creation (optimistic approach)
      return { canCreate: true };
    }
  }

  /**
   * Check if user can make an AI request
   */
  async canMakeAIRequest(userId: string): Promise<{ canMake: boolean; reason?: string }> {
    const [subscription, usage, limits] = await Promise.all([
      this.getSubscriptionStatus(userId),
      this.getUserUsage(userId),
      this.getFeatureLimits(userId),
    ]);

    // Check if subscription is active or within billing period
    // Allow canceled subscriptions if they're still within their paid period
    const now = new Date();
    const isWithinPeriod = subscription.currentPeriodEnd && 
                          new Date(subscription.currentPeriodEnd) > now;
    
    const isActive = subscription.status === 'active' || 
                    subscription.status === 'free' ||
                    (subscription.status === 'canceled' && isWithinPeriod);
    
    if (!isActive) {
      return { canMake: false, reason: 'Subscription is not active' };
    }

    // Check if billing period has ended - if so, reset usage automatically
    if (now > usage.currentPeriodEnd) {
      await this.resetUsageForNewPeriod(userId);
      // After reset, usage is 0, so they can make a request
      return { canMake: true };
    }

    // Check AI request limit
    if (limits.maxAiRequests !== 'unlimited' && usage.aiRequestsUsed >= limits.maxAiRequests) {
      return {
        canMake: false,
        reason: `You've used all ${limits.maxAiRequests} AI requests this month. Upgrade for more requests.`
      };
    }

    return { canMake: true };
  }

  /**
   * Check if document exceeds word limit
   */
  async canAddWords(userId: string, currentWordCount: number, additionalWords: number): Promise<{ canAdd: boolean; reason?: string }> {
    const [subscription, limits] = await Promise.all([
      this.getSubscriptionStatus(userId),
      this.getFeatureLimits(userId),
    ]);

    // Check if subscription is active
    // Check if subscription is active or within billing period
    // Allow canceled subscriptions if they're still within their paid period
    const now = new Date();
    const isWithinPeriod = subscription.currentPeriodEnd && 
                          new Date(subscription.currentPeriodEnd) > now;
    
    const isActive = subscription.status === 'active' || 
                    subscription.status === 'free' ||
                    (subscription.status === 'canceled' && isWithinPeriod);
    
    if (!isActive) {
      return { canAdd: false, reason: 'Subscription is not active' };
    }

    // Check word limit
    if (limits.maxWordsPerBook !== 'unlimited' && (currentWordCount + additionalWords) > limits.maxWordsPerBook) {
      return { 
        canAdd: false, 
        reason: `This would exceed your limit of ${limits.maxWordsPerBook.toLocaleString()} words per book. Upgrade for unlimited words.` 
      };
    }

    return { canAdd: true };
  }

  /**
   * @deprecated Book count is now calculated from actual series count
   * This method is kept for backwards compatibility but does nothing
   */
  async incrementBookCount(userId: string): Promise<void> {
    // No longer needed - we count books directly from database
  }

  /**
   * Increment AI request count when user makes an AI request
   */
  async incrementAIRequestCount(userId: string): Promise<void> {
    const usage = await this.getUserUsage(userId);
    usage.aiRequestsUsed += 1;
    usage.lastUpdated = new Date();
    await this.updateUserUsage(usage);
  }

  /**
   * Reset usage counters for new billing period
   * Note: Only resets AI usage, NOT book count (books are a permanent limit)
   */
  async resetUsageForNewPeriod(userId: string): Promise<void> {
    const usage = await this.getUserUsage(userId);
    usage.aiRequestsUsed = 0; // Reset AI usage only
    // Do NOT reset booksCreated - that's a total account limit, not monthly
    usage.currentPeriodStart = new Date();
    usage.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    usage.lastUpdated = new Date();
    await this.updateUserUsage(usage);
  }

  /**
   * Sync usage data with actual user data (useful for fixing discrepancies)
   */
  async syncUsageData(userId: string): Promise<UserUsage> {
    try {
      // Count actual documents (books)
      let actualBooksCount = 0;
      try {
        const userDocuments = await getUserDocuments(userId);
        actualBooksCount = userDocuments.length;
      } catch (error) {
        console.error('Could not count documents:', error);
      }

      // Get current usage
      const currentUsage = await this.getUserUsage(userId);

      // Update with actual counts
      const syncedUsage: UserUsage = {
        ...currentUsage,
        booksCreated: actualBooksCount,
        lastUpdated: new Date(),
      };

      await this.updateUserUsage(syncedUsage);
      return syncedUsage;
    } catch (error) {
      console.error('Error syncing usage data:', error);
      throw error;
    }
  }

  /**
   * Get usage summary for display
   */
  async getUsageSummary(userId: string): Promise<{
    subscription: SubscriptionStatus;
    usage: UserUsage;
    limits: FeatureLimits;
    canCreateBook: boolean;
    canMakeAIRequest: boolean;
    currentBookCount: number;
  }> {
    const [subscription, usage, limits, bookCheck, aiCheck] = await Promise.all([
      this.getSubscriptionStatus(userId),
      this.getUserUsage(userId),
      this.getFeatureLimits(userId),
      this.canCreateBook(userId),
      this.canMakeAIRequest(userId),
    ]);

    // Get actual current document (book) count
    let currentBookCount = 0;
    try {
      const userDocuments = await getUserDocuments(userId);
      currentBookCount = userDocuments.length;
    } catch (error) {
      console.error('Error counting documents:', error);
    }

    return {
      subscription,
      usage,
      limits,
      canCreateBook: bookCheck.canCreate,
      canMakeAIRequest: aiCheck.canMake,
      currentBookCount,
    };
  }

  /**
   * Create a Stripe checkout session for upgrading
   */
  async createCheckoutSession(userId: string, planId: string): Promise<string> {
    try {
      // Call your backend API to create a Stripe checkout session
      // This should be implemented in your backend/cloud function
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data.url; // Stripe checkout URL
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Change subscription plan (upgrade or downgrade)
   * Upgrades are prorated immediately, downgrades take effect at period end
   */
  async changePlan(userId: string, newPriceId: string): Promise<{ success: boolean; message: string; effectiveDate: string }> {
    try {
      // Get current subscription
      const subscription = await this.getSubscriptionStatus(userId);

      if (!subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const response = await fetch(API_ENDPOINTS.changePlan, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
          newPriceId,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change plan');
      }

      const data = await response.json();
      return {
        success: data.success,
        message: data.message,
        effectiveDate: data.effectiveDate,
      };
    } catch (error) {
      console.error('Error changing plan:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const subscription = await this.getSubscriptionStatus(userId);

      if (!subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const response = await fetch(API_ENDPOINTS.cancelSubscription, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * TESTING ONLY: Manually set subscription plan for testing
   * Remove this in production or add proper authentication
   */
  async setTestSubscription(userId: string, planId: 'free' | 'pro' | 'premium'): Promise<void> {
    const now = new Date();
    const endDate = new Date(now.getTime());
    endDate.setMonth(endDate.getMonth() + 1); // 1 month from now

    const subscription: SubscriptionStatus = {
      planId,
      status: planId === 'free' ? 'free' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
    };

    await this.updateSubscriptionStatus(userId, subscription);
  }
}

export const subscriptionService = new SubscriptionService();
