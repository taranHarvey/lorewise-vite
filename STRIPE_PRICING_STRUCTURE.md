# Lorewise Pricing Structure

## 📊 Subscription Tiers

### 🆓 **Free Plan** - $0/month
**Target:** Users trying out the platform

**Limits:**
- **Books:** Up to 3 books
- **Word Count:** 10,000 words per book (perfect for short stories)
- **AI Generation:** 25 GPT-4 requests per month

**Features:**
- Up to 3 books
- 10,000 words per book
- 25 GPT-4 requests per month
- Auto-save
- Cloud storage

**Note:** 10,000 words is enough for short stories and novellas (e.g., "The Twits" by Roald Dahl is ~8,000 words). 25 GPT-4 requests allow users to experience premium AI quality while encouraging upgrades.

---

### ⭐ **Pro Plan** - $9.99/month
**Target:** Serious writers (80% of users)

**Limits:**
- **Books:** Up to 15 books
- **Word Count:** 200,000 words per book
- **AI Generation:** 200 GPT-4 requests per month + unlimited GPT-3.5 fallback

**Features:**
- Up to 15 books
- 200,000 words per book
- 200 GPT-4 requests per month
- Unlimited GPT-3.5 fallback (keeps users engaged)
- Priority support
- Export options
- Advanced editing tools

**Strategy:** Lower price point to get users in the door. Fallback model ensures users can continue writing even after GPT-4 limit.

---

### 💎 **Premium Plan** - $19.99/month
**Target:** Professional authors and power users

**Limits:**
- **Books:** Unlimited
- **Word Count:** Unlimited
- **AI Generation:** 500 GPT-4 requests per month + unlimited GPT-3.5 fallback

**Features:**
- Unlimited books
- Unlimited word count
- 500 GPT-4 requests per month
- Unlimited GPT-3.5 fallback
- Priority support
- All Pro features
- Early access to new features

**Strategy:** Competitive pricing to attract power users while maintaining profitability.

---

## 🔧 Implementation Status

### ✅ Completed:
1. ✅ Stripe account setup
2. ✅ Publishable key configured in `.env.local`
3. ✅ Pricing structure defined in `src/lib/stripe.ts`
4. ✅ Pricing page component created
5. ✅ Stripe context and hooks set up
6. ✅ Frontend integration complete

### ⏳ Next Steps:
1. **Create Products in Stripe Dashboard:**
   - Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
   - Create "Lorewise Pro" product with $9.99/month price
   - Create "Lorewise Premium" product with $19.99/month price
   - Copy the Price IDs (they look like `price_1ABC123...`)

2. **Update Configuration:**
   - Replace `price_1234567890` in `src/lib/stripe.ts` with Pro plan Price ID
   - Replace `price_0987654321` in `src/lib/stripe.ts` with Premium plan Price ID

3. **Backend API (Required for Live Payments):**
   - Set up `/api/create-checkout-session` endpoint
   - Set up `/api/create-customer-portal-session` endpoint
   - Set up `/api/subscriptions/:userId` endpoint
   - Configure Stripe webhooks

4. **Implement Usage Limits:**
   - Add middleware to check user's plan limits
   - Track AI requests per user per month
   - Enforce book count limits on dashboard
   - Enforce word count limits in editor

---

## 📝 Usage Limit Implementation Guide

### Book Limit Enforcement
```typescript
// In Dashboard.tsx or documentService.ts
const canCreateNewBook = (userPlan: string, currentBookCount: number) => {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  if (plan.limits.maxBooks === 'unlimited') return true;
  return currentBookCount < plan.limits.maxBooks;
};
```

### AI Request Tracking
```typescript
// In aiService.ts
const canMakeAIRequest = async (userId: string, userPlan: string) => {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  if (plan.limits.aiRequests === 'unlimited') return true;
  
  const currentMonth = new Date().getMonth();
  const requestCount = await getMonthlyAIRequestCount(userId, currentMonth);
  return requestCount < plan.limits.aiRequests;
};
```

### Word Count Limit
```typescript
// In TiptapEditor.tsx
const canSaveDocument = (wordCount: number, userPlan: string) => {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  if (plan.limits.wordsPerBook === 'unlimited') return true;
  return wordCount <= plan.limits.wordsPerBook;
};
```

---

## 🧪 Testing

### Test Cards
Use Stripe's test cards to test checkout:
- **Success:** `4242 4242 4242 4242`
- **Requires Auth:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`

### Test Scenarios
1. Sign up for Pro plan
2. Verify limits are enforced
3. Upgrade from Pro to Premium
4. Verify limits are updated
5. Cancel subscription
6. Verify user returns to Free plan

---

## 🚀 Go Live Checklist

- [ ] Replace test API keys with live keys
- [ ] Update `.env.local` with live publishable key
- [ ] Create live products in Stripe
- [ ] Update price IDs in configuration
- [ ] Set up live webhooks
- [ ] Test checkout flow with live cards
- [ ] Test subscription updates
- [ ] Test cancellation flow
- [ ] Implement proper error handling
- [ ] Add analytics tracking

---

## 📞 Support

If you encounter any issues:
1. Check Stripe Dashboard logs
2. Check browser console for errors
3. Verify environment variables are set
4. Ensure backend endpoints are responding
5. Check webhook delivery status

