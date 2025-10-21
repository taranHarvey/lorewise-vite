import { Mark, mergeAttributes } from '@tiptap/core';

export interface DiffOptions {
  HTMLAttributes: Record<string, any>;
}

export interface DiffChange {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  from: number;
  to: number;
  newText?: string;
  oldText?: string;
  rationale?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    diff: {
      /**
       * Set a diff mark with specific change data
       */
      setDiff: (changeId: string, changeType: 'insert' | 'delete' | 'replace') => ReturnType;
      /**
       * Remove a specific diff mark
       */
      unsetDiff: (changeId: string) => ReturnType;
      /**
       * Remove all diff marks
       */
      clearAllDiffs: () => ReturnType;
    };
  }
}

/**
 * TipTap extension for visualizing AI-proposed text changes
 * Supports insert (green), delete (red), and replace (yellow) operations
 */
export const DiffExtension = Mark.create<DiffOptions>({
  name: 'diff',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      changeId: {
        default: null,
        parseHTML: element => element.getAttribute('data-change-id'),
        renderHTML: attributes => {
          if (!attributes.changeId) {
            return {};
          }
          return {
            'data-change-id': attributes.changeId,
          };
        },
      },
      changeType: {
        default: 'replace',
        parseHTML: element => element.getAttribute('data-change-type'),
        renderHTML: attributes => {
          if (!attributes.changeType) {
            return {};
          }
          return {
            'data-change-type': attributes.changeType,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-change-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'diff-change',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDiff:
        (changeId: string, changeType: 'insert' | 'delete' | 'replace') =>
        ({ commands }) => {
          return commands.setMark(this.name, { changeId, changeType });
        },
      unsetDiff:
        (changeId: string) =>
        ({ tr, state }) => {
          const { doc } = state;
          let removed = false;

          doc.descendants((node, pos) => {
            if (node.marks) {
              node.marks.forEach(mark => {
                if (mark.type.name === this.name && mark.attrs.changeId === changeId) {
                  const from = pos;
                  const to = pos + node.nodeSize;
                  tr.removeMark(from, to, mark.type);
                  removed = true;
                }
              });
            }
          });

          return removed;
        },
      clearAllDiffs:
        () =>
        ({ tr, state }) => {
          const { doc } = state;
          let cleared = false;

          doc.descendants((node, pos) => {
            if (node.marks) {
              node.marks.forEach(mark => {
                if (mark.type.name === this.name) {
                  const from = pos;
                  const to = pos + node.nodeSize;
                  tr.removeMark(from, to, mark.type);
                  cleared = true;
                }
              });
            }
          });

          return cleared;
        },
    };
  },
});
