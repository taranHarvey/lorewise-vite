import { aiService } from './aiService';
import type { SeriesLore } from '../documentService';

/**
 * Structure for lore updates extracted from content
 */
export interface LoreUpdate {
  section: string; // e.g., "Characters", "Worldbuilding", "Plot Continuity"
  subsection?: string; // e.g., "Geography", "Magic System"
  content: string; // The actual update content
  priority: 'high' | 'medium' | 'low';
  rationale: string; // Why this update is needed
}

export interface LoreExtractionResult {
  hasUpdates: boolean;
  updates: LoreUpdate[];
  summary: string;
}

/**
 * Lore Extraction Service
 * Analyzes accepted content and extracts relevant lore information
 */
class LoreExtractionService {
  /**
   * Analyze content and extract lore updates
   */
  async extractLoreFromContent(
    acceptedContent: string,
    currentLore?: SeriesLore
  ): Promise<LoreExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(acceptedContent, currentLore);

      const response = await aiService.generateContent(prompt, {
        lore: currentLore,
        selectedText: acceptedContent,
      });

      // Parse the JSON response
      const result = this.parseExtractionResponse(response);
      return result;
    } catch (error) {
      console.error('Lore extraction error:', error);
      return {
        hasUpdates: false,
        updates: [],
        summary: 'Failed to extract lore updates',
      };
    }
  }

  /**
   * Apply lore updates to the lore document
   */
  async applyLoreUpdates(
    currentLore: SeriesLore,
    updates: LoreUpdate[]
  ): Promise<string> {
    if (updates.length === 0) {
      return currentLore.content;
    }

    try {
      const prompt = this.buildUpdatePrompt(currentLore.content, updates);

      const updatedLoreContent = await aiService.generateContent(prompt, {
        lore: currentLore,
      });

      // Convert markdown/text to HTML if needed
      const formattedContent = this.formatLoreToHTML(updatedLoreContent);

      return formattedContent;
    } catch (error) {
      console.error('Lore update error:', error);
      return currentLore.content;
    }
  }

  /**
   * Convert lore document text/markdown to HTML
   */
  private formatLoreToHTML(text: string): string {
    // Split by double line breaks to identify paragraphs
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // Empty line - close any open lists
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      // Headers (markdown style)
      if (line.startsWith('###')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h3>${line.replace(/^###\s*/, '')}</h3>`;
      } else if (line.startsWith('##')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h2>${line.replace(/^##\s*/, '')}</h2>`;
      } else if (line.startsWith('#')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h1>${line.replace(/^#\s*/, '')}</h1>`;
      }
      // Bullet points
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${line.replace(/^[-*]\s*/, '')}</li>`;
      }
      // Horizontal rules
      else if (line === '---' || line === '***') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<hr>';
      }
      // Regular paragraphs
      else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        // Handle bold **text**
        const withBold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html += `<p>${withBold}</p>`;
      }
    }

    // Close any remaining open lists
    if (inList) {
      html += '</ul>';
    }

    return html;
  }

  /**
   * Build the extraction prompt
   */
  private buildExtractionPrompt(content: string, currentLore?: SeriesLore): string {
    return `You are analyzing newly written story content to extract lore information.

TASK: Identify any new or important information that should be added to the series lore document.

CURRENT LORE DOCUMENT:
${currentLore?.content || 'No existing lore document'}

NEW CONTENT TO ANALYZE:
${content}

LORE CATEGORIES TO CONSIDER:
1. Characters - New characters, character development, relationships
2. Worldbuilding - Geography, politics, history, culture, magic/technology
3. Locations - New places, significant details about locations
4. Plot Continuity - Key events, foreshadowing, plot developments
5. Themes & Symbolism - Recurring themes, symbols, motifs
6. Terminology - New terms, concepts, in-world vocabulary

INSTRUCTIONS:
- Only extract SIGNIFICANT information worth tracking
- Ignore minor details or temporary elements
- Focus on facts that ensure consistency across the series
- Prioritize information that could cause continuity errors if forgotten

RETURN FORMAT (valid JSON):
{
  "hasUpdates": true/false,
  "updates": [
    {
      "section": "Characters" or "Worldbuilding" or "Locations" or "Plot Continuity" or "Themes & Symbolism" or "Terminology",
      "subsection": "Geography" or "Magic System" or specific category (optional),
      "content": "Bullet point of the specific information to add",
      "priority": "high" or "medium" or "low",
      "rationale": "Brief explanation of why this is important"
    }
  ],
  "summary": "Brief summary of what was extracted"
}

If there are no significant updates, return:
{
  "hasUpdates": false,
  "updates": [],
  "summary": "No significant lore updates found"
}`;
  }

  /**
   * Build the update application prompt
   */
  private buildUpdatePrompt(currentLore: string, updates: LoreUpdate[]): string {
    const updatesList = updates
      .map(
        (u, i) =>
          `${i + 1}. [${u.section}${u.subsection ? ` > ${u.subsection}` : ''}] ${u.content}`
      )
      .join('\n');

    return `You are updating a series lore document with new information.

CURRENT LORE DOCUMENT:
${currentLore}

NEW UPDATES TO ADD:
${updatesList}

INSTRUCTIONS:
1. Find the appropriate section for each update
2. Add updates as bullet points under the correct heading/subheading
3. If a section doesn't exist, create it following this structure:

📚 LORE DOCUMENT STRUCTURE:

## 🧭 1. Overview
- Series Title
- Author Name
- Genre / Subgenre
- Target Audience
- Brief Summary

## 🌍 2. Worldbuilding

### Geography
- Continents / Countries / Regions
- Cities, Towns, Landmarks

### Environment & Climate
- Weather patterns
- Ecosystems / Flora / Fauna

### Politics & Power
- Nations / Kingdoms / Governments
- Factions / Organizations

### History & Timeline
- Major historical events
- Timeline of key moments

### Magic / Technology System
- Rules and limitations
- Key artifacts or inventions

## 🧙 3. Characters

### [Character Name]
- **Full Name:**
- **Age:**
- **Description:**
- **Personality:**
- **Role:**
- **Relationships:**
- **Background:**
- **Motivations:**
- **Character Arc:**

## 🏠 4. Cultures & Societies
- Languages / dialects
- Religion / belief systems
- Customs / traditions
- Social structure

## 📖 5. Plot Continuity

### Main Story Arcs
- Series arc summary
- Book-by-book outline

### Key Events Tracker
- Major events timeline
- Foreshadowing references

### Continuity Notes
- Character states (alive/dead)
- World changes
- Important items/locations

## 🗂 6. Locations Database

### [Location Name]
- **Description:**
- **Key Events:**
- **Inhabitants:**
- **Related Characters:**

## 🧠 7. Themes & Symbolism
- Core themes
- Recurring symbols
- Motifs and patterns

## 🗣 8. Quotes & Terminology
- Important quotes
- Glossary of terms
- In-world vocabulary

## 📔 9. References & Meta Notes
- Inspirations
- Writing style notes
- Consistency warnings

4. Maintain existing structure and formatting
5. Don't duplicate information that's already there
6. Keep it organized with clear bullet points
7. Use emojis for section headers as shown above

RETURN the complete updated lore document with all new information integrated.`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseExtractionResponse(response: string): LoreExtractionResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        hasUpdates: parsed.hasUpdates || false,
        updates: parsed.updates || [],
        summary: parsed.summary || 'Lore extraction completed',
      };
    } catch (error) {
      console.error('Failed to parse lore extraction response:', error);
      return {
        hasUpdates: false,
        updates: [],
        summary: 'Failed to parse extraction results',
      };
    }
  }

  /**
   * Generate initial lore document template
   */
  generateLoreTemplate(
    seriesTitle?: string,
    authorName?: string,
    genre?: string
  ): string {
    return `# 📚 ${seriesTitle || 'Series'} - Lore Document

## 🧭 1. Overview

- **Series Title:** ${seriesTitle || '[To be filled]'}
- **Author Name:** ${authorName || '[To be filled]'}
- **Genre / Subgenre:** ${genre || '[To be filled]'}
- **Target Audience:** [To be filled]
- **Brief Summary:** [One paragraph summary of the world and main story arc]

---

## 🌍 2. Worldbuilding

### Geography
- [Add continents, countries, regions]
- [Add cities, towns, landmarks]

### Environment & Climate
- [Add weather patterns]
- [Add ecosystems, flora, fauna]
- [Add natural resources]

### Politics & Power
- [Add nations, kingdoms, governments]
- [Add political systems]
- [Add factions, guilds, organizations]
- [Add key historical conflicts]

### History & Timeline
- [Add major historical events]
- [Add founding myths or origin stories]
- [Add timeline of world-changing moments]

### Magic / Technology System
- [Add rules or limitations]
- [Add key artifacts, spells, or inventions]
- [Add energy sources or scientific principles]

---

## 🧙 3. Characters

_Character entries will be added as they appear in the story_

---

## 🏠 4. Cultures & Societies

- **Languages / Dialects:** [To be filled]
- **Religion / Belief Systems:** [To be filled]
- **Customs / Traditions:** [To be filled]
- **Art / Music / Fashion:** [To be filled]
- **Social Structure:** [To be filled]

---

## 📖 5. Plot Continuity

### Main Story Arcs
- [Series arc summary]
- [Book-by-book plot outline]

### Key Events Tracker
- [Major events across timeline]
- [Foreshadowing references]

### Continuity Notes
- [Character states - alive/dead]
- [World changes]
- [Items or locations status]

---

## 🗂 6. Locations Database

_Location entries will be added as they appear in the story_

---

## 🧠 7. Themes & Symbolism

- **Core Themes:** [To be filled]
- **Symbols / Motifs:** [To be filled]
- **Tone / Mood:** [To be filled]
- **Recurring Imagery:** [To be filled]

---

## 🗣 8. Quotes & Terminology

### Important Quotes
- [To be filled]

### Glossary
- [To be filled]

### Measurement Systems / Currency
- [To be filled]

---

## 📔 9. References & Meta Notes

- **Inspirations:** [Historical, literary, personal]
- **Writing Style Notes:** [To be filled]
- **Consistency Warnings:** [To be filled]
- **Future Ideas:** [Open threads for future books]

---

## 🧩 10. AI Context Notes

_Auto-generated summary for AI reference_

- **Last Updated:** ${new Date().toLocaleDateString()}
- **Version:** 1.0
- **Character Count:** 0
- **Location Count:** 0
`;
  }
}

// Export singleton instance
export const loreExtractionService = new LoreExtractionService();
