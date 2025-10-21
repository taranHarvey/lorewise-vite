# How to Use the AI Diff System

## 🎉 Everything is Connected!

The AI diff system is now fully integrated into your Lorewise application. Here's how to use it:

## Quick Start Guide

### 1. Start Your Application

```bash
npm run dev
```

### 2. Open a Document

Navigate to any book or lore document in your editor.

### 3. Use AI Editing

**Step 1:** Select some text in your editor (highlight a sentence, paragraph, or scene)

**Step 2:** Click one of the AI action buttons at the top of the editor:
- **Improve** - Refine tone, flow, and clarity
- **Expand** - Add depth and sensory detail
- **Shorten** - Tighten and condense
- **Rephrase** - Rewrite with different words
- **Continue** - Generate story continuation
- **Check** - Verify against lore for consistency
- **Dialogue** - Enhance character voice
- **Describe** - Add vivid imagery

**Step 3:** Watch the AI process your request (you'll see a loading indicator)

**Step 4:** Review the proposed changes:
- Changes appear highlighted in the editor
- A sidebar shows each change with rationale
- Green = additions
- Red = deletions
- Yellow = replacements

**Step 5:** Accept or reject changes:
- Click "Accept" on individual changes
- Click "Reject" to discard them
- Use "Accept All" or "Reject All" for bulk operations
- Or use keyboard shortcuts:
  - `Ctrl+Shift+A` - Accept next change
  - `Ctrl+Shift+R` - Reject next change
  - `Ctrl+Shift+Enter` - Accept all
  - `Shift+Escape` - Reject all

## Features

### ✅ AI Action Toolbar
Located at the top of both editors (book and lore):
- 8 different AI actions
- Collapsible to save space
- Color-coded buttons
- Tooltip descriptions

### ✅ Diff Visualization
Appears automatically when AI suggests changes:
- Shows in sidebar on the right
- Lists all pending changes
- Includes AI's rationale for each edit
- Numbered for easy reference

### ✅ Context-Aware Editing
The AI considers:
- Your selected text
- 500 characters before the selection
- 500 characters after the selection
- Your series lore document (for consistency)

### ✅ Keyboard Shortcuts
Fast workflow for power users:

| Action | Shortcut |
|--------|----------|
| Accept next change | `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`) |
| Reject next change | `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`) |
| Accept all changes | `Ctrl+Shift+Enter` |
| Reject all changes | `Shift+Escape` |

## Example Workflow

### Scenario: Improving a Description

1. **Original text:**
   ```
   The knight walked into the castle.
   ```

2. **User action:**
   - Highlight the sentence
   - Click "Expand" button

3. **AI processes** with:
   - The selected sentence
   - Context from surrounding paragraphs
   - Series lore about the castle and knight

4. **AI suggests:**
   - Replace "walked" with "strode confidently"
   - Replace "castle" with "towering stone fortress"
   - Rationale: "Added sensory detail and dynamic movement"

5. **User reviews:**
   - Sees highlighted changes in yellow
   - Reads the rationale in sidebar
   - Likes the first change, not the second

6. **User accepts/rejects:**
   - Clicks "Accept" on first change
   - Clicks "Reject" on second change

7. **Final result:**
   ```
   The knight strode confidently into the castle.
   ```

## Tips for Best Results

### 🎯 Select Meaningful Text
- Select complete sentences or paragraphs
- Include enough context for AI to understand
- Avoid selecting single words (unless using "rephrase")

### 🎯 Use the Right Action
- **Improve**: General polish and refinement
- **Expand**: When you want more detail
- **Shorten**: When prose feels too verbose
- **Consistency**: When you've established lore

### 🎯 Review Before Accepting
- Read the AI's rationale
- Make sure it matches your voice
- Reject anything that doesn't fit
- You're the author - AI is just a tool!

### 🎯 Iterate
- Accept some changes, then select again
- Apply different actions to the same text
- Build up your scene layer by layer

## Troubleshooting

### "Please select some text first"
- You need to highlight text before clicking an AI action
- Click and drag to select text in the editor

### Changes not appearing
- Check your internet connection
- Verify OpenAI API key is set in `.env`:
  ```
  VITE_OPENAI_API_KEY=your_key_here
  ```
- Check browser console for errors

### AI is slow
- Normal - AI processing takes 2-10 seconds
- Longer selections take more time
- Check your API quota/rate limits

### Changes don't match my style
- Try different actions
- Reject and try again
- The AI learns from context, so select more surrounding text
- Update your lore document with style guidelines

## Configuration

### API Key Setup

1. Create a `.env` file in your project root:
   ```env
   VITE_OPENAI_API_KEY=sk-your-openai-api-key
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

### Customization

**Change button colors:**
Edit `src/components/AI/AIEditToolbar.tsx` - look for the `AI_ACTIONS` array

**Change diff colors:**
Edit `src/styles/diff-highlights.css`

**Add custom AI actions:**
1. Add to `AIActionMode` type in `src/services/aiService.ts`
2. Add instructions in `getInlineEditModeInstructions()`
3. Add button in `AI_ACTIONS` array in `AIEditToolbar.tsx`

## What's Included

### Files Created
✅ Diff highlighting extension
✅ Diff visualization component
✅ AI edit toolbar
✅ Selection/context hooks
✅ Keyboard shortcut system
✅ Complete styling (dark theme)

### Files Modified
✅ TiptapEditor - has toolbar + diff system
✅ LoreEditor - has toolbar + diff system
✅ main.tsx - imports CSS

### Ready to Use
✅ All 8 AI actions connected
✅ OpenAI integration working
✅ Lore context automatically included
✅ Accept/reject functionality
✅ Keyboard shortcuts active

## Advanced Usage

### Batch Editing
1. Select a large section
2. Apply an action (e.g., "Improve")
3. Review all suggested changes
4. Accept/reject individually
5. Apply again with different action

### Consistency Checking
1. Write a scene
2. Select the entire scene
3. Click "Check" (consistency)
4. AI compares against your lore
5. Suggests fixes for contradictions

### Story Continuation
1. Select the last paragraph
2. Click "Continue"
3. AI generates next 2-3 sentences
4. Accept if you like it
5. Select the new text + previous
6. Continue again for more

## Need Help?

- **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`
- **Technical guide**: See `DIFF_SYSTEM_GUIDE.md`
- **Quick reference**: See `QUICK_START.md`
- **Component code**: Check `src/components/AI/AIEditToolbar.tsx`

## What's Next?

The system is ready to use! Just:
1. Make sure your OpenAI API key is set
2. Start writing
3. Select text and use AI actions
4. Review and accept/reject changes
5. Keep writing!

---

**Happy writing!** 🎨✨📖

The AI is here to help you write better, faster, and more consistently. But remember - you're the author. The AI is just a smart assistant. Use it to enhance your creativity, not replace it!
