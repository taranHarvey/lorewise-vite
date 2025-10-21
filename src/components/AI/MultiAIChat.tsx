import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { useAIInlineEdit } from '../../hooks/useAIInlineEdit';
import { useAIResponsePreview } from '../../hooks/useAIResponsePreview';
import { MessageSquare, Send, X, Plus, User, Loader2, Save, Edit3, Trash2, Check, FileText } from 'lucide-react';
import type { SeriesLore } from '../../documentService';
import { chatService, type SavedChat } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import AIResponsePreview from './AIResponsePreview';

interface AIChatProps {
  lore?: SeriesLore;
  selectedText?: string;
  surroundingText?: string;
  className?: string;
  documentId?: string;
  seriesId?: string;
  editor?: any; // Tiptap editor instance
  fullDocumentText?: string; // Full document content for analysis
}

interface ChatTab {
  id: string;
  title: string;
  messages: ChatMessage[];
  isActive: boolean;
  isNew?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'normal' | 'suggestion' | 'consistency' | 'edit-proposal' | 'edit-summary';
  edits?: any[]; // For edit proposal messages
  editSummary?: {
    totalEdits: number;
    types: string[];
    summary: string;
  };
}

export default function MultiAIChat({
  lore,
  selectedText,
  surroundingText,
  className = '',
  documentId,
  seriesId,
  editor,
  fullDocumentText
}: AIChatProps) {
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([]);
  
  const [message, setMessage] = useState('');
  const [activeTabId, setActiveTabId] = useState('1');
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [editProposals, setEditProposals] = useState<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const {
    isLoading,
    error,
    chatWithAI,
    suggestCharacterDevelopment,
    generatePlotIdeas,
    checkConsistency,
    clearError
  } = useAI({ lore, selectedText, surroundingText });

  // AI inline editing hook
  const aiInlineEdit = useAIInlineEdit({ editor, lore });

  // AI response preview hook
  const {
    isPreviewOpen,
    currentSuggestion,
    showPreview,
    hidePreview,
    handleAccept,
    handleDiscard
  } = useAIResponsePreview();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatTabs]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 4 * 24; // 4 rows * 24px per row
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [message]);

  // Get active tab
  const activeTab = chatTabs.find(tab => tab.id === activeTabId);

  // Load saved chats on component mount
  useEffect(() => {
    if (user) {
      loadSavedChats();
    }
  }, [user, documentId, seriesId]);

  // Load saved chats from the service
  const loadSavedChats = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingChats(true);
    try {
      const chats = await chatService.loadUserChats(user.uid, documentId, seriesId);
      setSavedChats(chats);
      
      if (chats.length > 0) {
        // Convert saved chats to chat tabs
        const savedChatTabs = chats.map(chat => chatService.convertToChatTab(chat));
        setChatTabs(savedChatTabs);
        
        // Set the first saved chat as active
        if (savedChatTabs.length > 0) {
          setActiveTabId(savedChatTabs[0].id);
        }
      } else {
        // No saved chats, create a new one
        const newChatTab: ChatTab = {
          id: '1',
          title: 'New Chat',
          messages: [
            {
              id: generateMessageId(),
              role: 'assistant',
              content: `Hi! I'm your AI writing assistant. I can help you with plot development, character creation, dialogue, and more. ${
                lore ? 'I can also reference your series lore to maintain consistency across your books.' : ''
              } What would you like to work on?`,
              timestamp: new Date(),
              type: 'normal'
            }
          ],
          isActive: true,
          isNew: true
        };
        setChatTabs([newChatTab]);
        setActiveTabId('1');
      }
    } catch (error) {
      console.error('Error loading saved chats:', error);
      // On error, create a new chat as fallback
      const newChatTab: ChatTab = {
        id: '1',
        title: 'New Chat',
        messages: [
          {
            id: generateMessageId(),
            role: 'assistant',
            content: `Hi! I'm your AI writing assistant. I can help you with plot development, character creation, dialogue, and more. ${
              lore ? 'I can also reference your series lore to maintain consistency across your books.' : ''
            } What would you like to work on?`,
            timestamp: new Date(),
            type: 'normal'
          }
        ],
        isActive: true,
        isNew: true
      };
      setChatTabs([newChatTab]);
      setActiveTabId('1');
    } finally {
      setIsLoadingChats(false);
    }
  }, [user, documentId, seriesId, lore]);

  // Save current chat
  const saveCurrentChat = useCallback(async (tab: ChatTab) => {
    if (!user || !tab.messages || tab.messages.length <= 1) return;
    
    try {
      const chatId = await chatService.saveChat(tab, user.uid, documentId, seriesId);
      
      // Update the tab with the saved ID without reloading all chats
      setChatTabs(prev => prev.map(t => 
        t.id === tab.id ? { ...t, id: chatId, isNew: false } : t
      ));
      
      // Update saved chats list without reloading
      setSavedChats(prev => {
        const existingIndex = prev.findIndex(chat => chat.id === chatId);
        if (existingIndex >= 0) {
          // Update existing chat
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            title: tab.title,
            messages: tab.messages,
            updatedAt: new Date()
          };
          return updated;
        } else {
          // Add new chat
          return [{
            id: chatId,
            title: tab.title,
            messages: tab.messages,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.uid,
            documentId,
            seriesId
          }, ...prev];
        }
      });
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  }, [user, documentId, seriesId]);


  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

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

  const handleAcceptProposal = useCallback((messageId: string) => {
    const proposal = editProposals.get(messageId);
    if (!proposal || !editor) return;

    // Apply all edits to the document using the AI inline edit system
    proposal.edits.forEach((edit: any) => {
      // Set the suggestion in the editor first
      editor.commands.setSuggestions([edit]);
      // Then accept the edit to apply it to the document
      editor.commands.acceptEdit(edit.id);
    });

    // Mark proposal as accepted
    setEditProposals(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, { ...proposal, accepted: true });
      return newMap;
    });

    // Update the message
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            messages: tab.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: msg.content + '\n\n✅ **Changes applied to document!**' }
                : msg
            )
          }
        : tab
    ));
  }, [editProposals, editor, activeTabId]);

  const handleRejectProposal = useCallback((messageId: string) => {
    const proposal = editProposals.get(messageId);
    if (!proposal) return;

    // Mark proposal as rejected
    setEditProposals(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, { ...proposal, accepted: false });
      return newMap;
    });

    // Update the message
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            messages: tab.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: msg.content + '\n\n❌ **Changes rejected.**' }
                : msg
            )
          }
        : tab
    ));
  }, [editProposals, activeTabId]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isLoading || !activeTab) return;

    const messageText = message.trim();
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'normal'
    };

    // Add user message to active tab
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, messages: [...tab.messages, userMessage], isNew: false }
        : tab
    ));
    
    setMessage('');
    clearError();

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
          id: generateMessageId(),
          role: 'assistant',
          content: `I've generated content based on your request. The preview modal should open automatically, or you can click "Preview" to review it before adding to your document.`,
          timestamp: new Date(),
          type: 'normal'
        };
        
        setChatTabs(prev => prev.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, messages: [...tab.messages, assistantMessage] }
            : tab
        ));

        // Show preview modal instead of directly inserting
        showPreview({
          content: generatedContent,
          type: 'generate',
          originalPrompt: messageText
        });
      } else if (hasContent) {
        // Analyze the full document and generate edits
        const response = await aiInlineEdit.requestInlineEdits('improve', messageText, fullDocumentText);
        
        if (response && response.success && response.edits && response.edits.length > 0) {
          const proposalId = `proposal-${Date.now()}`;
          
          // Create edit proposal
          const proposal = {
            id: proposalId,
            messageId: generateMessageId(),
            edits: response.edits,
            summary: response.summary || 'Document improvements suggested',
            accepted: null
          };
          
          setEditProposals(prev => new Map(prev.set(proposal.messageId, proposal)));
          
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
              types: [...new Set(response.edits.map((e: any) => e.type))],
              summary: response.summary || 'Document improvements suggested'
            }
          };
          
          setChatTabs(prev => prev.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, messages: [...tab.messages, assistantMessage] }
              : tab
          ));
        } else {
          // Fallback to regular chat if no edits found
          const response = await chatWithAI(messageText);
          
          const assistantMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            type: 'normal'
          };
          
          setChatTabs(prev => prev.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, messages: [...tab.messages, assistantMessage] }
              : tab
          ));
        }
      } else {
        // No content and not a generative request
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: 'I need some content to work with! Please either:\n\n• Write some text in your document, then ask me to improve it\n• Or ask me to create new content (e.g., "Create a story about...")',
          timestamp: new Date(),
          type: 'normal'
        };
        
        setChatTabs(prev => prev.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, messages: [...tab.messages, assistantMessage] }
            : tab
        ));
      }
      
      // Auto-save the chat after receiving a response
      setTimeout(async () => {
        setChatTabs(currentTabs => {
          const updatedTab = currentTabs.find(tab => tab.id === activeTabId);
          if (updatedTab) {
            saveCurrentChat(updatedTab).catch(console.error);
          }
          return currentTabs;
        });
      }, 1000);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        type: 'normal'
      };
      
      setChatTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, messages: [...tab.messages, errorMessage] }
          : tab
      ));
    }
  }, [message, isLoading, activeTab, activeTabId, chatWithAI, clearError, chatTabs, saveCurrentChat, aiInlineEdit, fullDocumentText, editor]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const createNewChat = useCallback(() => {
    const newTabId = generateMessageId();
    const newTab: ChatTab = {
      id: newTabId,
      title: 'New Chat',
      messages: [
        {
          id: generateMessageId(),
          role: 'assistant',
          content: `Hi! I'm your AI writing assistant. I can help you with plot development, character creation, dialogue, and more. ${
            lore ? 'I can also reference your series lore to maintain consistency across your books.' : ''
          } What would you like to work on?`,
          timestamp: new Date(),
          type: 'normal'
        }
      ],
      isActive: true,
      isNew: true
    };

    // Deactivate all existing tabs and add the new one
    setChatTabs(prev => prev.map(tab => ({ ...tab, isActive: false })));
    setChatTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
  }, [lore, generateMessageId]);

  const switchToTab = useCallback((tabId: string) => {
    setChatTabs(prev => prev.map(tab => ({ ...tab, isActive: tab.id === tabId })));
    setActiveTabId(tabId);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    if (chatTabs.length === 1) return; // Don't close the last tab
    
    setChatTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    if (tabId === activeTabId) {
      const remainingTabs = chatTabs.filter(tab => tab.id !== tabId);
      const newActiveTab = remainingTabs[remainingTabs.length - 1];
      setActiveTabId(newActiveTab.id);
      setChatTabs(prev => prev.map(tab => ({ ...tab, isActive: tab.id === newActiveTab.id })));
    }
  }, [chatTabs, activeTabId]);

  const formatMessage = useCallback((content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  }, []);

  const renderEditProposal = useCallback((msg: ChatMessage) => {
    const proposal = editProposals.get(msg.id);
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
          {msg.edits.slice(0, 3).map((edit: any, index: number) => (
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
                onClick={() => handleAcceptProposal(msg.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                Apply All Changes
              </button>
              <button
                onClick={() => handleRejectProposal(msg.id)}
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
  }, [editProposals, handleAcceptProposal, handleRejectProposal]);

  const generateTabTitle = useCallback((messages: ChatMessage[]) => {
    if (messages.length <= 1) return 'New Chat';
    
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return chatService.generateChatTitle(firstUserMessage.content);
    }
    
    return 'Chat';
  }, []);

  // Rename chat
  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      await chatService.renameChat(chatId, newTitle);
      setChatTabs(prev => prev.map(tab => 
        tab.id === chatId ? { ...tab, title: newTitle } : tab
      ));
      setEditingTitle(null);
      await loadSavedChats();
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  }, [loadSavedChats]);

  // Delete chat
  const handleDeleteChat = useCallback(async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChatTabs(prev => prev.filter(tab => tab.id !== chatId));
      
      // If we deleted the active tab, switch to another tab
      if (chatId === activeTabId) {
        const remainingTabs = chatTabs.filter(tab => tab.id !== chatId);
        if (remainingTabs.length > 0) {
          setActiveTabId(remainingTabs[0].id);
        }
      }
      
      await loadSavedChats();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [activeTabId, chatTabs, loadSavedChats]);

  // Start editing title
  const startEditingTitle = useCallback((chatId: string, currentTitle: string) => {
    setEditingTitle(chatId);
    setEditingTitleValue(currentTitle);
  }, []);

  // Cancel editing title
  const cancelEditingTitle = useCallback(() => {
    setEditingTitle(null);
    setEditingTitleValue('');
  }, []);

  // Update tab titles when messages change
  useEffect(() => {
    setChatTabs(prev => prev.map(tab => ({
      ...tab,
      title: generateTabTitle(tab.messages)
    })));
  }, [generateTabTitle]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Tabs */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center overflow-x-auto flex-1">
          {chatTabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 px-3 py-2 border-r border-gray-200 cursor-pointer min-w-0 max-w-48 ${
                tab.isActive ? 'bg-white border-b-2 border-blue-500' : 'hover:bg-gray-100'
              }`}
              onClick={() => switchToTab(tab.id)}
            >
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              
              {editingTitle === tab.id ? (
                <input
                  type="text"
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={() => {
                    if (editingTitleValue.trim()) {
                      handleRenameChat(tab.id, editingTitleValue.trim());
                    } else {
                      cancelEditingTitle();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (editingTitleValue.trim()) {
                        handleRenameChat(tab.id, editingTitleValue.trim());
                      } else {
                        cancelEditingTitle();
                      }
                    } else if (e.key === 'Escape') {
                      cancelEditingTitle();
                    }
                  }}
                  className="text-sm bg-transparent border-none outline-none flex-1 min-w-0"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm truncate">{tab.title}</span>
              )}
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!tab.isNew && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTitle(tab.id, tab.title);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Rename Chat"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(tab.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-red-600"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
                {chatTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Close Tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={createNewChat}
          className="p-2 hover:bg-gray-100 border-l border-gray-200"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 pl-6 pr-4 py-4 overflow-y-auto min-h-0">
        {isLoadingChats ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <div className="text-gray-600">Loading your chats...</div>
            </div>
          </div>
        ) : activeTab ? (
          <div className="space-y-4">
            {activeTab.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  // User messages with bubble styling
                  <div className="max-w-[95%] p-3 rounded-lg bg-blue-600 text-white">
                    <div
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                    <div className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  // AI messages without bubble styling - plain text
                  <div className={`max-w-[95%] w-full p-3 rounded-lg ${
                    msg.type === 'edit-proposal'
                      ? 'bg-green-50 border border-green-200'
                      : msg.type === 'edit-summary'
                      ? 'bg-blue-50 border border-blue-200'
                      : ''
                  }`}>
                    <div
                      className="text-sm text-gray-900 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                    
                    {/* Render edit proposal UI */}
                    {msg.type === 'edit-proposal' && renderEditProposal(msg)}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="max-w-[95%] w-full">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-gray-600 mb-2">No chats yet</div>
              <div className="text-sm text-gray-500">Click the + button to start a new conversation</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 pb-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-1 w-full">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your AI assistant anything about your writing..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[96px]"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
      </div>

      {/* AI Response Preview Modal */}
      {isPreviewOpen && currentSuggestion && (
        <AIResponsePreview
          isOpen={isPreviewOpen}
          onClose={hidePreview}
          onAccept={(content) => handleAccept(editor, content)}
          onDiscard={handleDiscard}
          suggestion={currentSuggestion}
          editor={editor}
        />
      )}
    </div>
  );
}
