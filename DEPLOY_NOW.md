# 🚀 Deploy Lorewise to Firebase - Quick Guide

## ⚠️ IMPORTANT: Backend Must Be Deployed First!

Your frontend needs a backend API. You have two options:

### Option A: Deploy Backend First (Recommended)
1. Deploy `server.js` to Railway/Render (see `FIREBASE_DEPLOYMENT.md`)
2. Get your backend URL (e.g., `https://lorewise-backend.up.railway.app`)
3. Update `.env`: `VITE_API_URL=https://your-backend-url.com`
4. Rebuild: `npm run build`
5. Deploy frontend: `firebase deploy --only hosting`

### Option B: Deploy Frontend Now (For Testing)
- Frontend will work for UI, but Stripe/API calls will fail until backend is deployed
- Good for testing the UI deployment process

---

## 🎯 Quick Deploy Steps

### 1. Update Environment Variables (If Needed)

**For Production:**
```bash
# Edit .env file
VITE_API_URL=https://your-backend-url.com  # Update this!
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...    # Use live key for production
VITE_OPENAI_API_KEY=sk-proj-...             # Your OpenAI key
```

**For Testing (Current Setup):**
- Keep test keys for now
- Update `VITE_API_URL` once backend is deployed

### 2. Build Production Bundle

```bash
npm run build
```

✅ Already done! Your `dist` folder is ready.

### 3. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

This will:
- Upload your `dist` folder to Firebase Hosting
- Make your site live at: `https://lorewise-89533.web.app`

### 4. Verify Deployment

Visit: `https://lorewise-89533.web.app`

Test:
- [ ] Site loads
- [ ] Can sign up/login
- [ ] Dashboard works
- [ ] Stripe checkout (will fail until backend is deployed)

---

## 🔄 After Backend is Deployed

1. **Update `.env`** with backend URL
2. **Rebuild**: `npm run build`
3. **Redeploy**: `firebase deploy --only hosting`

---

## 📝 Next Steps

1. **Deploy Backend**: See `FIREBASE_DEPLOYMENT.md` → Backend Deployment section
2. **Set Up Stripe Webhooks**: See `FIREBASE_DEPLOYMENT.md` → Stripe Webhook Setup
3. **Switch to Live Keys**: Update `.env` with `pk_live_` and `sk_live_` keys
4. **Test Everything**: Run through the post-deployment checklist

---

## 🐛 Troubleshooting

**"Site not found"**
- Check Firebase Console → Hosting
- Verify deployment completed successfully

**"API calls failing"**
- Backend not deployed yet (expected)
- Check `VITE_API_URL` in `.env` matches your backend URL

**"Stripe errors"**
- Verify Stripe keys are correct
- Check if using test keys in production (switch to live keys)

---

## ✅ Ready to Deploy?

Run this command:
```bash
firebase deploy --only hosting
```

Your site will be live in ~30 seconds! 🎉

