import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ReferenceDocument {
  id: string;
  title: string;
  content: string;
  type: 'lore' | 'character' | 'world' | 'summary' | 'other';
  fileType: 'txt' | 'md' | 'docx' | 'plain';
  seriesId?: string;
  documentId?: string;
  userId: string;
  isActive: boolean; // Whether to include in AI context
  createdAt: Date;
  updatedAt: Date;
  size: number; // File size in bytes
}

class ReferenceService {
  /**
   * Upload a reference document
   */
  async uploadReference(
    title: string,
    content: string,
    type: ReferenceDocument['type'],
    fileType: ReferenceDocument['fileType'],
    userId: string,
    seriesId?: string,
    documentId?: string
  ): Promise<string> {
    try {
      const referenceData = {
        title,
        content,
        type,
        fileType,
        userId,
        seriesId: seriesId || null,
        documentId: documentId || null,
        isActive: true, // Active by default
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        size: content.length,
      };

      const docRef = await addDoc(collection(db, 'references'), referenceData);
      return docRef.id;
    } catch (error) {
      console.error('Error uploading reference:', error);
      throw error;
    }
  }

  /**
   * Get all references for a user
   */
  async getUserReferences(userId: string): Promise<ReferenceDocument[]> {
    try {
      const q = query(
        collection(db, 'references'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const references: ReferenceDocument[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        references.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          type: data.type,
          fileType: data.fileType,
          seriesId: data.seriesId,
          documentId: data.documentId,
          userId: data.userId,
          isActive: data.isActive,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          size: data.size,
        });
      });

      return references.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting references:', error);
      return [];
    }
  }

  /**
   * Get references for a specific series
   */
  async getSeriesReferences(seriesId: string): Promise<ReferenceDocument[]> {
    try {
      const q = query(
        collection(db, 'references'),
        where('seriesId', '==', seriesId)
      );

      const querySnapshot = await getDocs(q);
      const references: ReferenceDocument[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        references.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          type: data.type,
          fileType: data.fileType,
          seriesId: data.seriesId,
          documentId: data.documentId,
          userId: data.userId,
          isActive: data.isActive,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          size: data.size,
        });
      });

      return references.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting series references:', error);
      return [];
    }
  }

  /**
   * Get references for a specific document
   */
  async getDocumentReferences(documentId: string): Promise<ReferenceDocument[]> {
    try {
      const q = query(
        collection(db, 'references'),
        where('documentId', '==', documentId)
      );

      const querySnapshot = await getDocs(q);
      const references: ReferenceDocument[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        references.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          type: data.type,
          fileType: data.fileType,
          seriesId: data.seriesId,
          documentId: data.documentId,
          userId: data.userId,
          isActive: data.isActive,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          size: data.size,
        });
      });

      return references.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting document references:', error);
      return [];
    }
  }

  /**
   * Toggle reference active status
   */
  async toggleReferenceActive(referenceId: string, isActive: boolean): Promise<void> {
    try {
      const refDoc = doc(db, 'references', referenceId);
      await updateDoc(refDoc, {
        isActive,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error toggling reference:', error);
      throw error;
    }
  }

  /**
   * Update reference content or metadata
   */
  async updateReference(
    referenceId: string,
    updates: Partial<Pick<ReferenceDocument, 'title' | 'content' | 'type'>>
  ): Promise<void> {
    try {
      const refDoc = doc(db, 'references', referenceId);
      await updateDoc(refDoc, {
        ...updates,
        updatedAt: Timestamp.now(),
        ...(updates.content ? { size: updates.content.length } : {}),
      });
    } catch (error) {
      console.error('Error updating reference:', error);
      throw error;
    }
  }

  /**
   * Delete a reference
   */
  async deleteReference(referenceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'references', referenceId));
    } catch (error) {
      console.error('Error deleting reference:', error);
      throw error;
    }
  }

  /**
   * Read file content based on file type
   */
  async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      // For now, only support plain text files
      // In the future, add docx parsing library
      if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type. Please upload .txt or .md files.'));
      }
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const referenceService = new ReferenceService();
export { ReferenceService };

