# GPT-5 Model Names Configuration

## Current Configuration

The system is now configured to use GPT-5 models directly. The model names are set in `src/services/modelSelectionService.ts`:

```typescript
export const MODEL_API_NAMES: Record<ModelName, string> = {
  'gpt-5.1': 'gpt-5.1',           // GPT-5.1 premium model
  'gpt-5-mini': 'gpt-5-mini',     // GPT-5 Mini standard model
  'gpt-5-nano': 'gpt-5-nano',     // GPT-5 Nano lightweight model
};
```

## Verifying Model Names

If you encounter 400 Bad Request errors, the model names might be slightly different. Check the OpenAI API documentation for the exact model names:

1. Go to https://platform.openai.com/docs/models
2. Look for GPT-5 model names
3. Common variations might be:
   - `gpt-5o` instead of `gpt-5.1`
   - `gpt-5o-mini` instead of `gpt-5-mini`
   - `gpt-5o-nano` instead of `gpt-5-nano`
   - Or just `gpt-5`, `gpt-5-mini`, `gpt-5-nano`

## How to Update

If the model names are different, update `MODEL_API_NAMES` in `src/services/modelSelectionService.ts`:

```typescript
export const MODEL_API_NAMES: Record<ModelName, string> = {
  'gpt-5.1': 'actual-gpt-5-model-name',     // Update with actual name
  'gpt-5-mini': 'actual-gpt-5-mini-name',    // Update with actual name
  'gpt-5-nano': 'actual-gpt-5-nano-name',   // Update with actual name
};
```

## Testing

After updating, test an AI request. If you still get 400 errors, check:
1. Your OpenAI API key has access to GPT-5 models
2. The exact model names in OpenAI's documentation
3. Browser console for the exact error message

## Pricing

Update `MODEL_COSTS` in the same file with actual GPT-5 pricing from OpenAI's pricing page:
https://openai.com/api/pricing/

