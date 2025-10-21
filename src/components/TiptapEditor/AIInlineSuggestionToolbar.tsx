import React from 'react';
import type { TiptapSuggestion } from '../../services/tiptapAIAdapter';

interface AIInlineSuggestionToolbarProps {
  suggestions: TiptapSuggestion[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const AIInlineSuggestionToolbar: React.FC<AIInlineSuggestionToolbarProps> = ({
  suggestions,
  onAcceptAll,
  onRejectAll,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="ai-inline-suggestion-toolbar">
      <div className="ai-suggestion-info">
        <span className="ai-suggestion-icon">✨</span>
        <span className="ai-suggestion-count">
          {suggestions.length} AI {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
        </span>
      </div>
      <div className="ai-suggestion-actions">
        <button
          onClick={onAcceptAll}
          className="ai-suggestion-btn ai-suggestion-accept-all"
          title="Accept all suggestions"
        >
          ✓ Accept All
        </button>
        <button
          onClick={onRejectAll}
          className="ai-suggestion-btn ai-suggestion-reject-all"
          title="Reject all suggestions"
        >
          ✕ Reject All
        </button>
      </div>
    </div>
  );
};

