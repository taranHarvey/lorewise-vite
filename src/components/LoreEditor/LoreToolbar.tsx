import React from 'react';
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
} from 'lucide-react';

interface LoreToolbarProps {}

export default function LoreToolbar({}: LoreToolbarProps) {
  const getEditor = () => {
    const editor = document.querySelector('.ProseMirror') as any;
    return editor && editor.editor ? editor.editor : null;
  };

  const toggleBold = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleItalic().run();
  };

  const toggleUnderline = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleUnderline().run();
  };

  const toggleStrike = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleStrike().run();
  };

  const toggleHighlight = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleHighlight().run();
  };

  const toggleHeading1 = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleHeading({ level: 1 }).run();
  };

  const toggleHeading2 = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleHeading({ level: 2 }).run();
  };

  const toggleHeading3 = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleHeading({ level: 3 }).run();
  };

  const toggleBulletList = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleOrderedList().run();
  };

  const setTextAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    const editor = getEditor();
    if (editor) editor.chain().focus().setTextAlign(alignment).run();
  };

  const insertTable = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const toggleBlockquote = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleBlockquote().run();
  };

  const toggleCodeBlock = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().toggleCodeBlock().run();
  };

  const insertHorizontalRule = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().setHorizontalRule().run();
  };

  const undo = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().undo().run();
  };

  const redo = () => {
    const editor = getEditor();
    if (editor) editor.chain().focus().redo().run();
  };

  const editor = getEditor();

  return (
    <>
      {/* Basic Text Formatting */}
      <button
        onClick={toggleBold}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={toggleItalic}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={toggleUnderline}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        onClick={toggleStrike}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('strike') ? 'bg-gray-200' : ''}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        onClick={toggleHighlight}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('highlight') ? 'bg-gray-200' : ''}`}
        title="Highlight"
      >
        <Highlighter className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      
      {/* Headings */}
      <button
        onClick={toggleHeading1}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        onClick={toggleHeading2}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        onClick={toggleHeading3}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      
      {/* Lists */}
      <button
        onClick={toggleBulletList}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={toggleOrderedList}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      
      {/* Text Alignment */}
      <button
        onClick={() => setTextAlign('left')}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTextAlign('center')}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTextAlign('right')}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      
      {/* Advanced Formatting */}
      <button
        onClick={insertTable}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('table') ? 'bg-gray-200' : ''}`}
        title="Insert Table"
      >
        <TableIcon className="w-4 h-4" />
      </button>
      <button
        onClick={toggleBlockquote}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        onClick={toggleCodeBlock}
        className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        onClick={insertHorizontalRule}
        className="p-2 rounded hover:bg-gray-100"
        title="Horizontal Rule"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      
      {/* History */}
      <button
        onClick={undo}
        disabled={!editor?.can().undo()}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={redo}
        disabled={!editor?.can().redo()}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>
    </>
  );
}
