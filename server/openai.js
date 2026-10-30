import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Supported OpenAI models
export const SUPPORTED_OPENAI_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4-turbo',
  'o1-mini',
  'o3-mini'
];

let openaiClient = null;

/**
 * Returns or initializes the OpenAI client
 */
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey.trim() === '') {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: apiKey.trim() });
  }

  return openaiClient;
}

/**
 * Checks if the OpenAI API key is configured
 */
export function isOpenAIConfigured() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'your_openai_api_key_here');
}

/**
 * Formats user-friendly, secure error messages from OpenAI API
 */
export function formatOpenAIError(error) {
  const message = error?.message || String(error);

  if (message.includes('401') || message.includes('Incorrect API key') || message.includes('invalid_api_key')) {
    return 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in the server .env file.';
  }
  if (message.includes('429') || message.includes('insufficient_quota') || message.includes('quota') || message.includes('rate_limit')) {
    return 'OpenAI rate limit or quota exceeded. Check your OpenAI account balance and limits at platform.openai.com.';
  }
  if (message.includes('model_not_found') || message.includes('The model does not exist')) {
    return 'The requested OpenAI model was not found or your account does not have access to it.';
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) {
    return 'Request to OpenAI timed out. Please try again.';
  }

  return `OpenAI generation error: ${message.slice(0, 150)}`;
}

/**
 * Executes content generation via OpenAI Chat Completions API
 */
export async function generateWithOpenAI({
  prompt,
  systemInstruction,
  preferredModel,
  temperature = 0.4,
  maxOutputTokens = 4096
}) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OPENAI_API_KEY is not configured on the Beacon AI server. Please add your key to server/.env.');
  }

  // Model fallback / selection
  let model = preferredModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  // If a Gemini model name was passed in options, fallback to default OpenAI model
  if (!SUPPORTED_OPENAI_MODELS.includes(model)) {
    model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const isReasoningModel = model.startsWith('o1') || model.startsWith('o3');

    const params = {
      model,
      messages
    };

    if (!isReasoningModel) {
      params.temperature = temperature;
      params.max_tokens = maxOutputTokens;
    }

    const response = await client.chat.completions.create(params);
    const choice = response.choices?.[0];
    const text = choice?.message?.content;

    if (!text || typeof text !== 'string') {
      throw new Error('Received empty response from OpenAI model.');
    }

    return {
      text: text.trim(),
      modelUsed: response.model || model,
      finishReason: choice?.finish_reason || 'stop'
    };
  } catch (err) {
    throw new Error(formatOpenAIError(err));
  }
}
