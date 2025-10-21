import { useState, useEffect, useCallback } from 'react';
import { referenceService, ReferenceDocument } from '../services/referenceService';
import { ReferenceDocument as AIReferenceDocument } from '../services/aiService';

interface UseReferencesProps {
  userId: string;
  seriesId?: string;
  documentId?: string;
}

export function useReferences({ userId, seriesId, documentId }: UseReferencesProps) {
  const [references, setReferences] = useState<ReferenceDocument[]>([]);
  const [activeReferences, setActiveReferences] = useState<ReferenceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load references from Firestore
   */
  const loadReferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let refs: ReferenceDocument[] = [];
      
      if (documentId) {
        refs = await referenceService.getDocumentReferences(documentId);
      } else if (seriesId) {
        refs = await referenceService.getSeriesReferences(seriesId);
      } else {
        refs = await referenceService.getUserReferences(userId);
      }
      
      setReferences(refs);
      setActiveReferences(refs.filter(ref => ref.isActive));
    } catch (err) {
      console.error('Error loading references:', err);
      setError(err instanceof Error ? err.message : 'Failed to load references');
    } finally {
      setIsLoading(false);
    }
  }, [userId, seriesId, documentId]);

  /**
   * Upload a new reference
   */
  const uploadReference = useCallback(async (
    file: File,
    type: ReferenceDocument['type'] = 'other'
  ) => {
    try {
      const content = await referenceService.readFileContent(file);
      const fileType = file.name.endsWith('.md') ? 'md' : 
                      file.name.endsWith('.txt') ? 'txt' : 'plain';
      
      await referenceService.uploadReference(
        file.name,
        content,
        type,
        fileType,
        userId,
        seriesId,
        documentId
      );

      await loadReferences();
    } catch (err) {
      console.error('Error uploading reference:', err);
      throw err;
    }
  }, [userId, seriesId, documentId, loadReferences]);

  /**
   * Toggle reference active state
   */
  const toggleReference = useCallback(async (referenceId: string, isActive: boolean) => {
    try {
      await referenceService.toggleReferenceActive(referenceId, isActive);
      await loadReferences();
    } catch (err) {
      console.error('Error toggling reference:', err);
      throw err;
    }
  }, [loadReferences]);

  /**
   * Delete a reference
   */
  const deleteReference = useCallback(async (referenceId: string) => {
    try {
      await referenceService.deleteReference(referenceId);
      await loadReferences();
    } catch (err) {
      console.error('Error deleting reference:', err);
      throw err;
    }
  }, [loadReferences]);

  /**
   * Convert to AI service format
   */
  const getAIReferences = useCallback((): AIReferenceDocument[] => {
    return activeReferences.map(ref => ({
      title: ref.title,
      content: ref.content,
      type: ref.type,
    }));
  }, [activeReferences]);

  // Load references on mount
  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  return {
    references,
    activeReferences,
    isLoading,
    error,
    loadReferences,
    uploadReference,
    toggleReference,
    deleteReference,
    getAIReferences,
  };
}

