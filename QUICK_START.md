# Lorewise Diff System - Quick Start

## 🚀 Getting Started in 5 Minutes

### Step 1: Import the CSS
Add to your main CSS file or `main.tsx`:

```typescript
import './styles/diff-highlights.css';
```

### Step 2: The System is Already Integrated!

Both `TiptapEditor` and `LoreEditor` already have the diff system built-in. You don't need to add anything to them.

### Step 3: Connect Your AI Service

Create or update your AI service to return this format:

```typescript
// src/services/aiService.ts

export async function generateEdits(
  action: string,
  selectedText: string,
  context: string,
  lore?: any
): Promise<{
  success: boolean;
  edits: Array<{
    id: string;
    type: 'replace' | 'insert' | 'delete';
    range: { start: number; end: number };
    oldText: string;
    newText: string;
    rationale: string;
  }>;
  error?: string;
}> {
  // Your AI implementation here
  const response = await callYourAI(action, selectedText, context, lore);

  return {
    success: true,
    edits: response.edits.map(edit => ({
      id: crypto.randomUUID(),
      type: edit.type,
      range: edit.range,
      oldText: edit.oldText,
      newText: edit.newText,
      rationale: edit.rationale,
    })),
  };
}
```

### Step 4: Add AI Action Buttons

Use the provided component:

```typescript
// In your Editor page or component
import { AIDiffIntegration } from '../components/AI/AIDiffIntegration';
import { generateEdits } from '../services/aiService';

function EditorPage() {
  return (
    <div>
      <AIDiffIntegration
        editor={editor}
        lore={lore}
        onAIRequest={generateEdits}
      />
      {/* Your existing editor */}
    </div>
  );
}
```

### Step 5: Try It Out!

1. Run `npm run dev`
2. Open a document
3. Select some text
4. Click an AI action button (e.g., "Improve")
5. See the diff sidebar appear with changes
6. Accept or reject changes

## 🎯 That's It!

The diff system is now working. When the AI returns edits:
- Green highlights = additions
- Red highlights = deletions
- Yellow highlights = replacements

Use keyboard shortcuts:
- `Ctrl+Shift+A` - Accept next change
- `Ctrl+Shift+R` - Reject next change

## 📚 Need More Info?

- **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`
- **Full guide**: See `DIFF_SYSTEM_GUIDE.md`
- **Example code**: Check `src/components/AI/AIDiffIntegration.tsx`

## 🔧 Troubleshooting

**Changes not showing?**
- Make sure your AI returns the correct JSON format
- Check console for errors
- Verify CSS is imported

**Can't accept/reject?**
- Click directly on the buttons in the diff sidebar
- Or use keyboard shortcuts (Ctrl+Shift+A/R)

## 🎨 Customization

Colors and styling are in:
- `src/components/DiffVisualization/DiffVisualization.scss`
- `src/styles/diff-highlights.css`

Keyboard shortcuts in:
- `src/hooks/useKeyboardShortcuts.ts`

---

**Questions?** Check the full guides or the example integration component!
