import type { Editor } from '@tiptap/react';
import { aiService } from './aiService';
import type { AIEdit, AIEditResponse, AIActionMode, InlineEditRequest } from './aiService';

/**
 * Tiptap AI Adapter - Bridges our custom AI service with Tiptap's suggestion system
 * This creates a hybrid approach where we keep our custom backend but get Tiptap's UX
 */

export interface TiptapSuggestion {
  id: string;
  from: number;
  to: number;
  insert?: string;
  delete?: string;
  reason?: string;
  type: 'insert' | 'replace' | 'delete';
}

export interface TiptapAIProvider {
  generateSuggestions(request: {
    text: string;
    from: number;
    to: number;
    mode?: AIActionMode;
    context?: {
      before?: string;
      after?: string;
      references?: any[];
    };
  }): Promise<TiptapSuggestion[]>;
}

/**
 * Transforms our AI service responses to Tiptap suggestion format
 */
export function transformToTiptapSuggestions(aiResponse: AIEditResponse): TiptapSuggestion[] {
  return aiResponse.edits.map(edit => {
    const suggestion: TiptapSuggestion = {
      id: edit.id,
      from: edit.range.start,
      to: edit.range.end,
      reason: edit.rationale,
      type: edit.type
    };

    if (edit.type === 'insert') {
      suggestion.insert = edit.newText;
    } else if (edit.type === 'replace') {
      suggestion.insert = edit.newText;
      suggestion.delete = edit.oldText;
    } else if (edit.type === 'delete') {
      suggestion.delete = edit.oldText;
    }

    return suggestion;
  });
}

/**
 * Custom AI Provider that uses our existing backend
 */
export class CustomTiptapAIProvider implements TiptapAIProvider {
  constructor(private editor: Editor) {}

  async generateSuggestions(request: {
    text: string;
    from: number;
    to: number;
    mode?: AIActionMode;
    context?: {
      before?: string;
      after?: string;
      references?: any[];
    };
  }): Promise<TiptapSuggestion[]> {
    try {
      // Build the inline edit request for our AI service
      const mode = request.mode || 'improve';
      
      const inlineRequest: InlineEditRequest = {
        mode: mode,
        prompt: this.getPromptForMode(mode),
        selection: request.text,
        contextBefore: request.context?.before || '',
        contextAfter: request.context?.after || '',
        references: request.context?.references || []
        // Note: fullDocumentText is intentionally omitted for selection-based edits
        // This ensures the AI only edits the selected text, not the entire document
      };

      // Call our existing AI service
      const aiResponse = await aiService.getInlineEdits(inlineRequest);
      
      console.log('AI Response from service:', aiResponse);
      
      // Transform to Tiptap format
      const suggestions = transformToTiptapSuggestions(aiResponse);
      
      console.log('Transformed suggestions:', suggestions);
      
      return suggestions;
    } catch (error) {
      console.error('Error generating Tiptap suggestions:', error);
      return [];
    }
  }

  private getPromptForMode(mode: AIActionMode): string {
    const modePrompts: Record<AIActionMode, string> = {
      improve: 'Improve the writing quality, flow, and clarity of this text',
      expand: 'Expand this text with more detail, description, or depth',
      shorten: 'Make this text more concise while preserving key information',
      rephrase: 'Rephrase this text with different wording while keeping the same meaning',
      continue: 'Continue the story or narrative from this point',
      consistency: 'Check and improve consistency with the established lore and characters',
      factcheck: 'Fact-check and verify the accuracy of this information'
    };

    return modePrompts[mode] || modePrompts.improve;
  }
}

/**
 * Hook to manage Tiptap AI integration
 */
export function useTiptapAI(editor: Editor) {
  const provider = new CustomTiptapAIProvider(editor);

  const generateSuggestions = async (
    from: number,
    to: number,
    mode: AIActionMode = 'improve'
  ) => {
    if (!editor) return [];

    const selectedText = editor.state.doc.textBetween(from, to);
    const contextBefore = editor.state.doc.textBetween(0, from);
    const contextAfter = editor.state.doc.textBetween(to, editor.state.doc.content.size);
    
    return provider.generateSuggestions({
      text: selectedText,
      from,
      to,
      mode,
      context: {
        before: contextBefore.slice(-500), // Last 500 chars for context
        after: contextAfter.slice(0, 500), // First 500 chars for context
      }
    });
  };

  return {
    generateSuggestions,
    provider
  };
}
