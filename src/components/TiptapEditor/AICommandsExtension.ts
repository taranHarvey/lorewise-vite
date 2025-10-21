import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';

export interface AICommand {
  title: string;
  description: string;
  icon: string;
  command: () => void;
  keywords?: string[];
}

export interface AICommandsOptions {
  commands: AICommand[];
}

export const AICommandsPluginKey = new PluginKey('aiCommands');

/**
 * Extension to add slash commands for AI actions
 */
export const AICommandsExtension = Extension.create<AICommandsOptions>({
  name: 'aiCommands',

  addOptions() {
    return {
      commands: [],
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        pluginKey: AICommandsPluginKey,
        
        command: ({ editor, range, props }) => {
          const command = props as AICommand;
          
          // Delete the slash and command text
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .run();
          
          // Execute the command
          command.command();
        },

        items: ({ query }) => {
          const commands = this.options.commands;
          const lowerQuery = query.toLowerCase();
          
          return commands.filter((command) => {
            const titleMatch = command.title.toLowerCase().includes(lowerQuery);
            const keywordMatch = command.keywords?.some(k => 
              k.toLowerCase().includes(lowerQuery)
            );
            
            return titleMatch || keywordMatch;
          });
        },

        render: () => {
          let component: any;
          let popup: any;

          return {
            onStart: (props: any) => {
              component = new CommandsList(props);
              
              if (!props.clientRect) {
                return;
              }

              popup = document.createElement('div');
              popup.style.position = 'fixed';
              popup.style.zIndex = '1000';
              document.body.appendChild(popup);

              component.mount(popup);
              component.updatePosition(props.clientRect());
            },

            onUpdate(props: any) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              component.updatePosition(props.clientRect());
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup?.remove();
                return true;
              }

              return component.onKeyDown(props);
            },

            onExit() {
              popup?.remove();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Cmd+I or Ctrl+I for Improve
      'Mod-i': () => {
        const improveCommand = this.options.commands.find(c => c.title === 'Improve Writing');
        if (improveCommand) {
          improveCommand.command();
          return true;
        }
        return false;
      },
      
      // Cmd+Shift+E or Ctrl+Shift+E for Expand
      'Mod-Shift-e': () => {
        const expandCommand = this.options.commands.find(c => c.title === 'Expand Scene');
        if (expandCommand) {
          expandCommand.command();
          return true;
        }
        return false;
      },
      
      // Cmd+Shift+S or Ctrl+Shift+S for Shorten
      'Mod-Shift-s': () => {
        const shortenCommand = this.options.commands.find(c => c.title === 'Shorten Text');
        if (shortenCommand) {
          shortenCommand.command();
          return true;
        }
        return false;
      },
      
      // Cmd+Shift+R or Ctrl+Shift+R for Rephrase
      'Mod-Shift-r': () => {
        const rephraseCommand = this.options.commands.find(c => c.title === 'Rephrase');
        if (rephraseCommand) {
          rephraseCommand.command();
          return true;
        }
        return false;
      },
      
      // Cmd+Shift+C or Ctrl+Shift+C for Continue
      'Mod-Shift-c': () => {
        const continueCommand = this.options.commands.find(c => c.title === 'Continue Story');
        if (continueCommand) {
          continueCommand.command();
          return true;
        }
        return false;
      },
    };
  },
});

/**
 * Commands List Component for rendering slash command menu
 */
class CommandsList {
  private items: AICommand[];
  private selectedIndex: number;
  private element: HTMLElement | null;
  private props: any;

  constructor(props: any) {
    this.props = props;
    this.items = props.items;
    this.selectedIndex = 0;
    this.element = null;
  }

  mount(element: HTMLElement) {
    this.element = element;
    this.render();
  }

  updateProps(props: any) {
    this.props = props;
    this.items = props.items;
    
    // Reset selection if items changed
    if (this.selectedIndex >= this.items.length) {
      this.selectedIndex = 0;
    }
    
    this.render();
  }

  updatePosition(rect: DOMRect) {
    if (!this.element) return;

    const menuHeight = 300; // Max height
    const menuWidth = 320;
    
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    // Ensure menu doesn't go off screen
    if (top + menuHeight > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - menuHeight - 8;
    }

    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 16;
    }

    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      this.selectPrevious();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.selectNext();
      return true;
    }

    if (event.key === 'Enter') {
      this.selectItem(this.selectedIndex);
      return true;
    }

    return false;
  }

  selectNext() {
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this.render();
  }

  selectPrevious() {
    this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    this.render();
  }

  selectItem(index: number) {
    const item = this.items[index];
    if (item) {
      this.props.command(item);
    }
  }

  render() {
    if (!this.element) return;

    if (this.items.length === 0) {
      this.element.innerHTML = `
        <div class="ai-command-menu">
          <div class="ai-command-empty">
            No commands found
          </div>
        </div>
      `;
      return;
    }

    const itemsHtml = this.items.map((item, index) => {
      const isSelected = index === this.selectedIndex;
      return `
        <button
          class="ai-command-item ${isSelected ? 'selected' : ''}"
          data-index="${index}"
        >
          <div class="ai-command-icon">${item.icon}</div>
          <div class="ai-command-content">
            <div class="ai-command-title">${item.title}</div>
            <div class="ai-command-description">${item.description}</div>
          </div>
        </button>
      `;
    }).join('');

    this.element.innerHTML = `
      <div class="ai-command-menu">
        <div class="ai-command-header">
          AI Commands
        </div>
        <div class="ai-command-list">
          ${itemsHtml}
        </div>
      </div>
    `;

    // Add click handlers
    this.element.querySelectorAll('.ai-command-item').forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.selectItem(index);
      });
    });

    // Scroll selected item into view
    const selectedElement = this.element.querySelector('.ai-command-item.selected');
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }

  destroy() {
    this.element = null;
  }
}

// CSS for slash commands menu (to be added to editor.css)
export const aiCommandsStyles = `
  .ai-command-menu {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    overflow: hidden;
    min-width: 320px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .ai-command-header {
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .ai-command-list {
    overflow-y: auto;
    max-height: 360px;
  }

  .ai-command-item {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: none;
    background: white;
    cursor: pointer;
    transition: background-color 0.15s;
    text-align: left;
  }

  .ai-command-item:hover,
  .ai-command-item.selected {
    background: #eff6ff;
  }

  .ai-command-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .ai-command-content {
    flex: 1;
    min-width: 0;
  }

  .ai-command-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
    margin-bottom: 0.125rem;
  }

  .ai-command-description {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .ai-command-empty {
    padding: 1rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

