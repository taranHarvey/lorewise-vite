import { useState, useCallback, useRef } from 'react';
import { aiService, type WritingContext, type AISuggestion, type ConsistencyCheck, type AIChatMessage } from '../services/aiService';
import type { SeriesLore } from '../documentService';
import { useAuth } from '../contexts/AuthContext';

export interface UseAIOptions {
  lore?: SeriesLore;
  selectedText?: string;
  surroundingText?: string;
}

export function useAI(options: UseAIOptions = {}) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [chatHistory, setChatHistory] = useState<AIChatMessage[]>([]);
  const [consistencyCheck, setConsistencyCheck] = useState<ConsistencyCheck | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Build context for AI requests
  const buildContext = useCallback((): WritingContext => {
    return aiService.buildContext(
      options.selectedText,
      options.lore,
      options.surroundingText
    );
  }, [options.selectedText, options.lore, options.surroundingText]);

  // Generate content
  const generateContent = useCallback(async (prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      abortControllerRef.current = new AbortController();
      const context = buildContext();
      const result = await aiService.generateContent(prompt, context, user?.uid || undefined, 'improve');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  // Improve selected text
  const improveText = useCallback(async (text: string): Promise<AISuggestion[]> => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    
    try {
      const context = buildContext();
      const result = await aiService.improveText(text, context);
      setSuggestions(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  // Suggest character development
  const suggestCharacterDevelopment = useCallback(async (character: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const context = buildContext();
      const result = await aiService.suggestCharacterDevelopment(character, context);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  // Generate plot ideas
  const generatePlotIdeas = useCallback(async (currentStory: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const context = buildContext();
      const result = await aiService.generatePlotIdeas(currentStory, context);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  // Check consistency
  const checkConsistency = useCallback(async (text: string): Promise<ConsistencyCheck> => {
    setIsLoading(true);
    setError(null);
    setConsistencyCheck(null);
    
    try {
      const context = buildContext();
      const result = await aiService.checkConsistency(text, context);
      setConsistencyCheck(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  // Chat with AI
  const chatWithAI = useCallback(async (message: string): Promise<string> => {
    console.log('useAI: chatWithAI called with message:', message);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('useAI: Building context');
      const context = buildContext();
      console.log('useAI: Context built:', context);
      console.log('useAI: Calling aiService.chatWithAI');
      const response = await aiService.chatWithAI(message, context, chatHistory, user?.uid || undefined);
      console.log('useAI: Response received:', response);
      return response;
    } catch (err) {
      console.error('useAI: Error in chatWithAI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      console.log('useAI: Setting loading to false');
      setIsLoading(false);
    }
  }, [buildContext, chatHistory, user?.uid]);

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Clear consistency check
  const clearConsistencyCheck = useCallback(() => {
    setConsistencyCheck(null);
  }, []);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    suggestions,
    chatHistory,
    consistencyCheck,
    
    // Actions
    generateContent,
    improveText,
    suggestCharacterDevelopment,
    generatePlotIdeas,
    checkConsistency,
    chatWithAI,
    
    // Utilities
    clearChatHistory,
    clearSuggestions,
    clearConsistencyCheck,
    cancelRequest,
    clearError,
    
    // Context
    context: buildContext()
  };
}
