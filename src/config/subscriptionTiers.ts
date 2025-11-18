/**
 * Subscription tier definitions and usage limits for Lorewise
 */

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium'
}

export interface UsageLimits {
  // AI Generation limits
  aiGenerationsPerMonth: number;
  maxWordsPerGeneration: number;

  // Document limits
  maxDocuments: number;
  maxSeriesCount: number;

  // Lore limits
  maxLoreSize: number; // in characters

  // Feature access
  canExportDocx: boolean;
  canUseLoreAnalysis: boolean;
  canAccessAdvancedAI: boolean;

  // Rate limits
  maxRequestsPerMinute: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  [SubscriptionTier.FREE]: {
    aiGenerationsPerMonth: 50,
    maxWordsPerGeneration: 500,
    maxDocuments: 3,
    maxSeriesCount: 1,
    maxLoreSize: 10000, // 10k characters
    canExportDocx: false,
    canUseLoreAnalysis: false,
    canAccessAdvancedAI: false,
    maxRequestsPerMinute: 5,
  },

  [SubscriptionTier.PRO]: {
    aiGenerationsPerMonth: 500,
    maxWordsPerGeneration: 2000,
    maxDocuments: 50,
    maxSeriesCount: 10,
    maxLoreSize: 100000, // 100k characters
    canExportDocx: true,
    canUseLoreAnalysis: true,
    canAccessAdvancedAI: false,
    maxRequestsPerMinute: 20,
  },

  [SubscriptionTier.PREMIUM]: {
    aiGenerationsPerMonth: -1, // unlimited
    maxWordsPerGeneration: -1, // unlimited
    maxDocuments: -1, // unlimited
    maxSeriesCount: -1, // unlimited
    maxLoreSize: -1, // unlimited
    canExportDocx: true,
    canUseLoreAnalysis: true,
    canAccessAdvancedAI: true,
    maxRequestsPerMinute: 60,
  },
};

export interface SubscriptionData {
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get the limits for a specific subscription tier
 */
export function getLimitsForTier(tier: SubscriptionTier): UsageLimits {
  return SUBSCRIPTION_LIMITS[tier];
}

/**
 * Check if a value is unlimited (-1)
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Check if usage is within limit
 */
export function isWithinLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return true;
  return current < limit;
}
