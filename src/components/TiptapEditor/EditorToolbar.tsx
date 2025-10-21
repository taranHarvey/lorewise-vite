import React, { useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Highlighter,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Quote,
  Code,
  Minus,
  Eye,
  Download,
} from 'lucide-react';
import { exportService } from '../../services/exportService';

interface EditorToolbarProps {
  editor: any;
  title: string;
  onTitleChange: (title: string) => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function EditorToolbar({
  editor,
  title,
  onTitleChange,
  showBackButton = false,
  onBackClick,
}: EditorToolbarProps) {
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleHeading1 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 1 }).run();
  }, [editor]);

  const toggleHeading2 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }, [editor]);

  const toggleHeading3 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 3 }).run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const toggleHighlight = useCallback(() => {
    editor?.chain().focus().toggleHighlight().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const setTextAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor?.chain().focus().setTextAlign(alignment).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const toggleCodeBlock = useCallback(() => {
    editor?.chain().focus().toggleCodeBlock().run();
  }, [editor]);

  const insertHorizontalRule = useCallback(() => {
    editor?.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const handleExport = useCallback(async () => {
    if (!editor) return;

    try {
      const htmlContent = editor.getHTML();
      await exportService.exportToDocx(title || 'Untitled', htmlContent);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export document. Please try again.');
    }
  }, [editor, title]);

  if (!editor) return null;

  return (
    <>
      {/* Formatting Tools */}
            {/* Basic Text Formatting */}
            <button
              onClick={toggleBold}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={toggleItalic}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={toggleUnderline}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              onClick={toggleStrike}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              onClick={toggleHighlight}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('highlight') ? 'bg-gray-200' : ''}`}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            {/* Headings */}
            <button
              onClick={toggleHeading1}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleHeading2}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleHeading3}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            {/* Lists */}
            <button
              onClick={toggleBulletList}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={toggleOrderedList}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            {/* Text Alignment */}
            <button
              onClick={() => setTextAlign('left')}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextAlign('center')}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextAlign('right')}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            {/* Advanced Formatting */}
            <button
              onClick={insertTable}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('table') ? 'bg-gray-200' : ''}`}
              title="Insert Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={toggleBlockquote}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
              title="Blockquote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={toggleCodeBlock}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={insertHorizontalRule}
              className={`p-2 rounded hover:bg-gray-100`}
              title="Horizontal Rule"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            {/* History */}
            <button
              onClick={undo}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Export */}
            <button
              onClick={handleExport}
              className="p-2 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700"
              title="Export to Word Document (.docx)"
            >
              <Download className="w-4 h-4" />
            </button>
    </>
  );
}
