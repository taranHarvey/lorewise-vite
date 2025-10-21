import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Wand2, Loader2 } from 'lucide-react';
import type { AIEditResponse } from '../../hooks/useDiffEditor';
import { useDiffEditor } from '../../hooks/useDiffEditor';

interface AIDiffIntegrationProps {
  editor: Editor | null;
  lore?: any;
  onAIRequest?: (prompt: string, selection: string, context: string) => Promise<AIEditResponse>;
}

type AIActionType = 'improve' | 'expand' | 'shorten' | 'rephrase' | 'continue' | 'consistency' | 'dialogue' | 'description';

const AI_ACTIONS: { type: AIActionType; label: string; description: string }[] = [
  { type: 'improve', label: 'Improve', description: 'Refine tone, flow, and clarity' },
  { type: 'expand', label: 'Expand', description: 'Add depth and detail' },
  { type: 'shorten', label: 'Shorten', description: 'Tighten and condense' },
  { type: 'rephrase', label: 'Rephrase', description: 'Rewrite with different wording' },
  { type: 'continue', label: 'Continue', description: 'Generate continuation' },
  { type: 'consistency', label: 'Check Consistency', description: 'Verify against lore' },
  { type: 'dialogue', label: 'Enhance Dialogue', description: 'Improve character voice' },
  { type: 'description', label: 'Enhance Description', description: 'Add vivid imagery' },
];

/**
 * Component that integrates AI actions with the diff visualization system
 * Provides a toolbar for triggering AI edits on selected text
 */
export const AIDiffIntegration: React.FC<AIDiffIntegrationProps> = ({
  editor,
  lore,
  onAIRequest,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AIActionType | null>(null);
  const { getSelection, getContext, processAIResponse } = useDiffEditor(editor);

  const handleAIAction = useCallback(
    async (actionType: AIActionType) => {
      if (!editor || !onAIRequest) {
        console.warn('Editor or AI request handler not available');
        return;
      }

      const selection = getSelection();
      if (!selection || !selection.text) {
        alert('Please select some text first');
        return;
      }

      setIsProcessing(true);
      setSelectedAction(actionType);

      try {
        // Get surrounding context
        const context = getContext(selection.from, selection.to);

        // Build the AI prompt
        const prompt = buildPrompt(actionType, selection.text, context?.fullContext || '', lore);

        // Call AI service
        const aiResponse = await onAIRequest(prompt, selection.text, context?.fullContext || '');

        // Process the response and apply as pending diffs
        if (aiResponse.success) {
          await processAIResponse(aiResponse);
        } else {
          alert(`AI request failed: ${aiResponse.error}`);
        }
      } catch (error) {
        console.error('AI action error:', error);
        alert('Failed to process AI request. Please try again.');
      } finally {
        setIsProcessing(false);
        setSelectedAction(null);
      }
    },
    [editor, onAIRequest, getSelection, getContext, processAIResponse, lore]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="ai-diff-integration">
      <div className="ai-diff-integration__header">
        <Wand2 size={16} />
        <span className="ai-diff-integration__title">AI Actions</span>
      </div>

      <div className="ai-diff-integration__actions">
        {AI_ACTIONS.map(action => (
          <button
            key={action.type}
            className={`ai-diff-integration__action-btn ${
              selectedAction === action.type ? 'ai-diff-integration__action-btn--active' : ''
            }`}
            onClick={() => handleAIAction(action.type)}
            disabled={isProcessing}
            title={action.description}
          >
            {isProcessing && selectedAction === action.type ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            {action.label}
          </button>
        ))}
      </div>

      {isProcessing && (
        <div className="ai-diff-integration__processing">
          <Loader2 size={16} className="animate-spin" />
          <span>Processing with AI...</span>
        </div>
      )}
    </div>
  );
};

/**
 * Build AI prompt based on action type
 */
function buildPrompt(
  actionType: AIActionType,
  selectedText: string,
  context: string,
  lore?: any
): string {
  const loreContext = lore?.content ? `\n\nSeries Lore:\n${lore.content}` : '';

  const prompts: Record<AIActionType, string> = {
    improve: `Improve the following text by refining its tone, flow, grammar, and clarity. Return the improved version as structured edits.\n\nContext: ${context}\n\nText to improve: ${selectedText}${loreContext}`,

    expand: `Expand the following text by adding sensory details, emotional depth, and vivid description. Return the expanded version as structured edits.\n\nContext: ${context}\n\nText to expand: ${selectedText}${loreContext}`,

    shorten: `Shorten the following text by tightening the pacing and removing redundancy while preserving key information. Return the condensed version as structured edits.\n\nContext: ${context}\n\nText to shorten: ${selectedText}${loreContext}`,

    rephrase: `Rephrase the following text using different wording while maintaining the same meaning and tone. Return the rephrased version as structured edits.\n\nContext: ${context}\n\nText to rephrase: ${selectedText}${loreContext}`,

    continue: `Continue writing from where the following text ends, maintaining consistent style, tone, and narrative flow. Generate 2-3 sentences of continuation as structured edits.\n\nContext: ${context}\n\nText to continue from: ${selectedText}${loreContext}`,

    consistency: `Check the following text for consistency with the series lore and context. Suggest corrections if inconsistencies are found. Return corrections as structured edits.\n\nContext: ${context}\n\nText to check: ${selectedText}${loreContext}`,

    dialogue: `Enhance the dialogue in the following text by strengthening character voice, making it more natural, and improving emotional resonance. Return the enhanced version as structured edits.\n\nContext: ${context}\n\nDialogue to enhance: ${selectedText}${loreContext}`,

    description: `Enhance the description in the following text by adding vivid sensory details, stronger imagery, and more evocative language. Return the enhanced version as structured edits.\n\nContext: ${context}\n\nDescription to enhance: ${selectedText}${loreContext}`,
  };

  return prompts[actionType];
}

// Add styles (you can move this to a separate SCSS file)
const styles = `
.ai-diff-integration {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #e0e0e0;
    font-weight: 600;
    font-size: 14px;
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: #3a3a3a;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    color: #e0e0e0;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: #4a4a4a;
      border-color: #5a5a5a;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--active {
      background: #4a7f8f;
      border-color: #5a8f9f;
    }
  }

  &__processing {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 8px;
    background: rgba(74, 127, 143, 0.2);
    border-radius: 6px;
    color: #b0e0e0;
    font-size: 13px;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`;
