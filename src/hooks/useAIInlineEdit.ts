import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { aiService } from '../services/aiService';
import type { AIEdit, AIActionMode, InlineEditRequest, ReferenceDocument } from '../services/aiService';
import { getAISuggestions } from '../components/TiptapEditor/AISuggestionsExtension';
import type { SeriesLore } from '../documentService';
import { useAuth } from '../contexts/AuthContext';

interface UseAIInlineEditProps {
  editor: Editor | null;
  lore?: SeriesLore;
  references?: ReferenceDocument[];
}

export function useAIInlineEdit({ editor, lore, references = [] }: UseAIInlineEditProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AIEdit[]>([]);

  /**
   * Get context before and after the selection
   */
  const getContext = useCallback((selection: { from: number; to: number }, contextLength: number = 200) => {
    if (!editor) return { before: '', after: '' };
    
    const doc = editor.state.doc;
    const beforeStart = Math.max(0, selection.from - contextLength);
    const afterEnd = Math.min(doc.content.size, selection.to + contextLength);
    
    return {
      before: doc.textBetween(beforeStart, selection.from, ' '),
      after: doc.textBetween(selection.to, afterEnd, ' '),
    };
  }, [editor]);

  /**
   * Request AI inline edits for the current selection
   */
  const requestInlineEdits = useCallback(async (
    mode: AIActionMode,
    customPrompt?: string,
    fullDocumentText?: string
  ) => {
    if (!editor) {
      setError('Editor not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If we have full document text, use it for analysis
      let selection = '';
      let contextBefore = '';
      let contextAfter = '';
      
      if (fullDocumentText) {
        // Use the full document for analysis
        selection = fullDocumentText;
        contextBefore = '';
        contextAfter = '';
      } else {
        // Use current selection
        const { from, to } = editor.state.selection;
        selection = editor.state.doc.textBetween(from, to, ' ');
        
        if (!selection.trim() && mode !== 'continue') {
          setError('Please select some text first or provide full document text');
          return;
        }
        
        const context = getContext({ from, to });
        contextBefore = context.before;
        contextAfter = context.after;
      }
      
      // Combine lore and uploaded references
      const allReferences: ReferenceDocument[] = [...references];
      if (lore) {
        allReferences.unshift({
          title: 'Series Lore',
          content: lore.content,
          type: 'lore' as const
        });
      }
      
      const request: InlineEditRequest = {
        prompt: customPrompt || '',
        selection,
        contextBefore,
        contextAfter,
        mode,
        references: allReferences,
        fullDocumentText: fullDocumentText || undefined,
      };

      const response = await aiService.getInlineEdits(request, user?.uid || undefined);

      if (response.success && response.edits.length > 0) {
        // Adjust edit ranges to be relative to document position
        let adjustedEdits = response.edits;
        
        if (!fullDocumentText) {
          // Only adjust ranges if we're working with a selection
          const { from } = editor.state.selection;
          adjustedEdits = response.edits.map(edit => ({
            ...edit,
            range: {
              start: from + edit.range.start,
              end: from + edit.range.end,
            }
          }));
        }

        // Set suggestions in the editor
        editor.commands.setSuggestions(adjustedEdits);
        setSuggestions(adjustedEdits);
        
        // Return the response for the chat component
        return response;
      } else {
        setError(response.error || 'No suggestions available');
        return response;
      }
    } catch (err) {
      console.error('Error requesting inline edits:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI suggestions';
      setError(errorMessage);
      return { success: false, error: errorMessage, edits: [] };
    } finally {
      setIsLoading(false);
    }
  }, [editor, lore, references, getContext]);

  /**
   * Accept a single edit
   */
  const acceptEdit = useCallback((editId: string) => {
    if (!editor) return;
    
    editor.commands.acceptEdit(editId);
    
    // Update local suggestions list
    const updatedSuggestions = getAISuggestions(editor);
    setSuggestions(updatedSuggestions);
  }, [editor]);

  /**
   * Reject a single edit
   */
  const rejectEdit = useCallback((editId: string) => {
    if (!editor) return;
    
    editor.commands.rejectEdit(editId);
    
    // Update local suggestions list
    const updatedSuggestions = getAISuggestions(editor);
    setSuggestions(updatedSuggestions);
  }, [editor]);

  /**
   * Accept all edits
   */
  const acceptAllEdits = useCallback(() => {
    if (!editor) return;
    
    editor.commands.acceptAllEdits();
    setSuggestions([]);
  }, [editor]);

  /**
   * Reject all edits
   */
  const rejectAllEdits = useCallback(() => {
    if (!editor) return;
    
    editor.commands.rejectAllEdits();
    setSuggestions([]);
  }, [editor]);

  /**
   * Clear all suggestions without applying
   */
  const clearSuggestions = useCallback(() => {
    if (!editor) return;
    
    editor.commands.clearAllSuggestions();
    setSuggestions([]);
  }, [editor]);

  /**
   * Quick action methods
   */
  const improveText = useCallback(() => requestInlineEdits('improve'), [requestInlineEdits]);
  const expandScene = useCallback(() => requestInlineEdits('expand'), [requestInlineEdits]);
  const shortenText = useCallback(() => requestInlineEdits('shorten'), [requestInlineEdits]);
  const rephraseText = useCallback(() => requestInlineEdits('rephrase'), [requestInlineEdits]);
  const continueStory = useCallback(() => requestInlineEdits('continue'), [requestInlineEdits]);
  const checkConsistency = useCallback(() => requestInlineEdits('consistency'), [requestInlineEdits]);
  const improveDialogue = useCallback(() => requestInlineEdits('dialogue'), [requestInlineEdits]);
  const enhanceDescription = useCallback(() => requestInlineEdits('description'), [requestInlineEdits]);

  return {
    // State
    isLoading,
    error,
    suggestions,
    hasSuggestions: suggestions.length > 0,
    
    // Methods
    requestInlineEdits,
    acceptEdit,
    rejectEdit,
    acceptAllEdits,
    rejectAllEdits,
    clearSuggestions,
    
    // Quick actions
    improveText,
    expandScene,
    shortenText,
    rephraseText,
    continueStory,
    checkConsistency,
    improveDialogue,
    enhanceDescription,
  };
}

