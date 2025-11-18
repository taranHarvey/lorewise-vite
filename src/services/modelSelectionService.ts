/**
 * Smart Model Selection Service
 * 
 * This service intelligently selects AI models based on:
 * - Task type (brainstorming vs polish)
 * - User's remaining premium allocation
 * - Target profit margins (70% target, 50% minimum)
 * - Subscription tier
 */

import { collection, doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { AIActionMode } from './aiService';

// Model definitions with costs (per 1M tokens)
// GPT-5 family pricing - update with actual pricing from OpenAI
export const MODEL_COSTS = {
  // Premium model (for complex, high-priority tasks - LIMITED USAGE)
  'gpt-5.1': {
    input: 5.00,   // $5.00 per 1M input tokens (update with actual GPT-5.1 pricing)
    output: 15.00, // $15.00 per 1M output tokens (update with actual GPT-5.1 pricing)
    name: 'GPT-5.1',
    tier: 'premium' as const,
    unlimited: false, // Limited usage based on profit margins
  },
  
  // Standard models (for most tasks - UNLIMITED USAGE)
  'gpt-5-mini': {
    input: 0.15,   // $0.15 per 1M input tokens (update with actual GPT-5-mini pricing)
    output: 0.60,  // $0.60 per 1M output tokens (update with actual GPT-5-mini pricing)
    name: 'GPT-5 Mini',
    tier: 'standard' as const,
    unlimited: true, // Unlimited usage
  },
  'gpt-5-nano': {
    input: 0.10,   // $0.10 per 1M input tokens (update with actual GPT-5-nano pricing)
    output: 0.40,  // $0.40 per 1M output tokens (update with actual GPT-5-nano pricing)
    name: 'GPT-5 Nano',
    tier: 'standard' as const,
    unlimited: true, // Unlimited usage
  },
} as const;

export type ModelName = keyof typeof MODEL_COSTS;

// Map internal model names to actual OpenAI API model names
// GPT-5 models use date suffixes (e.g., gpt-5-mini-2025-08-07)
export const MODEL_API_NAMES: Record<ModelName, string> = {
  'gpt-5.1': 'gpt-5.1-2025-08-07',           // GPT-5.1 premium model (update date if needed)
  'gpt-5-mini': 'gpt-5-mini-2025-08-07',     // GPT-5 Mini standard model (update date if needed)
  'gpt-5-nano': 'gpt-5-nano-2025-08-07',     // GPT-5 Nano lightweight model (update date if needed)
};

/**
 * Get the actual OpenAI API model name for an internal model name
 */
export function getAPIModelName(internalModel: ModelName): string {
  return MODEL_API_NAMES[internalModel];
}

// Task type classification
export type TaskPriority = 'high' | 'medium' | 'low';

// Map AI action modes to task priorities and complexity
const TASK_PRIORITY_MAP: Record<AIActionMode, TaskPriority> = {
  // High priority - use GPT-5.1 (complex, quality-critical tasks)
  'improve': 'high',        // Final polish - needs GPT-5.1
  'consistency': 'high',    // Important for story quality - needs GPT-5.1
  'dialogue': 'high',       // Character voice is critical - needs GPT-5.1
  'description': 'high',    // Vivid descriptions matter - needs GPT-5.1
  
  // Medium priority - use GPT-5 Mini (moderate complexity)
  'expand': 'medium',       // Scene expansion - GPT-5 Mini sufficient
  'continue': 'medium',     // Story continuation - GPT-5 Mini sufficient
  
  // Low priority - use GPT-5 Nano (simple tasks)
  'shorten': 'low',         // Simple task - GPT-5 Nano
  'rephrase': 'low',        // Simple task - GPT-5 Nano
};

// Chat requests - determine based on message complexity
const CHAT_PRIORITY: TaskPriority = 'medium'; // Default to medium, can be upgraded to high for complex queries

interface UserCostTracking {
  userId: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  // Cost tracking (in USD)
  totalCostThisPeriod: number;
  premiumModelCost: number;  // Cost from premium models (GPT-5.1)
  standardModelCost: number; // Cost from standard models (GPT-5 Mini/Nano)
  
  // Token usage
  totalTokensUsed: number;
  premiumTokensUsed: number;
  standardTokensUsed: number;
  
  // Request counts
  totalRequests: number;
  premiumRequests: number;
  standardRequests: number;
  
  // Premium allocation (how much premium model usage they have left)
  premiumAllocationUsed: number; // Percentage 0-100
  premiumAllocationLimit: number; // Based on subscription tier
  
  lastUpdated: Date;
}

interface ModelSelectionResult {
  model: ModelName;
  reason: string;
  estimatedCost: number;
  willUsePremiumAllocation: boolean;
}

// Subscription tier profit targets
const PROFIT_TARGETS = {
  free: {
    targetMargin: 0,      // No revenue, minimize costs
    minMargin: 0,
    maxMonthlyCost: 0.50, // Keep free tier costs very low
  },
  pro: {
    targetMargin: 0.70,   // 70% profit target
    minMargin: 0.50,      // 50% minimum acceptable
    monthlyRevenue: 9.99,
    maxMonthlyCost: 2.99, // $9.99 * 0.30 = ~$3 max cost
  },
  premium: {
    targetMargin: 0.70,   // 70% profit target
    minMargin: 0.50,      // 50% minimum acceptable
    monthlyRevenue: 19.99,
    maxMonthlyCost: 5.99, // $19.99 * 0.30 = ~$6 max cost
  },
} as const;

export class ModelSelectionService {
  /**
   * Select the best model for a given task
   * Smart selection: GPT-5.1 for complex tasks (limited), GPT-5 Mini/Nano for others (unlimited)
   */
  async selectModel(
    userId: string,
    taskType: AIActionMode | 'chat',
    estimatedInputTokens: number = 1000,
    estimatedOutputTokens: number = 500
  ): Promise<ModelSelectionResult> {
    // Get user's cost tracking
    const costTracking = await this.getUserCostTracking(userId);
    
    // Determine task priority
    const priority = taskType === 'chat' ? CHAT_PRIORITY : TASK_PRIORITY_MAP[taskType];
    
    // Calculate current profit margin
    const profitMargin = this.calculateProfitMargin(costTracking);
    
    // High priority tasks: Use GPT-5.1 if profit margin allows, otherwise fallback to GPT-5 Mini
    if (priority === 'high') {
      const shouldUseGPT51 = this.shouldUseGPT51(
        costTracking,
        profitMargin,
        estimatedInputTokens,
        estimatedOutputTokens
      );
      
      if (shouldUseGPT51) {
        const cost = this.estimateCost('gpt-5.1', estimatedInputTokens, estimatedOutputTokens);
        return {
          model: 'gpt-5.1',
          reason: `GPT-5.1 selected for high-priority task. Premium allocation: ${costTracking.premiumAllocationUsed.toFixed(1)}% used. Profit margin: ${(profitMargin * 100).toFixed(1)}%.`,
          estimatedCost: cost,
          willUsePremiumAllocation: true,
        };
      } else {
        // GPT-5.1 allocation exhausted or profit margin too low - fallback to GPT-5 Mini
        // Still good quality for high-priority tasks, just unlimited usage
        const cost = this.estimateCost('gpt-5-mini', estimatedInputTokens, estimatedOutputTokens);
        let reason = `GPT-5 Mini selected for high-priority task (GPT-5.1 allocation exhausted). Unlimited usage.`;
        if (costTracking.premiumAllocationUsed >= costTracking.premiumAllocationLimit) {
          reason = `GPT-5 Mini selected for high-priority task (GPT-5.1 allocation exhausted: ${costTracking.premiumAllocationUsed.toFixed(1)}%). Unlimited usage.`;
        } else if (profitMargin < PROFIT_TARGETS[costTracking.subscriptionTier].minMargin) {
          reason = `GPT-5 Mini selected for high-priority task (profit margin protection: ${(profitMargin * 100).toFixed(1)}%). Unlimited usage.`;
        }
        return {
          model: 'gpt-5-mini',
          reason,
          estimatedCost: cost,
          willUsePremiumAllocation: false,
        };
      }
    }
    
    // Medium priority tasks: Use GPT-5 Mini (unlimited)
    if (priority === 'medium') {
      const cost = this.estimateCost('gpt-5-mini', estimatedInputTokens, estimatedOutputTokens);
      return {
        model: 'gpt-5-mini',
        reason: `GPT-5 Mini selected for medium-priority task. Unlimited usage.`,
        estimatedCost: cost,
        willUsePremiumAllocation: false,
      };
    }
    
    // Low priority tasks: Use GPT-5 Nano (unlimited, cheapest)
    const cost = this.estimateCost('gpt-5-nano', estimatedInputTokens, estimatedOutputTokens);
    return {
      model: 'gpt-5-nano',
      reason: `GPT-5 Nano selected for low-priority task. Unlimited usage.`,
      estimatedCost: cost,
      willUsePremiumAllocation: false,
    };
  }
  
  /**
   * Check if we should use GPT-5.1 based on profit margins and allocation
   * Only use GPT-5.1 for high-priority tasks when profit margin allows
   */
  private shouldUseGPT51(
    costTracking: UserCostTracking,
    profitMargin: number,
    estimatedInputTokens: number,
    estimatedOutputTokens: number
  ): boolean {
    const tier = costTracking.subscriptionTier;
    const targets = PROFIT_TARGETS[tier];
    
    // Free tier: very limited GPT-5.1 usage (only 3-5 requests)
    if (tier === 'free') {
      return costTracking.premiumRequests < 5;
    }
    
    // Check if premium allocation is exhausted
    if (costTracking.premiumAllocationUsed >= costTracking.premiumAllocationLimit) {
      return false;
    }
    
    // Calculate projected cost with GPT-5.1
    const estimatedCost = this.estimateCost('gpt-5.1', estimatedInputTokens, estimatedOutputTokens);
    const projectedCost = costTracking.totalCostThisPeriod + estimatedCost;
    const projectedMargin = this.calculateProjectedProfitMargin(tier, projectedCost);
    
    // Don't use GPT-5.1 if it would push us below minimum profit margin
    if (projectedMargin < targets.minMargin) {
      return false;
    }
    
    // Use GPT-5.1 if we're within profit targets
    // For high-priority tasks, we're more lenient (allow up to target margin)
    return projectedMargin >= targets.minMargin;
  }
  
  /**
   * Track AI usage and costs
   */
  async trackUsage(
    userId: string,
    model: ModelName,
    inputTokens: number,
    outputTokens: number,
    actualCost: number
  ): Promise<void> {
    const costTracking = await this.getUserCostTracking(userId);
    const isPremium = MODEL_COSTS[model].tier === 'premium';
    
    // Update cost tracking
    const userCostRef = doc(db, 'userAICosts', userId);
    
    const updates: any = {
      totalCostThisPeriod: increment(actualCost),
      totalTokensUsed: increment(inputTokens + outputTokens),
      totalRequests: increment(1),
      lastUpdated: serverTimestamp(),
    };
    
    // GPT-5.1 is premium (limited), Mini and Nano are standard (unlimited)
    if (model === 'gpt-5.1') {
      updates.premiumModelCost = increment(actualCost);
      updates.premiumTokensUsed = increment(inputTokens + outputTokens);
      updates.premiumRequests = increment(1);
      
      // Calculate premium allocation used (based on subscription tier limits)
      const premiumAllocationPercent = this.calculatePremiumAllocationPercent(
        costTracking,
        actualCost
      );
      updates.premiumAllocationUsed = increment(premiumAllocationPercent);
    } else {
      // GPT-5 Mini and Nano are unlimited, track costs but don't count against allocation
      updates.standardModelCost = increment(actualCost);
      updates.standardTokensUsed = increment(inputTokens + outputTokens);
      updates.standardRequests = increment(1);
    }
    
    await setDoc(userCostRef, updates, { merge: true });
  }
  
  /**
   * Get user's cost tracking data
   */
  async getUserCostTracking(userId: string): Promise<UserCostTracking> {
    const costRef = doc(db, 'userAICosts', userId);
    const costSnap = await getDoc(costRef);
    
    // Get subscription tier from subscription service
    let subscriptionTier: 'free' | 'pro' | 'premium' = 'free';
    try {
      const subscriptionRef = doc(db, 'userSubscriptions', userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
      if (subscriptionSnap.exists()) {
        const planId = subscriptionSnap.data().planId || 'free';
        subscriptionTier = planId as 'free' | 'pro' | 'premium';
      }
    } catch (error) {
      console.error('Error fetching subscription tier:', error);
    }
    
    if (!costSnap.exists()) {
      // Initialize cost tracking
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const initialTracking: UserCostTracking = {
        userId,
        subscriptionTier,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        totalCostThisPeriod: 0,
        premiumModelCost: 0,
        standardModelCost: 0,
        totalTokensUsed: 0,
        premiumTokensUsed: 0,
        standardTokensUsed: 0,
        totalRequests: 0,
        premiumRequests: 0,
        standardRequests: 0,
        premiumAllocationUsed: 0,
        premiumAllocationLimit: this.getPremiumAllocationLimit(subscriptionTier),
        lastUpdated: now,
      };
      
      await setDoc(costRef, initialTracking);
      return initialTracking;
    }
    
    const data = costSnap.data();
    
    // Check if we need to reset for new billing period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (data.currentPeriodStart?.toDate) {
      const lastPeriodStart = data.currentPeriodStart.toDate();
      if (lastPeriodStart.getTime() !== periodStart.getTime()) {
        // New billing period - reset costs
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const resetTracking: Partial<UserCostTracking> = {
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          totalCostThisPeriod: 0,
          premiumModelCost: 0,
          standardModelCost: 0,
          totalTokensUsed: 0,
          premiumTokensUsed: 0,
          standardTokensUsed: 0,
          totalRequests: 0,
          premiumRequests: 0,
          standardRequests: 0,
          premiumAllocationUsed: 0,
          lastUpdated: now,
        };
        
        await setDoc(costRef, resetTracking, { merge: true });
        return { ...data, ...resetTracking } as UserCostTracking;
      }
    }
    
    return {
      userId,
      subscriptionTier: data.subscriptionTier || subscriptionTier,
      currentPeriodStart: data.currentPeriodStart?.toDate() || periodStart,
      currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(now.getFullYear(), now.getMonth() + 1, 0),
      totalCostThisPeriod: data.totalCostThisPeriod || 0,
      premiumModelCost: data.premiumModelCost || 0,
      standardModelCost: data.standardModelCost || 0,
      totalTokensUsed: data.totalTokensUsed || 0,
      premiumTokensUsed: data.premiumTokensUsed || 0,
      standardTokensUsed: data.standardTokensUsed || 0,
      totalRequests: data.totalRequests || 0,
      premiumRequests: data.premiumRequests || 0,
      standardRequests: data.standardRequests || 0,
      premiumAllocationUsed: data.premiumAllocationUsed || 0,
      premiumAllocationLimit: data.premiumAllocationLimit || this.getPremiumAllocationLimit(subscriptionTier),
      lastUpdated: data.lastUpdated?.toDate() || now,
    };
  }
  
  /**
   * Calculate profit margin
   */
  private calculateProfitMargin(costTracking: UserCostTracking): number {
    const tier = costTracking.subscriptionTier;
    const targets = PROFIT_TARGETS[tier];
    
    if (tier === 'free') {
      return 0; // No revenue
    }
    
    const revenue = targets.monthlyRevenue;
    const cost = costTracking.totalCostThisPeriod;
    const profit = revenue - cost;
    
    return profit / revenue;
  }
  
  /**
   * Calculate projected profit margin
   */
  private calculateProjectedProfitMargin(tier: 'free' | 'pro' | 'premium', projectedCost: number): number {
    const targets = PROFIT_TARGETS[tier];
    
    if (tier === 'free') {
      return 0;
    }
    
    const revenue = targets.monthlyRevenue;
    const profit = revenue - projectedCost;
    
    return profit / revenue;
  }
  
  /**
   * Estimate cost for a request
   */
  private estimateCost(
    model: ModelName,
    inputTokens: number,
    outputTokens: number
  ): number {
    const costs = MODEL_COSTS[model];
    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;
    return inputCost + outputCost;
  }
  
  /**
   * Get premium allocation limit based on subscription tier
   * This limits GPT-5.1 usage (Mini and Nano are unlimited)
   */
  private getPremiumAllocationLimit(tier: 'free' | 'pro' | 'premium'): number {
    // This represents the percentage/cost allocation for GPT-5.1
    // Free: Very limited (5 requests max)
    // Pro: Limited by profit margin (aim for 70% margin)
    // Premium: More generous but still limited by profit margin
    switch (tier) {
      case 'free':
        return 20; // 20% = ~5 GPT-5.1 requests out of 25 total
      case 'pro':
        return 30; // 30% of monthly cost can be GPT-5.1 (keeps profit margin healthy)
      case 'premium':
        return 40; // 40% of monthly cost can be GPT-5.1 (more generous for premium users)
    }
  }
  
  /**
   * Calculate premium allocation percentage used
   * For GPT-5.1 usage tracking
   */
  private calculatePremiumAllocationPercent(
    costTracking: UserCostTracking,
    additionalCost: number
  ): number {
    const tier = costTracking.subscriptionTier;
    
    if (tier === 'free') {
      // For free tier, track by request count (5 GPT-5.1 requests max)
      return (100 / 5); // Each GPT-5.1 request = 20% of allocation
    }
    
    // For paid tiers, track by cost percentage of monthly GPT-5.1 budget
    // GPT-5.1 budget is a percentage of max monthly cost
    const targets = PROFIT_TARGETS[tier];
    const maxMonthlyCost = targets.maxMonthlyCost;
    const gpt51Budget = maxMonthlyCost * (this.getPremiumAllocationLimit(tier) / 100);
    
    // Calculate what percentage of GPT-5.1 budget this request uses
    const costPercent = (additionalCost / gpt51Budget) * 100;
    
    return Math.min(costPercent, 100 - costTracking.premiumAllocationUsed);
  }
}

export const modelSelectionService = new ModelSelectionService();

