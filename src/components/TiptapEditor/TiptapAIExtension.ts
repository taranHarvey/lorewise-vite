import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import type { TiptapSuggestion } from '../../services/tiptapAIAdapter';

// Extend the Commands interface to include our custom commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setTiptapAISuggestions: {
      setTiptapAISuggestions: (suggestions: TiptapSuggestion[]) => ReturnType;
    };
    clearTiptapAISuggestions: {
      clearTiptapAISuggestions: () => ReturnType;
    };
  }
}

export interface TiptapAIOptions {
  suggestions: TiptapSuggestion[];
  onAccept: (suggestion: TiptapSuggestion) => void;
  onReject: (suggestion: TiptapSuggestion) => void;
  editor: Editor;
}

const TiptapAIKey = new PluginKey('tiptapAI');

export const TiptapAIExtension = Extension.create<TiptapAIOptions>({
  name: 'tiptapAI',

  addOptions() {
    return {
      suggestions: [],
      onAccept: () => {},
      onReject: () => {},
      editor: null as any,
    };
  },

  addCommands() {
    return {
      setTiptapAISuggestions: (suggestions: TiptapSuggestion[]) => ({ editor }) => {
        // Dispatch a transaction with the meta data to update plugin state
        const tr = editor.state.tr.setMeta(TiptapAIKey, { 
          action: 'updateSuggestions', 
          suggestions 
        });
        
        editor.view.dispatch(tr);
        return true;
      },
      
      clearTiptapAISuggestions: () => ({ editor }) => {
        // Dispatch a transaction to clear suggestions
        const tr = editor.state.tr.setMeta(TiptapAIKey, { 
          action: 'updateSuggestions', 
          suggestions: [] 
        });
        
        editor.view.dispatch(tr);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const { onAccept, onReject } = this.options;

    return [
      new Plugin({
        key: TiptapAIKey,
        state: {
          init() {
            return { suggestions: [] };
          },
          apply(tr, oldState, newState) {
            const meta = tr.getMeta(TiptapAIKey);
            if (meta && meta.action === 'updateSuggestions') {
              return { suggestions: meta.suggestions };
            }
            return oldState;
          },
        },
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const pluginState = TiptapAIKey.getState(state);
            const currentSuggestions = pluginState?.suggestions || [];
            
            currentSuggestions.forEach(suggestion => {
              const { from, to, type, reason } = suggestion;
              
              // Create decoration based on suggestion type
              let decoration;
              
              if (type === 'insert') {
                // Show insertion point
                decoration = Decoration.widget(from, () => {
                  const widget = document.createElement('span');
                  widget.className = 'tiptap-ai-insertion';
                  widget.textContent = suggestion.insert || '';
                  widget.setAttribute('data-reason', reason || '');
                  
                  // Add accept/reject buttons
                  const buttonContainer = document.createElement('div');
                  buttonContainer.className = 'tiptap-ai-buttons';
                  
                  const acceptBtn = document.createElement('button');
                  acceptBtn.innerHTML = '✅';
                  acceptBtn.title = 'Accept suggestion';
                  acceptBtn.className = 'tiptap-ai-accept';
                  acceptBtn.onclick = () => {
                    console.log('Individual accept button clicked:', suggestion);
                    console.log('Extension editor:', this.options.editor);
                    // Use the editor from the extension options
                    const extensionEditor = this.options.editor;
                    if (extensionEditor) {
                      console.log('Calling onAccept with suggestion:', suggestion);
                      onAccept(suggestion);
                    } else {
                      console.log('No extension editor available');
                    }
                  };
                  
                  const rejectBtn = document.createElement('button');
                  rejectBtn.innerHTML = '❌';
                  rejectBtn.title = 'Reject suggestion';
                  rejectBtn.className = 'tiptap-ai-reject';
                  rejectBtn.onclick = () => {
                    // Use the editor from the extension options
                    const extensionEditor = this.options.editor;
                    if (extensionEditor) {
                      onReject(suggestion);
                    }
                  };
                  
                  buttonContainer.appendChild(acceptBtn);
                  buttonContainer.appendChild(rejectBtn);
                  widget.appendChild(buttonContainer);
                  
                  return widget;
                });
              } else if (type === 'replace') {
                // Show replacement with strikethrough for old text
                decoration = Decoration.inline(from, to, {
                  class: 'tiptap-ai-replacement',
                  'data-reason': reason || '',
                  style: 'text-decoration: line-through; background-color: #fecaca; color: #dc2626;'
                });
                
                // Add new text suggestion
                const newTextDecoration = Decoration.widget(to, () => {
                  const widget = document.createElement('span');
                  widget.className = 'tiptap-ai-new-text';
                  widget.textContent = suggestion.insert || '';
                  widget.style.backgroundColor = '#dcfce7';
                  widget.style.color = '#16a34a';
                  widget.style.padding = '2px 4px';
                  widget.style.borderRadius = '3px';
                  widget.style.marginLeft = '4px';
                  
                  const buttonContainer = document.createElement('div');
                  buttonContainer.className = 'tiptap-ai-buttons';
                  
                  const acceptBtn = document.createElement('button');
                  acceptBtn.innerHTML = '✅';
                  acceptBtn.title = 'Accept suggestion';
                  acceptBtn.className = 'tiptap-ai-accept';
                  acceptBtn.onclick = () => {
                    console.log('Individual accept button clicked:', suggestion);
                    console.log('Extension editor:', this.options.editor);
                    // Use the editor from the extension options
                    const extensionEditor = this.options.editor;
                    if (extensionEditor) {
                      console.log('Calling onAccept with suggestion:', suggestion);
                      onAccept(suggestion);
                    } else {
                      console.log('No extension editor available');
                    }
                  };
                  
                  const rejectBtn = document.createElement('button');
                  rejectBtn.innerHTML = '❌';
                  rejectBtn.title = 'Reject suggestion';
                  rejectBtn.className = 'tiptap-ai-reject';
                  rejectBtn.onclick = () => {
                    // Use the editor from the extension options
                    const extensionEditor = this.options.editor;
                    if (extensionEditor) {
                      onReject(suggestion);
                    }
                  };
                  
                  buttonContainer.appendChild(acceptBtn);
                  buttonContainer.appendChild(rejectBtn);
                  widget.appendChild(buttonContainer);
                  
                  return widget;
                });
                
                decorations.push(decoration, newTextDecoration);
                return;
              } else if (type === 'delete') {
                // Show deletion with strikethrough
                decoration = Decoration.inline(from, to, {
                  class: 'tiptap-ai-deletion',
                  'data-reason': reason || '',
                  style: 'text-decoration: line-through; background-color: #fecaca; color: #dc2626;'
                });
              }
              
              if (decoration) {
                decorations.push(decoration);
              }
            });
            
            return DecorationSet.create(state.doc, decorations);
          },
          
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('tiptap-ai-accept') || target.classList.contains('tiptap-ai-reject')) {
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
