import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import TextSelection from '../AI/TextSelection';
import { useAIIntegration } from '../AI/AIIntegrationExample';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Strike from '@tiptap/extension-strike';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Placeholder from '@tiptap/extension-placeholder';
import Focus from '@tiptap/extension-focus';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { DiffExtension } from '../../extensions/DiffExtension';
import { DiffVisualization } from '../DiffVisualization/DiffVisualization';
import { useDiffEditor } from '../../hooks/useDiffEditor';
import { useDiffKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import {
  Hash,
  CheckCircle
} from 'lucide-react';


interface TiptapEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  onAutoSave?: () => void;
  user?: any;
  lore?: any; // Series lore for AI context
  onEditorReady?: (editor: any) => void; // Callback to pass editor instance to parent
  loreStatus?: { isProcessing: boolean; message?: string }; // Lore update status
}

export default function TiptapEditor({
  content,
  onUpdate,
  onAutoSave,
  user,
  lore,
  onEditorReady,
  loreStatus,
}: TiptapEditorProps) {
  const [ready, setReady] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFocusMode] = useState(false);
  const [showWordCount] = useState(true);
  const [lastSaved] = useState<Date | null>(new Date());
  const [showTextSelection, setShowTextSelection] = useState(false);
  const [currentSelection, setCurrentSelection] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: false,
        underline: false, // Disable underline from StarterKit to avoid conflict
        strike: false, // Disable strike from StarterKit to avoid conflict
        blockquote: false, // We'll use our own blockquote
        codeBlock: false, // We'll use our own code block
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Strike,
      Superscript,
      Subscript,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Blockquote,
      CodeBlock,
      HorizontalRule,
      Placeholder.configure({
        placeholder: 'Start writing your story...',
      }),
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      CharacterCount,
      Typography,
      DiffExtension, // Add diff highlighting extension
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html);
    },
  });

  // Initialize diff editor hook
  const {
    pendingChanges,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
  } = useDiffEditor(editor);

  // Keyboard shortcuts for diff operations
  const acceptNextChange = useCallback(() => {
    if (pendingChanges.length > 0) {
      acceptChange(pendingChanges[0].id);
    }
  }, [pendingChanges, acceptChange]);

  const rejectNextChange = useCallback(() => {
    if (pendingChanges.length > 0) {
      rejectChange(pendingChanges[0].id);
    }
  }, [pendingChanges, rejectChange]);

  // Enable keyboard shortcuts when there are pending changes
  useDiffKeyboardShortcuts(
    acceptNextChange,
    rejectNextChange,
    acceptAllChanges,
    rejectAllChanges,
    pendingChanges.length > 0
  );

  const handleAutoSave = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Auto-saving document...');
      await onAutoSave?.();
      console.log('Document auto-saved successfully');
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  }, [user, onAutoSave]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && ready) {
      onEditorReady?.(editor);
    }
  }, [editor, ready, onEditorReady]);

  // Auto-save when content changes
  useEffect(() => {
    if (content) {
      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      // Set new timeout for auto-save (2 seconds after user stops typing)
      const timeout = setTimeout(() => {
        handleAutoSave();
      }, 2000);
      
      setAutoSaveTimeout(timeout);
    }
  }, [content, handleAutoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Set ready state when editor is available
  useEffect(() => {
    if (editor) {
      setReady(true);
    }
  }, [editor]);

  // AI integration hook
  useAIIntegration(editor, lore);

  // AI inline editing hook

  // Note: Slash commands (AICommandsExtension) temporarily disabled
  // They will be re-added with a better pattern that avoids circular dependencies

  // handleAIAction removed - using HybridAIActionMenu instead

  // aiActionHandlers removed - using HybridAIActionMenu instead


  // Handle suggestion application
  const handleSuggestionApply = useCallback((suggestion: string) => {
    if (!editor || !currentSelection) return;

    editor.chain().focus().deleteSelection().insertContent(suggestion).run();
    
    setShowTextSelection(false);
    setCurrentSelection('');
  }, [editor, currentSelection]);

  // Get surrounding text for context
  const getSurroundingText = useCallback(() => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    const start = Math.max(0, from - 200);
    const end = Math.min(doc.content.size, to + 200);
    return doc.textBetween(start, end);
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">

        {/* Main Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 bg-white overflow-y-auto ${isFocusMode ? 'focus-mode' : ''}`}>
              <div
                style={{
                  visibility: ready ? 'visible' : 'hidden',
                  maxWidth: isFocusMode ? '800px' : 'none',
                  margin: isFocusMode ? '0 auto' : '0',
                  padding: isFocusMode ? '2rem' : '2rem 3rem'
                }}
              >

                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Status Bar */}
          {showWordCount && editor && (
            <div className="bg-gray-50 text-gray-600 px-4 py-2 flex items-center justify-between text-sm border-t border-gray-200">
              {/* Left side - Word and Character Count */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span>{editor.storage.characterCount.words()} words</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>{editor.storage.characterCount.characters()} characters</span>
                </div>
              </div>

              {/* Right side - Save Status and Lore Status */}
              <div className="flex items-center gap-6">
                {/* Lore Status */}
                {loreStatus?.isProcessing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                    <span>{loreStatus.message || 'Processing lore...'}</span>
                  </div>
                )}
                {loreStatus?.message && !loreStatus.isProcessing && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{loreStatus.message}</span>
                  </div>
                )}

                {/* Save Status */}
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>
                    {lastSaved
                      ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Auto-save enabled'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diff Visualization Sidebar */}
      {pendingChanges.length > 0 && (
        <div className="w-96 border-l border-gray-300 bg-gray-100 overflow-y-auto">
          <DiffVisualization
            changes={pendingChanges}
            onAccept={acceptChange}
            onReject={rejectChange}
            onAcceptAll={acceptAllChanges}
            onRejectAll={rejectAllChanges}
            showRationale={true}
          />
        </div>
      )}


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

      {/* Old AI Action Menu disabled - using HybridAIActionMenu instead */}



    </div>
  );
}