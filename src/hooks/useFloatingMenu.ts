import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';

interface FloatingMenuPosition {
  x: number;
  y: number;
  visible: boolean;
}

export function useFloatingMenu(editor: Editor | null) {
  const [position, setPosition] = useState<FloatingMenuPosition>({
    x: 0,
    y: 0,
    visible: false
  });
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = useCallback(() => {
    if (!editor || editor.state.selection.empty) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    const editorElement = editor.view.dom;
    const editorRect = editorElement.getBoundingClientRect();
    
    // Always center the menu horizontally within the editor
    const x = editorRect.width / 2;
    
    // Position the menu in the text editor section, accounting for toolbar and padding
    // Toolbar height is approximately 60px, editor padding is 32px (2rem)
    const y = 100; // Position below toolbar but within the text editor area
    
    setPosition({
      x,
      y,
      visible: true
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // Clear any existing timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      
      // Hide menu immediately if selection is empty
      if (editor.state.selection.empty) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Wait 300ms after selection stops changing before showing menu
      selectionTimeoutRef.current = setTimeout(() => {
        updatePosition();
      }, 300);
    };

    // Listen for selection changes
    editor.on('selectionUpdate', handleSelectionUpdate);
    
    // Initial position update
    updatePosition();

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [editor, updatePosition]);

  return position;
}
