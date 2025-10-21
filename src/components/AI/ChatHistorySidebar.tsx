import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import type { ChatSession } from '../../services/chatPersistenceService';
import './ChatHistorySidebar.scss';

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveEdit = () => {
    if (editingSessionId && editingTitle.trim()) {
      onRenameSession(editingSessionId, editingTitle.trim());
      setEditingSessionId(null);
      setEditingTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="chat-history-sidebar">
      <div className="chat-history-sidebar__header">
        <h3 className="chat-history-sidebar__title">Chat History</h3>
        <button
          className="chat-history-sidebar__new-btn"
          onClick={onNewSession}
          title="New Chat"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="chat-history-sidebar__list">
        {sessions.length === 0 ? (
          <div className="chat-history-sidebar__empty">
            <MessageSquare size={32} className="chat-history-sidebar__empty-icon" />
            <p>No chat history yet</p>
            <p className="chat-history-sidebar__empty-hint">Start a new chat to begin</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`chat-history-sidebar__item ${
                session.id === activeSessionId ? 'chat-history-sidebar__item--active' : ''
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="chat-history-sidebar__item-icon">
                <MessageSquare size={16} />
              </div>

              <div className="chat-history-sidebar__item-content">
                {editingSessionId === session.id ? (
                  <input
                    type="text"
                    className="chat-history-sidebar__item-edit"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div className="chat-history-sidebar__item-title">{session.title}</div>
                )}
                <div className="chat-history-sidebar__item-meta">
                  {session.messages.length} messages • {new Date(session.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="chat-history-sidebar__item-actions">
                {editingSessionId === session.id ? (
                  <>
                    <button
                      className="chat-history-sidebar__action-btn chat-history-sidebar__action-btn--success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="chat-history-sidebar__action-btn chat-history-sidebar__action-btn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="chat-history-sidebar__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(session);
                      }}
                      title="Rename"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="chat-history-sidebar__action-btn chat-history-sidebar__action-btn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this chat session?')) {
                          onDeleteSession(session.id);
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
