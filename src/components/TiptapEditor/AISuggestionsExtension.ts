import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { AIEdit, AIEditResponse } from '../../services/aiService';

// Plugin state to track AI suggestions
interface AISuggestionsState {
  suggestions: AIEdit[];
  decorations: DecorationSet;
  activeEditId: string | null;
}

// Plugin key for managing the state
export const aiSuggestionsPluginKey = new PluginKey<AISuggestionsState>('aiSuggestions');

// Custom extension for AI inline editing
export const AISuggestionsExtension = Extension.create({
  name: 'aiSuggestions',

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: aiSuggestionsPluginKey,
        
        state: {
          init() {
            return {
              suggestions: [],
              decorations: DecorationSet.empty,
              activeEditId: null,
            };
          },
          
          apply(tr, value) {
            // Get the meta data for AI suggestions
            const meta = tr.getMeta(aiSuggestionsPluginKey);
            
            if (meta?.type === 'setSuggestions') {
              // Set new suggestions and create decorations
              const suggestions = meta.suggestions as AIEdit[];
              const decorations = createDecorations(tr.doc, suggestions);
              
              return {
                suggestions,
                decorations,
                activeEditId: null,
              };
            }
            
            if (meta?.type === 'acceptEdit') {
              // Remove the accepted suggestion
              const editId = meta.editId as string;
              const newSuggestions = value.suggestions.filter(s => s.id !== editId);
              const decorations = createDecorations(tr.doc, newSuggestions);
              
              return {
                suggestions: newSuggestions,
                decorations,
                activeEditId: null,
              };
            }
            
            if (meta?.type === 'rejectEdit') {
              // Remove the rejected suggestion
              const editId = meta.editId as string;
              const newSuggestions = value.suggestions.filter(s => s.id !== editId);
              const decorations = createDecorations(tr.doc, newSuggestions);
              
              return {
                suggestions: newSuggestions,
                decorations,
                activeEditId: null,
              };
            }
            
            if (meta?.type === 'clearAllSuggestions') {
              return {
                suggestions: [],
                decorations: DecorationSet.empty,
                activeEditId: null,
              };
            }
            
            if (meta?.type === 'setActiveEdit') {
              return {
                ...value,
                activeEditId: meta.editId as string,
              };
            }
            
            // Map decorations through document changes
            return {
              ...value,
              decorations: value.decorations.map(tr.mapping, tr.doc),
            };
          },
        },
        
        props: {
          decorations(state) {
            return aiSuggestionsPluginKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
  
  // Add commands for managing suggestions
  addCommands() {
    return {
      setSuggestions: (suggestions: AIEdit[]) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(aiSuggestionsPluginKey, { type: 'setSuggestions', suggestions });
        }
        return true;
      },
      
      acceptEdit: (editId: string) => ({ tr, dispatch, state }) => {
        if (dispatch) {
          const pluginState = aiSuggestionsPluginKey.getState(state);
          const edit = pluginState?.suggestions.find(s => s.id === editId);
          
          if (edit) {
            // Apply the edit to the document
            const { range, newText } = edit;
            tr.insertText(newText, range.start, range.end);
            
            // Remove this suggestion
            tr.setMeta(aiSuggestionsPluginKey, { type: 'acceptEdit', editId });
          }
        }
        return true;
      },
      
      rejectEdit: (editId: string) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(aiSuggestionsPluginKey, { type: 'rejectEdit', editId });
        }
        return true;
      },
      
      clearAllSuggestions: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(aiSuggestionsPluginKey, { type: 'clearAllSuggestions' });
        }
        return true;
      },
      
      acceptAllEdits: () => ({ tr, dispatch, state, editor }) => {
        if (dispatch) {
          const pluginState = aiSuggestionsPluginKey.getState(state);
          const suggestions = pluginState?.suggestions || [];
          
          // Apply all edits in reverse order to maintain correct positions
          const sortedSuggestions = [...suggestions].sort((a, b) => b.range.start - a.range.start);
          
          sortedSuggestions.forEach(edit => {
            tr.insertText(edit.newText, edit.range.start, edit.range.end);
          });
          
          // Clear all suggestions
          tr.setMeta(aiSuggestionsPluginKey, { type: 'clearAllSuggestions' });
        }
        return true;
      },
      
      rejectAllEdits: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(aiSuggestionsPluginKey, { type: 'clearAllSuggestions' });
        }
        return true;
      },
      
      setActiveEdit: (editId: string | null) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(aiSuggestionsPluginKey, { type: 'setActiveEdit', editId });
        }
        return true;
      },
    };
  },
});

// Create decorations for AI suggestions
function createDecorations(doc: any, suggestions: AIEdit[]): DecorationSet {
  const decorations: Decoration[] = [];
  
  suggestions.forEach(suggestion => {
    const { range, type, id, oldText, newText, rationale } = suggestion;
    
    // Ensure range is valid
    if (range.start < 0 || range.end > doc.content.size) {
      console.warn('Invalid range for suggestion:', suggestion);
      return;
    }
    
    // Create decoration based on edit type
    if (type === 'replace') {
      // Show deletion with red strikethrough
      if (oldText && range.start < range.end) {
        decorations.push(
          Decoration.inline(range.start, range.end, {
            class: 'ai-deletion',
            'data-edit-id': id,
            'data-rationale': rationale,
            'data-new-text': newText,
          })
        );
      }
      
      // Show insertion with green highlight
      // For replace operations, we show a widget at the end of the old text
      if (newText) {
        decorations.push(
          Decoration.widget(range.end, () => {
            const widget = document.createElement('span');
            widget.className = 'ai-insertion';
            widget.setAttribute('data-edit-id', id);
            widget.setAttribute('data-rationale', rationale);
            widget.textContent = newText;
            return widget;
          }, {
            side: 1,
            key: `insertion-${id}`,
          })
        );
      }
    } else if (type === 'insert') {
      // Pure insertion - just show the new text
      decorations.push(
        Decoration.widget(range.start, () => {
          const widget = document.createElement('span');
          widget.className = 'ai-insertion';
          widget.setAttribute('data-edit-id', id);
          widget.setAttribute('data-rationale', rationale);
          widget.textContent = newText;
          return widget;
        }, {
          side: 1,
          key: `insertion-${id}`,
        })
      );
    } else if (type === 'delete') {
      // Pure deletion - show strikethrough
      decorations.push(
        Decoration.inline(range.start, range.end, {
          class: 'ai-deletion',
          'data-edit-id': id,
          'data-rationale': rationale,
        })
      );
    }
  });
  
  return DecorationSet.create(doc, decorations);
}

// Helper function to get suggestions from editor state
export function getAISuggestions(editor: any): AIEdit[] {
  const state = aiSuggestionsPluginKey.getState(editor.state);
  return state?.suggestions || [];
}

// Helper function to get active edit ID
export function getActiveEditId(editor: any): string | null {
  const state = aiSuggestionsPluginKey.getState(editor.state);
  return state?.activeEditId || null;
}

