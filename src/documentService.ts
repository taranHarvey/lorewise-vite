import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

export interface Document {
  id: string;
  title: string;
  content: string;
  seriesId: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
  updatedAt?: Timestamp;
}

export interface Series {
  id: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SeriesLore {
  id: string;
  seriesId: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Document operations
export const getDocument = async (documentId: string): Promise<Document | null> => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Document;
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const createDocument = async (
  userId: string, 
  seriesId: string, 
  title: string, 
  content: string = '<p></p>'
): Promise<string> => {
  try {
    const docData = {
      title,
      content,
      seriesId,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'documents'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const updateDocument = async (documentId: string, updates: DocumentUpdate): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', documentId);
    console.log('[deleteDocument] Attempting to delete document:', documentId);
    await deleteDoc(docRef);
    console.log('[deleteDocument] Successfully deleted document:', documentId);
  } catch (error: any) {
    console.error('[deleteDocument] Error deleting document:', error);
    console.error('[deleteDocument] Error code:', error?.code);
    console.error('[deleteDocument] Error message:', error?.message);
    throw error;
  }
};

export const getUserDocuments = async (userId: string, forceServer = false): Promise<Document[]> => {
  try {
    const q = query(collection(db, 'documents'), where('userId', '==', userId));
    
    // Force fresh data from server if requested (bypasses cache)
    let querySnapshot;
    if (forceServer) {
      const { getDocsFromServer } = await import('firebase/firestore');
      querySnapshot = await getDocsFromServer(q);
      console.log('[getUserDocuments] Fetched from server (bypassed cache)');
    } else {
      querySnapshot = await getDocs(q);
    }
    
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Document));
    
    console.log('[getUserDocuments] Found', documents.length, 'documents for user', userId);
    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

export const getSeriesDocumentCount = async (seriesId: string): Promise<number> => {
  try {
    const q = query(collection(db, 'documents'), where('seriesId', '==', seriesId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting series document count:', error);
    throw error;
  }
};

// Series operations
export const createSeries = async (userId: string, title: string, description: string = ''): Promise<string> => {
  try {
    const seriesData = {
      title,
      description,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const seriesRef = await addDoc(collection(db, 'series'), seriesData);
    return seriesRef.id;
  } catch (error) {
    console.error('Error creating series:', error);
    throw error;
  }
};

export const getSeries = async (seriesId: string): Promise<Series | null> => {
  try {
    const seriesRef = doc(db, 'series', seriesId);
    const seriesSnap = await getDoc(seriesRef);
    
    if (seriesSnap.exists()) {
      return { id: seriesSnap.id, ...seriesSnap.data() } as Series;
    }
    return null;
  } catch (error) {
    console.error('Error getting series:', error);
    throw error;
  }
};

export const getUserSeries = async (userId: string): Promise<Series[]> => {
  try {
    const q = query(collection(db, 'series'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Series));
  } catch (error) {
    console.error('Error getting user series:', error);
    throw error;
  }
};

// Delete all user data
export const deleteAllUserData = async (userId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete all user's documents
    const documentsQuery = query(collection(db, 'documents'), where('userId', '==', userId));
    const documentsSnapshot = await getDocs(documentsQuery);
    documentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete all user's series
    const seriesQuery = query(collection(db, 'series'), where('userId', '==', userId));
    const seriesSnapshot = await getDocs(seriesQuery);
    seriesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Commit all deletions
    await batch.commit();
    
    console.log(`Successfully deleted all data for user: ${userId}`);
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
};

export const getSeriesDocuments = async (seriesId: string): Promise<Document[]> => {
  try {
    const q = query(collection(db, 'documents'), where('seriesId', '==', seriesId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Document));
  } catch (error) {
    console.error('Error getting series documents:', error);
    throw error;
  }
};

export const updateSeries = async (seriesId: string, updates: Partial<Series>): Promise<void> => {
  try {
    const seriesRef = doc(db, 'series', seriesId);
    await updateDoc(seriesRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating series:', error);
    throw error;
  }
};

export const deleteSeries = async (seriesId: string): Promise<void> => {
  try {
    const seriesRef = doc(db, 'series', seriesId);
    await deleteDoc(seriesRef);
  } catch (error) {
    console.error('Error deleting series:', error);
    throw error;
  }
};

// Series Lore operations
export const getSeriesLore = async (seriesId: string): Promise<SeriesLore | null> => {
  try {
    const loreQuery = query(
      collection(db, 'seriesLore'),
      where('seriesId', '==', seriesId)
    );
    const querySnapshot = await getDocs(loreQuery);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SeriesLore;
    }
    return null;
  } catch (error) {
    console.error('Error getting series lore:', error);
    throw error;
  }
};

export const createSeriesLore = async (seriesId: string, userId: string): Promise<string> => {
  try {
    const loreData = {
      seriesId,
      userId,
      content: '<h1>Series Lore & Bible</h1><p>Document your world-building, character details, plot points, and any other important information for this series.</p><h2>Characters</h2><p>Add character descriptions, backgrounds, and relationships here...</p><h2>World Building</h2><p>Add setting details, rules, history, and lore here...</p><h2>Plot Points</h2><p>Add important plot points, story arcs, and key events here...</p>',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'seriesLore'), loreData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating series lore:', error);
    throw error;
  }
};

export const updateSeriesLore = async (loreId: string, updates: { content?: string }): Promise<void> => {
  try {
    const loreRef = doc(db, 'seriesLore', loreId);
    await updateDoc(loreRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating series lore:', error);
    throw error;
  }
};