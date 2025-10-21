import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { CursorStyleChat } from './CursorStyleChat';
import { ChatTabs } from './ChatTabs';
import { chatPersistenceService, type ChatSession, type ChatMessage } from '../../services/chatPersistenceService';
import type { SeriesLore } from '../../documentService';

interface ResizableAIPanelProps {
  lore?: SeriesLore;
  selectedText?: string;
  surroundingText?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  documentId?: string;
  seriesId?: string;
  editor?: any; // Tiptap editor instance
  fullDocumentText?: string; // Full document content for analysis
  onLoreUpdate?: (updatedLore: string) => Promise<void>; // Callback for lore updates
  onLoreStatusChange?: (status: { isProcessing: boolean; message?: string }) => void; // Callback for lore status
}

export default function ResizableAIPanel({
  lore,
  selectedText,
  surroundingText,
  isOpen,
  onClose,
  className = '',
  documentId,
  seriesId,
  editor,
  fullDocumentText,
  onLoreUpdate,
  onLoreStatusChange
}: ResizableAIPanelProps) {
  const [width, setWidth] = useState(500); // Default width for compact tabs
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chat session management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Calculate constraints - Allow AI panel to take more space
  const minWidth = 300; // Minimum width in pixels
  const maxWidthPercent = 80; // Maximum 80% of container width (increased from 70%)
  const documentMinWidth = 250; // Minimum width for document area (reduced from 300)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse down on resize handle');
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    // Get the parent container (the flex container that holds both editor and AI panel)
    const parentContainer = containerRef.current.parentElement;
    if (!parentContainer) return;

    const parentRect = parentContainer.getBoundingClientRect();
    const mouseX = e.clientX;
    
    // Calculate the distance from the right edge of the parent container
    const distanceFromRight = parentRect.right - mouseX;
    
    // Calculate max width as percentage of parent container, but ensure document area has minimum width
    const maxWidthFromPercent = (parentRect.width * maxWidthPercent) / 100;
    const maxWidthFromDocument = parentRect.width - documentMinWidth;
    const maxWidth = Math.min(maxWidthFromPercent, maxWidthFromDocument);
    
    // Ensure we don't go beyond the parent container boundaries
    const constrainedDistance = Math.max(0, Math.min(parentRect.width, distanceFromRight));
    
    // Constrain the width
    const newWidth = Math.max(minWidth, Math.min(maxWidth, constrainedDistance));
    
    console.log('Resizing flex:', { 
      mouseX, 
      parentRect, 
      distanceFromRight, 
      constrainedDistance,
      newWidth, 
      minWidth, 
      maxWidthFromPercent,
      maxWidthFromDocument,
      maxWidth,
      currentWidth: width,
      parentWidth: parentRect.width
    });
    
    setWidth(newWidth);
  }, [isResizing, minWidth, maxWidthPercent, documentMinWidth, width]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add event listeners for mouse move and up
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Handle window resize to recalculate constraints
  useEffect(() => {
    const handleWindowResize = () => {
      if (!containerRef.current) return;

      const parentContainer = containerRef.current.parentElement;
      if (!parentContainer) return;

      const parentWidth = parentContainer.getBoundingClientRect().width;
      const maxWidth = (parentWidth * maxWidthPercent) / 100;

      // Adjust current width if it exceeds new maximum
      if (width > maxWidth) {
        setWidth(maxWidth);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [width, maxWidthPercent]);

  // Load chat sessions when panel opens or document changes
  useEffect(() => {
    if (isOpen && documentId) {
      loadSessions();
    }
  }, [isOpen, documentId]);

  // Load sessions for current document
  const loadSessions = async () => {
    if (!documentId) return;

    try {
      const loadedSessions = await chatPersistenceService.getSessionsForDocument(documentId);
      setSessions(loadedSessions);

      // Load most recent session or create new one
      if (loadedSessions.length > 0) {
        const mostRecent = loadedSessions[0];
        setActiveSession(mostRecent);
        setMessages(mostRecent.messages);
      } else {
        // Create first session
        await handleNewSession();
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  // Create new session
  const handleNewSession = async () => {
    if (!documentId) return;

    try {
      const newSession = await chatPersistenceService.createSession(documentId);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  // Select a session
  const handleSelectSession = async (sessionId: string) => {
    try {
      const session = await chatPersistenceService.getSession(sessionId);
      if (session) {
        setActiveSession(session);
        setMessages(session.messages);
      }
    } catch (error) {
      console.error('Error selecting session:', error);
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatPersistenceService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      // If deleting active session, switch to another or create new
      if (activeSession?.id === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          await handleSelectSession(remaining[0].id);
        } else {
          await handleNewSession();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Rename a session
  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    try {
      await chatPersistenceService.updateSessionTitle(sessionId, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  // Save messages to active session
  const handleMessagesUpdate = async (updatedMessages: ChatMessage[]) => {
    if (!activeSession) return;

    setMessages(updatedMessages);

    try {
      await chatPersistenceService.updateSession(activeSession.id, updatedMessages);
      // Reload sessions to update the session list with new title/metadata
      if (documentId) {
        const loadedSessions = await chatPersistenceService.getSessionsForDocument(documentId);
        setSessions(loadedSessions);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-white border-l border-gray-200 ${className}`}
      style={{ 
        width: `${width}px`,
        minWidth: `${minWidth}px`
      }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 transition-colors z-20 ${
          isResizing ? 'bg-blue-500' : 'bg-gray-200'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Tabs - Compact tabs above chat */}
        <ChatTabs
          sessions={sessions}
          activeSessionId={activeSession?.id}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <CursorStyleChat
            editor={editor}
            lore={lore}
            isOpen={isOpen}
            onClose={onClose}
            onLoreUpdate={onLoreUpdate}
            messages={messages}
            onMessagesUpdate={handleMessagesUpdate}
            onLoreStatusChange={onLoreStatusChange}
          />
        </div>
      </div>
    </div>
  );
}
