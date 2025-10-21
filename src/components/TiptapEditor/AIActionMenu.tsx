import { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  CheckCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Editor } from '@tiptap/react';

interface AIActionMenuProps {
  editor: Editor;
  onImprove: () => void;
  onExpand: () => void;
  onShorten: () => void;
  onRephrase: () => void;
  onContinue: () => void;
  onCheckConsistency: () => void;
  onImproveDialogue: () => void;
  onEnhanceDescription: () => void;
  isLoading?: boolean;
}

export default function AIActionMenu({
  editor,
  onImprove,
  onExpand,
  onShorten,
  onRephrase,
  onContinue,
  onCheckConsistency,
  onImproveDialogue,
  onEnhanceDescription,
  isLoading = false,
}: AIActionMenuProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection && !isLoading) {
        // Get the position of the selection
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        
        // Position menu above the selection
        const menuWidth = 400; // Approximate menu width
        const left = Math.max(10, Math.min(
          window.innerWidth - menuWidth - 10,
          (start.left + end.right) / 2 - menuWidth / 2
        ));
        
        setPosition({
          top: start.top - 60, // Position above selection
          left,
        });
        setShow(true);
      } else {
        setShow(false);
      }
    };

    // Update position on selection change
    const handleUpdate = () => {
      updatePosition();
    };

    editor.on('selectionUpdate', handleUpdate);
    editor.on('update', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor, isLoading]);

  if (!show) {
    return null;
  }

  const actions = [
    {
      icon: Wand2,
      label: 'Improve',
      onClick: onImprove,
      description: 'Refine tone, flow & grammar',
    },
    {
      icon: Maximize2,
      label: 'Expand',
      onClick: onExpand,
      description: 'Add depth & detail',
    },
    {
      icon: Minimize2,
      label: 'Shorten',
      onClick: onShorten,
      description: 'Tighten pacing',
    },
    {
      icon: RefreshCw,
      label: 'Rephrase',
      onClick: onRephrase,
      description: 'Rewrite differently',
    },
    {
      icon: Plus,
      label: 'Continue',
      onClick: onContinue,
      description: 'Generate next part',
    },
    {
      icon: CheckCircle,
      label: 'Consistency',
      onClick: onCheckConsistency,
      description: 'Check with lore',
    },
    {
      icon: MessageSquare,
      label: 'Dialogue',
      onClick: onImproveDialogue,
      description: 'Enhance conversation',
    },
    {
      icon: Sparkles,
      label: 'Description',
      onClick: onEnhanceDescription,
      description: 'Add vivid imagery',
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="flex items-center gap-1">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1">
          AI Actions
        </div>
        <div className="h-4 w-px bg-gray-200" />
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={(e) => {
              e.preventDefault();
              action.onClick();
              setShow(false);
            }}
            className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600"
            title={action.description}
            disabled={isLoading}
          >
            <action.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{action.label}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {action.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact version - shows as icon buttons only
 */
export function AIActionMenuCompact({
  editor,
  onImprove,
  onExpand,
  onShorten,
  onRephrase,
  onContinue,
  onCheckConsistency,
  onImproveDialogue,
  onEnhanceDescription,
  isLoading = false,
}: AIActionMenuProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection && !isLoading) {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        
        const menuWidth = 320;
        const left = Math.max(10, Math.min(
          window.innerWidth - menuWidth - 10,
          (start.left + end.right) / 2 - menuWidth / 2
        ));
        
        setPosition({
          top: start.top - 50,
          left,
        });
        setShow(true);
      } else {
        setShow(false);
      }
    };

    const handleUpdate = () => {
      updatePosition();
    };

    editor.on('selectionUpdate', handleUpdate);
    editor.on('update', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor, isLoading]);

  if (!show) {
    return null;
  }

  const actions = [
    { icon: Wand2, onClick: onImprove, tooltip: 'Improve Writing' },
    { icon: Maximize2, onClick: onExpand, tooltip: 'Expand Scene' },
    { icon: Minimize2, onClick: onShorten, tooltip: 'Shorten Text' },
    { icon: RefreshCw, onClick: onRephrase, tooltip: 'Rephrase' },
    { icon: Plus, onClick: onContinue, tooltip: 'Continue Story' },
    { icon: CheckCircle, onClick: onCheckConsistency, tooltip: 'Check Consistency' },
    { icon: MessageSquare, onClick: onImproveDialogue, tooltip: 'Improve Dialogue' },
    { icon: Sparkles, onClick: onEnhanceDescription, tooltip: 'Enhance Description' },
  ];

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 flex items-center gap-0.5"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault();
            action.onClick();
            setShow(false);
          }}
          className="group relative p-2 rounded hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
          title={action.tooltip}
          disabled={isLoading}
        >
          <action.icon className="w-4 h-4" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {action.tooltip}
          </div>
        </button>
      ))}
    </div>
  );
}

