/**
 * Beacon AI - Background Service Worker (Manifest V3)
 * Handles extension lifecycle, storage settings, direct AI REST APIs, and server messaging.
 */
import { buildPrompt, SYSTEM_INSTRUCTION } from './src/prompts.js';

const DEFAULT_SETTINGS = {
  connectionMode: 'direct', // 'direct' (Browser -> AI API) | 'server' (Node.js backend)
  provider: 'gemini',       // 'gemini' | 'openai'
  geminiApiKey: '',
  openaiApiKey: '',
  backendUrl: 'http://localhost:3001',
  preferredLanguage: 'python',
  model: 'gemini-2.5-flash'
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['beaconSettings'], (result) => {
    if (!result.beaconSettings) {
      chrome.storage.local.set({ beaconSettings: DEFAULT_SETTINGS }, () => {
        console.log('[Beacon AI] Default settings initialized.');
      });
    } else {
      // Merge defaults with existing settings
      chrome.storage.local.set({
        beaconSettings: { ...DEFAULT_SETTINGS, ...result.beaconSettings }
      });
    }
  });
  console.log('🟢 Beacon AI Extension service worker active!');
});

// Helper to get active settings
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['beaconSettings'], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result.beaconSettings || {}) });
    });
  });
}

// ----------------------------------------------------------------------------
// Direct Google Gemini API Implementation
// ----------------------------------------------------------------------------

async function callGeminiDirect({ apiKey, model, systemInstruction, prompt, temperature = 0.4, signal }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key is missing. Please configure your key in Beacon AI Settings (Alt+B).');
  }

  const activeModel = model || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: systemInstruction
            ? `${systemInstruction}\n\n---\n\n${prompt}`
            : prompt
        }
      ]
    }
  ];

  const payload = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 4096
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || `HTTP ${res.status}`;
    if (errorMsg.includes('API_KEY_INVALID') || res.status === 400 || res.status === 403) {
      throw new Error(`Invalid Gemini API Key (${errorMsg}). Please check your key in Settings.`);
    }
    throw new Error(`Gemini API Error: ${errorMsg}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return {
    success: true,
    text,
    modelUsed: activeModel,
    finishReason: data.candidates?.[0]?.finishReason || 'STOP'
  };
}

async function callGeminiChatDirect({ apiKey, model, systemInstruction, message, history = [], temperature = 0.4, signal }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key is missing. Please configure your key in Beacon AI Settings (Alt+B).');
  }

  const activeModel = model || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const contents = [];

  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: `Instructions: ${systemInstruction}` }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I am Beacon AI and will adhere to these developer companion instructions.' }]
    });
  }

  if (Array.isArray(history) && history.length > 0) {
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || '' }]
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 4096
      }
    }),
    signal
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return {
    success: true,
    text,
    modelUsed: activeModel,
    finishReason: data.candidates?.[0]?.finishReason || 'STOP'
  };
}

// ----------------------------------------------------------------------------
// Direct OpenAI API Implementation
// ----------------------------------------------------------------------------

async function callOpenAIDirect({ apiKey, model, systemInstruction, prompt, history = [], temperature = 0.4, signal }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenAI API key is missing. Please configure your key in Beacon AI Settings (Alt+B).');
  }

  const activeModel = model || 'gpt-4o-mini';
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  if (Array.isArray(history) && history.length > 0) {
    for (const h of history) {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content || ''
      });
    }
  }

  messages.push({ role: 'user', content: prompt });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: activeModel,
      messages,
      temperature
    }),
    signal
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || `HTTP ${res.status}`;
    if (res.status === 401) {
      throw new Error('Invalid OpenAI API Key. Please verify your API key in Settings.');
    }
    if (res.status === 429) {
      throw new Error('OpenAI quota exceeded or rate limit hit. Check your OpenAI billing / usage.');
    }
    throw new Error(`OpenAI API Error: ${errorMsg}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI returned an empty response.');
  }

  return {
    success: true,
    text,
    modelUsed: data.model || activeModel,
    finishReason: data.choices?.[0]?.finish_reason || 'stop'
  };
}

// ----------------------------------------------------------------------------
// Message Dispatcher
// ----------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.type) return false;

  switch (request.type) {
    case 'CHECK_BACKEND': {
      getSettings().then(async (settings) => {
        const mode = settings.connectionMode || 'direct';
        const provider = settings.provider || 'gemini';
        const activeKey = provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;

        if (mode === 'direct') {
          if (activeKey && activeKey.trim().length > 0) {
            sendResponse({ success: true, data: { configured: true, mode: 'direct', provider } });
          } else {
            sendResponse({ success: true, data: { configured: false, mode: 'direct', provider } });
          }
          return;
        }

        // Server mode check
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`${settings.backendUrl || 'http://localhost:3001'}/api/health`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            sendResponse({ success: false, error: `Backend responded with HTTP ${res.status}` });
            return;
          }
          const data = await res.json();
          sendResponse({ success: true, data: { ...data, mode: 'server' } });
        } catch (err) {
          sendResponse({
            success: false,
            error: err.name === 'AbortError' ? 'Connection timed out' : 'Backend offline or unreachable'
          });
        }
      });
      return true;
    }

    case 'TEST_CONNECTION': {
      const s = request.settings || {};
      const mode = s.connectionMode || 'direct';
      const provider = s.provider || 'gemini';

      if (mode === 'direct') {
        const key = provider === 'openai' ? s.openaiApiKey : s.geminiApiKey;
        if (!key || !key.trim()) {
          sendResponse({ success: false, error: `No ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key entered.` });
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const testCall = provider === 'openai'
          ? callOpenAIDirect({
              apiKey: key,
              model: s.model || 'gpt-4o-mini',
              systemInstruction: 'Respond only with OK.',
              prompt: 'ping',
              temperature: 0,
              signal: controller.signal
            })
          : callGeminiDirect({
              apiKey: key,
              model: s.model || 'gemini-2.5-flash',
              systemInstruction: 'Respond only with OK.',
              prompt: 'ping',
              temperature: 0,
              signal: controller.signal
            });

        testCall
          .then(() => {
            clearTimeout(timeoutId);
            sendResponse({ success: true });
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            sendResponse({ success: false, error: err.message });
          });
        return true;
      }

      // Server mode test
      fetch(`${s.backendUrl || 'http://localhost:3001'}/api/health`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          sendResponse({ success: false, error: `Backend unreachable: ${err.message}` });
        });
      return true;
    }

    case 'EXECUTE_ACTION': {
      getSettings().then(async (settings) => {
        const mode = settings.connectionMode || 'direct';
        const provider = settings.provider || 'gemini';
        const activeKey = provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;

        // DIRECT BROWSER MODE
        if (mode === 'direct') {
          if (!activeKey || !activeKey.trim()) {
            sendResponse({
              success: false,
              error: `No ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key found. Please open Settings (Alt+B) and add your API key.`
            });
            return;
          }

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const sanitizedContext = {
              ...request.context,
              body: typeof request.context?.body === 'string' ? request.context.body.slice(0, 15000) : '',
              description: typeof request.context?.description === 'string' ? request.context.description.slice(0, 15000) : '',
              diffSummary: typeof request.context?.diffSummary === 'string' ? request.context.diffSummary.slice(0, 15000) : '',
              userCode: typeof request.context?.userCode === 'string' ? request.context.userCode.slice(0, 10000) : ''
            };

            const { prompt, systemInstruction } = buildPrompt(request.action, {
              context: sanitizedContext,
              options: request.options || {}
            });

            const activeModel = request.options?.model || settings.model || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash');

            let result;
            if (provider === 'openai') {
              result = await callOpenAIDirect({
                apiKey: activeKey,
                model: activeModel,
                systemInstruction,
                prompt,
                temperature: request.options?.temperature ?? 0.4,
                signal: controller.signal
              });
            } else {
              result = await callGeminiDirect({
                apiKey: activeKey,
                model: activeModel,
                systemInstruction,
                prompt,
                temperature: request.options?.temperature ?? 0.4,
                signal: controller.signal
              });
            }

            clearTimeout(timeoutId);
            sendResponse(result);
          } catch (err) {
            sendResponse({
              success: false,
              error: err.name === 'AbortError' ? 'Request timed out' : err.message
            });
          }
          return;
        }

        // SERVER RELAY MODE
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          const res = await fetch(`${settings.backendUrl || 'http://localhost:3001'}/api/action`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': activeKey || '',
              'x-api-provider': provider
            },
            body: JSON.stringify({
              action: request.action,
              context: request.context,
              options: request.options
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const data = await res.json();
          sendResponse(data);
        } catch (err) {
          sendResponse({
            success: false,
            error: err.name === 'AbortError' ? 'Request timed out' : `Connection failed: ${err.message}`
          });
        }
      });
      return true;
    }

    case 'SEND_CHAT': {
      getSettings().then(async (settings) => {
        const mode = settings.connectionMode || 'direct';
        const provider = settings.provider || 'gemini';
        const activeKey = provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;

        // DIRECT BROWSER MODE
        if (mode === 'direct') {
          if (!activeKey || !activeKey.trim()) {
            sendResponse({
              success: false,
              error: `No ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key found. Please open Settings (Alt+B) and add your API key.`
            });
            return;
          }

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const activeModel = request.options?.model || settings.model || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash');

            let result;
            if (provider === 'openai') {
              const { prompt, systemInstruction } = buildPrompt('chat', {
                context: request.context,
                userMessage: request.message,
                history: request.history,
                options: request.options
              });

              result = await callOpenAIDirect({
                apiKey: activeKey,
                model: activeModel,
                systemInstruction,
                prompt,
                history: request.history,
                temperature: 0.4,
                signal: controller.signal
              });
            } else {
              result = await callGeminiChatDirect({
                apiKey: activeKey,
                model: activeModel,
                systemInstruction: SYSTEM_INSTRUCTION,
                message: request.message,
                history: request.history,
                temperature: 0.4,
                signal: controller.signal
              });
            }

            clearTimeout(timeoutId);
            sendResponse(result);
          } catch (err) {
            sendResponse({
              success: false,
              error: err.name === 'AbortError' ? 'Request timed out' : err.message
            });
          }
          return;
        }

        // SERVER RELAY MODE
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          const res = await fetch(`${settings.backendUrl || 'http://localhost:3001'}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': activeKey || '',
              'x-api-provider': provider
            },
            body: JSON.stringify({
              message: request.message,
              context: request.context,
              options: request.options,
              history: request.history
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const data = await res.json();
          sendResponse(data);
        } catch (err) {
          sendResponse({
            success: false,
            error: err.name === 'AbortError' ? 'Request timed out' : `Connection failed: ${err.message}`
          });
        }
      });
      return true;
    }

    case 'GET_SETTINGS': {
      getSettings().then((settings) => {
        sendResponse({ success: true, settings });
      });
      return true;
    }

    case 'SAVE_SETTINGS': {
      chrome.storage.local.set({ beaconSettings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
    }

    case 'UPDATE_BADGE': {
      if (request.text !== undefined && chrome.action?.setBadgeText) {
        chrome.action.setBadgeText({ text: request.text });
        if (request.color) {
          chrome.action.setBadgeBackgroundColor({ color: request.color });
        }
      }
      sendResponse({ success: true });
      return true;
    }

    default:
      return false;
  }
});
