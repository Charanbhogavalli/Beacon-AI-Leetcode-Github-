/**
 * UI Components and State Manager for Beacon AI Shadow DOM
 */
import { SHADOW_STYLES } from './styles.js';
import { renderMarkdown, bindCopyButtons } from './markdown.js';

export class BeaconUI {
  constructor({ onAction, onChat, onSaveSettings, onCheckHealth }) {
    this.onAction = onAction;
    this.onChat = onChat;
    this.onSaveSettings = onSaveSettings;
    this.onCheckHealth = onCheckHealth;

    this.isOpen = false;
    this.activeTab = 'actions'; // 'actions' | 'chat' | 'settings'
    this.isLoading = false;
    this.loadingActionName = '';
    this.context = null;
    this.hintLevel = 1;
    this.actionsExpanded = true; // Auto-collapse when answer is visible so answer is front & center
    this.lastAction = null;
    this.lastActionPayload = null;

    this.responseTitle = '';
    this.responseText = '';
    this.error = null;

    this.chatHistory = [];
    this.backendStatus = 'connecting'; // 'online' | 'offline' | 'unconfigured' | 'connecting'

    this.settings = {
      backendUrl: 'http://localhost:3001',
      preferredLanguage: 'python',
      model: 'gemini-2.5-flash'
    };

    this.container = null;
    this.shadowRoot = null;
  }

  mount(hostElement) {
    this.shadowRoot = hostElement.attachShadow({ mode: 'open' });
    this.container = document.createElement('div');
    this.container.className = 'beacon-app-root';
    this.shadowRoot.appendChild(this.container);

    this.render();
    this.bindGlobalShortcuts();
  }

  setContext(newContext) {
    this.context = newContext;
    // Reset hint level when switching problems
    this.hintLevel = 1;
    this.render();
  }

  setBackendStatus(status) {
    this.backendStatus = status;
    this.updateStatusPill();
  }

  setSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.render();
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    this.render();
  }

  setLoading(isLoading, actionName = '') {
    this.isLoading = isLoading;
    this.loadingActionName = actionName;
    if (isLoading) {
      this.error = null;
      this.actionsExpanded = false; // Collapse action grid to bring answer into view
    }
    this.render();
    if (isLoading) {
      setTimeout(() => {
        const skeleton = this.shadowRoot?.querySelector('.beacon-skeleton-box');
        if (skeleton) {
          skeleton.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }

  setResponse(title, text) {
    this.isLoading = false;
    this.responseTitle = title;
    this.responseText = text;
    this.error = null;
    this.actionsExpanded = false;
    this.render();
    setTimeout(() => {
      // Scroll chat stream or response box
      const stream = this.shadowRoot?.querySelector('.beacon-chat-stream');
      if (stream && stream.lastElementChild) {
        stream.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        const respBox = this.shadowRoot?.querySelector('.beacon-response-box');
        respBox?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  executeAction(action, title) {
    let hintLevelToUse = this.hintLevel;
    if (action === 'leetcode_hint') {
      hintLevelToUse = this.hintLevel;
      this.hintLevel = this.hintLevel >= 3 ? 1 : this.hintLevel + 1;
    }

    const options = {
      language: this.settings.preferredLanguage,
      model: this.settings.model,
      hintLevel: hintLevelToUse
    };

    this.lastAction = action;
    this.lastActionPayload = { title, options };

    // Deliver directly into the scrollable Chat feed as requested by user!
    this.chatHistory.push({ role: 'user', content: title });
    this.activeTab = 'chat';
    this.setLoading(true, title);

    this.onAction(action, this.context, options, (err, res) => {
      if (err) {
        this.chatHistory.push({
          role: 'assistant',
          content: `⚠️ **Action Failed:** ${err.message || String(err)}`
        });
        this.setError(err.message || String(err));
      } else {
        this.chatHistory.push({
          role: 'assistant',
          content: res.text
        });
        this.setResponse(title, res.text);
      }
    });
  }

  setError(errorText) {
    this.isLoading = false;
    this.error = errorText;
    this.render();
  }

  addChatMessage(role, content) {
    this.chatHistory.push({ role, content });
    this.render();
    setTimeout(() => {
      const stream = this.shadowRoot?.querySelector('.beacon-chat-stream');
      if (stream && stream.lastElementChild) {
        stream.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 50);
  }

  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Alt+B toggles sidebar
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        this.toggleSidebar();
      }
      // Esc closes sidebar
      if (e.key === 'Escape' && this.isOpen) {
        this.isOpen = false;
        this.render();
      }
    });
  }

  updateStatusPill() {
    const pill = this.shadowRoot?.querySelector('.beacon-status-indicator');
    if (!pill) return;

    pill.className = `beacon-status-indicator ${this.backendStatus}`;
    const text = pill.querySelector('.status-text');
    if (text) {
      if (this.backendStatus === 'online') text.innerText = 'Gemini Ready';
      else if (this.backendStatus === 'unconfigured') text.innerText = 'Key Missing';
      else if (this.backendStatus === 'connecting') text.innerText = 'Connecting';
      else text.innerText = 'Backend Offline';
    }
  }

  render() {
    if (!this.container) return;

    const ctx = this.context || {};
    const platform = ctx.platform || 'General';
    const isLC = platform === 'leetcode';
    const isGH = platform === 'github';

    // Badge text for launcher
    let badgeText = 'Companion';
    if (isLC && ctx.slug) {
      badgeText = `${ctx.title || ctx.slug} [${ctx.difficulty || 'M'}]`;
    } else if (isGH && ctx.number) {
      badgeText = `${ctx.type === 'pull_request' ? 'PR' : 'Issue'} #${ctx.number}`;
    } else if (isGH && ctx.repo) {
      badgeText = ctx.repo;
    }

    this.container.innerHTML = `
      <style>${SHADOW_STYLES}</style>

      <!-- Floating Launcher Button -->
      <div class="beacon-launcher" id="beacon-launcher" title="Toggle Beacon AI (Alt+B)">
        <div class="beacon-launcher-dot"></div>
        <div class="beacon-launcher-title">
          <span>Beacon</span>
        </div>
        <div class="beacon-launcher-badge">${badgeText}</div>
      </div>

      <!-- Slide-Over Sidebar Panel -->
      <aside class="beacon-sidebar ${this.isOpen ? 'open' : ''}" id="beacon-sidebar">
        <!-- Header -->
        <header class="beacon-header">
          <div class="beacon-brand">
            <span style="font-size: 18px;">🟢</span>
            <div class="beacon-brand-name">Beacon AI</div>
            <div class="beacon-brand-tag">v1.0</div>
          </div>
          <div class="beacon-header-actions">
            <div class="beacon-status-indicator ${this.backendStatus}">
              <div class="dot"></div>
              <span class="status-text">
                ${this.backendStatus === 'online' ? 'Gemini Ready' : this.backendStatus === 'unconfigured' ? 'Key Missing' : this.backendStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
            </div>
            <button class="beacon-icon-btn" id="btn-settings-toggle" title="Settings">⚙️</button>
            <button class="beacon-icon-btn" id="btn-close" title="Close (Esc)">✕</button>
          </div>
        </header>

        <!-- Active Context Banner -->
        <div class="beacon-context-card">
          <div class="beacon-context-meta">
            <div class="beacon-context-type">
              ${isLC ? '⚡ LeetCode Problem' : isGH ? `🐙 GitHub ${ctx.type || 'Repo'}` : '🌐 Web Page'}
            </div>
            ${ctx.difficulty ? `<span class="beacon-difficulty-badge ${ctx.difficulty}">${ctx.difficulty}</span>` : ''}
            ${ctx.state ? `<span class="beacon-tag" style="color:#00f59b; border:1px solid #10b981;">${ctx.state}</span>` : ''}
          </div>
          <div class="beacon-context-title" title="${ctx.title || 'Page Detected'}">
            ${ctx.title || 'Scanning current page...'}
          </div>
          ${ctx.tags?.length ? `
            <div class="beacon-tag-list">
              ${ctx.tags.map(t => `<span class="beacon-tag">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Navigation Tabs -->
        <nav class="beacon-tabs">
          <button class="beacon-tab-btn ${this.activeTab === 'actions' ? 'active' : ''}" data-tab="actions">
            ⚡ Actions
          </button>
          <button class="beacon-tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">
            💬 Chat
          </button>
          <button class="beacon-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
            ⚙️ Settings
          </button>
        </nav>

        <!-- Main Body Area -->
        <main class="beacon-body">
          ${this.renderActiveTabContent()}
        </main>

        <!-- Footer / Chat Input Bar (only in Chat tab) -->
        ${this.activeTab === 'chat' ? this.renderChatInputBar() : ''}
      </aside>
    `;

    this.bindEvents();
    bindCopyButtons(this.shadowRoot);
  }

  renderActiveTabContent() {
    if (this.activeTab === 'settings') {
      return this.renderSettingsTab();
    }
    if (this.activeTab === 'chat') {
      return this.renderChatTab();
    }
    return this.renderActionsTab();
  }

  renderActionsTab() {
    const ctx = this.context || {};
    const isLC = ctx.platform === 'leetcode';
    const isGH = ctx.platform === 'github';

    const hasResponseOrLoading = Boolean(this.responseText || this.isLoading || this.error);

    return `
      <!-- Action Buttons Section -->
      <div class="beacon-actions-section">
        ${hasResponseOrLoading ? `
          <button class="beacon-actions-toggle-btn" id="btn-toggle-actions" title="Click to show/hide action shortcuts">
            <span>⚡ Available Actions</span>
            <span class="badge-pill">${this.actionsExpanded ? '▴ Hide' : '▾ Show All'}</span>
          </button>
        ` : ''}

        <div class="beacon-actions-grid ${(!this.actionsExpanded && hasResponseOrLoading) ? 'collapsed' : ''}">
          ${isLC ? this.renderLeetCodeActions() : isGH ? this.renderGitHubActions() : this.renderGeneralActions()}
        </div>
      </div>

      <!-- Loading State -->
      ${this.isLoading ? `
        <div class="beacon-response-box">
          <div class="beacon-skeleton-box">
            <div class="beacon-pulse-avatar">
              <div class="beacon-launcher-dot"></div>
              <span>Beacon is generating ${this.loadingActionName || 'analysis'}...</span>
            </div>
            <div class="beacon-skeleton-line" style="width: 85%;"></div>
            <div class="beacon-skeleton-line" style="width: 95%;"></div>
            <div class="beacon-skeleton-line" style="width: 70%;"></div>
            <div class="beacon-skeleton-line" style="width: 90%;"></div>
          </div>
        </div>
      ` : ''}

      <!-- Error / Quota Alert -->
      ${this.error ? `
        <div class="beacon-alert error">
          <strong>⚠️ Action Failed</strong>
          <div>${this.error}</div>
          <button class="beacon-retry-btn" id="btn-retry-action">🔄 Retry</button>
        </div>
      ` : ''}

      <!-- Backend Offline Warning -->
      ${this.backendStatus === 'offline' && !this.error ? `
        <div class="beacon-alert warning">
          <strong>🔌 Backend Offline</strong>
          <div>Could not reach Beacon server at <code>${this.settings.backendUrl}</code>. Ensure the server is running (<code>npm start</code> in <code>server/</code>).</div>
          <button class="beacon-retry-btn" id="btn-retry-health">Check Connection</button>
        </div>
      ` : ''}

      <!-- Unconfigured Gemini Key Warning -->
      ${this.backendStatus === 'unconfigured' && !this.error ? `
        <div class="beacon-alert warning">
          <strong>🔑 Gemini API Key Required</strong>
          <div>Your backend server does not have <code>GEMINI_API_KEY</code> set in <code>server/.env</code>. Add your key from Google AI Studio.</div>
        </div>
      ` : ''}

      <!-- Response Viewer -->
      ${this.responseText && !this.isLoading ? `
        <div class="beacon-response-box" id="beacon-active-response">
          <div class="beacon-response-header">
            <span>✨ ${this.responseTitle || 'Beacon Response'}</span>
            <div style="display:flex; gap:6px;">
              <button class="beacon-copy-btn" id="btn-view-in-chat" title="View in scrollable Chat">
                💬 Open in Chat
              </button>
              <button class="beacon-copy-btn" id="btn-copy-full-response">
                📋 Copy All
              </button>
            </div>
          </div>
          <div class="beacon-markdown">
            ${renderMarkdown(this.responseText)}
          </div>
        </div>
      ` : ''}
    `;
  }

  renderLeetCodeActions() {
    return `
      <button class="beacon-action-card" data-action="leetcode_explain">
        <span class="icon">✨</span>
        <span class="title">Explain Problem</span>
        <span class="desc">Mental model & requirements</span>
      </button>

      <button class="beacon-action-card" data-action="leetcode_hint">
        <span class="icon">💡</span>
        <span class="title">Progressive Hint</span>
        <span class="desc">Socratic guidance without spoilers</span>
        <span class="badge">Next: Hint Level ${this.hintLevel}/3</span>
      </button>

      <button class="beacon-action-card" data-action="leetcode_approach">
        <span class="icon">🧠</span>
        <span class="title">Optimal Approach</span>
        <span class="desc">Data structures & key insight</span>
      </button>

      <button class="beacon-action-card" data-action="leetcode_complexity">
        <span class="icon">⏱️</span>
        <span class="title">Big-O Complexity</span>
        <span class="desc">Rigorous Time & Space bounds</span>
      </button>

      <button class="beacon-action-card full-width" data-action="leetcode_solution">
        <span class="icon">💻</span>
        <span class="title">Optimal Solution Walkthrough</span>
        <span class="desc">Clean ${this.settings.preferredLanguage.toUpperCase()} code + line-by-line explanation</span>
      </button>
    `;
  }

  renderGitHubActions() {
    const isPR = this.context?.type === 'pull_request';
    const isRepo = this.context?.type === 'repository';

    if (isRepo) {
      return `
        <button class="beacon-action-card full-width" data-action="github_repo_overview">
          <span class="icon">📖</span>
          <span class="title">Repository Architecture Overview</span>
          <span class="desc">Tech stack, design & codebase structure</span>
        </button>
        <button class="beacon-action-card full-width" data-action="github_next_step">
          <span class="icon">🚀</span>
          <span class="title">Contributor Quickstart Guide</span>
          <span class="desc">How to set up and start contributing</span>
        </button>
      `;
    }

    if (isPR) {
      return `
        <button class="beacon-action-card" data-action="github_review">
          <span class="icon">🔍</span>
          <span class="title">Review PR Changes</span>
          <span class="desc">Code smells, risks & suggestions</span>
        </button>
        <button class="beacon-action-card" data-action="github_explain">
          <span class="icon">✨</span>
          <span class="title">Explain Pull Request</span>
          <span class="desc">Executive summary & impact</span>
        </button>
        <button class="beacon-action-card" data-action="github_next_step">
          <span class="icon">🎯</span>
          <span class="title">Verification Steps</span>
          <span class="desc">Checklist before merge</span>
        </button>
        <button class="beacon-action-card" data-action="github_summarize">
          <span class="icon">📝</span>
          <span class="title">Summarize Review</span>
          <span class="desc">Feedback & consensus</span>
        </button>
      `;
    }

    // Default GitHub Issue
    return `
      <button class="beacon-action-card" data-action="github_explain">
        <span class="icon">✨</span>
        <span class="title">Explain Issue</span>
        <span class="desc">Core problem & edge cases</span>
      </button>
      <button class="beacon-action-card" data-action="github_next_step">
        <span class="icon">🎯</span>
        <span class="title">Next Practical Step</span>
        <span class="desc">Concrete developer action plan</span>
      </button>
      <button class="beacon-action-card" data-action="github_debug">
        <span class="icon">🐛</span>
        <span class="title">Debug & Root Cause</span>
        <span class="desc">Isolate bug & suggested fix</span>
      </button>
      <button class="beacon-action-card" data-action="github_summarize">
        <span class="icon">📝</span>
        <span class="title">Summarize Thread</span>
        <span class="desc">Key comments & conclusions</span>
      </button>
    `;
  }

  renderGeneralActions() {
    return `
      <button class="beacon-action-card full-width" data-action="explain_page">
        <span class="icon">✨</span>
        <span class="title">Analyze Page</span>
        <span class="desc">Summarize context and purpose</span>
      </button>
    `;
  }

  renderChatTab() {
    const ctx = this.context || {};
    const isLC = ctx.platform === 'leetcode';
    const isGH = ctx.platform === 'github';
    const isPR = ctx.type === 'pull_request';

    return `
      <!-- Quick Action Chips at the Top of Chat -->
      <div class="beacon-quick-actions-bar">
        <div class="beacon-quick-actions-title">⚡ Quick Actions:</div>
        <div class="beacon-quick-chips">
          ${isLC ? `
            <button class="beacon-action-chip" data-action="leetcode_explain">✨ Explain</button>
            <button class="beacon-action-chip" data-action="leetcode_hint">💡 Hint ${this.hintLevel}/3</button>
            <button class="beacon-action-chip" data-action="leetcode_approach">🧠 Approach</button>
            <button class="beacon-action-chip" data-action="leetcode_complexity">⏱️ Complexity</button>
            <button class="beacon-action-chip" data-action="leetcode_solution">💻 Solution</button>
          ` : isGH ? `
            <button class="beacon-action-chip" data-action="github_explain">✨ Explain</button>
            <button class="beacon-action-chip" data-action="github_next_step">🎯 Next Step</button>
            <button class="beacon-action-chip" data-action="github_debug">🐛 Debug</button>
            <button class="beacon-action-chip" data-action="github_summarize">📝 Summarize</button>
            ${isPR ? `<button class="beacon-action-chip" data-action="github_review">🔍 Review PR</button>` : ''}
          ` : `
            <button class="beacon-action-chip" data-action="explain_page">✨ Analyze</button>
          `}
        </div>
      </div>

      <div class="beacon-chat-stream">
        ${this.chatHistory.length === 0 ? `
          <div style="text-align: center; color: #8b949e; padding: 25px 10px;">
            <div style="font-size: 28px; margin-bottom: 6px;">🟢</div>
            <div style="font-weight: 600; color: #f0f6fc; margin-bottom: 4px;">Ask Beacon Anything</div>
            <div style="font-size: 12px;">Click a quick action above or type below to chat.</div>
          </div>
        ` : ''}

        ${this.chatHistory.map(msg => `
          <div class="beacon-chat-msg ${msg.role}">
            <div class="beacon-chat-bubble">
              ${msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        `).join('')}

        ${this.isLoading ? `
          <div class="beacon-chat-msg assistant">
            <div class="beacon-chat-bubble" style="display:flex; align-items:center; gap:8px;">
              <div class="beacon-launcher-dot"></div>
              <span>Beacon is generating ${this.loadingActionName || 'response'}...</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderChatInputBar() {
    return `
      <div class="beacon-chat-bar">
        <div class="beacon-chat-input-row">
          <textarea
            class="beacon-chat-textarea"
            id="beacon-chat-input"
            rows="1"
            placeholder="Ask about this ${this.context?.platform === 'leetcode' ? 'problem' : 'task'}..."
          ></textarea>
          <button class="beacon-send-btn" id="btn-chat-send" title="Send message (Enter)">➤</button>
        </div>
        <div class="beacon-chat-tip">Press Enter to send, Shift+Enter for new line</div>
      </div>
    `;
  }

  renderSettingsTab() {
    return `
      <div class="beacon-settings-form">
        <div class="beacon-form-group">
          <label class="beacon-form-label">Backend Server URL</label>
          <input
            type="text"
            class="beacon-form-input"
            id="setting-backend-url"
            value="${this.settings.backendUrl || 'http://localhost:3001'}"
            placeholder="http://localhost:3001"
          />
          <span style="font-size:11px; color:#8b949e;">Local Node.js backend handling Google Gemini requests.</span>
        </div>

        <div class="beacon-form-group">
          <label class="beacon-form-label">LeetCode Solution Language</label>
          <select class="beacon-form-select" id="setting-language">
            <option value="python" ${this.settings.preferredLanguage === 'python' ? 'selected' : ''}>Python 3</option>
            <option value="javascript" ${this.settings.preferredLanguage === 'javascript' ? 'selected' : ''}>JavaScript</option>
            <option value="typescript" ${this.settings.preferredLanguage === 'typescript' ? 'selected' : ''}>TypeScript</option>
            <option value="cpp" ${this.settings.preferredLanguage === 'cpp' ? 'selected' : ''}>C++</option>
            <option value="java" ${this.settings.preferredLanguage === 'java' ? 'selected' : ''}>Java</option>
            <option value="go" ${this.settings.preferredLanguage === 'go' ? 'selected' : ''}>Go</option>
            <option value="rust" ${this.settings.preferredLanguage === 'rust' ? 'selected' : ''}>Rust</option>
          </select>
        </div>

        <div class="beacon-form-group">
          <label class="beacon-form-label">Gemini Model</label>
          <select class="beacon-form-select" id="setting-model">
            <option value="gemini-2.5-flash" ${this.settings.model === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (Fast & Intelligent)</option>
            <option value="gemini-2.0-flash" ${this.settings.model === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Fallback)</option>
            <option value="gemini-1.5-flash" ${this.settings.model === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash</option>
            <option value="gemini-1.5-pro" ${this.settings.model === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro (Deep Reasoning)</option>
          </select>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="beacon-save-btn" id="btn-save-settings" style="flex:1;">Save Settings</button>
          <button class="beacon-retry-btn" id="btn-test-connection" style="padding: 8px 12px; margin:0;">Test Backend</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    // Toggle Launcher
    root.querySelector('#beacon-launcher')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Close Button
    root.querySelector('#btn-close')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    // Settings Toggle
    root.querySelector('#btn-settings-toggle')?.addEventListener('click', () => {
      this.activeTab = this.activeTab === 'settings' ? 'actions' : 'settings';
      this.render();
    });

    // Tab buttons
    root.querySelectorAll('.beacon-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeTab = btn.getAttribute('data-tab');
        this.render();
      });
    });

    // Actions Section Expand/Collapse Toggle
    root.querySelector('#btn-toggle-actions')?.addEventListener('click', () => {
      this.actionsExpanded = !this.actionsExpanded;
      this.render();
    });

    // Isolate all keyboard events so host page shortcuts (GitHub/LeetCode) NEVER trigger
    const sidebar = root.querySelector('#beacon-sidebar');
    sidebar?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.isOpen = false;
        this.render();
      }
      e.stopPropagation();
    });
    sidebar?.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });
    sidebar?.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    // Isolate mouse and wheel events so clicks inside Beacon never bubble to GitHub
    sidebar?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    sidebar?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    sidebar?.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

    // Action Cards (in Actions tab)
    root.querySelectorAll('.beacon-action-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = card.getAttribute('data-action');
        const title = card.querySelector('.title')?.innerText || action;
        this.executeAction(action, title);
      });
    });

    // Quick Action Chips (in Chat tab)
    root.querySelectorAll('.beacon-action-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = chip.getAttribute('data-action');
        const title = chip.innerText.trim();
        this.executeAction(action, title);
      });
    });

    // View in Chat button on Actions response header
    root.querySelector('#btn-view-in-chat')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.activeTab = 'chat';
      this.render();
      setTimeout(() => {
        const stream = this.shadowRoot?.querySelector('.beacon-chat-stream');
        if (stream && stream.lastElementChild) {
          stream.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 50);
    });

    // Retry Action Button
    root.querySelector('#btn-retry-action')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.lastAction) {
        const { title, options } = this.lastActionPayload;
        this.setLoading(true, title);
        this.onAction(this.lastAction, this.context, options, (err, res) => {
          if (err) {
            this.setError(err.message || String(err));
          } else {
            this.setResponse(title, res.text);
          }
        });
      }
    });

    // Retry Health / Connection Check
    root.querySelector('#btn-retry-health')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onCheckHealth();
    });

    root.querySelector('#btn-test-connection')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onCheckHealth();
    });

    // Copy Full Response
    root.querySelector('#btn-copy-full-response')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = root.querySelector('#btn-copy-full-response');
      if (!btn) return;
      try {
        await navigator.clipboard.writeText(this.responseText);
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy response:', err);
      }
    });

    // Chat Send
    const chatInput = root.querySelector('#beacon-chat-input');
    const sendBtn = root.querySelector('#btn-chat-send');

    const handleSendChat = () => {
      const message = chatInput?.value?.trim();
      if (!message || this.isLoading) return;

      chatInput.value = '';
      chatInput.style.height = '42px';
      this.addChatMessage('user', message);
      this.setLoading(true, 'Chat Response');

      this.onChat(message, this.context, this.settings, this.chatHistory, (err, res) => {
        if (err) {
          this.addChatMessage('assistant', `⚠️ **Error:** ${err.message || String(err)}`);
          this.setLoading(false);
        } else {
          this.addChatMessage('assistant', res.text);
          this.setLoading(false);
        }
      });
    };

    sendBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSendChat();
    });

    chatInput?.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendChat();
      }
    });

    chatInput?.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    chatInput?.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    chatInput?.addEventListener('input', (e) => {
      e.stopPropagation();
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Auto-focus chat input when on Chat tab
    if (this.activeTab === 'chat') {
      setTimeout(() => {
        chatInput?.focus();
      }, 50);
    }

    // Save Settings
    root.querySelector('#btn-save-settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const backendUrl = root.querySelector('#setting-backend-url')?.value?.trim();
      const preferredLanguage = root.querySelector('#setting-language')?.value;
      const model = root.querySelector('#setting-model')?.value;

      const newSettings = {
        backendUrl: backendUrl || 'http://localhost:3001',
        preferredLanguage,
        model
      };

      this.settings = newSettings;
      this.onSaveSettings(newSettings);

      const saveBtn = root.querySelector('#btn-save-settings');
      if (saveBtn) {
        saveBtn.innerText = '✅ Saved!';
        setTimeout(() => {
          this.activeTab = 'actions';
          this.render();
        }, 800);
      }
    });
  }
}
