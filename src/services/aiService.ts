import type { SeriesLore } from '../documentService';
import { modelSelectionService, type ModelName, MODEL_COSTS, getAPIModelName } from './modelSelectionService';

export interface WritingContext {
  selectedText?: string;
  surroundingText?: string;
  contextBefore?: string;
  contextAfter?: string;
  lore?: SeriesLore;
  currentChapter?: string;
  genre?: string;
  writingStyle?: string;
  references?: ReferenceDocument[];
}

export interface ReferenceDocument {
  title: string;
  content: string;
  type?: 'lore' | 'character' | 'world' | 'summary';
}

export interface AISuggestion {
  type: 'improvement' | 'expansion' | 'dialogue' | 'description' | 'plot' | 'character';
  text: string;
  reasoning?: string;
  confidence: number;
}

// New interfaces for inline editing
export interface AIEditRange {
  start: number;
  end: number;
}

export interface AIEdit {
  type: 'replace' | 'insert' | 'delete';
  range: AIEditRange;
  oldText: string;
  newText: string;
  rationale: string;
  id: string; // Unique identifier for tracking accept/reject
}

export interface AIEditResponse {
  edits: AIEdit[];
  summary?: string;
  success: boolean;
  error?: string;
}

export type AIActionMode = 
  | 'improve'      // ✍️ Improve Writing - Refine tone, flow, and grammar
  | 'expand'       // 🧠 Expand Scene - Add sensory or emotional depth
  | 'shorten'      // ✂️ Shorten Scene - Summarize or tighten pacing
  | 'rephrase'     // 🔄 Rephrase - Paraphrase selected text
  | 'continue'     // 🧩 Continue Story - Generate next paragraph naturally
  | 'consistency'  // 📖 Maintain Consistency - Adjust using reference docs
  | 'dialogue'     // 💬 Improve Dialogue - Enhance character voice
  | 'description'; // 🎨 Enhance Description - Add vivid imagery

export interface InlineEditRequest {
  prompt: string;
  selection: string;
  contextBefore: string;
  contextAfter: string;
  references?: ReferenceDocument[];
  mode: AIActionMode;
  fullDocumentText?: string; // For calculating positions
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  issues: string[];
  suggestions: string[];
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: WritingContext;
}

class AIService {
  private apiKey: string;
  private baseURL = '/api/openai/v1'; // Use proxy URL for development
  private defaultModel: ModelName = 'gpt-5-mini'; // Default to GPT-5 Mini (unlimited, cost-effective)

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get the current user ID (needed for model selection)
   * This should be passed from the calling component/hook
   */
  private getCurrentUserId(): string | null {
    // Try to get from auth context if available
    // Otherwise, this will be passed as a parameter
    return null;
  }

  // Build context for AI requests
  buildContext(selectedText?: string, lore?: SeriesLore, surroundingText?: string): WritingContext {
    return {
      selectedText,
      surroundingText,
      lore,
      genre: 'fiction',
      writingStyle: 'literary'
    };
  }

  // Generate content based on prompt and context
  async generateContent(
    prompt: string, 
    context: WritingContext,
    userId?: string,
    taskType: AIActionMode = 'improve'
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    // Estimate tokens (rough estimate: 1 token ≈ 4 characters)
    const estimatedInputTokens = Math.ceil((systemPrompt.length + prompt.length) / 4);
    const estimatedOutputTokens = 4000; // Increased for GPT-5 (reasoning tokens + content tokens)

    // Select model using smart selection service
    let selectedModel: ModelName = this.defaultModel;
    if (userId) {
      try {
        const modelSelection = await modelSelectionService.selectModel(
          userId,
          taskType,
          estimatedInputTokens,
          estimatedOutputTokens
        );
        selectedModel = modelSelection.model;
        
        if (import.meta.env.DEV) {
          console.log(`[Model Selection] ${modelSelection.reason}`);
        }
      } catch (error) {
        console.error('Error selecting model, using default:', error);
      }
    }

    try {
      // Map internal model name to actual OpenAI API model name
      const apiModelName = getAPIModelName(selectedModel);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: apiModelName, // Use actual OpenAI model name
          messages,
          max_completion_tokens: 4000, // GPT-5 uses max_completion_tokens - increased to allow for reasoning tokens + content
          // Note: GPT-5 models use reasoning tokens separately, so we need more tokens for actual content
          // Note: GPT-5 models only support default temperature (1), so we omit it
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenAI API error: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`;
            // Log model name for debugging
            if (import.meta.env.DEV) {
              console.error(`[AI Service] Model used: ${apiModelName}`);
              console.error(`[AI Service] Full error:`, errorData);
            }
          }
        } catch {
          // If error response isn't JSON, use the text as-is
          if (import.meta.env.DEV) {
            console.error(`[AI Service] Model used: ${apiModelName}`);
            console.error(`[AI Service] Error response:`, errorText);
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (import.meta.env.DEV) {
        console.log('[AI Service] Full API response:', JSON.stringify(data, null, 2));
        console.log('[AI Service] Choices:', data.choices);
        console.log('[AI Service] First choice:', data.choices?.[0]);
        console.log('[AI Service] Message:', data.choices?.[0]?.message);
        console.log('[AI Service] Message content:', data.choices?.[0]?.message?.content);
        console.log('[AI Service] Choice content:', data.choices?.[0]?.content);
        console.log('[AI Service] Choice text:', data.choices?.[0]?.text);
      }
      
      // GPT-5 response structure - extract content from choices array
      let content = '';
      if (data.choices && data.choices.length > 0 && data.choices[0]) {
        const choice = data.choices[0];
        // Try different possible content locations
        content = choice.message?.content || 
                  choice.content || 
                  choice.text || 
                  choice.delta?.content ||
                  '';
        
        // If still empty, log the entire choice structure
        if (!content && import.meta.env.DEV) {
          console.warn('[AI Service] Choice structure:', JSON.stringify(choice, null, 2));
        }
      } else if (data.content) {
        content = data.content;
      } else if (data.text) {
        content = data.text;
      }
      
      if (import.meta.env.DEV) {
        console.log('[AI Service] Extracted content:', content);
        console.log('[AI Service] Content length:', content.length);
      }
      
      if (!content) {
        console.warn('[AI Service] No content found in response. Full response:', data);
      }
      
      // Track usage and costs
      if (userId && data.usage) {
        const inputTokens = data.usage.prompt_tokens || estimatedInputTokens;
        const outputTokens = data.usage.completion_tokens || estimatedOutputTokens;
        const actualCost = this.calculateCost(selectedModel, inputTokens, outputTokens);
        
        await modelSelectionService.trackUsage(
          userId,
          selectedModel,
          inputTokens,
          outputTokens,
          actualCost
        );
      }
      
      return content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Calculate actual cost from API response
   */
  private calculateCost(model: ModelName, inputTokens: number, outputTokens: number): number {
    const costs = MODEL_COSTS[model];
    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;
    return inputCost + outputCost;
  }

  // Legacy method - kept for backward compatibility
  // Use improveText() with inline edits instead
  async improveTextLegacy(selectedText: string, context: WritingContext): Promise<AISuggestion[]> {
    const prompt = `Please improve the following text for a novel. Consider the context and lore provided. Return 2-3 specific suggestions with explanations:

Text to improve: "${selectedText}"

Provide suggestions in this format:
1. [Type: improvement/expansion/dialogue/description] [Suggestion] - [Reasoning]`;

    const response = await this.generateContent(prompt, context);
    return this.parseSuggestions(response);
  }

  // Generate character development suggestions
  async suggestCharacterDevelopment(character: string, context: WritingContext): Promise<string> {
    const prompt = `Based on the series lore and current story context, suggest character development ideas for "${character}". Consider their background, motivations, and potential growth arcs.`;
    return this.generateContent(prompt, context);
  }

  // Generate plot ideas
  async generatePlotIdeas(currentStory: string, context: WritingContext): Promise<string> {
    const prompt = `Based on the current story and series lore, suggest 3-5 plot development ideas that would fit naturally with the existing narrative. Consider character arcs, world-building, and thematic consistency.

Current story context: "${currentStory.substring(0, 500)}..."`;
    return this.generateContent(prompt, context);
  }

  // Check consistency with lore
  async checkConsistency(text: string, context: WritingContext): Promise<ConsistencyCheck> {
    const prompt = `Check the following text for consistency with the provided series lore. Identify any contradictions or inconsistencies:

Text to check: "${text}"

Return a JSON object with:
{
  "isConsistent": boolean,
  "issues": ["list of issues"],
  "suggestions": ["list of suggestions"]
}`;

    const response = await this.generateContent(prompt, context);
    try {
      return JSON.parse(response);
    } catch {
      return {
        isConsistent: true,
        issues: [],
        suggestions: ['Unable to parse consistency check response']
      };
    }
  }

  // Chat with AI assistant
  async chatWithAI(
    message: string, 
    context: WritingContext, 
    chatHistory: AIChatMessage[] = [],
    userId?: string
  ): Promise<string> {
    if (import.meta.env.DEV) {
      console.log('AI Service: Starting chat with message:', message);
      console.log('AI Service: API Key exists:', !!this.apiKey);
    }
    
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user' as const, content: message }
    ];

    // Estimate tokens
    const estimatedInputTokens = Math.ceil(
      (systemPrompt.length + message.length + 
       chatHistory.slice(-10).reduce((sum, msg) => sum + msg.content.length, 0)) / 4
    );
    const estimatedOutputTokens = 4000; // Increased for GPT-5 (reasoning tokens + content tokens)

    // Select model
    let selectedModel: ModelName = this.defaultModel;
    if (userId) {
      try {
        const modelSelection = await modelSelectionService.selectModel(
          userId,
          'chat',
          estimatedInputTokens,
          estimatedOutputTokens
        );
        selectedModel = modelSelection.model;
        
        if (import.meta.env.DEV) {
          console.log(`[Model Selection] ${modelSelection.reason}`);
        }
      } catch (error) {
        console.error('Error selecting model, using default:', error);
      }
    }

    try {
      if (import.meta.env.DEV) {
        console.log('AI Service: Sending request to OpenAI...');
      }
      
      // Map internal model name to actual OpenAI API model name
      const apiModelName = getAPIModelName(selectedModel);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: apiModelName, // Use actual OpenAI model name
          messages,
          max_completion_tokens: 4000, // GPT-5 uses max_completion_tokens - increased to allow for reasoning tokens + content
          // Note: GPT-5 models use reasoning tokens separately, so we need more tokens for actual content
          // Note: GPT-5 models only support default temperature (1), so we omit it
        }),
      });

      if (import.meta.env.DEV) {
        console.log('AI Service: Response status:', response.status);
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenAI API error: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`;
            if (import.meta.env.DEV) {
              console.error(`[AI Service] Model used: ${apiModelName}`);
              console.error(`[AI Service] Full error:`, errorData);
            }
          }
        } catch {
          if (import.meta.env.DEV) {
            console.error(`[AI Service] Model used: ${apiModelName}`);
            console.error(`[AI Service] Error response:`, errorText);
          }
        }
        console.error('AI Service: API Error Response:', errorText);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (import.meta.env.DEV) {
        console.log('[AI Service] Full API response:', JSON.stringify(data, null, 2));
        console.log('[AI Service] Choices:', data.choices);
        console.log('[AI Service] First choice:', data.choices?.[0]);
        console.log('[AI Service] Message:', data.choices?.[0]?.message);
        console.log('[AI Service] Message content:', data.choices?.[0]?.message?.content);
      }
      
      // GPT-5 response structure - extract content from choices array
      let content = '';
      if (data.choices && data.choices.length > 0 && data.choices[0]) {
        const choice = data.choices[0];
        content = choice.message?.content || 
                  choice.content || 
                  choice.text || 
                  choice.delta?.content ||
                  '';
        
        if (!content && import.meta.env.DEV) {
          console.warn('[AI Service] Choice structure:', JSON.stringify(choice, null, 2));
        }
      } else if (data.content) {
        content = data.content;
      } else if (data.text) {
        content = data.text;
      }
      
      if (import.meta.env.DEV) {
        console.log('[AI Service] Extracted content:', content);
        console.log('[AI Service] Content length:', content.length);
      }
      
      if (!content) {
        console.warn('[AI Service] No content found in response. Full response:', data);
      }
      
      // Track usage and costs
      if (userId && data.usage) {
        const inputTokens = data.usage.prompt_tokens || estimatedInputTokens;
        const outputTokens = data.usage.completion_tokens || estimatedOutputTokens;
        const actualCost = this.calculateCost(selectedModel, inputTokens, outputTokens);
        
        await modelSelectionService.trackUsage(
          userId,
          selectedModel,
          inputTokens,
          outputTokens,
          actualCost
        );
      }
      
      return content;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }

  // ========================================================================
  // INLINE EDITING METHODS
  // ========================================================================

  /**
   * Get structured inline edits for the selected text
   * This is the main method for the inline editing system
   */
  async getInlineEdits(request: InlineEditRequest, userId?: string): Promise<AIEditResponse> {
    try {
      const systemPrompt = this.buildInlineEditSystemPrompt(request);
      const userPrompt = this.buildInlineEditUserPrompt(request);

      if (import.meta.env.DEV) {
        console.log('AI Service: Requesting inline edits for mode:', request.mode);
      }

      // Estimate tokens
      const estimatedInputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
      const estimatedOutputTokens = 4000; // Increased for GPT-5 (reasoning tokens + content tokens)

      // Select model using smart selection
      let selectedModel: ModelName = this.defaultModel;
      if (userId) {
        try {
          const modelSelection = await modelSelectionService.selectModel(
            userId,
            request.mode,
            estimatedInputTokens,
            estimatedOutputTokens
          );
          selectedModel = modelSelection.model;
          
          if (import.meta.env.DEV) {
            console.log(`[Model Selection] ${modelSelection.reason}`);
          }
        } catch (error) {
          console.error('Error selecting model, using default:', error);
        }
      }

      // Map internal model name to actual OpenAI API model name
      const apiModelName = getAPIModelName(selectedModel);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: apiModelName, // Use actual OpenAI model name
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 4000, // GPT-5 uses max_completion_tokens - increased to allow for reasoning tokens + content
          // Note: GPT-5 models use reasoning tokens separately, so we need more tokens for actual content
          // Note: GPT-5 models only support default temperature (1), so we omit it
          response_format: { type: "json_object" } // Force JSON response
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenAI API error: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`;
            if (import.meta.env.DEV) {
              console.error(`[AI Service] Model used: ${apiModelName}`);
              console.error(`[AI Service] Full error:`, errorData);
            }
          }
        } catch {
          if (import.meta.env.DEV) {
            console.error(`[AI Service] Model used: ${apiModelName}`);
            console.error(`[AI Service] Error response:`, errorText);
          }
        }
        console.error('AI Service: Inline Edit Error:', errorText);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (import.meta.env.DEV) {
        console.log('[AI Service] Inline edits API response:', JSON.stringify(data, null, 2));
        console.log('[AI Service] Choices:', data.choices);
        console.log('[AI Service] First choice:', data.choices?.[0]);
        console.log('[AI Service] Message:', data.choices?.[0]?.message);
      }
      
      // GPT-5 response structure - extract content from choices array
      let content = '{}';
      if (data.choices && data.choices.length > 0 && data.choices[0]) {
        const choice = data.choices[0];
        content = choice.message?.content || 
                  choice.content || 
                  choice.text || 
                  choice.delta?.content ||
                  '{}';
        
        if (!content || content === '{}') {
          if (import.meta.env.DEV) {
            console.warn('[AI Service] Choice structure:', JSON.stringify(choice, null, 2));
          }
        }
      } else if (data.content) {
        content = data.content;
      } else if (data.text) {
        content = data.text;
      }
      
      if (import.meta.env.DEV) {
        console.log('[AI Service] Extracted content for inline edits:', content);
      }
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);
      
      // Add unique IDs to each edit
      const editsWithIds = parsedResponse.edits?.map((edit: Omit<AIEdit, 'id'>, index: number) => ({
        ...edit,
        id: `edit-${Date.now()}-${index}`
      })) || [];

      // Track usage and costs
      if (userId && data.usage) {
        const inputTokens = data.usage.prompt_tokens || estimatedInputTokens;
        const outputTokens = data.usage.completion_tokens || estimatedOutputTokens;
        const actualCost = this.calculateCost(selectedModel, inputTokens, outputTokens);
        
        await modelSelectionService.trackUsage(
          userId,
          selectedModel,
          inputTokens,
          outputTokens,
          actualCost
        );
      }

      return {
        edits: editsWithIds,
        summary: parsedResponse.summary,
        success: true
      };
    } catch (error) {
      console.error('Error getting inline edits:', error);
      return {
        edits: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Build the system prompt for inline editing based on AI action mode
   */
  private buildInlineEditSystemPrompt(request: InlineEditRequest): string {
    const modeInstructions = this.getInlineEditModeInstructions(request.mode);
    
    let prompt = `You are an expert writing assistant that provides structured inline edits for fiction writing.

Your task: ${modeInstructions}

CRITICAL INSTRUCTIONS:
1. Return a valid JSON object with this exact structure:
{
  "edits": [
    {
      "type": "replace",
      "range": { "start": 0, "end": 50 },
      "oldText": "original text to be replaced",
      "newText": "improved replacement text",
      "rationale": "Brief explanation of why this change improves the writing"
    }
  ],
  "summary": "Brief overview of all changes made"
}

2. The "range" uses character positions in the provided text (0-indexed)
3. For "replace" edits: provide both oldText and newText
4. For "insert" edits: oldText is empty, range.start == range.end
5. For "delete" edits: newText is empty
6. Keep rationales concise but helpful (under 100 characters)
7. Focus on meaningful improvements that enhance the narrative
8. Maintain the author's voice and style

IMPORTANT: If you are given a specific text selection to edit, you should return EXACTLY ONE replacement edit that covers the entire selection. Do not break it into multiple small edits. The single edit should replace the entire selected text with your improved version.

For document-wide analysis: find the most impactful places to improve and return between 3-8 edits.
For specific text selections: return exactly 1 edit that replaces the entire selection.`;

    // Add reference context if available
    if (request.references && request.references.length > 0) {
      prompt += `\n\nREFERENCE MATERIALS:`;
      request.references.forEach(ref => {
        prompt += `\n\n${ref.title}:\n${ref.content.substring(0, 1000)}${ref.content.length > 1000 ? '...' : ''}`;
      });
      prompt += `\n\nUse these references to ensure consistency and accuracy in your edits.`;
    }

    return prompt;
  }

  /**
   * Build the user prompt with the actual text to edit
   */
  private buildInlineEditUserPrompt(request: InlineEditRequest): string {
    let prompt = '';

    // If we have full document text, use document-wide analysis
    if (request.fullDocumentText) {
      prompt += `FULL DOCUMENT TO ANALYZE:\n"${request.fullDocumentText}"\n\n`;
      prompt += `Please analyze this entire document and suggest improvements based on the user's request.\n\n`;
    } else {
      // Use selection-based editing
      if (request.contextBefore) {
        prompt += `Context before:\n"${request.contextBefore}"\n\n`;
      }

      prompt += `Text to edit:\n"${request.selection}"\n\n`;

      if (request.contextAfter) {
        prompt += `Context after:\n"${request.contextAfter}"\n\n`;
      }
      
      prompt += `IMPORTANT: This is a text selection. Please provide EXACTLY ONE replacement edit that replaces the entire selected text with your improved version. Do not break this into multiple small edits.`;
    }

    if (request.prompt) {
      prompt += `User's request: ${request.prompt}\n\n`;
    }

    prompt += `Please provide structured edits in JSON format.`;

    return prompt;
  }

  /**
   * Get mode-specific instructions for different AI actions
   */
  private getInlineEditModeInstructions(mode: AIActionMode): string {
    const instructions: Record<AIActionMode, string> = {
      improve: 'Refine the writing by improving tone, flow, grammar, and clarity. Focus on making the prose more polished and engaging while maintaining the author\'s voice.',
      
      expand: 'Add sensory details, emotional depth, and descriptive elements to make the scene more vivid and immersive. Expand sparse descriptions into richer, more evocative prose.',
      
      shorten: 'Tighten the pacing by removing redundancy, condensing descriptions, and making the prose more concise while preserving essential meaning and narrative impact.',
      
      rephrase: 'Rewrite the selected text with different word choices and sentence structures while maintaining the same meaning and emotional tone.',
      
      continue: 'Generate a natural continuation of the narrative that flows seamlessly from the selected text. Match the tone, style, and pacing of the existing content.',
      
      consistency: 'Check the text against provided reference materials (lore, character sheets, world-building) and suggest edits to fix any inconsistencies or contradictions.',
      
      dialogue: 'Enhance the dialogue to sound more natural, reveal character personality, and improve the rhythm of conversation. Make character voices more distinct and authentic.',
      
      description: 'Enhance descriptive passages with vivid imagery, sensory details, and evocative language. Make settings and scenes come alive for the reader.'
    };

    return instructions[mode];
  }

  // ========================================================================
  // CONVENIENCE METHODS FOR COMMON AI ACTIONS
  // ========================================================================

  /**
   * Quick method to improve selected text
   */
  async improveText(selection: string, contextBefore?: string, contextAfter?: string, lore?: SeriesLore): Promise<AIEditResponse> {
    const references: ReferenceDocument[] = [];
    if (lore) {
      references.push({
        title: 'Series Lore',
        content: lore.content,
        type: 'lore'
      });
    }

    return this.getInlineEdits({
      prompt: '',
      selection,
      contextBefore: contextBefore || '',
      contextAfter: contextAfter || '',
      references,
      mode: 'improve'
    });
  }

  /**
   * Quick method to expand a scene
   */
  async expandScene(selection: string, contextBefore?: string, contextAfter?: string): Promise<AIEditResponse> {
    return this.getInlineEdits({
      prompt: '',
      selection,
      contextBefore: contextBefore || '',
      contextAfter: contextAfter || '',
      mode: 'expand'
    });
  }

  /**
   * Quick method to shorten text
   */
  async shortenText(selection: string, contextBefore?: string, contextAfter?: string): Promise<AIEditResponse> {
    return this.getInlineEdits({
      prompt: '',
      selection,
      contextBefore: contextBefore || '',
      contextAfter: contextAfter || '',
      mode: 'shorten'
    });
  }

  /**
   * Quick method to rephrase text
   */
  async rephraseText(selection: string, contextBefore?: string, contextAfter?: string): Promise<AIEditResponse> {
    return this.getInlineEdits({
      prompt: '',
      selection,
      contextBefore: contextBefore || '',
      contextAfter: contextAfter || '',
      mode: 'rephrase'
    });
  }

  /**
   * Quick method to continue story
   */
  async continueStory(selection: string, contextBefore?: string): Promise<AIEditResponse> {
    return this.getInlineEdits({
      prompt: '',
      selection,
      contextBefore: contextBefore || '',
      contextAfter: '',
      mode: 'continue'
    });
  }

  /**
   * Quick method to check consistency with lore
   */
  async checkTextConsistency(selection: string, lore: SeriesLore, contextBefore?: string, contextAfter?: string): Promise<AIEditResponse> {
    return this.getInlineEdits({
      prompt: '',
      selection,
      contextBefore: contextBefore || '',
      contextAfter: contextAfter || '',
      references: [{
        title: 'Series Lore',
        content: lore.content,
        type: 'lore'
      }],
      mode: 'consistency'
    });
  }

  // Build system prompt with context
  private buildSystemPrompt(context: WritingContext): string {
    let prompt = `You are an AI writing assistant specialized in novel writing. You help authors with creative writing, character development, plot suggestions, and maintaining consistency in their stories.

Your role:
- Provide creative and helpful suggestions for novel writing
- Maintain consistency with established lore and world-building
- Suggest improvements while respecting the author's voice
- Help with character development, dialogue, and plot progression
- Be encouraging and supportive of the creative process

Writing Guidelines:
- Focus on literary quality and engaging storytelling
- Consider character motivations and development
- Maintain narrative consistency
- Suggest vivid, sensory descriptions
- Help create compelling dialogue`;

    if (context.lore) {
      prompt += `\n\nSeries Lore Context:
${context.lore.content}

Use this lore to ensure consistency in character descriptions, world-building, and plot developments. Reference specific elements from the lore when relevant.`;
    }

    if (context.selectedText) {
      prompt += `\n\nSelected Text Context:
"${context.selectedText}"

Consider this selected text when providing suggestions.`;
    }

    if (context.surroundingText) {
      prompt += `\n\nSurrounding Text Context:
"${context.surroundingText}"

Use this context to understand the narrative flow and provide relevant suggestions.`;
    }

    return prompt;
  }

  // Parse AI suggestions from response
  private parseSuggestions(response: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const lines = response.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*\[Type:\s*(\w+)\]\s*(.+?)\s*-\s*(.+)$/);
      if (match) {
        suggestions.push({
          type: match[2] as AISuggestion['type'],
          text: match[3].trim(),
          reasoning: match[4].trim(),
          confidence: 0.8
        });
      }
    }

    return suggestions;
  }
}

// Export singleton instance
export const aiService = new AIService(import.meta.env.VITE_OPENAI_API_KEY || '');

// Export class for testing
export { AIService };
