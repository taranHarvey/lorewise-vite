import React, { useState } from 'react';
import { Check, X, Edit3, Copy, RotateCcw } from 'lucide-react';

interface AIResponsePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (content: string) => void;
  onDiscard: () => void;
  suggestion: {
    content: string;
    type: 'generate' | 'edit' | 'improve';
    originalPrompt: string;
  };
  editor?: any; // Tiptap editor instance
}

export default function AIResponsePreview({
  isOpen,
  onClose,
  onAccept,
  onDiscard,
  suggestion,
  editor
}: AIResponsePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(suggestion.content);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    const contentToInsert = isEditing ? editedContent : suggestion.content;
    onAccept(contentToInsert);
    onClose();
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleReset = () => {
    setEditedContent(suggestion.content);
    setIsEditing(false);
  };

  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'generate': return '✨';
      case 'edit': return '✏️';
      case 'improve': return '🚀';
      default: return '🤖';
    }
  };

  const getTypeLabel = () => {
    switch (suggestion.type) {
      case 'generate': return 'Generated Content';
      case 'edit': return 'Edit Suggestion';
      case 'improve': return 'Improvement';
      default: return 'AI Response';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon()}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getTypeLabel()}</h2>
              <p className="text-sm text-gray-500">Based on: "{suggestion.originalPrompt}"</p>
            </div>
          </div>
          <button
            onClick={handleDiscard}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isEditing 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? 'Editing' : 'Edit'}
              </button>
              
              {isEditing && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isCopied 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Copy className="w-4 h-4" />
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Text Area */}
          <div className="flex-1 p-6">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                placeholder="Edit the AI-generated content here..."
              />
            ) : (
              <div className="w-full h-full p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                <div 
                  className="prose prose-sm max-w-none text-gray-900 leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
                >
                  {editedContent}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {isEditing ? 'Edit the content above, then click Insert to add it to your document.' : 'Review the content above, then choose to insert or discard.'}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Discard
            </button>
            
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
