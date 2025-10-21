import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import type { SeriesLore } from '../../documentService';
import { DiffExtension } from '../../extensions/DiffExtension';
import { DiffVisualization } from '../DiffVisualization/DiffVisualization';
import { useDiffEditor } from '../../hooks/useDiffEditor';
import { useDiffKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface LoreEditorProps {
  lore: SeriesLore | null;
  onUpdate: (content: string) => void;
  onSave: () => void;
  onAutoSave?: () => void;
  user?: any;
}

export default function LoreEditor({
  lore,
  onUpdate,
  onSave,
  onAutoSave,
  user,
}: LoreEditorProps) {
  const [ready, setReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: false,
        underline: false, // Disable underline from StarterKit to avoid conflict
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      DiffExtension, // Add diff highlighting extension
    ],
    content: lore?.content || '<h1>Series Lore & Bible</h1><p>Document your world-building, character details, plot points, and any other important information for this series.</p><h2>Characters</h2><p>Add character descriptions, backgrounds, and relationships here...</p><h2>World Building</h2><p>Add setting details, rules, history, and lore here...</p><h2>Plot Points</h2><p>Add important plot points, story arcs, and key events here...</p>',
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onCreate: () => {
      setReady(true);
    },
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

  // Update editor content when lore changes
  useEffect(() => {
    if (editor && lore && lore.content !== editor.getHTML()) {
      editor.commands.setContent(lore.content);
    }
  }, [editor, lore]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    onSave();
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  }, [onSave]);


  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (user && onAutoSave) {
      try {
        await onAutoSave();
      } catch (error) {
        console.error('Error auto-saving lore:', error);
      }
    }
  }, [user, onAutoSave]);

  // Auto-save when content changes
  useEffect(() => {
    if (lore?.content) {
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
  }, [lore?.content, handleAutoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600 font-medium">Loading lore editor...</div>
          <div className="text-xs text-gray-400">Initializing Tiptap...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Content */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div style={{ visibility: ready ? 'visible' : 'hidden' }}>
            <EditorContent editor={editor} />
          </div>
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
    </div>
  );
}
