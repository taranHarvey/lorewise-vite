import { Check, X, CheckCheck, XCircle } from 'lucide-react';
import type { AIEdit } from '../../services/aiService';

interface AIInlineToolbarProps {
  suggestions: AIEdit[];
  onAcceptEdit: (editId: string) => void;
  onRejectEdit: (editId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export default function AIInlineToolbar({
  suggestions,
  onAcceptEdit,
  onRejectEdit,
  onAcceptAll,
  onRejectAll,
}: AIInlineToolbarProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="ai-batch-actions">
      <span className="suggestion-count">
        {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
      </span>
      
      <button
        className="accept-all"
        onClick={onAcceptAll}
        title="Accept all AI suggestions"
      >
        <CheckCheck className="w-4 h-4 inline mr-1" />
        Accept All
      </button>
      
      <button
        className="reject-all"
        onClick={onRejectAll}
        title="Reject all AI suggestions"
      >
        <XCircle className="w-4 h-4 inline mr-1" />
        Reject All
      </button>
    </div>
  );
}

interface AISuggestionItemProps {
  edit: AIEdit;
  onAccept: (editId: string) => void;
  onReject: (editId: string) => void;
}

export function AISuggestionItem({ edit, onAccept, onReject }: AISuggestionItemProps) {
  return (
    <div className="ai-suggestion-item p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {edit.type}
            </span>
          </div>
          
          {edit.oldText && (
            <div className="text-sm mb-1">
              <span className="text-red-600 line-through bg-red-50 px-1 py-0.5 rounded">
                {edit.oldText.length > 50 ? edit.oldText.substring(0, 50) + '...' : edit.oldText}
              </span>
            </div>
          )}
          
          {edit.newText && (
            <div className="text-sm mb-2">
              <span className="text-green-600 bg-green-50 px-1 py-0.5 rounded">
                {edit.newText.length > 50 ? edit.newText.substring(0, 50) + '...' : edit.newText}
              </span>
            </div>
          )}
          
          {edit.rationale && (
            <p className="text-xs text-gray-600 italic">
              {edit.rationale}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onAccept(edit.id)}
            className="p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors"
            title="Accept suggestion"
          >
            <Check className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onReject(edit.id)}
            className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
            title="Reject suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

