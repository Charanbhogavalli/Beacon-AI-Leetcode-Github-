/**
 * Beacon AI - Background Service Worker (Manifest V3)
 * Handles extension lifecycle, storage settings, and secure messaging with the local AI backend.
 */

const DEFAULT_SETTINGS = {
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
    }
  });
  console.log('🟢 Beacon AI Extension service worker active!');
});

// Helper to get active backend URL
async function getBackendUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['beaconSettings'], (result) => {
      resolve(result.beaconSettings?.backendUrl || DEFAULT_SETTINGS.backendUrl);
    });
  });
}

// Handle messages from content scripts and UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.type) return false;

  switch (request.type) {
    case 'CHECK_BACKEND': {
      getBackendUrl().then(async (backendUrl) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`${backendUrl}/api/health`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            sendResponse({ success: false, error: `Backend responded with HTTP ${res.status}` });
            return;
          }
          const data = await res.json();
          sendResponse({ success: true, data });
        } catch (err) {
          sendResponse({
            success: false,
            error: err.name === 'AbortError' ? 'Connection timed out' : 'Backend offline or unreachable'
          });
        }
      });
      return true; // Keep channel open for async response
    }

    case 'EXECUTE_ACTION': {
      getBackendUrl().then(async (backendUrl) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for deep AI generation
          const res = await fetch(`${backendUrl}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
      getBackendUrl().then(async (backendUrl) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          const res = await fetch(`${backendUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
      chrome.storage.local.get(['beaconSettings'], (result) => {
        sendResponse({ success: true, settings: result.beaconSettings || DEFAULT_SETTINGS });
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
