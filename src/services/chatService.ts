import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'normal' | 'suggestion' | 'consistency';
}

export interface ChatTab {
  id: string;
  title: string;
  messages: ChatMessage[];
  isActive: boolean;
  isNew?: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  documentId?: string; // Optional: link to specific document
  seriesId?: string; // Optional: link to specific series
}

export interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  documentId?: string;
  seriesId?: string;
}

class ChatService {
  private readonly MAX_CHAT_LENGTH = 100; // Maximum number of messages per chat
  private readonly MAX_SAVED_CHATS = 50; // Maximum number of saved chats per user

  // Save a chat to Firestore
  async saveChat(chat: ChatTab, userId: string, documentId?: string, seriesId?: string): Promise<string> {
    try {
      // Clean up messages if they exceed the limit
      const cleanedMessages = this.cleanupMessages(chat.messages);
      
      const chatData = {
        title: chat.title,
        messages: cleanedMessages.map(msg => ({
          ...msg,
          timestamp: Timestamp.fromDate(msg.timestamp)
        })),
        createdAt: Timestamp.fromDate(chat.createdAt || new Date()),
        updatedAt: Timestamp.now(),
        userId,
        documentId: documentId || null,
        seriesId: seriesId || null
      };

      if (chat.id && chat.id !== '1' && !chat.isNew) {
        // Update existing chat
        const chatRef = doc(db, 'chats', chat.id);
        await updateDoc(chatRef, {
          title: chatData.title,
          messages: chatData.messages,
          updatedAt: chatData.updatedAt
        });
        return chat.id;
      } else {
        // Create new chat
        const docRef = await addDoc(collection(db, 'chats'), chatData);
        
        // Clean up old chats if we exceed the limit
        await this.cleanupOldChats(userId);
        
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving chat:', error);
      throw error;
    }
  }

  // Load all chats for a user
  async loadUserChats(userId: string, documentId?: string, seriesId?: string): Promise<SavedChat[]> {
    try {
      // Start with a simple query to get all user chats
      let q = query(
        collection(db, 'chats'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const chats: SavedChat[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const chat: SavedChat = {
          id: doc.id,
          title: data.title,
          messages: data.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp.toDate()
          })),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          userId: data.userId,
          documentId: data.documentId,
          seriesId: data.seriesId
        };

        // Filter by document or series in memory if provided
        if (documentId && chat.documentId === documentId) {
          chats.push(chat);
        } else if (seriesId && chat.seriesId === seriesId) {
          chats.push(chat);
        } else if (!documentId && !seriesId) {
          // If no specific filter, include all chats
          chats.push(chat);
        }
      });

      // Sort by updatedAt in memory
      chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return chats;
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  }

  // Delete a chat
  async deleteChat(chatId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'chats', chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // Rename a chat
  async renameChat(chatId: string, newTitle: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        title: newTitle,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error renaming chat:', error);
      throw error;
    }
  }

  // Convert SavedChat to ChatTab
  convertToChatTab(savedChat: SavedChat, isActive: boolean = false): ChatTab {
    return {
      id: savedChat.id,
      title: savedChat.title,
      messages: savedChat.messages,
      isActive,
      isNew: false,
      createdAt: savedChat.createdAt,
      updatedAt: savedChat.updatedAt,
      userId: savedChat.userId,
      documentId: savedChat.documentId,
      seriesId: savedChat.seriesId
    };
  }

  // Clean up messages if they exceed the limit
  private cleanupMessages(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length <= this.MAX_CHAT_LENGTH) {
      return messages;
    }

    // Keep the first message (welcome message) and the most recent messages
    const firstMessage = messages[0];
    const recentMessages = messages.slice(-(this.MAX_CHAT_LENGTH - 1));
    
    return [firstMessage, ...recentMessages];
  }

  // Clean up old chats if we exceed the limit
  private async cleanupOldChats(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const chats = querySnapshot.docs;

      if (chats.length > this.MAX_SAVED_CHATS) {
        // Sort by updatedAt in memory and delete oldest
        const sortedChats = chats.sort((a, b) => {
          const aTime = a.data().updatedAt?.toDate()?.getTime() || 0;
          const bTime = b.data().updatedAt?.toDate()?.getTime() || 0;
          return aTime - bTime;
        });

        const chatsToDelete = sortedChats.slice(0, sortedChats.length - this.MAX_SAVED_CHATS);
        
        for (const chatDoc of chatsToDelete) {
          await deleteDoc(chatDoc.ref);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old chats:', error);
    }
  }

  // Generate a title from the first user message
  generateChatTitle(firstUserMessage: string): string {
    const words = firstUserMessage.trim().split(' ');
    if (words.length <= 6) {
      return firstUserMessage;
    }
    return words.slice(0, 6).join(' ') + '...';
  }
}

// Export singleton instance
export const chatService = new ChatService();
export { ChatService };
