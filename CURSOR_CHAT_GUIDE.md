# Cursor-Style AI Chat - User Guide

## 🎯 Overview

Your Lorewise app now features a streamlined, Cursor-style AI chat interface. This is the **core feature** of your novel writing application.

## How It Works

### Simple 3-Step Workflow

```
1. PROMPT → Ask AI to write something
2. REVIEW → AI generates content, you review it
3. ACTION → Accept (insert at cursor) | Decline | Request changes
```

## Interface Layout

```
┌─────────────────────────────────────┐
│  🗨 AI Assistant              [×]   │  ← Header
├─────────────────────────────────────┤
│                                     │
│  💬 User: Write a scene...          │  ← Your messages
│                                     │
│  🤖 AI: Generated content...        │  ← AI responses
│     [×Decline] [⟳Revise] [✓Accept] │  ← Actions
│                                     │
│  ✓ Accepted ← Status indicator      │
│                                     │
├─────────────────────────────────────┤
│  Ask AI to write something...      │  ← Input box
│  [Send ➤]                           │
└─────────────────────────────────────┘
```

## Features

### ✅ Accept
- **What it does:** Inserts the AI-generated content at your current cursor position
- **How to use:** Click the green "Accept" button
- **What happens:**
  1. Content is inserted where your cursor is in the document
  2. Message is marked as "✓ Accepted"
  3. Confirmation message appears in chat

### ❌ Decline
- **What it does:** Rejects the AI's suggestion
- **How to use:** Click the red "Decline" button
- **What happens:**
  1. Message is marked as "× Declined"
  2. Content is NOT inserted
  3. You can ask for something different

### 🔄 Revise
- **What it does:** Give feedback to improve the AI's response
- **How to use:**
  1. Click the "Revise" button
  2. Type your feedback (e.g., "Make it darker", "Add more dialogue")
  3. Press Enter or click "Send Feedback"
- **What happens:**
  1. AI receives your feedback
  2. Generates a revised version
  3. New version appears with Accept/Decline/Revise buttons

## Example Workflow

### Scenario: Writing a Battle Scene

**Step 1: Prompt**
```
You: Write a short battle scene between a knight and a dragon
```

**Step 2: AI Generates**
```
AI: The knight raised his sword as the dragon descended from
    the storm-dark sky. Fire erupted from its maw, scorching
    the earth mere feet from where he stood. He rolled aside,
    armor clanging against stone...

    [×Decline] [⟳Revise] [✓Accept]
```

**Step 3a: Accept** ✅
- Click "Accept"
- Content appears at cursor in your document
- Keep writing from there!

**Step 3b: Revise** 🔄
- Click "Revise"
- Type: "Make it more visceral and add the knight's internal thoughts"
- AI generates improved version
- Accept or revise again!

**Step 3c: Decline** ❌
- Click "Decline"
- Try a different prompt
- Ask for something else

## Usage Tips

### 📝 Writing Prompts

**Good Prompts:**
- "Write a dialogue between Sarah and Tom arguing about the mission"
- "Describe the abandoned castle at sunset"
- "Create a tense action sequence where the hero escapes"
- "Write the opening paragraph of Chapter 5"

**Less Effective Prompts:**
- "Write something" (too vague)
- "Fix this" (no context about what to fix)
- "More" (unclear what you want more of)

### 🎯 Best Practices

1. **Be Specific:** The more detail you provide, the better the result
   - Good: "Write a humorous scene where the robot butler malfunctions"
   - Better: "Write a humorous scene where the robot butler malfunctions during a formal dinner party"

2. **Use Context:** The AI can see surrounding text
   - It knows what you're writing about
   - It uses your series lore for consistency
   - Position your cursor where you want the content

3. **Iterate with Revise:** Don't settle for the first version
   - First generation: Good starting point
   - After 1-2 revisions: Great content that fits your vision

4. **Mix Accept and Revise:**
   - Accept parts you like
   - Revise parts that need work
   - Build your scene incrementally

### 💡 Advanced Techniques

**Continuation:**
```
You: Continue from where I left off
```
→ AI reads your last paragraph and continues naturally

**Style Matching:**
```
You: Write the next scene in the same style as the previous chapter
```
→ AI analyzes your writing style and matches it

**Character Voice:**
```
You: Write dialogue for Marcus that sounds like how he spoke in Chapter 3
```
→ AI references your lore and previous content

**Atmosphere:**
```
You: Describe this room but make it feel ominous and threatening
```
→ AI focuses on mood and atmosphere

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send message | `Enter` |
| New line in message | `Shift + Enter` |
| Send feedback | `Enter` (when in feedback mode) |

## How Content is Inserted

### Cursor Position
The AI content is inserted **exactly where your cursor is** in the document.

**Example:**
```
Before:
  The knight stood ready.|        ← Your cursor here

You ask AI to write battle action

After Accept:
  The knight stood ready. He raised his sword as the dragon
  descended from the storm-dark sky. Fire erupted from its maw...
```

### Smart Insertion
- Content flows naturally from cursor position
- Maintains your formatting
- Preserves your existing text
- You can undo with `Ctrl+Z` if needed

## Context Awareness

The AI is aware of:

### 1. **Your Series Lore**
- Character backgrounds
- World-building rules
- Plot points
- Established facts
- ✅ Ensures consistency across your series

### 2. **Surrounding Text** (500 characters before/after cursor)
- Recent narrative
- Current scene context
- Character voices in play
- Tone and pacing
- ✅ Matches your writing style

### 3. **Your Request**
- Specific instructions
- Style preferences
- Content requirements
- ✅ Delivers exactly what you asked for

## Common Use Cases

### 📖 Starting a Chapter
```
You: Write an engaging opening paragraph for Chapter 12
AI: [Generates opening]
You: Click "Accept"
Result: Chapter started, you continue from there
```

### 💬 Writing Dialogue
```
You: Write a conversation between Emma and Dr. Chen about the discovery
AI: [Generates dialogue]
You: Click "Revise" → "Make Emma more skeptical"
AI: [Generates revised dialogue]
You: Click "Accept"
```

### 🎨 Describing Scenes
```
You: Describe the underground laboratory in vivid detail
AI: [Generates description]
You: Click "Accept"
```

### 🔄 Revising Content
```
You: Rewrite this fight scene to be more intense
[Select existing text first]
AI: [Generates intense version]
You: Click "Accept" → Replaces at cursor
```

### 🧩 Continuing Story
```
You: Continue the story from where I left off
AI: [Reads last paragraph, continues naturally]
You: Click "Accept"
```

## Troubleshooting

### AI Response Doesn't Match
✅ **Use Revise:** Click "Revise" and explain what's wrong
- "Too formal"
- "Doesn't match Sarah's personality"
- "Add more action, less description"

### Content Inserted in Wrong Place
✅ **Check Cursor Position:** Make sure cursor is where you want insertion
✅ **Use Undo:** Press `Ctrl+Z` to undo insertion
✅ **Try Again:** Position cursor correctly and accept

### AI Doesn't Understand Context
✅ **Update Lore:** Make sure your series lore document is current
✅ **Be More Specific:** Provide more detail in your prompt
✅ **Reference Previous Content:** Say "like in Chapter 3" or "remember that Sarah is..."

### Generation is Too Long/Short
✅ **Be Specific:**
- "Write 2-3 paragraphs"
- "Write a short dialogue exchange"
- "Describe this in detail"

## Differences from Diff System

| Feature | Cursor Chat | Diff System |
|---------|-------------|-------------|
| **Use Case** | Generate new content | Edit existing content |
| **Workflow** | Prompt → Generate → Insert | Select → Edit → Accept changes |
| **Action** | Insert at cursor | Apply edits inline |
| **Best For** | Writing from scratch | Improving what you wrote |

**When to use what:**
- 🆕 **Cursor Chat:** "Write me a..." / "Create a..." / "Generate..."
- ✏️ **Diff System:** "Improve this" / "Make this better" / "Fix this"

## Tips for Maximum Productivity

### 1. **Draft with AI, Refine Yourself**
- Use AI for first drafts and rough scenes
- Edit and polish to match your voice
- Use Revise for major changes
- Manual edit for final touches

### 2. **Build Incrementally**
- Start with outline/summary
- Generate scene by scene
- Accept and build on each piece
- Maintain narrative flow

### 3. **Leverage Lore**
- Keep lore document updated
- AI will maintain consistency
- Reference established facts
- Build cohesive story world

### 4. **Iterate Quickly**
- Don't overthink first prompt
- Use Revise to improve
- Accept when "good enough"
- Keep momentum going

## Privacy & Data

- **Chat Not Saved:** Current implementation doesn't persist chats
- **Fresh Each Session:** Start clean every time
- **Focus on Generation:** Pure content creation tool
- **No History Distraction:** Stay in the flow

## Next Steps

Ready to write? Here's how to start:

1. **Open your document**
2. **Position cursor** where you want to write
3. **Open AI chat** (click chat icon)
4. **Type your prompt**
5. **Review AI response**
6. **Accept, Decline, or Revise**
7. **Keep writing!**

---

**The AI is your co-writer. You're still the author. Use it to write faster, not to write for you.** 🎨✨📖
