import { useState, useEffect } from 'react';
import {
  X,
  Wand2,
  FileText,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { AIActionMode, ReferenceDocument } from '../../services/aiService';

interface PromptComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mode: AIActionMode, customPrompt: string, selectedRefs: ReferenceDocument[]) => void;
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  availableReferences: ReferenceDocument[];
  defaultMode?: AIActionMode;
  isLoading?: boolean;
}

const AI_MODE_TEMPLATES: Record<AIActionMode, { label: string; description: string; template: string }> = {
  improve: {
    label: 'Improve Writing',
    description: 'Refine tone, flow, and grammar',
    template: 'Please improve the following text by enhancing clarity, flow, and style while maintaining the author\'s voice.',
  },
  expand: {
    label: 'Expand Scene',
    description: 'Add sensory details and emotional depth',
    template: 'Please expand this scene by adding sensory details, emotional depth, and vivid descriptions.',
  },
  shorten: {
    label: 'Shorten Text',
    description: 'Condense and tighten pacing',
    template: 'Please shorten this text by removing redundancy and tightening the pacing while preserving the essential meaning.',
  },
  rephrase: {
    label: 'Rephrase',
    description: 'Rewrite with different words',
    template: 'Please rephrase this text using different word choices and sentence structures while maintaining the same meaning.',
  },
  continue: {
    label: 'Continue Story',
    description: 'Generate natural continuation',
    template: 'Please continue this story naturally, matching the tone, style, and pacing of the existing text.',
  },
  consistency: {
    label: 'Check Consistency',
    description: 'Verify against lore and references',
    template: 'Please check this text for consistency with the provided reference materials and suggest corrections for any contradictions.',
  },
  dialogue: {
    label: 'Improve Dialogue',
    description: 'Enhance character voices',
    template: 'Please improve the dialogue to make it sound more natural, reveal character personality, and enhance the rhythm of conversation.',
  },
  description: {
    label: 'Enhance Description',
    description: 'Add vivid imagery',
    template: 'Please enhance the descriptions with vivid imagery, sensory details, and evocative language.',
  },
};

export default function PromptComposer({
  isOpen,
  onClose,
  onSubmit,
  selectedText,
  contextBefore,
  contextAfter,
  availableReferences,
  defaultMode = 'improve',
  isLoading = false,
}: PromptComposerProps) {
  const [selectedMode, setSelectedMode] = useState<AIActionMode>(defaultMode);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [showReferences, setShowReferences] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(defaultMode);
      setCustomPrompt(AI_MODE_TEMPLATES[defaultMode].template);
      // Pre-select all active references
      setSelectedRefs(availableReferences.map(ref => ref.title));
    }
  }, [isOpen, defaultMode, availableReferences]);

  const handleModeChange = (mode: AIActionMode) => {
    setSelectedMode(mode);
    setCustomPrompt(AI_MODE_TEMPLATES[mode].template);
  };

  const handleSubmit = () => {
    const refsToInclude = availableReferences.filter(ref => 
      selectedRefs.includes(ref.title)
    );
    onSubmit(selectedMode, customPrompt, refsToInclude);
  };

  const toggleReference = (refTitle: string) => {
    setSelectedRefs(prev =>
      prev.includes(refTitle)
        ? prev.filter(t => t !== refTitle)
        : [...prev, refTitle]
    );
  };

  if (!isOpen) return null;

  const selectedReferences = availableReferences.filter(ref => 
    selectedRefs.includes(ref.title)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Prompt Composer</h2>
              <p className="text-sm text-gray-500">Customize your AI request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Action Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              AI Action Mode
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(AI_MODE_TEMPLATES) as AIActionMode[]).map((mode) => {
                const template = AI_MODE_TEMPLATES[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedMode === mode
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      {template.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add any specific instructions for the AI..."
              disabled={isLoading}
            />
          </div>

          {/* Selected Text Preview */}
          <div>
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
            >
              {showContext ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <FileText className="w-4 h-4" />
              Context Preview
              <span className="text-gray-500 ml-1">
                ({selectedText.length} characters selected)
              </span>
            </button>
            
            {showContext && (
              <div className="space-y-2">
                {contextBefore && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">Before:</div>
                    <div className="text-sm text-gray-600 line-clamp-3">{contextBefore}</div>
                  </div>
                )}
                
                <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-1">Selected Text:</div>
                  <div className="text-sm text-gray-900 max-h-32 overflow-y-auto">
                    {selectedText || '(No text selected)'}
                  </div>
                </div>
                
                {contextAfter && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">After:</div>
                    <div className="text-sm text-gray-600 line-clamp-3">{contextAfter}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reference Documents */}
          {availableReferences.length > 0 && (
            <div>
              <button
                onClick={() => setShowReferences(!showReferences)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                {showReferences ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Eye className="w-4 h-4" />
                Reference Documents
                <span className="text-gray-500 ml-1">
                  ({selectedRefs.length} selected)
                </span>
              </button>
              
              {showReferences && (
                <div className="space-y-2">
                  {availableReferences.map((ref) => (
                    <label
                      key={ref.title}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRefs.includes(ref.title)}
                        onChange={() => toggleReference(ref.title)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {ref.title}
                        </div>
                        {ref.type && (
                          <div className="text-xs text-gray-500 mt-1">
                            Type: {ref.type}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-gray-700">
                <p className="font-medium mb-1">Ready to process:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>{selectedText.length} characters of selected text</li>
                  {selectedReferences.length > 0 && (
                    <li>{selectedReferences.length} reference document{selectedReferences.length > 1 ? 's' : ''}</li>
                  )}
                  <li>Mode: {AI_MODE_TEMPLATES[selectedMode].label}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedText.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? 'Processing...' : 'Generate AI Edits'}
          </button>
        </div>
      </div>
    </div>
  );
}

