import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, Check, X, MessageSquare, RotateCcw, FileSearch } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { loreExtractionService } from '../../services/loreExtractionService';
import type { SeriesLore } from '../../documentService';
import type { LoreUpdate } from '../../services/loreExtractionService';
import { Editor } from '@tiptap/react';
import './CursorStyleChat.scss';

interface CursorStyleChatProps {
  editor: Editor | null;
  lore?: SeriesLore;
  isOpen: boolean;
  onClose: () => void;
  onLoreUpdate?: (updatedLore: string) => Promise<void>;
  messages?: ChatMessage[];
  onMessagesUpdate?: (messages: ChatMessage[]) => void;
  onLoreStatusChange?: (status: { isProcessing: boolean; message?: string }) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'accepted' | 'declined';
  loreUpdates?: LoreUpdate[];
  loreUpdateSummary?: string;
}

/**
 * Helper function to convert plain text with line breaks into HTML paragraphs
 * Handles single line breaks (\n) and double line breaks (\n\n) for proper paragraph formatting
 */
function formatTextToHTML(text: string): string {
  // Split by double line breaks first to identify paragraphs
  const paragraphs = text.split(/\n\n+/);

  // Convert each paragraph to HTML, preserving single line breaks within paragraphs
  const htmlParagraphs = paragraphs
    .map(para => {
      // Trim whitespace from each paragraph
      const trimmed = para.trim();
      if (!trimmed) return '';

      // Replace single line breaks with <br> tags for line breaks within a paragraph
      const withBreaks = trimmed.replace(/\n/g, '<br>');

      // Wrap in paragraph tag
      return `<p>${withBreaks}</p>`;
    })
    .filter(para => para); // Remove empty paragraphs

  return htmlParagraphs.join('');
}

/**
 * Cursor-style AI Chat Component
 * Simple workflow: Prompt → AI Response → Accept/Decline/Feedback → Insert at cursor
 */
export const CursorStyleChat: React.FC<CursorStyleChatProps> = ({
  editor,
  lore,
  isOpen,
  onClose,
  onLoreUpdate,
  messages: externalMessages,
  onMessagesUpdate,
  onLoreStatusChange,
}) => {
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null); // message ID in feedback mode
  const [feedbackText, setFeedbackText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use external messages if provided, otherwise use internal state
  const messages = externalMessages || internalMessages;

  // Create a stable setMessages function using refs
  const onMessagesUpdateRef = useRef(onMessagesUpdate);
  const externalMessagesRef = useRef(externalMessages);
  const internalMessagesRef = useRef(internalMessages);

  // Update refs on every render
  useEffect(() => {
    onMessagesUpdateRef.current = onMessagesUpdate;
    externalMessagesRef.current = externalMessages;
    internalMessagesRef.current = internalMessages;
  });

  const setMessages = useCallback((updater: React.SetStateAction<ChatMessage[]>) => {
    if (onMessagesUpdateRef.current) {
      // If we have external message management, use it
      const currentMessages = externalMessagesRef.current || internalMessagesRef.current;
      const newMessages = typeof updater === 'function' ? updater(currentMessages) : updater;
      onMessagesUpdateRef.current(newMessages);
    } else {
      // Otherwise use internal state
      setInternalMessages(updater);
    }
  }, []);

  // Sync external messages to internal state
  useEffect(() => {
    if (externalMessages) {
      setInternalMessages(externalMessages);
    }
  }, [externalMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !editor) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get comprehensive context from editor
      const { from } = editor.state.selection;
      const fullText = editor.getText();

      // Get immediate surrounding context (1000 chars before cursor for recent events)
      const immediateContextStart = Math.max(0, from - 1000);
      const immediateContext = fullText.substring(immediateContextStart, from);

      // Get broader document context (first 2000 chars for story setup)
      const documentStart = fullText.substring(0, Math.min(2000, fullText.length));

      // Get cursor position context (500 chars around cursor)
      const cursorContextStart = Math.max(0, from - 500);
      const cursorContextEnd = Math.min(fullText.length, from + 500);
      const cursorContext = fullText.substring(cursorContextStart, cursorContextEnd);

      // Build enhanced prompt with full document analysis
      const systemContext = buildSystemContext(lore, {
        documentStart,
        immediateContext,
        cursorContext,
        fullTextLength: fullText.length,
        cursorPosition: from,
      });

      const prompt = `${systemContext}\n\nUser request: ${input.trim()}\n\nPlease generate the requested content that naturally continues the story. Write it ready to be inserted into the document at the cursor position. Maintain consistency with the story's tone, style, and established narrative.

IMPORTANT FORMATTING:
- Use double line breaks (\\n\\n) to separate paragraphs
- Use single line breaks (\\n) for line breaks within dialogue or poetry
- Format your response as plain text with proper paragraph breaks`;

      // Call AI service with enhanced context
      const response = await aiService.generateContent(prompt, {
        selectedText: '',
        surroundingText: immediateContext,
        lore,
      });

      // Add AI response as pending
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        status: 'pending',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        status: 'declined',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, editor, lore]);

  const handleAccept = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || !editor) return;

      // Convert escaped newlines to actual newlines, then format to HTML
      const contentWithNewlines = message.content.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');
      const formattedContent = formatTextToHTML(contentWithNewlines);

      // Insert at cursor position
      const { from } = editor.state.selection;
      editor.chain().focus().insertContentAt(from, formattedContent).run();

      // Mark as accepted and add confirmation message
      const confirmMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: '✓ Content inserted at cursor position.',
        timestamp: new Date(),
        status: 'accepted',
      };

      // Extract lore updates from accepted content
      if (lore && onLoreUpdate) {
        // Use an async IIFE to handle lore processing without blocking
        (async () => {
          try {
            onLoreStatusChange?.({ isProcessing: true, message: 'Analyzing for lore updates...' });

            // Update status and add confirmation (no analyzing message in chat)
            setMessages((prev) => [
              ...prev.map((m) => (m.id === messageId ? { ...m, status: 'accepted' as const } : m)),
              confirmMessage
            ]);

            const extractionResult = await loreExtractionService.extractLoreFromContent(
              contentWithNewlines,
              lore
            );

            if (extractionResult.hasUpdates && extractionResult.updates.length > 0) {
              onLoreStatusChange?.({ isProcessing: true, message: `Updating lore (${extractionResult.updates.length} ${extractionResult.updates.length === 1 ? 'entry' : 'entries'})...` });

              // Automatically apply all lore updates in the background
              const updatedLore = await loreExtractionService.applyLoreUpdates(
                lore,
                extractionResult.updates
              );

              // Save updated lore
              await onLoreUpdate(updatedLore);

              // Show success in status bar
              onLoreStatusChange?.({ isProcessing: false, message: `Lore updated (${extractionResult.updates.length} ${extractionResult.updates.length === 1 ? 'entry' : 'entries'})` });
            } else {
              // No lore updates found
              onLoreStatusChange?.({ isProcessing: false });
            }
          } catch (error) {
            console.error('Lore extraction failed:', error);
            onLoreStatusChange?.({ isProcessing: false, message: 'Lore update failed' });
          }
        })();
      } else {
        // No lore updates enabled, just update status and add confirmation
        setMessages((prev) => [
          ...prev.map((m) => (m.id === messageId ? { ...m, status: 'accepted' as const } : m)),
          confirmMessage
        ]);
      }
    },
    [messages, editor, lore, onLoreUpdate, setMessages]
  );

  const handleDecline = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, status: 'declined' as const } : m))
    );
  }, [setMessages]);

  const handleFeedback = useCallback(
    async (messageId: string) => {
      if (!feedbackText.trim() || !editor) return;

      const originalMessage = messages.find((m) => m.id === messageId);
      if (!originalMessage) return;

      // Add user feedback message
      const feedbackMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: `Please revise: ${feedbackText}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, feedbackMessage]);
      setFeedbackMode(null);
      setFeedbackText('');
      setIsLoading(true);

      try {
        // Get comprehensive context from editor
        const { from } = editor.state.selection;
        const fullText = editor.getText();

        // Get immediate surrounding context
        const immediateContextStart = Math.max(0, from - 1000);
        const immediateContext = fullText.substring(immediateContextStart, from);

        // Get broader document context
        const documentStart = fullText.substring(0, Math.min(2000, fullText.length));

        // Get cursor position context
        const cursorContextStart = Math.max(0, from - 500);
        const cursorContextEnd = Math.min(fullText.length, from + 500);
        const cursorContext = fullText.substring(cursorContextStart, cursorContextEnd);

        const systemContext = buildSystemContext(lore, {
          documentStart,
          immediateContext,
          cursorContext,
          fullTextLength: fullText.length,
          cursorPosition: from,
        });

        const prompt = `${systemContext}\n\nOriginal content:\n${originalMessage.content}\n\nUser feedback: ${feedbackText}\n\nPlease revise the content based on the feedback while maintaining consistency with the story context.

IMPORTANT FORMATTING:
- Use double line breaks (\\n\\n) to separate paragraphs
- Use single line breaks (\\n) for line breaks within dialogue or poetry
- Format your response as plain text with proper paragraph breaks`;

        const response = await aiService.generateContent(prompt, {
          selectedText: originalMessage.content,
          surroundingText: immediateContext,
          lore,
        });

        const revisedMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          status: 'pending',
        };

        setMessages((prev) => [...prev, revisedMessage]);
      } catch (error) {
        console.error('Feedback Error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [feedbackText, messages, editor, lore]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (feedbackMode) {
          handleFeedback(feedbackMode);
        } else {
          handleSendMessage();
        }
      }
    },
    [feedbackMode, handleFeedback, handleSendMessage]
  );

  // Manual lore analysis - analyze selected text or full document
  const handleAnalyzeLore = useCallback(async () => {
    if (!editor || !lore || !onLoreUpdate) return;

    // Run in background without blocking UI
    (async () => {
      try {
        // Get selected text or full document
        const { from, to } = editor.state.selection;
        const isTextSelected = from !== to;
        const contentToAnalyze = isTextSelected
          ? editor.state.doc.textBetween(from, to, '\n')
          : editor.getText();

        onLoreStatusChange?.({
          isProcessing: true,
          message: isTextSelected
            ? 'Analyzing selected text for lore...'
            : 'Analyzing document for lore...'
        });

        const extractionResult = await loreExtractionService.extractLoreFromContent(
          contentToAnalyze,
          lore
        );

        if (extractionResult.hasUpdates && extractionResult.updates.length > 0) {
          onLoreStatusChange?.({ isProcessing: true, message: `Updating lore (${extractionResult.updates.length} ${extractionResult.updates.length === 1 ? 'entry' : 'entries'})...` });

          // Automatically apply all lore updates
          const updatedLore = await loreExtractionService.applyLoreUpdates(
            lore,
            extractionResult.updates
          );

          // Save updated lore
          await onLoreUpdate(updatedLore);

          // Show success in status bar
          onLoreStatusChange?.({ isProcessing: false, message: `Lore updated (${extractionResult.updates.length} ${extractionResult.updates.length === 1 ? 'entry' : 'entries'})` });
        } else {
          // No lore updates found
          onLoreStatusChange?.({ isProcessing: false, message: 'No lore updates found' });
        }
      } catch (error) {
        console.error('Lore analysis failed:', error);
        onLoreStatusChange?.({ isProcessing: false, message: 'Lore analysis failed' });
      }
    })();
  }, [editor, lore, onLoreUpdate, onLoreStatusChange]);

  if (!isOpen) return null;

  return (
    <div className="cursor-chat">
      {/* Header */}
      <div className="cursor-chat__header">
        <div className="cursor-chat__title">
          <MessageSquare size={18} />
          <span>AI Assistant</span>
        </div>
        <div className="cursor-chat__header-actions">
          {lore && onLoreUpdate && (
            <button
              className="cursor-chat__analyze-btn"
              onClick={handleAnalyzeLore}
              disabled={isLoading}
              title="Analyze document for lore updates"
            >
              <FileSearch size={16} />
              <span>Analyze Lore</span>
            </button>
          )}
          <button className="cursor-chat__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="cursor-chat__messages">
        {messages.length === 0 && (
          <div className="cursor-chat__empty">
            <MessageSquare size={48} className="cursor-chat__empty-icon" />
            <p>Ask me to write anything!</p>
            <p className="cursor-chat__empty-hint">
              I'll generate content and you can insert it at your cursor position.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`cursor-chat__message cursor-chat__message--${msg.role}`}>
            <div className="cursor-chat__message-content">
              <div className="cursor-chat__message-text" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n')}
              </div>

              {/* AI message actions - only show for pending messages */}
              {msg.role === 'assistant' && msg.status === 'pending' && (
                <div className="cursor-chat__actions">
                  {feedbackMode === msg.id ? (
                    <div className="cursor-chat__feedback">
                      <textarea
                        className="cursor-chat__feedback-input"
                        placeholder="Describe how to improve this..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        autoFocus
                      />
                      <div className="cursor-chat__feedback-buttons">
                        <button
                          className="cursor-chat__btn cursor-chat__btn--small"
                          onClick={() => {
                            setFeedbackMode(null);
                            setFeedbackText('');
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="cursor-chat__btn cursor-chat__btn--primary cursor-chat__btn--small"
                          onClick={() => handleFeedback(msg.id)}
                          disabled={!feedbackText.trim()}
                        >
                          Send Feedback
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="cursor-chat__btn cursor-chat__btn--decline"
                        onClick={() => handleDecline(msg.id)}
                        title="Decline"
                      >
                        <X size={16} />
                        Decline
                      </button>
                      <button
                        className="cursor-chat__btn cursor-chat__btn--feedback"
                        onClick={() => setFeedbackMode(msg.id)}
                        title="Give feedback"
                      >
                        <RotateCcw size={16} />
                        Revise
                      </button>
                      <button
                        className="cursor-chat__btn cursor-chat__btn--accept"
                        onClick={() => handleAccept(msg.id)}
                        title="Accept and insert"
                      >
                        <Check size={16} />
                        Accept
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Status indicators */}
              {msg.status === 'accepted' && (
                <div className="cursor-chat__status cursor-chat__status--accepted">
                  <Check size={14} /> Accepted
                </div>
              )}
              {msg.status === 'declined' && (
                <div className="cursor-chat__status cursor-chat__status--declined">
                  <X size={14} /> Declined
                </div>
              )}
            </div>

            <div className="cursor-chat__message-time">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="cursor-chat__message cursor-chat__message--assistant">
            <div className="cursor-chat__message-content">
              <div className="cursor-chat__loading">
                <Loader2 size={16} className="cursor-chat__spinner" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="cursor-chat__input-container">
        <textarea
          ref={textareaRef}
          className="cursor-chat__input"
          placeholder="Ask AI to write something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          rows={1}
        />
        <button
          className="cursor-chat__send"
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

/**
 * Build system context for AI with enhanced document analysis
 */
interface DocumentContext {
  documentStart?: string;
  immediateContext?: string;
  cursorContext?: string;
  fullTextLength?: number;
  cursorPosition?: number;
}

function buildSystemContext(
  lore?: SeriesLore,
  context?: string | DocumentContext
): string {
  let prompt = 'You are a creative writing assistant helping an author write their novel.';

  // Add lore information
  if (lore?.content) {
    prompt += `\n\n=== SERIES LORE & BIBLE ===\n${lore.content}\n\nIMPORTANT: Use this lore to ensure consistency in characters, worldbuilding, plot, and established facts.`;
  }

  // Handle enhanced context object
  if (context && typeof context === 'object') {
    const ctx = context as DocumentContext;

    if (ctx.documentStart) {
      prompt += `\n\n=== STORY BEGINNING (for context) ===\n${ctx.documentStart}\n\nThis shows how the story began. Use this to understand the setup, tone, and style.`;
    }

    if (ctx.immediateContext) {
      prompt += `\n\n=== RECENT NARRATIVE (what just happened) ===\n${ctx.immediateContext}\n\nThis is what happened most recently in the story. Your content should flow naturally from here.`;
    }

    if (ctx.cursorContext) {
      prompt += `\n\n=== CURSOR POSITION CONTEXT ===\n${ctx.cursorContext}\n\nThe cursor is positioned in this section. Insert content that fits naturally at this point.`;
    }

    if (ctx.fullTextLength !== undefined && ctx.cursorPosition !== undefined) {
      const progressPercent = Math.round((ctx.cursorPosition / ctx.fullTextLength) * 100);
      prompt += `\n\nDocument progress: ${progressPercent}% (${ctx.cursorPosition} / ${ctx.fullTextLength} characters)`;
    }
  } else if (typeof context === 'string') {
    // Legacy string context support
    prompt += `\n\n=== CONTEXT (surrounding text) ===\n${context}\n\nConsider this context when generating content.`;
  }

  prompt += `\n\n=== INSTRUCTIONS ===
- Analyze all provided context carefully before generating
- Maintain narrative continuity with what came before
- Match the established writing style and tone
- Ensure consistency with lore and character voices
- Write content that flows naturally at the cursor position`;

  return prompt;
}
