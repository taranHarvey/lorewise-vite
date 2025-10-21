import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export Service
 * Handles exporting documents to various formats (DOCX, PDF, etc.)
 */
class ExportService {
  /**
   * Export document as DOCX
   */
  async exportToDocx(title: string, htmlContent: string): Promise<void> {
    try {
      // Parse HTML and convert to docx elements
      const paragraphs = this.parseHTMLToDocx(htmlContent);

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generate and save
      const blob = await Packer.toBlob(doc);
      const fileName = `${this.sanitizeFileName(title)}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Export to DOCX error:', error);
      throw new Error('Failed to export document');
    }
  }

  /**
   * Parse HTML content and convert to DOCX paragraphs
   */
  private parseHTMLToDocx(html: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    // Process each element
    this.processNode(body, paragraphs);

    return paragraphs;
  }

  /**
   * Process DOM node and convert to DOCX paragraphs
   */
  private processNode(node: Node, paragraphs: Paragraph[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'h1':
        paragraphs.push(
          new Paragraph({
            text: element.textContent || '',
            heading: HeadingLevel.HEADING_1,
            spacing: {
              before: 240,
              after: 120,
            },
          })
        );
        break;

      case 'h2':
        paragraphs.push(
          new Paragraph({
            text: element.textContent || '',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120,
            },
          })
        );
        break;

      case 'h3':
        paragraphs.push(
          new Paragraph({
            text: element.textContent || '',
            heading: HeadingLevel.HEADING_3,
            spacing: {
              before: 200,
              after: 100,
            },
          })
        );
        break;

      case 'p':
        const runs = this.parseInlineElements(element);
        if (runs.length > 0 || element.textContent?.trim()) {
          paragraphs.push(
            new Paragraph({
              children: runs.length > 0 ? runs : [new TextRun(element.textContent || '')],
              spacing: {
                after: 120,
              },
            })
          );
        }
        break;

      case 'ul':
      case 'ol':
        const listItems = element.querySelectorAll('li');
        listItems.forEach((li, index) => {
          const liRuns = this.parseInlineElements(li);
          paragraphs.push(
            new Paragraph({
              children: liRuns.length > 0 ? liRuns : [new TextRun(li.textContent || '')],
              bullet: tagName === 'ul' ? { level: 0 } : undefined,
              numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
            })
          );
        });
        break;

      case 'br':
        paragraphs.push(new Paragraph({ children: [] }));
        break;

      case 'hr':
        paragraphs.push(
          new Paragraph({
            border: {
              bottom: {
                color: '000000',
                space: 1,
                style: 'single',
                size: 6,
              },
            },
          })
        );
        break;

      default:
        // Process children for other elements
        Array.from(element.childNodes).forEach(child => {
          this.processNode(child, paragraphs);
        });
        break;
    }
  }

  /**
   * Parse inline elements (bold, italic, underline, etc.)
   */
  private parseInlineElements(element: Element): TextRun[] {
    const runs: TextRun[] = [];

    const processInlineNode = (node: Node, styles: {
      bold?: boolean;
      italics?: boolean;
      underline?: any;
    } = {}): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.trim() || text === ' ') {
          runs.push(new TextRun({
            text: text,
            bold: styles.bold,
            italics: styles.italics,
            underline: styles.underline,
          }));
        }
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        let newStyles = { ...styles };

        switch (tag) {
          case 'strong':
          case 'b':
            newStyles.bold = true;
            break;
          case 'em':
          case 'i':
            newStyles.italics = true;
            break;
          case 'u':
            newStyles.underline = {};
            break;
          case 'br':
            runs.push(new TextRun({ text: '', break: 1 }));
            return;
        }

        Array.from(el.childNodes).forEach(child => {
          processInlineNode(child, newStyles);
        });
      }
    };

    Array.from(element.childNodes).forEach(child => {
      processInlineNode(child);
    });

    return runs;
  }

  /**
   * Sanitize file name for safe file system usage
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }
}

// Export singleton instance
export const exportService = new ExportService();
