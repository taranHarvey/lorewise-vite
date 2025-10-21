# AI Diff System Architecture Diagram

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           AI Edit Toolbar (AIEditToolbar.tsx)           │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  [Improve] [Expand] [Shorten] [Rephrase] [Continue]   │    │
│  │  [Check] [Dialogue] [Describe]                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            TipTap Editor (with DiffExtension)           │    │
│  │                                                         │    │
│  │  The knight walked into the castle.                    │    │
│  │  ─────────────── ──────                                │    │
│  │  (highlighted changes appear inline)                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │       Diff Sidebar (DiffVisualization.tsx)              │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  Proposed Changes (2)                                   │    │
│  │                                                         │    │
│  │  #1 Replacement                                         │    │
│  │  From: "walked"                                         │    │
│  │  To: "strode confidently"                               │    │
│  │  Rationale: More dynamic movement verb                  │    │
│  │  [Reject] [Accept]                                      │    │
│  │                                                         │    │
│  │  #2 Replacement                                         │    │
│  │  From: "castle"                                         │    │
│  │  To: "towering stone fortress"                          │    │
│  │  Rationale: Enhanced description                        │    │
│  │  [Reject] [Accept]                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              ↕ (communicates via)

┌─────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          useDiffEditor Hook (useDiffEditor.ts)          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • getSelection() - Get user's text selection           │    │
│  │  • getContext() - Extract surrounding text              │    │
│  │  • processAIResponse() - Handle AI edits                │    │
│  │  • acceptChange() - Apply accepted change               │    │
│  │  • rejectChange() - Revert rejected change              │    │
│  │  • pendingChanges[] - Track all pending edits           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              ↕ (calls)

┌─────────────────────────────────────────────────────────────────┐
│                         AI SERVICE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            AI Service (aiService.ts)                    │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  getInlineEdits({                                       │    │
│  │    mode: 'improve',                                     │    │
│  │    selection: "The knight walked...",                   │    │
│  │    contextBefore: "...",                                │    │
│  │    contextAfter: "...",                                 │    │
│  │    references: [{ lore }]                               │    │
│  │  })                                                     │    │
│  │                                                         │    │
│  │  ↓ Builds prompt with:                                  │    │
│  │    • Mode-specific instructions                         │    │
│  │    • Selected text + context                            │    │
│  │    • Lore for consistency                               │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              ↕ (API call)

┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL AI API                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              OpenAI API (GPT-4 Turbo)                   │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  Receives: Prompt + Context + Instructions              │    │
│  │                                                         │    │
│  │  Returns: JSON                                          │    │
│  │  {                                                      │    │
│  │    "edits": [                                           │    │
│  │      {                                                  │    │
│  │        "type": "replace",                               │    │
│  │        "range": { "start": 4, "end": 10 },              │    │
│  │        "oldText": "walked",                             │    │
│  │        "newText": "strode confidently",                 │    │
│  │        "rationale": "More dynamic movement"             │    │
│  │      }                                                  │    │
│  │    ]                                                    │    │
│  │  }                                                      │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
Step 1: USER SELECTS TEXT
┌──────────────────┐
│  "walked into"   │  ← User highlights in editor
└──────────────────┘
         ↓
Step 2: USER CLICKS ACTION
┌──────────────────┐
│  [Improve] ←──   │  ← User clicks button
└──────────────────┘
         ↓
Step 3: TOOLBAR CAPTURES DATA
┌──────────────────────────────┐
│  AIEditToolbar.tsx           │
│  • selection: "walked into"  │
│  • context: "...before..."   │
│  • lore: { content: "..." }  │
└──────────────────────────────┘
         ↓
Step 4: CALLS AI SERVICE
┌──────────────────────────────┐
│  aiService.getInlineEdits()  │
│  • Builds system prompt      │
│  • Adds context + lore       │
│  • Calls OpenAI API          │
└──────────────────────────────┘
         ↓
Step 5: AI PROCESSES
┌──────────────────────────────┐
│  OpenAI GPT-4 Turbo          │
│  • Analyzes text             │
│  • Considers context + lore  │
│  • Generates improvements    │
│  • Returns structured JSON   │
└──────────────────────────────┘
         ↓
Step 6: RECEIVES EDITS
┌──────────────────────────────┐
│  AIEditResponse              │
│  {                           │
│    success: true,            │
│    edits: [...]              │
│  }                           │
└──────────────────────────────┘
         ↓
Step 7: PROCESSES RESPONSE
┌──────────────────────────────┐
│  useDiffEditor.ts            │
│  • processAIResponse()       │
│  • Converts to DiffChange[]  │
│  • Applies to editor         │
└──────────────────────────────┘
         ↓
Step 8: APPLIES VISUAL MARKS
┌──────────────────────────────┐
│  DiffExtension               │
│  • setDiff() for each change │
│  • Adds colored highlights   │
│  • Updates editor view       │
└──────────────────────────────┘
         ↓
Step 9: UPDATES UI
┌──────────────────────────────┐
│  • Highlights in editor      │
│  • Diff sidebar appears      │
│  • Shows all changes         │
│  • Accept/Reject buttons     │
└──────────────────────────────┘
         ↓
Step 10: USER REVIEWS & ACTS
┌──────────────────────────────┐
│  User clicks:                │
│  • Accept → change applied   │
│  • Reject → change removed   │
│  • Ctrl+Shift+A → next       │
└──────────────────────────────┘
         ↓
Step 11: FINAL UPDATE
┌──────────────────────────────┐
│  Document updated!           │
│  • Changes committed         │
│  • Highlights removed        │
│  • Sidebar closes            │
└──────────────────────────────┘
```

---

## Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│                  TiptapEditor.tsx                        │
│  (Main book editor component)                           │
│                                                          │
│  ┌────────────────────┐  ┌─────────────────────────┐   │
│  │  AIEditToolbar     │  │  DiffVisualization      │   │
│  │  • 8 action buttons│  │  • Shows pending changes│   │
│  │  • Triggers AI     │  │  • Accept/Reject UI     │   │
│  └────────────────────┘  └─────────────────────────┘   │
│           ↓                         ↑                    │
│  ┌─────────────────────────────────────────────┐        │
│  │  useDiffEditor Hook                         │        │
│  │  • Manages state                            │        │
│  │  • Processes AI responses                   │        │
│  │  • Handles accept/reject                    │        │
│  └─────────────────────────────────────────────┘        │
│           ↓                                              │
│  ┌─────────────────────────────────────────────┐        │
│  │  DiffExtension (TipTap Mark)                │        │
│  │  • Highlights changes in editor             │        │
│  │  • Tracks change IDs                        │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              aiService.ts (Your AI Service)              │
│  • getInlineEdits() - Main method                       │
│  • Handles all 8 action modes                           │
│  • Manages OpenAI API calls                             │
│  • Returns structured edits                             │
└─────────────────────────────────────────────────────────┘
```

---

## File Organization

```
src/
├── components/
│   ├── TiptapEditor/
│   │   └── TiptapEditor.tsx ────────┐ (uses toolbar + diff)
│   │                                 │
│   ├── LoreEditor/                  │
│   │   └── LoreEditor.tsx ───────────┤ (uses toolbar + diff)
│   │                                 │
│   ├── AI/                           │
│   │   ├── AIEditToolbar.tsx ←───────┘ (connector component!)
│   │   ├── AIEditToolbar.scss
│   │   └── AIDiffIntegration.tsx (alternative example)
│   │
│   └── DiffVisualization/
│       ├── DiffVisualization.tsx (sidebar UI)
│       └── DiffVisualization.scss
│
├── hooks/
│   ├── useDiffEditor.ts (state management)
│   └── useKeyboardShortcuts.ts (shortcuts)
│
├── extensions/
│   └── DiffExtension.ts (TipTap mark extension)
│
├── services/
│   └── aiService.ts (YOUR existing AI service - unchanged!)
│
├── styles/
│   └── diff-highlights.css (inline editor highlighting)
│
└── main.tsx (imports diff-highlights.css)
```

---

## State Flow

```
┌────────────────────────────────────────────────┐
│              Editor Instance (TipTap)          │
│  • Contains document content                   │
│  • Has DiffExtension loaded                    │
│  • Manages editor state                        │
└────────────────────────────────────────────────┘
                    ↕
┌────────────────────────────────────────────────┐
│         useDiffEditor Hook State               │
│  • pendingChanges: DiffChange[]                │
│  • isProcessing: boolean                       │
│  • Methods for accept/reject                   │
└────────────────────────────────────────────────┘
                    ↕
┌────────────────────────────────────────────────┐
│              React Components                  │
│  • AIEditToolbar (trigger actions)             │
│  • DiffVisualization (show changes)            │
│  • TiptapEditor (orchestrate everything)       │
└────────────────────────────────────────────────┘
```

---

## User Journey Map

```
1. DISCOVERY
   User sees → [AI Edit Toolbar]
   8 colorful buttons at top of editor

2. ACTION
   User → Selects text
   User → Clicks "Improve"

3. PROCESSING
   Toolbar → Shows "Processing with AI..."
   Button → Highlights in blue

4. RESULTS
   Editor → Shows colored highlights
   Sidebar → Appears with change list

5. REVIEW
   User → Reads rationale for each change
   User → Sees old vs new text

6. DECISION
   User → Clicks "Accept" or "Reject"
   OR → Uses Ctrl+Shift+A / Ctrl+Shift+R

7. COMPLETION
   Document → Updated with accepted changes
   Sidebar → Closes when no more changes
   Highlights → Removed

8. ITERATION
   User → Can select again and repeat
```

---

## Key Integration Points

### 1. Toolbar → AI Service
```typescript
// AIEditToolbar.tsx
const handleAIAction = async (mode) => {
  const selection = getSelection();
  const context = getContext(selection.from, selection.to);

  const aiResponse = await aiService.getInlineEdits({
    mode,
    selection: selection.text,
    contextBefore: context.before,
    contextAfter: context.after,
    references: [{ title: 'Lore', content: lore.content }]
  });

  await processAIResponse(aiResponse);
};
```

### 2. AI Service → Diff System
```typescript
// aiService.ts returns this format
{
  success: true,
  edits: [{
    id: "edit-123",
    type: "replace",
    range: { start: 0, end: 10 },
    oldText: "original",
    newText: "improved",
    rationale: "why"
  }]
}

// useDiffEditor.ts processes it
processAIResponse(aiResponse) {
  const changes = convertAIEditsToChanges(aiResponse);
  applyPendingChanges(changes); // Shows in editor + sidebar
}
```

### 3. Diff System → Editor
```typescript
// DiffExtension marks applied to editor
editor.chain()
  .setTextSelection({ from, to })
  .setDiff(changeId, changeType) // Adds highlight
  .run();
```

---

This diagram shows how all the pieces fit together! The key is that **your existing AI service didn't need any changes** - we just created the connector components and diff visualization system around it! 🎉
