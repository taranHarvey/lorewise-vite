# Tiptap AI Integration Setup Guide (Start Plan)

## ✅ What's Been Installed

- ✅ **@tiptap-pro/extension-ai** (v3.3.0)
- ✅ Tiptap AI extension configured for Start plan
- ✅ AI action menu with Improve, Expand, Shorten, Rephrase, Grammar
- ✅ Direct AI text generation (no highlighting/accept-reject)

## 🚀 Next Steps - Get Your License

### 1. Purchase Tiptap Start Plan

Go to: https://tiptap.dev/pricing

**Current Plan**: 
- **Start Plan** - $59/month
- Includes: AI Generation, Collaboration, Comments, Version History
- **Future Upgrade**: Team Plan ($179/month) for AI Suggestions & AI Changes

### 2. Get Your Credentials

After purchasing, you'll receive:
1. **App ID** (looks like: `app_xxxxxxxxxxxxx`)
2. **Token** (your API token for authentication)

You can find these at: https://cloud.tiptap.dev

### 3. Create `.env.local` File

Create a file called `.env.local` in the root of your project with:

```bash
# Tiptap Pro Configuration
VITE_TIPTAP_APP_ID=your-app-id-here
VITE_TIPTAP_TOKEN=your-token-here

# OpenAI Configuration (if you don't already have this)
VITE_OPENAI_API_KEY=your-openai-key-here
```

**Important**: Replace `your-app-id-here` and `your-token-here` with your actual credentials from Tiptap Cloud.

### 4. Restart Your Development Server

After creating `.env.local`, restart the server:

```bash
npm run dev
```

## 🎯 How to Use (Start Plan)

### AI Actions Available:

When you highlight text in the editor, a popup menu appears with:

- **✨ Improve** - Enhance writing quality and flow
- **📝 Expand** - Add more detail and depth  
- **✂️ Shorten** - Make text more concise
- **🔄 Rephrase** - Rewrite with different wording
- **✓ Grammar** - Fix spelling and grammar

### How It Works:

1. **Highlight text** you want to improve
2. **Click an AI action** (e.g., "✨ Improve")
3. **AI generates new text** and replaces the selection
4. **No accept/reject needed** - changes apply immediately

## 🔧 How It Works (Start Plan)

The integration uses:

1. **Tiptap AI Extension** - Official extension from Tiptap
2. **AI Generation** - Direct text replacement (no suggestions)
3. **Streaming** - Text appears as AI generates it
4. **Auto-insert** - Changes apply immediately

## 📈 Future Upgrade Path

When you're ready to upgrade to Team Plan ($179/month), you'll get:

- **AI Suggestions** - Show suggestions with highlighting
- **AI Changes** - Accept/reject functionality
- **AI Agent** - More advanced AI capabilities
- **Higher limits** - 5,000 documents vs 500

## 📚 Additional Features Available

With your Tiptap Pro license, you also get access to:

- **AI Autocomplete** - Already enabled! (starts suggesting as you type)
- **Collaboration** - Real-time multi-user editing
- **Comments** - Add comments to your document
- **Track Changes** - See all edits with accept/reject
- **Export to DOCX** - Already integrated!

## 🆘 Troubleshooting

### "Invalid credentials" error

- Double-check your `VITE_TIPTAP_APP_ID` and `VITE_TIPTAP_TOKEN` in `.env.local`
- Make sure you restarted the dev server after creating `.env.local`
- Verify your license is active at https://cloud.tiptap.dev

### AI commands not working

- Ensure you have an active internet connection
- Check browser console for errors
- Verify your Tiptap Cloud app has sufficient credits

### Need help?

- Tiptap Docs: https://tiptap.dev/docs/content-ai
- Tiptap Discord: https://discord.gg/WtJ49jGshW
- Support: support@tiptap.dev

## 🎉 What's Next?

Once you've added your credentials and restarted the server:

1. Highlight some text in the editor
2. Click an AI action (e.g., "✨ Improve")
3. Review the AI suggestion (shown with highlighting)
4. Click "✓ Accept" or "✕ Reject"

That's it! You now have professional-grade AI writing assistance! 🚀

