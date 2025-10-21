import React, { useState, useCallback, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { Sparkles, X, Check, AlertCircle } from 'lucide-react';
import type { SeriesLore } from '../../documentService';

interface TextSelectionProps {
  selectedText: string;
  surroundingText?: string;
  lore?: SeriesLore;
  onSuggestionApply?: (suggestion: string) => void;
  onClose?: () => void;
}

export default function TextSelection({
  selectedText,
  surroundingText,
  lore,
  onSuggestionApply,
  onClose
}: TextSelectionProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  
  const {
    isLoading,
    error,
    suggestions,
    improveText,
    checkConsistency,
    clearSuggestions,
    clearError
  } = useAI({ selectedText, surroundingText, lore });

  // Auto-improve text when component mounts
  useEffect(() => {
    if (selectedText && selectedText.length > 10) {
      handleImproveText();
    }
  }, [selectedText]);

  const handleImproveText = useCallback(async () => {
    try {
      clearError();
      await improveText(selectedText);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Failed to improve text:', err);
    }
  }, [selectedText, improveText, clearError]);

  const handleCheckConsistency = useCallback(async () => {
    try {
      clearError();
      await checkConsistency(selectedText);
    } catch (err) {
      console.error('Failed to check consistency:', err);
    }
  }, [selectedText, checkConsistency, clearError]);

  const handleApplySuggestion = useCallback((suggestion: string) => {
    if (onSuggestionApply) {
      onSuggestionApply(suggestion);
    }
    setSelectedSuggestion(null);
    setShowSuggestions(false);
    if (onClose) {
      onClose();
    }
  }, [onSuggestionApply, onClose]);

  const handleClose = useCallback(() => {
    clearSuggestions();
    clearError();
    setShowSuggestions(false);
    setSelectedSuggestion(null);
    if (onClose) {
      onClose();
    }
  }, [clearSuggestions, clearError, onClose]);

  if (!selectedText) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl w-full mx-4 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">AI Text Assistant</h3>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Text Preview */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Selected text:</p>
        <p className="text-sm italic text-gray-800 bg-yellow-100 p-2 rounded">
          "{selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}"
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-2">
        <button
          onClick={handleImproveText}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'Improving...' : 'Improve Text'}
        </button>
        
        <button
          onClick={handleCheckConsistency}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          Check Consistency
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">AI Suggestions:</h4>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => setSelectedSuggestion(suggestion.text)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {suggestion.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{suggestion.text}</p>
                    {suggestion.reasoning && (
                      <p className="text-xs text-gray-600 italic">{suggestion.reasoning}</p>
                    )}
                  </div>
                  {selectedSuggestion === suggestion.text && (
                    <Check className="w-4 h-4 text-green-500 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {selectedSuggestion && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleApplySuggestion(selectedSuggestion)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Suggestion
              </button>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
