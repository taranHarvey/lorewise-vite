import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { MessageSquare, Send, Sparkles, User, Loader2 } from 'lucide-react';
import type { SeriesLore } from '../../documentService';

interface AIChatProps {
  lore?: SeriesLore;
  selectedText?: string;
  surroundingText?: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'normal' | 'suggestion' | 'consistency';
}

export default function AIChat({
  lore,
  selectedText,
  surroundingText,
  className = ''
}: AIChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI writing assistant. I can help you with plot development, character creation, dialogue, and more. ${
        lore ? 'I can also reference your series lore to maintain consistency across your books.' : ''
      } What would you like to work on?`,
      timestamp: new Date(),
      type: 'normal'
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isLoading,
    error,
    chatWithAI,
    suggestCharacterDevelopment,
    generatePlotIdeas,
    checkConsistency,
    clearError
  } = useAI({ lore, selectedText, surroundingText });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = useCallback(async () => {
    console.log('AIChat: handleSendMessage called');
    console.log('AIChat: message:', message);
    console.log('AIChat: isLoading:', isLoading);
    
    if (!message.trim() || isLoading) {
      console.log('AIChat: Early return - no message or loading');
      return;
    }

    const messageText = message.trim();
    console.log('AIChat: Processing message:', messageText);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'normal'
    };

    console.log('AIChat: Adding user message to chat');
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    clearError();

    try {
      console.log('AIChat: Calling chatWithAI');
      // Regular chat
      const response = await chatWithAI(messageText);
      console.log('AIChat: Response received:', response);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'normal'
      };
      
      console.log('AIChat: Adding assistant message to chat');
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AIChat: Error occurred:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        type: 'normal'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [message, isLoading, chatWithAI, clearError]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const formatMessage = useCallback((content: string) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            AI Assistant
            {lore && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Lore-Aware
              </span>
            )}
          </h3>
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
                    : msg.type === 'suggestion'
                    ? 'bg-green-50 border border-green-200'
                    : msg.type === 'consistency'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                <div className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
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
            placeholder="Ask your AI assistant anything about your writing..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
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
