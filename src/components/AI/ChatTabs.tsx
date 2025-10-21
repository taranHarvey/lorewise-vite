import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, Edit2, Check, Trash2 } from 'lucide-react';
import type { ChatSession } from '../../services/chatPersistenceService';
import './ChatTabs.scss';

interface ChatTabsProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
    setShowDropdown(false);
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

  // Show max 3 recent tabs, rest in dropdown
  const visibleSessions = sessions.slice(0, 3);
  const dropdownSessions = sessions.slice(3);

  return (
    <div className="chat-tabs">
      <div className="chat-tabs__container">
        {/* Visible Tabs */}
        {visibleSessions.map((session) => (
          <div
            key={session.id}
            className={`chat-tabs__tab ${
              session.id === activeSessionId ? 'chat-tabs__tab--active' : ''
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            {editingSessionId === session.id ? (
              <input
                type="text"
                className="chat-tabs__tab-edit"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleSaveEdit}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <>
                <span className="chat-tabs__tab-title">{session.title}</span>
                <button
                  className="chat-tabs__tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this chat?')) {
                      onDeleteSession(session.id);
                    }
                  }}
                  title="Close chat"
                >
                  <X size={12} />
                </button>
              </>
            )}
          </div>
        ))}

        {/* Dropdown for more chats */}
        {dropdownSessions.length > 0 && (
          <div className="chat-tabs__dropdown-wrapper" ref={dropdownRef}>
            <button
              className="chat-tabs__dropdown-trigger"
              onClick={() => setShowDropdown(!showDropdown)}
              title={`${dropdownSessions.length} more chats`}
            >
              <ChevronDown size={14} />
              <span>{dropdownSessions.length}</span>
            </button>

            {showDropdown && (
              <div className="chat-tabs__dropdown">
                {dropdownSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`chat-tabs__dropdown-item ${
                      session.id === activeSessionId ? 'chat-tabs__dropdown-item--active' : ''
                    }`}
                    onClick={() => {
                      onSelectSession(session.id);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="chat-tabs__dropdown-item-title">{session.title}</span>
                    <div className="chat-tabs__dropdown-item-actions">
                      <button
                        className="chat-tabs__dropdown-action"
                        onClick={(e) => handleStartEdit(session, e)}
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="chat-tabs__dropdown-action chat-tabs__dropdown-action--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this chat?')) {
                            onDeleteSession(session.id);
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Chat Button */}
        <button className="chat-tabs__new-btn" onClick={onNewSession} title="New Chat">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
