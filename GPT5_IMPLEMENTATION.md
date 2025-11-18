# GPT-5 Family Implementation

## Overview

Lorewise now uses the GPT-5 family of models with smart usage optimization:
- **GPT-5.1**: Premium model for complex, high-priority tasks (limited usage)
- **GPT-5 Mini**: Standard model for medium-priority tasks (unlimited usage)
- **GPT-5 Nano**: Lightweight model for simple tasks (unlimited usage)

## Model Selection Strategy

### GPT-5.1 (Limited Usage)
**When Used:**
- High-priority tasks: Final polish, consistency checks, dialogue improvement, description enhancement
- Only when profit margins allow (70% target, 50% minimum)
- Limited allocation per subscription tier

**Allocation Limits:**
- Free: 5 requests/month (~20% of total)
- Pro: 30% of monthly cost budget
- Premium: 40% of monthly cost budget

**Fallback:** If GPT-5.1 allocation is exhausted, falls back to GPT-5 Mini (still high quality, unlimited)

### GPT-5 Mini (Unlimited Usage)
**When Used:**
- Medium-priority tasks: Scene expansion, story continuation, general chat
- Fallback for high-priority tasks when GPT-5.1 is unavailable
- All users have unlimited access

**Cost:** Very low ($0.15/1M input, $0.60/1M output)

### GPT-5 Nano (Unlimited Usage)
**When Used:**
- Low-priority tasks: Text shortening, rephrasing, simple edits
- All users have unlimited access

**Cost:** Lowest ($0.10/1M input, $0.40/1M output)

## Task Priority Mapping

| Task Type | Priority | Model | Usage |
|-----------|----------|-------|-------|
| `improve` | High | GPT-5.1 → GPT-5 Mini | Limited → Unlimited |
| `consistency` | High | GPT-5.1 → GPT-5 Mini | Limited → Unlimited |
| `dialogue` | High | GPT-5.1 → GPT-5 Mini | Limited → Unlimited |
| `description` | High | GPT-5.1 → GPT-5 Mini | Limited → Unlimited |
| `expand` | Medium | GPT-5 Mini | Unlimited |
| `continue` | Medium | GPT-5 Mini | Unlimited |
| `chat` | Medium | GPT-5 Mini | Unlimited |
| `shorten` | Low | GPT-5 Nano | Unlimited |
| `rephrase` | Low | GPT-5 Nano | Unlimited |

## Profit Margin Protection

The system automatically protects profit margins:

1. **Real-time Cost Tracking**: Tracks all AI costs per user
2. **Profit Margin Calculation**: Calculates profit margin in real-time
3. **Smart Model Selection**: Only uses GPT-5.1 when profit margin allows
4. **Automatic Fallback**: Switches to GPT-5 Mini if GPT-5.1 would hurt margins

### Profit Targets

| Tier | Revenue | Target Margin | Max Cost | GPT-5.1 Budget |
|------|---------|---------------|----------|----------------|
| Free | $0 | N/A | < $0.50 | 5 requests |
| Pro | $9.99 | 70% | $2.99 | 30% of budget |
| Premium | $19.99 | 70% | $5.99 | 40% of budget |

## Cost Structure (Estimated)

### GPT-5.1 (Premium)
- Input: $5.00 per 1M tokens
- Output: $15.00 per 1M tokens
- **Usage:** Limited based on profit margins

### GPT-5 Mini (Standard)
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- **Usage:** Unlimited

### GPT-5 Nano (Lightweight)
- Input: $0.10 per 1M tokens
- Output: $0.40 per 1M tokens
- **Usage:** Unlimited

## Implementation Details

### Files Modified

1. **`src/services/modelSelectionService.ts`**
   - Updated `MODEL_COSTS` with GPT-5 family
   - Smart selection logic for GPT-5.1 vs Mini vs Nano
   - Profit margin protection
   - Unlimited tracking for Mini/Nano

2. **`src/services/aiService.ts`**
   - Default model changed to GPT-5 Mini
   - All methods use smart model selection

### How It Works

1. **User makes AI request** → System determines task priority
2. **High priority?** → Check if GPT-5.1 allocation available and profit margin allows
   - Yes → Use GPT-5.1
   - No → Fallback to GPT-5 Mini (unlimited)
3. **Medium priority?** → Use GPT-5 Mini (unlimited)
4. **Low priority?** → Use GPT-5 Nano (unlimited)
5. **Track costs** → Update Firestore with usage and costs

## User Experience

### What Users See

- **Marketing:** "Powered by GPT-5" (no mention of Mini/Nano)
- **Quality:** High-quality responses for important tasks
- **Speed:** Fast responses for simple tasks
- **No Limits:** Unlimited usage for most tasks (only GPT-5.1 is limited)

### What Users Don't See

- Model switching (automatic and seamless)
- Cost tracking (internal only)
- Profit margin calculations (internal only)
- Allocation limits (handled automatically)

## Monitoring

### Key Metrics

1. **GPT-5.1 Usage Rate**
   - Track how often GPT-5.1 is used vs fallback to Mini
   - Monitor allocation exhaustion rates

2. **Profit Margins**
   - Average profit margin per tier
   - Cost per user per tier

3. **Model Distribution**
   - Percentage of requests using each model
   - Cost breakdown by model

### Firestore Collections

**`userAICosts`** - Tracks per-user costs:
```typescript
{
  userId: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  totalCostThisPeriod: number;
  premiumModelCost: number;      // GPT-5.1 costs
  standardModelCost: number;     // GPT-5 Mini/Nano costs
  premiumRequests: number;       // GPT-5.1 request count
  standardRequests: number;       // GPT-5 Mini/Nano request count
  premiumAllocationUsed: number; // GPT-5.1 allocation percentage
  premiumAllocationLimit: number; // GPT-5.1 allocation limit
  // ... other fields
}
```

## Updating Pricing

When actual GPT-5 pricing is available, update `MODEL_COSTS` in `modelSelectionService.ts`:

```typescript
export const MODEL_COSTS = {
  'gpt-5.1': {
    input: ACTUAL_INPUT_PRICE,   // Update with real pricing
    output: ACTUAL_OUTPUT_PRICE, // Update with real pricing
    name: 'GPT-5.1',
    tier: 'premium' as const,
    unlimited: false,
  },
  'gpt-5-mini': {
    input: ACTUAL_INPUT_PRICE,   // Update with real pricing
    output: ACTUAL_OUTPUT_PRICE, // Update with real pricing
    name: 'GPT-5 Mini',
    tier: 'standard' as const,
    unlimited: true,
  },
  'gpt-5-nano': {
    input: ACTUAL_INPUT_PRICE,   // Update with real pricing
    output: ACTUAL_OUTPUT_PRICE, // Update with real pricing
    name: 'GPT-5 Nano',
    tier: 'standard' as const,
    unlimited: true,
  },
};
```

## Benefits

1. **Maximized Profit**: GPT-5.1 only used when profitable
2. **Unlimited Usage**: Mini and Nano provide unlimited access
3. **Quality Maintained**: High-priority tasks get best model when available
4. **Cost Effective**: Simple tasks use cheapest model
5. **Automatic Optimization**: System handles all decisions automatically

## Future Enhancements

1. **Dynamic Complexity Detection**: Analyze request complexity to better select models
2. **User Preferences**: Allow users to prefer quality vs speed
3. **Time-based Optimization**: Use GPT-5.1 more during off-peak hours
4. **A/B Testing**: Test different allocation strategies

