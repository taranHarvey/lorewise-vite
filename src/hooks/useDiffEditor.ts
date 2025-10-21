import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';

export interface DiffChange {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  from: number;
  to: number;
  newText?: string;
  oldText?: string;
  rationale?: string;
}

export interface AIEditResponse {
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

/**
 * Hook for managing AI diff changes in TipTap editor
 * Handles selection-based editing, change visualization, and accept/reject operations
 */
export const useDiffEditor = (editor: Editor | null) => {
  const [pendingChanges, setPendingChanges] = useState<DiffChange[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Get the current text selection from the editor
   */
  const getSelection = useCallback(() => {
    if (!editor) return null;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    return {
      text: selectedText,
      from,
      to,
    };
  }, [editor]);

  /**
   * Get surrounding context for AI (500 chars before and after selection)
   */
  const getContext = useCallback(
    (from: number, to: number) => {
      if (!editor) return null;

      const doc = editor.state.doc;
      const docSize = doc.content.size;

      const contextRadius = 500;
      const contextStart = Math.max(0, from - contextRadius);
      const contextEnd = Math.min(docSize, to + contextRadius);

      const beforeText = doc.textBetween(contextStart, from);
      const afterText = doc.textBetween(to, contextEnd);

      return {
        before: beforeText,
        after: afterText,
        fullContext: doc.textBetween(contextStart, contextEnd),
      };
    },
    [editor]
  );

  /**
   * Convert AI edit response to DiffChange format
   */
  const convertAIEditsToChanges = useCallback(
    (aiResponse: AIEditResponse): DiffChange[] => {
      return aiResponse.edits.map(edit => ({
        id: edit.id,
        type: edit.type,
        from: edit.range.start,
        to: edit.range.end,
        newText: edit.newText,
        oldText: edit.oldText,
        rationale: edit.rationale,
      }));
    },
    []
  );

  /**
   * Apply AI changes as pending diffs (visualize but don't commit)
   */
  const applyPendingChanges = useCallback(
    (changes: DiffChange[]) => {
      if (!editor) return;

      setPendingChanges(changes);

      // Apply diff marks to visualize changes in the editor
      changes.forEach(change => {
        if (change.type === 'insert' && change.newText) {
          // Insert new text with diff mark
          editor
            .chain()
            .focus()
            .setTextSelection({ from: change.from, to: change.from })
            .insertContent({
              type: 'text',
              text: change.newText,
              marks: [
                {
                  type: 'diff',
                  attrs: {
                    changeId: change.id,
                    changeType: 'insert',
                  },
                },
              ],
            })
            .run();
        } else if (change.type === 'delete') {
          // Mark text for deletion
          editor
            .chain()
            .focus()
            .setTextSelection({ from: change.from, to: change.to })
            .setDiff(change.id, 'delete')
            .run();
        } else if (change.type === 'replace' && change.newText) {
          // Mark old text for deletion and insert new text
          editor
            .chain()
            .focus()
            .setTextSelection({ from: change.from, to: change.to })
            .setDiff(change.id, 'replace')
            .run();
        }
      });
    },
    [editor]
  );

  /**
   * Accept a specific change (apply it permanently)
   */
  const acceptChange = useCallback(
    (changeId: string) => {
      if (!editor) return;

      const change = pendingChanges.find(c => c.id === changeId);
      if (!change) return;

      editor.chain().focus();

      if (change.type === 'insert' && change.newText) {
        // Keep the inserted text, just remove the diff mark
        editor.commands.unsetDiff(changeId);
      } else if (change.type === 'delete') {
        // Actually delete the text
        editor
          .chain()
          .setTextSelection({ from: change.from, to: change.to })
          .deleteSelection()
          .run();
      } else if (change.type === 'replace' && change.newText) {
        // Replace old text with new text
        editor
          .chain()
          .setTextSelection({ from: change.from, to: change.to })
          .insertContent(change.newText)
          .run();
      }

      // Remove from pending changes
      setPendingChanges(prev => prev.filter(c => c.id !== changeId));
    },
    [editor, pendingChanges]
  );

  /**
   * Reject a specific change (revert it)
   */
  const rejectChange = useCallback(
    (changeId: string) => {
      if (!editor) return;

      const change = pendingChanges.find(c => c.id === changeId);
      if (!change) return;

      if (change.type === 'insert') {
        // Remove the inserted text
        const newFrom = change.from;
        const newTo = change.from + (change.newText?.length || 0);
        editor
          .chain()
          .focus()
          .setTextSelection({ from: newFrom, to: newTo })
          .deleteSelection()
          .run();
      } else {
        // Just remove the diff mark for delete/replace
        editor.commands.unsetDiff(changeId);
      }

      // Remove from pending changes
      setPendingChanges(prev => prev.filter(c => c.id !== changeId));
    },
    [editor, pendingChanges]
  );

  /**
   * Accept all pending changes
   */
  const acceptAllChanges = useCallback(() => {
    pendingChanges.forEach(change => {
      acceptChange(change.id);
    });
  }, [pendingChanges, acceptChange]);

  /**
   * Reject all pending changes
   */
  const rejectAllChanges = useCallback(() => {
    if (!editor) return;

    // Clear all diff marks
    editor.commands.clearAllDiffs();
    setPendingChanges([]);
  }, [editor]);

  /**
   * Process AI response and apply as pending changes
   */
  const processAIResponse = useCallback(
    async (aiResponse: AIEditResponse) => {
      setIsProcessing(true);
      try {
        const changes = convertAIEditsToChanges(aiResponse);
        applyPendingChanges(changes);
      } finally {
        setIsProcessing(false);
      }
    },
    [convertAIEditsToChanges, applyPendingChanges]
  );

  return {
    // State
    pendingChanges,
    isProcessing,

    // Selection & Context
    getSelection,
    getContext,

    // Change Management
    applyPendingChanges,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
    processAIResponse,
  };
};
