# Smart Model Selection & Profit Optimization

## Overview

Lorewise now uses intelligent AI model selection to optimize costs while maintaining quality and achieving target profit margins (70% target, 50% minimum).

## How It Works

### Model Selection Strategy

The system automatically selects the best AI model based on:

1. **Task Priority**
   - **High Priority** (Premium models): Final polish, consistency checks, dialogue improvement, description enhancement
   - **Medium Priority** (Smart selection): Scene expansion, story continuation
   - **Low Priority** (Standard models): Text shortening, rephrasing, brainstorming

2. **User's Premium Allocation**
   - Free tier: 20% premium allocation (5 premium requests out of 25)
   - Pro tier: 100% premium allocation (all 200 requests can be premium)
   - Premium tier: 100% premium allocation (all 500 requests can be premium)

3. **Profit Margin Targets**
   - Free: Minimize costs (no revenue)
   - Pro ($9.99/month): Target 70% profit, minimum 50% ($2.99 max cost)
   - Premium ($19.99/month): Target 70% profit, minimum 50% ($5.99 max cost)

4. **Real-time Cost Tracking**
   - Tracks token usage and costs per user
   - Monitors profit margins in real-time
   - Automatically switches to cheaper models when approaching limits

## Model Pricing (as of 2024)

### Premium Models (for final polish)
- **GPT-4o**: $2.50/1M input tokens, $10.00/1M output tokens
- **GPT-4 Turbo**: $10.00/1M input tokens, $30.00/1M output tokens
- **GPT-5**: (Ready for when available - update pricing in `modelSelectionService.ts`)

### Standard Models (for brainstorming)
- **GPT-3.5 Turbo**: $0.50/1M input tokens, $1.50/1M output tokens

## Task Type Mapping

| Task Type | Priority | Typical Model | Use Case |
|-----------|----------|---------------|----------|
| `improve` | High | GPT-4o/GPT-5 | Final polish, quality improvement |
| `consistency` | High | GPT-4o/GPT-5 | Lore consistency checks |
| `dialogue` | High | GPT-4o/GPT-5 | Character voice enhancement |
| `description` | High | GPT-4o/GPT-5 | Vivid description enhancement |
| `expand` | Medium | Smart selection | Scene expansion |
| `continue` | Medium | Smart selection | Story continuation |
| `shorten` | Low | GPT-3.5 | Text condensation |
| `rephrase` | Low | GPT-3.5 | Simple rephrasing |
| `chat` | Medium | Smart selection | General AI chat |

## Implementation Details

### Files Created/Modified

1. **`src/services/modelSelectionService.ts`** (NEW)
   - Smart model selection logic
   - Cost tracking and profit margin calculation
   - Premium allocation management

2. **`src/services/aiService.ts`** (MODIFIED)
   - Updated to use smart model selection
   - Tracks costs after each API call
   - Passes userId to model selection service

### How to Update for GPT-5

When GPT-5 becomes available:

1. **Update `MODEL_COSTS` in `modelSelectionService.ts`:**
```typescript
'gpt-5': {
  input: 5.00,   // Update with actual pricing
  output: 15.00,
  name: 'GPT-5',
  tier: 'premium' as const,
},
```

2. **Update default model in `aiService.ts`:**
```typescript
private defaultModel: ModelName = 'gpt-5';
```

3. **Update model selection logic:**
```typescript
const premiumModel: ModelName = 'gpt-5'; // In selectModel method
```

## Usage in Code

### For Components/Hooks

When calling AI service methods, pass the `userId`:

```typescript
// In your component/hook
const { user } = useAuth();

// Chat with AI
const response = await aiService.chatWithAI(
  message,
  context,
  chatHistory,
  user?.uid // Pass userId here
);

// Get inline edits
const edits = await aiService.getInlineEdits(
  request,
  user?.uid // Pass userId here
);
```

### Example: Updating useAI Hook

```typescript
// In useAI.ts
const { user } = useAuth();

const chatWithAI = useCallback(async (message: string): Promise<string> => {
  // ... existing code ...
  const response = await aiService.chatWithAI(
    message,
    context,
    chatHistory,
    user?.uid // Add userId parameter
  );
  return response;
}, [buildContext, chatHistory, user?.uid]);
```

## Cost Tracking

Costs are tracked in Firestore collection `userAICosts`:

```typescript
{
  userId: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  totalCostThisPeriod: number;      // Total cost in USD
  premiumModelCost: number;         // Cost from premium models
  standardModelCost: number;        // Cost from standard models
  totalTokensUsed: number;
  premiumTokensUsed: number;
  standardTokensUsed: number;
  totalRequests: number;
  premiumRequests: number;
  standardRequests: number;
  premiumAllocationUsed: number;    // Percentage 0-100
  premiumAllocationLimit: number;    // Based on subscription tier
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  lastUpdated: Date;
}
```

## Profit Margin Calculation

```typescript
Profit Margin = (Revenue - Cost) / Revenue

Example (Pro tier):
- Revenue: $9.99/month
- Target Cost: $2.99 (30% of revenue)
- Target Profit: $7.00 (70% margin)
- Minimum Acceptable Cost: $4.99 (50% margin)
```

## Marketing

**User-facing messaging:**
- "Powered by GPT-5" (when GPT-5 is available)
- Don't show usage details or model switching
- Users just see high-quality AI assistance

**What users experience:**
- High-quality AI responses for important tasks
- Fast, cost-effective responses for brainstorming
- Seamless experience - they don't need to know which model is used

## Monitoring

### Key Metrics to Track

1. **Profit Margins by Tier**
   - Free: Keep costs < $0.50/month
   - Pro: Maintain 50-70% margin
   - Premium: Maintain 50-70% margin

2. **Model Usage Distribution**
   - Track premium vs standard model usage
   - Monitor allocation exhaustion rates

3. **Cost per User**
   - Average cost per free user
   - Average cost per pro user
   - Average cost per premium user

### Firestore Queries

```typescript
// Get all user costs for a period
const costsRef = collection(db, 'userAICosts');
const costsSnapshot = await getDocs(costsRef);

// Calculate average cost per tier
const costsByTier = {
  free: [],
  pro: [],
  premium: []
};

costsSnapshot.forEach(doc => {
  const data = doc.data();
  costsByTier[data.subscriptionTier].push(data.totalCostThisPeriod);
});
```

## Future Enhancements

1. **Dynamic Pricing**
   - Adjust model selection based on time of day
   - Prioritize premium models during peak usage

2. **User Preferences**
   - Allow users to prefer quality vs speed
   - "Quality mode" vs "Fast mode" toggle

3. **A/B Testing**
   - Test different model selection strategies
   - Optimize for user satisfaction vs cost

4. **Cost Alerts**
   - Alert when approaching profit margin thresholds
   - Automatic model downgrade when limits reached

## Troubleshooting

### Issue: Users always getting GPT-3.5

**Check:**
1. Is premium allocation exhausted? (`premiumAllocationUsed >= premiumAllocationLimit`)
2. Is profit margin below minimum? (Check `calculateProfitMargin`)
3. Is task priority set correctly? (High priority tasks should use premium)

### Issue: Costs too high

**Solutions:**
1. Adjust `PROFIT_TARGETS` max costs
2. Increase low-priority task usage of GPT-3.5
3. Reduce premium allocation limits

### Issue: Users complaining about quality

**Solutions:**
1. Increase premium allocation for high-priority tasks
2. Adjust task priority mapping
3. Consider user preference settings

## Notes

- GPT-5 doesn't exist yet, but the system is ready for it
- Update model names and pricing when GPT-5 is available
- Current implementation uses GPT-4o as the premium model
- All cost calculations are in USD
- Token estimates are approximate (1 token ≈ 4 characters)

