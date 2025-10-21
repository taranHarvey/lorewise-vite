# AI Integration Setup Guide

## Overview
Your Lorewise app now has comprehensive AI integration powered by OpenAI's GPT-4, specifically designed for novel writing with lore-aware features.

## Features Implemented

### 🤖 **AI Service Architecture**
- **Custom OpenAI Integration** - Full control over AI interactions
- **Lore-Aware Context** - AI references your series bible/lore
- **Text Selection Support** - Highlight text for AI analysis
- **Novel-Specific Commands** - Character development, plot suggestions, consistency checks

### 📝 **Text Selection & Highlighting**
- Select text in the editor to get AI suggestions
- Automatic text improvement suggestions
- Consistency checking against your lore
- Inline suggestions with reasoning

### 💬 **Enhanced AI Chat**
- Context-aware conversations
- Special commands: `/character`, `/plot`, `/consistency`
- Lore integration for consistent storytelling
- Real-time suggestions and feedback

### 🎯 **Novel-Specific AI Commands**
- `/character [name]` - Character development suggestions
- `/plot` - Plot development ideas based on current story
- `/consistency` - Check text against series lore

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Set Environment Variables
Create a `.env` file in your project root:

```bash
# OpenAI API Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Install Dependencies (if needed)
The AI integration uses only standard React and fetch APIs, so no additional dependencies are required.

## Usage Examples

### Text Selection
1. Select text in your editor
2. AI automatically suggests improvements
3. Click to apply suggestions

### AI Chat Commands
```
/character Sarah - Get character development ideas for Sarah
/plot - Generate plot ideas based on current story
/consistency - Check selected text against lore
```

### Lore Integration
The AI automatically includes your series lore in all suggestions, ensuring consistency across your books.

## File Structure

```
src/
├── services/
│   └── aiService.ts          # Core AI service
├── hooks/
│   └── useAI.ts             # React hook for AI interactions
└── components/AI/
    ├── AIChat.tsx           # Enhanced AI chat component
    └── TextSelection.tsx    # Text selection and suggestions
```

## Integration with Existing Editor

To integrate with your existing TiptapEditor:

1. **Replace AI Chat**: Use the new `AIChat` component
2. **Add Text Selection**: Integrate `TextSelection` component
3. **Pass Lore Context**: Provide series lore to AI components

## Cost Considerations

- **GPT-4 Turbo**: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- **Typical Usage**: 1-5 cents per interaction
- **Monthly Estimate**: $10-50 for active writers

## Security Notes

- API key is stored in environment variables
- No sensitive data is sent to OpenAI beyond your writing content
- All interactions are logged for debugging (remove in production)

## Next Steps

1. Set up your OpenAI API key
2. Test the AI integration
3. Customize prompts for your writing style
4. Add more novel-specific features as needed

## Troubleshooting

### Common Issues
- **API Key Error**: Check your `.env` file and restart the dev server
- **Rate Limits**: OpenAI has rate limits, add delays if needed
- **Context Too Long**: The AI automatically manages context length

### Debug Mode
Set `VITE_DEBUG_AI=true` in your `.env` file for detailed logging.
