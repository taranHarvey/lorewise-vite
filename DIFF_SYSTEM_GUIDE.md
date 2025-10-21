# Lorewise Diff System - Implementation Guide

## Overview

The diff system provides a Cursor-like experience for AI-powered text editing with visual change highlighting and accept/reject controls. This document explains how to use and integrate the diff system.

## Architecture

### Core Components

1. **DiffExtension** (`src/extensions/DiffExtension.ts`)
   - TipTap Mark extension for highlighting changes
   - Supports insert, delete, and replace operations
   - Color-coded visualization (green for insert, red for delete, yellow for replace)

2. **DiffVisualization** (`src/components/DiffVisualization/`)
   - UI component for displaying pending changes
   - Accept/reject buttons for individual changes
   - Bulk accept/reject all functionality
   - Shows rationale for each change

3. **useDiffEditor Hook** (`src/hooks/useDiffEditor.ts`)
   - Manages pending changes state
   - Handles selection and context extraction
   - Processes AI responses into diff changes
   - Applies/reverts changes to the editor

4. **useKeyboardShortcuts Hook** (`src/hooks/useKeyboardShortcuts.ts`)
   - Keyboard shortcuts for diff operations
   - `Ctrl+Shift+A`: Accept next/first change
   - `Ctrl+Shift+R`: Reject next/first change
   - `Ctrl+Shift+Enter`: Accept all changes
   - `Shift+Escape`: Reject all changes

## Integration

### Already Integrated

✅ **TiptapEditor** - Full diff support for book documents
✅ **LoreEditor** - Full diff support for lore documents

Both editors include:
- DiffExtension for visual highlighting
- DiffVisualization sidebar (appears when changes pending)
- Keyboard shortcuts
- Selection-based context extraction

### How to Use in Your Application

#### Step 1: Connect Your AI Service

Your AI service should return responses in this format:

```typescript
interface AIEditResponse {
  edits: Array<{
    type: 'replace' | 'insert' | 'delete';
    range: { start: number; end: number };
    oldText: string;
    newText: string;
    rationale: string;
    id: string;
  }>;
  summary?: string;
  success: boolean;
  error?: string;
}
```

#### Step 2: Trigger AI Edits

```typescript
import { useDiffEditor } from './hooks/useDiffEditor';

function MyEditor() {
  const editor = useEditor({...});
  const { processAIResponse, getSelection, getContext } = useDiffEditor(editor);

  const handleAIAction = async (actionType: string) => {
    // Get user's text selection
    const selection = getSelection();
    if (!selection?.text) {
      alert('Please select some text first');
      return;
    }

    // Get surrounding context (500 chars before/after)
    const context = getContext(selection.from, selection.to);

    // Call your AI service
    const aiResponse = await yourAIService.generateEdits({
      action: actionType,
      selectedText: selection.text,
      context: context?.fullContext,
      lore: yourLoreData,
    });

    // Process response and display as pending diffs
    await processAIResponse(aiResponse);
  };

  return (
    <div>
      <button onClick={() => handleAIAction('improve')}>
        Improve Selection
      </button>
      <EditorContent editor={editor} />
    </div>
  );
}
```

#### Step 3: Example AI Service Integration

See `src/components/AI/AIDiffIntegration.tsx` for a complete example component that provides a toolbar of AI actions:

```typescript
import { AIDiffIntegration } from './components/AI/AIDiffIntegration';

function MyEditor() {
  const handleAIRequest = async (prompt, selection, context) => {
    // Call your AI service (OpenAI, Claude, etc.)
    const response = await fetch('/api/ai/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, selection, context }),
    });

    return await response.json(); // Should match AIEditResponse format
  };

  return (
    <div>
      <AIDiffIntegration
        editor={editor}
        lore={loreData}
        onAIRequest={handleAIRequest}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
```

## AI Response Format

Your AI should analyze the selected text and return structured edits. Here's an example:

### Example User Selection
```
The knight walked into the castle.
```

### Example AI Response (Expand Action)
```json
{
  "success": true,
  "edits": [
    {
      "id": "edit-1",
      "type": "replace",
      "range": { "start": 4, "end": 17 },
      "oldText": "knight walked",
      "newText": "battle-worn knight strode confidently",
      "rationale": "Added sensory detail about the knight's appearance and more dynamic movement verb"
    },
    {
      "id": "edit-2",
      "type": "replace",
      "range": { "start": 27, "end": 33 },
      "oldText": "castle",
      "newText": "towering stone castle, its shadow falling across the courtyard",
      "rationale": "Enhanced description with visual imagery and atmosphere"
    }
  ],
  "summary": "Expanded description with sensory details and stronger verbs"
}
```

## AI Prompt Engineering Tips

When building prompts for your AI service:

1. **Include Context**: Send 500 chars before/after the selection
2. **Include Lore**: Pass the series lore document for consistency
3. **Be Specific**: Tell the AI to return structured edits, not just rewritten text
4. **Request Rationale**: Ask AI to explain each change
5. **Set Boundaries**: Specify character positions for precise edits

### Example Prompt Template

```
You are editing a novel. The user has selected text to improve.

TASK: Improve the selected text by refining tone, flow, and clarity.

CONTEXT (surrounding text):
${context}

SELECTED TEXT:
${selectedText}

SERIES LORE:
${loreContent}

INSTRUCTIONS:
- Return edits as a JSON array
- Each edit must have: type, range (start/end positions), oldText, newText, rationale
- Maintain consistency with the series lore
- Preserve the author's voice and style
- Use character positions relative to the full document

RESPONSE FORMAT:
{
  "success": true,
  "edits": [
    {
      "id": "unique-id",
      "type": "replace" | "insert" | "delete",
      "range": { "start": number, "end": number },
      "oldText": "original text",
      "newText": "improved text",
      "rationale": "why this change improves the writing"
    }
  ]
}
```

## User Experience Flow

1. **User selects text** in the editor (highlights a sentence, paragraph, etc.)
2. **User triggers AI action** (e.g., clicks "Improve" button or uses slash command)
3. **AI processes request** with selection + context + lore
4. **Diff sidebar appears** showing proposed changes with color-coded highlights:
   - 🟢 Green = Additions
   - 🔴 Red = Deletions
   - 🟡 Yellow = Replacements
5. **User reviews changes** one by one, reading the rationale
6. **User accepts/rejects** using buttons or keyboard shortcuts
7. **Changes are applied** to the document or reverted

## Keyboard Shortcuts

When there are pending changes:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac) | Accept first/next change |
| `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) | Reject first/next change |
| `Ctrl+Shift+Enter` | Accept ALL changes |
| `Shift+Escape` | Reject ALL changes |

## Styling

The diff visualization uses a dark theme by default. Colors are defined in:

- **DiffVisualization.scss**: Main diff UI styling
- **Inline marks**: Color-coded highlights in the editor
  - Insert: `rgba(100, 255, 100, 0.2)` with green border
  - Delete: `rgba(255, 100, 100, 0.2)` with red border + strikethrough
  - Replace: `rgba(255, 200, 100, 0.2)` with yellow border

## Extending the System

### Custom AI Actions

Add new AI action types by extending the `AIActionType`:

```typescript
type AIActionType =
  | 'improve'
  | 'expand'
  | 'shorten'
  | 'rephrase'
  | 'continue'
  | 'consistency'
  | 'dialogue'
  | 'description'
  | 'YOUR_CUSTOM_ACTION'; // Add here

// Add to AI_ACTIONS array in AIDiffIntegration.tsx
const AI_ACTIONS = [
  // ... existing actions
  {
    type: 'YOUR_CUSTOM_ACTION',
    label: 'Custom Action',
    description: 'Does something custom'
  },
];
```

### Custom Diff Highlighting

Modify `DiffVisualization.scss` to customize colors:

```scss
.diff-change {
  &[data-change-type='insert'] {
    background: rgba(100, 255, 100, 0.2); // Change green highlight
    border-bottom: 2px solid #64ff64;
  }

  // Add custom type
  &[data-change-type='custom'] {
    background: rgba(100, 100, 255, 0.2);
    border-bottom: 2px solid #6464ff;
  }
}
```

## Integration with Existing AI Service

Your app already has `src/services/aiService.ts`. To integrate:

1. **Update AI Service**: Modify `aiService.ts` to return `AIEditResponse` format
2. **Add Edit Endpoint**: Create a new function like `generateEdits()`
3. **Parse AI Output**: Convert your AI's response to the required JSON structure
4. **Handle Errors**: Return `{ success: false, error: "message" }` on failure

Example integration:

```typescript
// src/services/aiService.ts

export async function generateEdits(
  action: string,
  selectedText: string,
  context: string,
  lore?: string
): Promise<AIEditResponse> {
  try {
    const prompt = buildEditPrompt(action, selectedText, context, lore);

    const response = await fetch('/api/openai/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a novel editing assistant.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const edits = JSON.parse(data.choices[0].message.content);

    return {
      success: true,
      edits: edits.edits.map(edit => ({
        ...edit,
        id: edit.id || crypto.randomUUID(),
      })),
    };
  } catch (error) {
    console.error('AI edit generation failed:', error);
    return {
      success: false,
      error: error.message,
      edits: [],
    };
  }
}
```

## Testing

To test the diff system:

1. **Start your dev server**: `npm run dev`
2. **Open a document** in the editor
3. **Select some text** (highlight a sentence)
4. **Manually create a test change**:

```typescript
// In browser console
const editor = window.__editor; // You may need to expose this

const testChange = {
  success: true,
  edits: [{
    id: 'test-1',
    type: 'replace',
    range: { start: 0, end: 10 },
    oldText: 'The knight',
    newText: 'The brave knight',
    rationale: 'Added characterization',
  }],
};

// Assuming you have access to processAIResponse
processAIResponse(testChange);
```

5. **Verify**:
   - Diff sidebar appears on the right
   - Change is highlighted in the editor
   - Accept/reject buttons work
   - Keyboard shortcuts function correctly

## Troubleshooting

### Changes Not Appearing

- Check console for errors
- Verify `DiffExtension` is in the editor's extensions array
- Ensure AI response format matches `AIEditResponse` interface

### Keyboard Shortcuts Not Working

- Check if `useDiffKeyboardShortcuts` hook is called
- Verify `pendingChanges.length > 0` (shortcuts only active when changes exist)
- Check for conflicting keyboard shortcuts

### Diff Highlights Not Visible

- Import `DiffVisualization.scss` styles
- Check if CSS is being bundled correctly
- Verify mark attributes are being applied to the editor content

## Next Steps

1. **Connect to your AI service** - Update `aiService.ts` to return structured edits
2. **Add AI action buttons** - Use `AIDiffIntegration` component or create custom UI
3. **Test with real edits** - Try different AI actions on sample text
4. **Customize styling** - Adjust colors and layout to match your design
5. **Add analytics** - Track which AI actions users prefer
6. **Implement undo/redo** - Allow users to undo accepted changes

## Support

For questions or issues:
- Check this guide first
- Review example component: `src/components/AI/AIDiffIntegration.tsx`
- Inspect existing integrations in `TiptapEditor.tsx` and `LoreEditor.tsx`
- Check TipTap documentation: https://tiptap.dev/
