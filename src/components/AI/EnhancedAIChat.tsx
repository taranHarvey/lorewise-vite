import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAIInlineEdit } from '../../hooks/useAIInlineEdit';
import { MessageSquare, Send, Sparkles, User, Loader2, Check, X, FileText, Eye, EyeOff } from 'lucide-react';
import type { SeriesLore } from '../../documentService';
import type { AIEdit } from '../../services/aiService';

interface EnhancedAIChatProps {
  lore?: SeriesLore;
  selectedText?: string;
  surroundingText?: string;
  className?: string;
  editor?: any; // Tiptap editor instance
  fullDocumentText?: string; // Full document content for analysis
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'normal' | 'edit-proposal' | 'edit-summary';
  edits?: AIEdit[]; // For edit proposal messages
  editSummary?: {
    totalEdits: number;
    types: string[];
    summary: string;
  };
}

interface EditProposal {
  id: string;
  messageId: string;
  edits: AIEdit[];
  summary: string;
  accepted: boolean | null; // null = pending, true = accepted, false = rejected
}

export default function EnhancedAIChat({
  lore,
  selectedText,
  surroundingText,
  className = '',
  editor,
  fullDocumentText = '',
}: EnhancedAIChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your enhanced AI writing assistant. I can help you with:

📝 **Generate new content** - "Create a short story about a thief" or "Write a dialogue scene"
✍️ **Document-wide editing** - I'll analyze your entire document and suggest improvements
📝 **Smart placement** - I'll find the best places to apply changes
✅ **Review & approve** - See all changes before applying them
📊 **Change summary** - Get a complete overview of what I'm suggesting

${
        lore ? 'I can also reference your series lore to maintain consistency.' : ''
      }

**For new content:** "Create a story about...", "Write a dialogue between...", "Generate a scene where..."
**For editing:** "Improve the pacing", "Add more dialogue", "Enhance descriptions"`,
      timestamp: new Date(),
      type: 'normal'
    }
  ]);
  
  const [editProposals, setEditProposals] = useState<EditProposal[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the AI inline edit hook for document analysis
  const aiInlineEdit = useAIInlineEdit({ editor, lore });

  // Generate new content function
  const generateNewContent = useCallback(async (prompt: string): Promise<string> => {
    try {
      // Use the AI service directly for generation
      const { aiService } = await import('../../services/aiService');
      
      // Create a writing context for generation
      const context = {
        selectedText: '',
        contextBefore: fullDocumentText || '',
        contextAfter: '',
        references: lore ? [{
          title: 'Series Lore',
          content: lore.content,
          type: 'lore' as const
        }] : []
      };

      // Use the existing chat method for generation
      const response = await aiService.chatWithAI(prompt, context);
      return response || 'Sorry, I couldn\'t generate content at this time.';
    } catch (error) {
      console.error('Error generating content:', error);
      return 'Sorry, I encountered an error while generating content. Please try again.';
    }
  }, [lore, fullDocumentText]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || aiInlineEdit.isLoading) {
      return;
    }

    const messageText = message.trim();
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'normal'
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    try {
      // Determine if this is a generative request or an editing request
      const hasContent = fullDocumentText && fullDocumentText.trim().length > 0;
      const isGenerativeRequest = !hasContent || 
        messageText.toLowerCase().includes('create') ||
        messageText.toLowerCase().includes('write') ||
        messageText.toLowerCase().includes('generate') ||
        messageText.toLowerCase().includes('story') ||
        messageText.toLowerCase().includes('chapter') ||
        messageText.toLowerCase().includes('scene');

      if (isGenerativeRequest && (!hasContent || messageText.toLowerCase().includes('create') || messageText.toLowerCase().includes('write'))) {
        // Generate new content
        const generatedContent = await generateNewContent(messageText);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Here's what I've generated based on your request:\n\n${generatedContent}`,
          timestamp: new Date(),
          type: 'normal'
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Insert the generated content into the editor
        if (editor) {
          const currentContent = editor.getHTML();
          const newContent = currentContent ? `${currentContent}\n\n${generatedContent}` : generatedContent;
          editor.commands.setContent(newContent);
        }
      } else if (hasContent) {
        // Analyze the full document and generate edits
        const response = await aiInlineEdit.requestInlineEdits('improve', messageText, fullDocumentText);
        
        if (response && response.success && response.edits && response.edits.length > 0) {
          const proposalId = `proposal-${Date.now()}`;
          
          // Create edit proposal
          const proposal: EditProposal = {
            id: proposalId,
            messageId: Date.now().toString(),
            edits: response.edits,
            summary: response.summary || 'Document improvements suggested',
            accepted: null
          };
          
          setEditProposals(prev => [...prev, proposal]);
          
          // Create assistant message with edit proposal
          const assistantMessage: ChatMessage = {
            id: proposal.messageId,
            role: 'assistant',
            content: `I've analyzed your document and found ${response.edits.length} places that could be improved based on your request: "${messageText}"

${response.summary || 'Here are my suggestions:'}`,
            timestamp: new Date(),
            type: 'edit-proposal',
            edits: response.edits,
            editSummary: {
              totalEdits: response.edits.length,
              types: [...new Set(response.edits.map(e => e.type))],
              summary: response.summary || 'Document improvements suggested'
            }
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Fallback to regular chat if no edits found
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.error || 'I analyzed your document but didn\'t find specific areas that need improvement based on your request. Could you be more specific about what you\'d like me to help with?',
            timestamp: new Date(),
            type: 'normal'
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // No content and not a generative request
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I need some content to work with! Please either:\n\n• Write some text in your document, then ask me to improve it\n• Or ask me to create new content (e.g., "Create a story about...")',
          timestamp: new Date(),
          type: 'normal'
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Error processing request:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'normal'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [message, aiInlineEdit, fullDocumentText, editor]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleAcceptProposal = useCallback((proposalId: string) => {
    const proposal = editProposals.find(p => p.id === proposalId);
    if (!proposal || !editor) return;

    // Apply all edits to the document using the AI inline edit system
    proposal.edits.forEach(edit => {
      // Set the suggestion in the editor first
      editor.commands.setSuggestions([edit]);
      // Then accept the edit to apply it to the document
      editor.commands.acceptEdit(edit.id);
    });

    // Mark proposal as accepted
    setEditProposals(prev => 
      prev.map(p => p.id === proposalId ? { ...p, accepted: true } : p)
    );

    // Update the message
    setMessages(prev => 
      prev.map(msg => 
        msg.id === proposal.messageId 
          ? { ...msg, content: msg.content + '\n\n✅ **Changes applied to document!**' }
          : msg
      )
    );
  }, [editProposals, editor]);

  const handleRejectProposal = useCallback((proposalId: string) => {
    const proposal = editProposals.find(p => p.id === proposalId);
    if (!proposal) return;

    // Mark proposal as rejected
    setEditProposals(prev => 
      prev.map(p => p.id === proposalId ? { ...p, accepted: false } : p)
    );

    // Update the message
    setMessages(prev => 
      prev.map(msg => 
        msg.id === proposal.messageId 
          ? { ...msg, content: msg.content + '\n\n❌ **Changes rejected.**' }
          : msg
      )
    );
  }, [editProposals]);

  const formatMessage = useCallback((content: string) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  }, []);

  const renderEditProposal = (msg: ChatMessage) => {
    const proposal = editProposals.find(p => p.messageId === msg.id);
    if (!proposal || !msg.edits) return null;

    const isPending = proposal.accepted === null;
    const isAccepted = proposal.accepted === true;
    const isRejected = proposal.accepted === false;

    return (
      <div className="mt-4 space-y-3">
        {/* Edit Summary */}
        {msg.editSummary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Change Summary</span>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>{msg.editSummary.totalEdits}</strong> changes suggested</p>
              <p>Types: <strong>{msg.editSummary.types.join(', ')}</strong></p>
              <p>{msg.editSummary.summary}</p>
            </div>
          </div>
        )}

        {/* Individual Edits */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 text-sm">Proposed Changes:</h4>
          {msg.edits.slice(0, 3).map((edit, index) => (
            <div key={edit.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {edit.type} #{index + 1}
                    </span>
                  </div>
                  
                  {edit.oldText && (
                    <div className="text-sm mb-1">
                      <span className="text-red-600 line-through bg-red-50 px-1 py-0.5 rounded text-xs">
                        {edit.oldText.length > 80 ? edit.oldText.substring(0, 80) + '...' : edit.oldText}
                      </span>
                    </div>
                  )}
                  
                  {edit.newText && (
                    <div className="text-sm mb-2">
                      <span className="text-green-600 bg-green-50 px-1 py-0.5 rounded text-xs">
                        {edit.newText.length > 80 ? edit.newText.substring(0, 80) + '...' : edit.newText}
                      </span>
                    </div>
                  )}
                  
                  {edit.rationale && (
                    <p className="text-xs text-gray-600 italic">
                      {edit.rationale}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {msg.edits.length > 3 && (
            <p className="text-xs text-gray-500 italic">
              ...and {msg.edits.length - 3} more changes
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isPending && (
            <>
              <button
                onClick={() => handleAcceptProposal(proposal.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                Apply All Changes
              </button>
              <button
                onClick={() => handleRejectProposal(proposal.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Reject All
              </button>
            </>
          )}
          
          {isAccepted && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
              <Check className="w-4 h-4" />
              Changes Applied
            </div>
          )}
          
          {isRejected && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
              <X className="w-4 h-4" />
              Changes Rejected
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Enhanced AI Assistant
            {lore && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Lore-Aware
              </span>
            )}
          </h3>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Generate: "create a story about..." | Edit: "improve pacing", "add dialogue"
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto min-h-0">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[95%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.type === 'edit-proposal'
                    ? 'bg-green-50 border border-green-200'
                    : msg.type === 'edit-summary'
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                
                {/* Render edit proposal UI */}
                {msg.type === 'edit-proposal' && renderEditProposal(msg)}
                
                <div className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {aiInlineEdit.isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Analyzing your document...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {aiInlineEdit.error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{aiInlineEdit.error}</p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create content or improve your document..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={aiInlineEdit.isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || aiInlineEdit.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {aiInlineEdit.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
