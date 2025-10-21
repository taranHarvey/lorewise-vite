import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'accepted' | 'declined';
  loreUpdates?: any[];
  loreUpdateSummary?: string;
}

/**
 * Chat session structure
 */
export interface ChatSession {
  id: string;
  documentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database schema
 */
interface ChatDB extends DBSchema {
  sessions: {
    key: string;
    value: ChatSession;
    indexes: { 'by-document': string; 'by-updated': Date };
  };
}

/**
 * Chat Persistence Service
 * Manages chat sessions using IndexedDB for local persistence
 */
class ChatPersistenceService {
  private dbPromise: Promise<IDBPDatabase<ChatDB>>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<IDBPDatabase<ChatDB>> {
    return openDB<ChatDB>('lorewise-chat-db', 1, {
      upgrade(db) {
        // Create sessions store
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-document', 'documentId');
        sessionStore.createIndex('by-updated', 'updatedAt');
      },
    });
  }

  /**
   * Create a new chat session
   */
  async createSession(documentId: string, title?: string): Promise<ChatSession> {
    const db = await this.dbPromise;

    const session: ChatSession = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      title: title || `Chat ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.add('sessions', session);
    return session;
  }

  /**
   * Get all chat sessions for a document
   */
  async getSessionsForDocument(documentId: string): Promise<ChatSession[]> {
    const db = await this.dbPromise;
    const sessions = await db.getAllFromIndex('sessions', 'by-document', documentId);

    // Sort by most recently updated
    return sessions.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get a specific session
   */
  async getSession(sessionId: string): Promise<ChatSession | undefined> {
    const db = await this.dbPromise;
    return await db.get('sessions', sessionId);
  }

  /**
   * Update a session (save messages)
   */
  async updateSession(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const db = await this.dbPromise;
    const session = await db.get('sessions', sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    session.messages = messages;
    session.updatedAt = new Date();

    // Auto-generate title from first user message if not set
    if (session.title.startsWith('Chat ') && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        session.title = this.generateTitle(firstUserMessage.content);
      }
    }

    await db.put('sessions', session);
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const db = await this.dbPromise;
    const session = await db.get('sessions', sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    session.title = title;
    session.updatedAt = new Date();
    await db.put('sessions', session);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('sessions', sessionId);
  }

  /**
   * Delete all sessions for a document
   */
  async deleteSessionsForDocument(documentId: string): Promise<void> {
    const sessions = await this.getSessionsForDocument(documentId);
    const db = await this.dbPromise;

    for (const session of sessions) {
      await db.delete('sessions', session.id);
    }
  }

  /**
   * Generate a title from message content
   */
  private generateTitle(content: string): string {
    // Take first 50 chars and truncate at word boundary
    const maxLength = 50;
    let title = content.substring(0, maxLength).trim();

    if (content.length > maxLength) {
      // Truncate at last space
      const lastSpace = title.lastIndexOf(' ');
      if (lastSpace > 20) {
        title = title.substring(0, lastSpace);
      }
      title += '...';
    }

    return title;
  }

  /**
   * Get the most recent session for a document
   */
  async getMostRecentSession(documentId: string): Promise<ChatSession | undefined> {
    const sessions = await this.getSessionsForDocument(documentId);
    return sessions[0]; // Already sorted by most recent
  }
}

// Export singleton instance
export const chatPersistenceService = new ChatPersistenceService();
