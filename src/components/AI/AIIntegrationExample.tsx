import React, { useState, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import AIChat from './AIChat';
import TextSelection from './TextSelection';
import type { SeriesLore } from '../../documentService';

interface AIIntegrationExampleProps {
  editor: ReturnType<typeof useEditor>;
  lore?: SeriesLore;
  selectedText?: string;
  onTextReplace?: (oldText: string, newText: string) => void;
}

export default function AIIntegrationExample({
  editor,
  lore,
  selectedText,
  onTextReplace
}: AIIntegrationExampleProps) {
  const [showTextSelection, setShowTextSelection] = useState(false);
  const [currentSelection, setCurrentSelection] = useState('');

  // Handle text selection from editor
  const handleTextSelection = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from !== to) {
      const selectedText = editor.state.doc.textBetween(from, to);
      setCurrentSelection(selectedText);
      setShowTextSelection(true);
    }
  }, [editor]);

  // Handle suggestion application
  const handleSuggestionApply = useCallback((suggestion: string) => {
    if (!editor || !currentSelection) return;

    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteSelection().insertContent(suggestion).run();
    
    if (onTextReplace) {
      onTextReplace(currentSelection, suggestion);
    }
    
    setShowTextSelection(false);
    setCurrentSelection('');
  }, [editor, currentSelection, onTextReplace]);

  // Get surrounding text for context
  const getSurroundingText = useCallback(() => {
    if (!editor) return '';

    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    
    // Get 200 characters before and after selection
    const start = Math.max(0, from - 200);
    const end = Math.min(doc.content.size, to + 200);
    
    return doc.textBetween(start, end);
  }, [editor]);

  return (
    <>
      {/* Text Selection Overlay */}
      {showTextSelection && currentSelection && (
        <TextSelection
          selectedText={currentSelection}
          surroundingText={getSurroundingText()}
          lore={lore}
          onSuggestionApply={handleSuggestionApply}
          onClose={() => {
            setShowTextSelection(false);
            setCurrentSelection('');
          }}
        />
      )}

      {/* AI Chat Integration */}
      <AIChat
        lore={lore}
        selectedText={selectedText || currentSelection}
        surroundingText={getSurroundingText()}
        className="w-80 border-l border-gray-200 bg-white flex flex-col h-full"
      />
    </>
  );
}

// Hook to integrate AI with TiptapEditor
export function useAIIntegration(editor: ReturnType<typeof useEditor>, lore?: SeriesLore) {
  const [selectedText, setSelectedText] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Listen for text selection changes
  React.useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to);
        setSelectedText(text);
        setShowAISuggestions(true);
      } else {
        setSelectedText('');
        setShowAISuggestions(false);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  return {
    selectedText,
    showAISuggestions,
    setShowAISuggestions
  };
}
