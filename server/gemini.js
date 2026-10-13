import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Supported model priority list
export const SUPPORTED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

let aiClient = null;

/**
 * Returns or initializes the Google GenAI client
 */
export function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
}

/**
 * Checks if the API key is configured
 */
export function isConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'your_gemini_api_key_here');
}

/**
 * Formats user-friendly, secure error messages from Gemini API
 */
export function formatGeminiError(error) {
  const message = error?.message || String(error);

  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    return 'Invalid Gemini API key. Please check your GEMINI_API_KEY in the server .env file.';
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota') || message.includes('429')) {
    return 'Gemini API rate limit or quota exceeded. Please wait a moment before trying again.';
  }
  if (message.includes('PERMISSION_DENIED')) {
    return 'Permission denied for this Gemini model. Check that your API key has appropriate permissions.';
  }
  if (message.includes('NOT_FOUND') || message.includes('404')) {
    return 'The requested Gemini model was not found or is not available in your region.';
  }
  if (message.includes('DEADLINE_EXCEEDED') || message.includes('timeout')) {
    return 'Request to Gemini timed out. Please try again.';
  }

  // Safe fallback without leaking internals
  return `Gemini generation error: ${message.slice(0, 150)}`;
}

/**
 * Executes content generation with automatic model fallback
 */
export async function generateWithFallback({
  prompt,
  systemInstruction,
  preferredModel,
  temperature = 0.4,
  maxOutputTokens = 4096
}) {
  const client = getGenAIClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the Beacon AI server. Please add your key to server/.env.');
  }

  // Determine model fallback cascade
  const targetModels = preferredModel
    ? [preferredModel, ...SUPPORTED_MODELS.filter(m => m !== preferredModel)]
    : [...SUPPORTED_MODELS];

  let lastError = null;

  for (const model of targetModels) {
    try {
      const config = {
        temperature,
        maxOutputTokens
      };

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config
      });

      const text = response?.text;
      if (!text || typeof text !== 'string') {
        throw new Error('Received empty response from model.');
      }

      return {
        text: text.trim(),
        modelUsed: model,
        finishReason: response?.candidates?.[0]?.finishReason || 'STOP'
      };
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || '';
      console.warn(`[Beacon Server] Model '${model}' failed: ${errMsg.slice(0, 100)}. Checking fallback...`);

      // If it's a quota or auth error, trying other models likely won't help
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        break;
      }
    }
  }

  throw new Error(formatGeminiError(lastError));
}
