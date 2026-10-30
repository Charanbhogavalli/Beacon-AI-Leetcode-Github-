import dotenv from 'dotenv';
import { generateWithFallback, isConfigured as isGeminiConfigured, SUPPORTED_MODELS as GEMINI_MODELS } from './gemini.js';
import { generateWithOpenAI, isOpenAIConfigured, SUPPORTED_OPENAI_MODELS } from './openai.js';

dotenv.config();

/**
 * Determines which AI provider is currently active ('openai' or 'gemini')
 */
export function getActiveProvider() {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicitProvider === 'openai') return 'openai';
  if (explicitProvider === 'gemini') return 'gemini';

  // Auto-detection: prioritize OpenAI if configured, else Gemini
  if (isOpenAIConfigured()) {
    return 'openai';
  }
  return 'gemini';
}

/**
 * Checks if the specified or active provider has valid credentials
 */
export function isConfigured(provider = getActiveProvider()) {
  return provider === 'openai' ? isOpenAIConfigured() : isGeminiConfigured();
}

/**
 * Returns supported models for the given provider
 */
export function getSupportedModels(provider = getActiveProvider()) {
  return provider === 'openai' ? SUPPORTED_OPENAI_MODELS : GEMINI_MODELS;
}

/**
 * Returns default model for the given provider
 */
export function getDefaultModel(provider = getActiveProvider()) {
  if (provider === 'openai') {
    return process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Unified generation entry point routing to the active provider
 */
export async function generateContent({
  prompt,
  systemInstruction,
  preferredModel,
  temperature = 0.4,
  maxOutputTokens = 4096,
  provider = getActiveProvider()
}) {
  if (provider === 'openai') {
    return generateWithOpenAI({
      prompt,
      systemInstruction,
      preferredModel,
      temperature,
      maxOutputTokens
    });
  }

  return generateWithFallback({
    prompt,
    systemInstruction,
    preferredModel,
    temperature,
    maxOutputTokens
  });
}
