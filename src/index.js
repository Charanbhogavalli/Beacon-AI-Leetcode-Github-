/**
 * Beacon AI - Main Content Script Entrypoint
 * Orchestrates DOM extraction, Shadow DOM UI, SPA navigation, and extension messaging.
 */
import { isGitHub, extractGitHubContext } from './extractors/github.js';
import { isLeetCode, extractLeetCodeContext } from './extractors/leetcode.js';
import { BeaconUI } from './ui/components.js';

let uiInstance = null;
let lastUrl = window.location.href;

function initBeacon() {
  // Prevent duplicate mounts
  if (document.getElementById('beacon-ai-root')) {
    return;
  }

  // Create host element for Shadow DOM isolation
  const host = document.createElement('div');
  host.id = 'beacon-ai-root';
  document.body.appendChild(host);

  // Instantiate UI with messaging hooks
  uiInstance = new BeaconUI({
    onAction: handleAction,
    onChat: handleChat,
    onSaveSettings: handleSaveSettings,
    onCheckHealth: checkBackendHealth
  });

  uiInstance.mount(host);

  // Load saved settings
  loadSettings();

  // Initial context extraction with brief delay for dynamic SPAs (LeetCode Next.js / Monaco)
  setTimeout(() => {
    refreshContext();
    checkBackendHealth();
  }, 500);

  // Setup SPA navigation observers
  setupNavigationWatchers();

  console.log('🟢 Beacon AI successfully mounted with Shadow DOM isolation!');
}

/**
 * Extracts page context from active platform
 */
function refreshContext() {
  if (!uiInstance) return;

  let context = null;
  if (isGitHub()) {
    context = extractGitHubContext();
  } else if (isLeetCode()) {
    context = extractLeetCodeContext();
  }

  if (context) {
    uiInstance.setContext(context);
  }
}

/**
 * Checks backend health via service worker message passing
 */
function checkBackendHealth() {
  if (!uiInstance) return;
  uiInstance.setBackendStatus('connecting');

  chrome.runtime.sendMessage({ type: 'CHECK_BACKEND' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[Beacon AI] Runtime message error:', chrome.runtime.lastError.message);
      uiInstance.setBackendStatus('offline');
      return;
    }

    if (response?.success && response.data) {
      if (response.data.configured) {
        uiInstance.setBackendStatus('online');
      } else {
        uiInstance.setBackendStatus('unconfigured');
      }
    } else {
      uiInstance.setBackendStatus('offline');
    }
  });
}

/**
 * Handles executing an action via backend
 */
function handleAction(action, context, options, callback) {
  chrome.runtime.sendMessage(
    {
      type: 'EXECUTE_ACTION',
      action,
      context,
      options
    },
    (response) => {
      if (chrome.runtime.lastError) {
        callback(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response?.success) {
        callback(null, response);
      } else {
        callback(new Error(response?.error || 'Action failed'));
      }
    }
  );
}

/**
 * Handles conversational chat message
 */
function handleChat(message, context, settings, history, callback) {
  chrome.runtime.sendMessage(
    {
      type: 'SEND_CHAT',
      message,
      context,
      options: {
        language: settings.preferredLanguage,
        model: settings.model
      },
      history
    },
    (response) => {
      if (chrome.runtime.lastError) {
        callback(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response?.success) {
        callback(null, response);
      } else {
        callback(new Error(response?.error || 'Chat request failed'));
      }
    }
  );
}

/**
 * Load settings from storage
 */
function loadSettings() {
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
    if (res?.success && res.settings) {
      uiInstance?.setSettings(res.settings);
    }
  });
}

/**
 * Save settings to storage
 */
function handleSaveSettings(settings) {
  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, () => {
    checkBackendHealth();
  });
}

/**
 * Sets up mutation and navigation watchers for GitHub Turbo and LeetCode Next.js SPAs
 */
function setupNavigationWatchers() {
  // 1. GitHub Turbo / PJAX events
  document.addEventListener('turbo:render', () => {
    setTimeout(refreshContext, 300);
  });
  document.addEventListener('pjax:end', () => {
    setTimeout(refreshContext, 300);
  });

  // 2. Browser history popstate
  window.addEventListener('popstate', () => {
    setTimeout(refreshContext, 300);
  });

  // 3. Intercept history pushState & replaceState
  const wrapHistory = (type) => {
    const orig = history[type];
    return function (...args) {
      const res = orig.apply(this, args);
      window.dispatchEvent(new Event('beacon:locationchange'));
      return res;
    };
  };
  history.pushState = wrapHistory('pushState');
  history.replaceState = wrapHistory('replaceState');

  window.addEventListener('beacon:locationchange', () => {
    setTimeout(refreshContext, 400);
  });

  // 4. Polling safeguard for dynamic tab/subview switches without URL reload
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      refreshContext();
    }
  }, 1000);
}

// Auto-boot when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBeacon);
} else {
  initBeacon();
}
