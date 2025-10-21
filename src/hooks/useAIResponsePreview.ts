import { useState, useCallback } from 'react';

interface AISuggestion {
  content: string;
  type: 'generate' | 'edit' | 'improve';
  originalPrompt: string;
}

export function useAIResponsePreview() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);

  const showPreview = useCallback((suggestion: AISuggestion) => {
    setCurrentSuggestion(suggestion);
    setIsPreviewOpen(true);
  }, []);

  const hidePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setCurrentSuggestion(null);
  }, []);

  const handleAccept = useCallback((editor: any, content: string) => {
    if (editor) {
      // Insert content at cursor position
      editor.chain().focus().insertContent(content).run();
    }
    hidePreview();
  }, [hidePreview]);

  const handleDiscard = useCallback(() => {
    hidePreview();
  }, [hidePreview]);

  return {
    isPreviewOpen,
    currentSuggestion,
    showPreview,
    hidePreview,
    handleAccept,
    handleDiscard
  };
}
