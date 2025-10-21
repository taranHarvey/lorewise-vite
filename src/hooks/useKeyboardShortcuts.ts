import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description?: string;
}

/**
 * Hook for managing keyboard shortcuts in the editor
 * Supports Ctrl/Cmd + Shift combinations for diff operations
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlOrCmd = event.ctrlKey || event.metaKey;
        const matchesModifiers =
          (shortcut.ctrlKey === undefined || shortcut.ctrlKey === ctrlOrCmd) &&
          (shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey) &&
          (shortcut.altKey === undefined || shortcut.altKey === event.altKey) &&
          (shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey);

        if (matchesModifiers && event.key.toLowerCase() === shortcut.key.toLowerCase()) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Pre-configured diff editor keyboard shortcuts
 */
export const useDiffKeyboardShortcuts = (
  acceptNext: () => void,
  rejectNext: () => void,
  acceptAll: () => void,
  rejectAll: () => void,
  enabled = true
) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      callback: acceptNext,
      description: 'Accept next/first change',
    },
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      callback: rejectNext,
      description: 'Reject next/first change',
    },
    {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
      callback: acceptAll,
      description: 'Accept all changes',
    },
    {
      key: 'Escape',
      shiftKey: true,
      callback: rejectAll,
      description: 'Reject all changes',
    },
  ];

  useKeyboardShortcuts(shortcuts, enabled);
};
