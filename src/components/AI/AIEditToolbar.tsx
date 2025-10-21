import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Wand2,
  Loader2,
  Maximize2,
  Minimize2,
  Edit3,
  Scissors,
  RefreshCw,
  PlusCircle,
  CheckCircle,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { AIActionMode } from '../../services/aiService';
import type { SeriesLore } from '../../documentService';
import { useDiffEditor } from '../../hooks/useDiffEditor';
import './AIEditToolbar.scss';

interface AIEditToolbarProps {
  editor: Editor | null;
  lore?: SeriesLore;
  className?: string;
}

interface AIAction {
  mode: AIActionMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const AI_ACTIONS: AIAction[] = [
  {
    mode: 'improve',
    label: 'Improve',
    icon: <Edit3 size={16} />,
    description: 'Refine tone, flow, and clarity',
    color: '#6496ff',
  },
  {
    mode: 'expand',
    label: 'Expand',
    icon: <Maximize2 size={16} />,
    description: 'Add depth and detail',
    color: '#64ff96',
  },
  {
    mode: 'shorten',
    label: 'Shorten',
    icon: <Minimize2 size={16} />,
    description: 'Tighten and condense',
    color: '#ffc864',
  },
  {
    mode: 'rephrase',
    label: 'Rephrase',
    icon: <RefreshCw size={16} />,
    description: 'Rewrite with different wording',
    color: '#c864ff',
  },
  {
    mode: 'continue',
    label: 'Continue',
    icon: <PlusCircle size={16} />,
    description: 'Generate continuation',
    color: '#64c8ff',
  },
  {
    mode: 'consistency',
    label: 'Check',
    icon: <CheckCircle size={16} />,
    description: 'Verify against lore',
    color: '#ff9664',
  },
  {
    mode: 'dialogue',
    label: 'Dialogue',
    icon: <MessageCircle size={16} />,
    description: 'Enhance character voice',
    color: '#ff64c8',
  },
  {
    mode: 'description',
    label: 'Describe',
    icon: <ImageIcon size={16} />,
    description: 'Add vivid imagery',
    color: '#96ff64',
  },
];

/**
 * AI Edit Toolbar - Provides quick access to AI editing actions
 * Integrates with the diff visualization system
 */
export const AIEditToolbar: React.FC<AIEditToolbarProps> = ({
  editor,
  lore,
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<AIActionMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const { getSelection, getContext, processAIResponse } = useDiffEditor(editor);

  const handleAIAction = useCallback(
    async (mode: AIActionMode) => {
      if (!editor) {
        setError('Editor not available');
        return;
      }

      // Get current selection
      const selection = getSelection();

      if (!selection || !selection.text || selection.text.trim().length === 0) {
        setError('Please select some text first');
        setTimeout(() => setError(null), 3000);
        return;
      }

      setIsProcessing(true);
      setActiveAction(mode);
      setError(null);

      try {
        // Get surrounding context
        const context = getContext(selection.from, selection.to);

        // Build the inline edit request
        const request = {
          prompt: '',
          selection: selection.text,
          contextBefore: context?.before || '',
          contextAfter: context?.after || '',
          references: lore ? [{
            title: 'Series Lore',
            content: lore.content,
            type: 'lore' as const,
          }] : [],
          mode,
        };

        console.log('AI Edit Toolbar: Requesting edits for mode:', mode);
        console.log('AI Edit Toolbar: Selection:', selection.text.substring(0, 100) + '...');

        // Call AI service
        const aiResponse = await aiService.getInlineEdits(request);

        if (aiResponse.success && aiResponse.edits.length > 0) {
          console.log('AI Edit Toolbar: Received', aiResponse.edits.length, 'edits');

          // Process response and apply as pending diffs
          await processAIResponse(aiResponse);
        } else {
          setError(aiResponse.error || 'No edits suggested');
          setTimeout(() => setError(null), 5000);
        }
      } catch (err) {
        console.error('AI Edit Toolbar: Error processing action:', err);
        setError(err instanceof Error ? err.message : 'Failed to process AI request');
        setTimeout(() => setError(null), 5000);
      } finally {
        setIsProcessing(false);
        setActiveAction(null);
      }
    },
    [editor, lore, getSelection, getContext, processAIResponse]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className={`ai-edit-toolbar ${className} ${isExpanded ? 'ai-edit-toolbar--expanded' : 'ai-edit-toolbar--collapsed'}`}>
      <div className="ai-edit-toolbar__header">
        <div className="ai-edit-toolbar__title">
          <Wand2 size={16} className="ai-edit-toolbar__icon" />
          <span>AI Actions</span>
        </div>
        <button
          className="ai-edit-toolbar__toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="ai-edit-toolbar__hint">
            Select text, then choose an action
          </div>

          <div className="ai-edit-toolbar__actions">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.mode}
                className={`ai-edit-toolbar__action ${
                  activeAction === action.mode ? 'ai-edit-toolbar__action--active' : ''
                }`}
                onClick={() => handleAIAction(action.mode)}
                disabled={isProcessing}
                title={action.description}
                style={{
                  '--action-color': action.color,
                } as React.CSSProperties}
              >
                {isProcessing && activeAction === action.mode ? (
                  <Loader2 size={16} className="ai-edit-toolbar__action-spinner" />
                ) : (
                  action.icon
                )}
                <span className="ai-edit-toolbar__action-label">{action.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="ai-edit-toolbar__error">
              <span className="ai-edit-toolbar__error-icon">⚠️</span>
              {error}
            </div>
          )}

          {isProcessing && (
            <div className="ai-edit-toolbar__processing">
              <Loader2 size={16} className="ai-edit-toolbar__processing-spinner" />
              <span>Processing with AI...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
