# Production Testing Checklist

Use this checklist to verify all critical functionality works correctly in production before going live.

## Pre-Launch Checklist

### Environment & Configuration
- [ ] All environment variables are set correctly (backend and frontend)
- [ ] Production Stripe keys are configured (not test keys)
- [ ] Production Stripe price IDs are set in `server.js`
- [ ] Firebase security rules are production-ready
- [ ] CORS is restricted to production domain only
- [ ] `.env` and `server.env` files are NOT committed to git
- [ ] SSL certificates are valid and working
- [ ] Custom domain is configured and working

### Backend Health
- [ ] Backend server is running and accessible
- [ ] Health check endpoint returns OK: `GET /api/health`
- [ ] Rate limiting is working (test with multiple rapid requests)
- [ ] CORS is blocking unauthorized origins
- [ ] Webhook endpoint is accessible: `POST /api/webhook`

### Frontend Health
- [ ] Frontend loads without errors
- [ ] No console errors in production build
- [ ] All API calls are going to production backend
- [ ] Firebase authentication is working
- [ ] Error boundary is working (test by intentionally breaking a component)

---

## User Flow Testing

### Authentication
- [ ] **Sign Up**
  - [ ] Can create new account with email/password
  - [ ] Email verification works (if enabled)
  - [ ] Redirects to dashboard after signup
  
- [ ] **Sign In**
  - [ ] Can sign in with email/password
  - [ ] Can sign in with Google
  - [ ] Redirects to dashboard after signin
  - [ ] Invalid credentials show appropriate error
  
- [ ] **Sign Out**
  - [ ] Sign out works correctly
  - [ ] Redirects to landing page
  - [ ] Protected routes are inaccessible after signout

### Dashboard
- [ ] **Series Management**
  - [ ] Can view all series
  - [ ] Can create new series
  - [ ] Series limit is enforced (free plan: 1 series)
  - [ ] Redirects to pricing when limit reached
  - [ ] Can delete series
  - [ ] Can edit series name/details
  - [ ] Series count updates after deletion

### Series Page
- [ ] **Book/Document Management**
  - [ ] Can view all books in a series
  - [ ] Can create new book
  - [ ] Book limit is enforced (free plan: 3 books)
  - [ ] Redirects to pricing when limit reached
  - [ ] Can delete book
  - [ ] Book count updates after deletion
  - [ ] Can navigate to editor from book list

### Editor
- [ ] **Document Editing**
  - [ ] Can open and edit documents
  - [ ] Changes are saved automatically
  - [ ] Can format text (bold, italic, etc.)
  - [ ] Can add headings, lists, etc.
  - [ ] Word count is tracked correctly
  - [ ] Word limit is enforced (free plan: 10,000 words)
  - [ ] Can export document (if feature exists)

### AI Features
- [ ] **AI Generation**
  - [ ] Can generate content with AI
  - [ ] AI request limit is enforced (free plan: 10 requests)
  - [ ] Error message shows when limit reached
  - [ ] Can use AI chat feature
  - [ ] AI suggestions work correctly
  - [ ] Rate limiting doesn't block legitimate requests

### Subscription & Billing
- [ ] **Pricing Page**
  - [ ] All plans are displayed correctly
  - [ ] Plan features are accurate
  - [ ] Can click "Get Started" on any plan
  
- [ ] **Checkout Flow**
  - [ ] Clicking plan redirects to Stripe checkout
  - [ ] Stripe checkout loads correctly
  - [ ] Can complete payment with test card
  - [ ] Success redirect works: `/dashboard?success=true`
  - [ ] Cancel redirect works: `/pricing?canceled=true`
  
- [ ] **Subscription Management**
  - [ ] Subscription status is displayed correctly
  - [ ] Current plan is shown in settings/dashboard
  - [ ] Can cancel subscription
  - [ ] Cancellation is reflected immediately
  - [ ] Can upgrade/downgrade plan
  - [ ] Plan changes are reflected correctly
  
- [ ] **Webhook Testing**
  - [ ] Complete a test subscription
  - [ ] Check Firestore `userSubscriptions` collection
  - [ ] Verify subscription data is correct:
    - [ ] `planId` matches selected plan
    - [ ] `status` is "active"
    - [ ] `currentPeriodStart` and `currentPeriodEnd` are set
    - [ ] `stripeSubscriptionId` is present
  - [ ] Cancel a subscription
  - [ ] Verify cancellation is reflected in Firestore
  - [ ] Test payment failure scenario (if possible)

### Settings
- [ ] **User Settings**
  - [ ] Can view account settings
  - [ ] Can update profile information
  - [ ] Can change password
  - [ ] Subscription management works

---

## Limit Enforcement Testing

### Free Plan Limits
- [ ] **Series Limit (1)**
  - [ ] Can create 1 series
  - [ ] Cannot create 2nd series
  - [ ] Redirects to pricing when attempting to create 2nd series
  - [ ] Can create new series after deleting one
  
- [ ] **Book Limit (3)**
  - [ ] Can create 3 books
  - [ ] Cannot create 4th book
  - [ ] Redirects to pricing when attempting to create 4th book
  - [ ] Can create new book after deleting one
  
- [ ] **Word Limit (10,000)**
  - [ ] Can add words up to limit
  - [ ] Cannot add words beyond limit
  - [ ] Error message shows when limit reached
  
- [ ] **AI Request Limit (10)**
  - [ ] Can make 10 AI requests
  - [ ] Cannot make 11th request
  - [ ] Error message shows when limit reached

### Pro Plan Limits (if testing)
- [ ] **Series Limit (5)**
- [ ] **Book Limit (15)**
- [ ] **Word Limit (200,000)**
- [ ] **AI Request Limit (200)**

### Premium Plan Limits (if testing)
- [ ] **Series Limit (unlimited)**
- [ ] **Book Limit (unlimited)**
- [ ] **Word Limit (unlimited)**
- [ ] **AI Request Limit (unlimited)**

---

## Error Handling Testing

### Error Boundary
- [ ] Intentionally break a component (e.g., throw error in render)
- [ ] Error boundary catches the error
- [ ] Error UI is displayed correctly
- [ ] "Try Again" button works
- [ ] "Go to Dashboard" button works
- [ ] Error details are shown in development mode only

### Network Errors
- [ ] Test with backend offline
- [ ] Appropriate error messages are shown
- [ ] App doesn't crash
- [ ] Can retry failed requests

### Validation Errors
- [ ] Invalid form inputs show errors
- [ ] Required fields are validated
- [ ] Email format validation works
- [ ] Password strength validation works (if implemented)

---

## Performance Testing

### Load Times
- [ ] Initial page load is < 3 seconds
- [ ] Dashboard loads quickly
- [ ] Editor opens quickly
- [ ] API responses are < 1 second

### Responsiveness
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] All buttons/links are clickable on mobile
- [ ] Text is readable on all screen sizes

---

## Security Testing

### Authentication
- [ ] Cannot access protected routes without login
- [ ] Session persists after page refresh
- [ ] Session expires after appropriate time
- [ ] Cannot access other users' data

### API Security
- [ ] Rate limiting prevents abuse
- [ ] CORS blocks unauthorized origins
- [ ] Input validation prevents malicious input
- [ ] SQL injection attempts are blocked (if applicable)

### Data Security
- [ ] Users can only see their own data
- [ ] Firestore rules prevent unauthorized access
- [ ] Sensitive data is not exposed in client-side code

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Final Checks

- [ ] All critical user flows work end-to-end
- [ ] No console errors in production
- [ ] No broken links or images
- [ ] All forms submit correctly
- [ ] All buttons/links work
- [ ] Analytics tracking is working (if implemented)
- [ ] Error monitoring is set up (if implemented)

---

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check server uptime
- [ ] Monitor API response times
- [ ] Watch for unusual traffic patterns
- [ ] Check Stripe webhook delivery
- [ ] Monitor user signups

### First Week
- [ ] Review user feedback
- [ ] Check for common errors
- [ ] Monitor subscription conversions
- [ ] Review performance metrics
- [ ] Check for any security issues

---

## Rollback Plan

If critical issues are found:
1. [ ] Document the issue
2. [ ] Revert to previous stable version
3. [ ] Notify users if necessary
4. [ ] Fix issue in development
5. [ ] Test fix thoroughly
6. [ ] Redeploy

---

## Notes

Use this section to document any issues found during testing:

```
Issue: 
Steps to reproduce:
Expected behavior:
Actual behavior:
Severity: [Critical/High/Medium/Low]
Status: [Open/Fixed/Deferred]
```

---

**Testing Date:** _______________
**Tester:** _______________
**Status:** [ ] Ready for Launch  [ ] Needs Fixes

