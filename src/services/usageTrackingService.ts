import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { SubscriptionTier, getLimitsForTier, isWithinLimit } from '../config/subscriptionTiers';

/**
 * Usage tracking for a user in the current billing period
 */
export interface UserUsage {
  userId: string;
  periodStart: Date;
  periodEnd: Date;

  // AI usage
  aiGenerationsCount: number;
  totalWordsGenerated: number;

  // Document counts
  documentCount: number;
  seriesCount: number;

  // Lore usage
  currentLoreSize: number;

  // Rate limiting
  lastRequestTime: Date;
  requestsInLastMinute: number;
}

/**
 * Result of a usage check
 */
export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  limitType?: string;
  currentUsage?: number;
  limit?: number;
}

class UsageTrackingService {
  /**
   * Get or create usage document for a user
   */
  async getUserUsage(userId: string): Promise<UserUsage | null> {
    try {
      const usageRef = doc(db, 'usage', userId);
      const usageDoc = await getDoc(usageRef);

      if (usageDoc.exists()) {
        const data = usageDoc.data();
        return {
          userId,
          periodStart: data.periodStart?.toDate() || new Date(),
          periodEnd: data.periodEnd?.toDate() || new Date(),
          aiGenerationsCount: data.aiGenerationsCount || 0,
          totalWordsGenerated: data.totalWordsGenerated || 0,
          documentCount: data.documentCount || 0,
          seriesCount: data.seriesCount || 0,
          currentLoreSize: data.currentLoreSize || 0,
          lastRequestTime: data.lastRequestTime?.toDate() || new Date(),
          requestsInLastMinute: data.requestsInLastMinute || 0,
        };
      }

      // Create new usage document
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const newUsage: UserUsage = {
        userId,
        periodStart: now,
        periodEnd,
        aiGenerationsCount: 0,
        totalWordsGenerated: 0,
        documentCount: 0,
        seriesCount: 0,
        currentLoreSize: 0,
        lastRequestTime: now,
        requestsInLastMinute: 0,
      };

      await setDoc(usageRef, {
        ...newUsage,
        periodStart: Timestamp.fromDate(newUsage.periodStart),
        periodEnd: Timestamp.fromDate(newUsage.periodEnd),
        lastRequestTime: Timestamp.fromDate(newUsage.lastRequestTime),
      });

      return newUsage;
    } catch (error) {
      console.error('Error getting user usage:', error);
      return null;
    }
  }

  /**
   * Check if user can make an AI generation request
   */
  async canGenerateAI(userId: string, tier: SubscriptionTier, estimatedWords: number = 500): Promise<UsageCheckResult> {
    const usage = await this.getUserUsage(userId);
    if (!usage) {
      return { allowed: false, reason: 'Unable to fetch usage data' };
    }

    const limits = getLimitsForTier(tier);

    // Check monthly generation limit
    if (!isWithinLimit(usage.aiGenerationsCount, limits.aiGenerationsPerMonth)) {
      return {
        allowed: false,
        reason: 'Monthly AI generation limit reached',
        limitType: 'aiGenerations',
        currentUsage: usage.aiGenerationsCount,
        limit: limits.aiGenerationsPerMonth,
      };
    }

    // Check words per generation limit
    if (!isWithinLimit(estimatedWords, limits.maxWordsPerGeneration)) {
      return {
        allowed: false,
        reason: 'Requested word count exceeds limit',
        limitType: 'wordsPerGeneration',
        currentUsage: estimatedWords,
        limit: limits.maxWordsPerGeneration,
      };
    }

    // Check rate limiting
    const now = new Date();
    const timeSinceLastRequest = now.getTime() - usage.lastRequestTime.getTime();

    if (timeSinceLastRequest < 60000) { // Within last minute
      if (usage.requestsInLastMinute >= limits.maxRequestsPerMinute) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded. Please wait a moment.',
          limitType: 'rateLimit',
          currentUsage: usage.requestsInLastMinute,
          limit: limits.maxRequestsPerMinute,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Track an AI generation
   */
  async trackAIGeneration(userId: string, wordsGenerated: number): Promise<void> {
    try {
      const usageRef = doc(db, 'usage', userId);
      const now = new Date();

      const usage = await this.getUserUsage(userId);
      if (!usage) return;

      const timeSinceLastRequest = now.getTime() - usage.lastRequestTime.getTime();
      const resetRequests = timeSinceLastRequest >= 60000; // Reset if more than a minute

      await updateDoc(usageRef, {
        aiGenerationsCount: increment(1),
        totalWordsGenerated: increment(wordsGenerated),
        lastRequestTime: Timestamp.fromDate(now),
        requestsInLastMinute: resetRequests ? 1 : increment(1),
      });
    } catch (error) {
      console.error('Error tracking AI generation:', error);
    }
  }

  /**
   * Check if user can create a new document
   */
  async canCreateDocument(userId: string, tier: SubscriptionTier): Promise<UsageCheckResult> {
    const usage = await this.getUserUsage(userId);
    if (!usage) {
      return { allowed: false, reason: 'Unable to fetch usage data' };
    }

    const limits = getLimitsForTier(tier);

    if (!isWithinLimit(usage.documentCount, limits.maxDocuments)) {
      return {
        allowed: false,
        reason: 'Document limit reached',
        limitType: 'documents',
        currentUsage: usage.documentCount,
        limit: limits.maxDocuments,
      };
    }

    return { allowed: true };
  }

  /**
   * Track document creation
   */
  async trackDocumentCreation(userId: string): Promise<void> {
    try {
      const usageRef = doc(db, 'usage', userId);
      await updateDoc(usageRef, {
        documentCount: increment(1),
      });
    } catch (error) {
      console.error('Error tracking document creation:', error);
    }
  }

  /**
   * Track document deletion
   */
  async trackDocumentDeletion(userId: string): Promise<void> {
    try {
      const usageRef = doc(db, 'usage', userId);
      await updateDoc(usageRef, {
        documentCount: increment(-1),
      });
    } catch (error) {
      console.error('Error tracking document deletion:', error);
    }
  }

  /**
   * Check if user can create a new series
   */
  async canCreateSeries(userId: string, tier: SubscriptionTier): Promise<UsageCheckResult> {
    const usage = await this.getUserUsage(userId);
    if (!usage) {
      return { allowed: false, reason: 'Unable to fetch usage data' };
    }

    const limits = getLimitsForTier(tier);

    if (!isWithinLimit(usage.seriesCount, limits.maxSeriesCount)) {
      return {
        allowed: false,
        reason: 'Series limit reached',
        limitType: 'series',
        currentUsage: usage.seriesCount,
        limit: limits.maxSeriesCount,
      };
    }

    return { allowed: true };
  }

  /**
   * Track series creation
   */
  async trackSeriesCreation(userId: string): Promise<void> {
    try {
      const usageRef = doc(db, 'usage', userId);
      await updateDoc(usageRef, {
        seriesCount: increment(1),
      });
    } catch (error) {
      console.error('Error tracking series creation:', error);
    }
  }

  /**
   * Track series deletion
   */
  async trackSeriesDeletion(userId: string): Promise<void> {
    try {
      const usageRef = doc(db, 'usage', userId);
      await updateDoc(usageRef, {
        seriesCount: increment(-1),
      });
    } catch (error) {
      console.error('Error tracking series deletion:', error);
    }
  }

  /**
   * Check if user can use lore analysis feature
   */
  canUseLoreAnalysis(tier: SubscriptionTier): UsageCheckResult {
    const limits = getLimitsForTier(tier);

    if (!limits.canUseLoreAnalysis) {
      return {
        allowed: false,
        reason: 'Lore analysis is not available on your plan',
        limitType: 'feature',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can export to DOCX
   */
  canExportDocx(tier: SubscriptionTier): UsageCheckResult {
    const limits = getLimitsForTier(tier);

    if (!limits.canExportDocx) {
      return {
        allowed: false,
        reason: 'Document export is not available on your plan',
        limitType: 'feature',
      };
    }

    return { allowed: true };
  }

  /**
   * Reset usage for a new billing period
   */
  async resetUsageForNewPeriod(userId: string): Promise<void> {
    try {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const usageRef = doc(db, 'usage', userId);
      await updateDoc(usageRef, {
        periodStart: Timestamp.fromDate(now),
        periodEnd: Timestamp.fromDate(periodEnd),
        aiGenerationsCount: 0,
        totalWordsGenerated: 0,
        requestsInLastMinute: 0,
      });
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  }
}

// Export singleton instance
export const usageTrackingService = new UsageTrackingService();
