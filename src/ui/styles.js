/**
 * Shadow DOM CSS Styles for Beacon AI
 * High-end Dark Developer Aesthetic with Emerald Beacon Accents
 */

export const SHADOW_STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #f0f6fc;
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ==========================================================================
   FLOATING LAUNCHER PILL
   ========================================================================== */
.beacon-launcher {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 9999px;
  color: #f0f6fc;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(16, 185, 129, 0.2);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

.beacon-launcher:hover {
  transform: translateY(-2px) scale(1.02);
  border-color: #10b981;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.35);
}

.beacon-launcher:active {
  transform: translateY(0) scale(0.98);
}

.beacon-launcher-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00f59b;
  box-shadow: 0 0 10px #00f59b;
  position: relative;
}

.beacon-launcher-dot::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #00f59b;
  opacity: 0.7;
  animation: beacon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes beacon-pulse {
  0% { transform: scale(0.8); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}

.beacon-launcher-title {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: -0.2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.beacon-launcher-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #00f59b;
  border-radius: 12px;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==========================================================================
   SIDEBAR DRAWER
   ========================================================================== */
.beacon-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 440px;
  max-width: 95vw;
  height: 100vh;
  background: #0d1117;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -16px 0 48px rgba(0, 0, 0, 0.75);
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.beacon-sidebar.open {
  transform: translateX(0);
}

/* Header */
.beacon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.beacon-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.beacon-brand-logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.beacon-brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #f0f6fc;
}

.beacon-brand-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #00f59b;
  border-radius: 4px;
}

.beacon-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.beacon-icon-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.beacon-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f0f6fc;
}

.beacon-status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.beacon-status-indicator.online .dot {
  background: #00f59b;
  box-shadow: 0 0 6px #00f59b;
}

.beacon-status-indicator.offline .dot {
  background: #f85149;
  box-shadow: 0 0 6px #f85149;
}

.beacon-status-indicator.unconfigured .dot {
  background: #d29922;
  box-shadow: 0 0 6px #d29922;
}

.beacon-status-indicator .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

/* Context Banner */
.beacon-context-card {
  margin: 12px 16px 0;
  padding: 12px 14px;
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.beacon-context-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.beacon-context-type {
  font-weight: 600;
  text-transform: uppercase;
  color: #8b949e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.beacon-difficulty-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
}

.beacon-difficulty-badge.Easy {
  background: rgba(0, 184, 163, 0.2);
  color: #00b8a3;
  border: 1px solid rgba(0, 184, 163, 0.4);
}

.beacon-difficulty-badge.Medium {
  background: rgba(255, 192, 30, 0.2);
  color: #ffc01e;
  border: 1px solid rgba(255, 192, 30, 0.4);
}

.beacon-difficulty-badge.Hard {
  background: rgba(255, 55, 95, 0.2);
  color: #ff375f;
  border: 1px solid rgba(255, 55, 95, 0.4);
}

.beacon-context-title {
  font-size: 13px;
  font-weight: 600;
  color: #f0f6fc;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.beacon-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.beacon-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: #8b949e;
}

/* Tab Bar */
.beacon-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 16px;
  margin-top: 12px;
}

.beacon-tab-btn {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.beacon-tab-btn:hover {
  color: #f0f6fc;
}

.beacon-tab-btn.active {
  color: #00f59b;
  border-bottom-color: #00f59b;
}

/* Content Area - Scrollable */
.beacon-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  overscroll-behavior: contain;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
  scrollbar-color: rgba(16, 185, 129, 0.4) rgba(255, 255, 255, 0.05);
}

.beacon-body::-webkit-scrollbar {
  width: 7px;
  display: block;
}

.beacon-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

.beacon-body::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.4);
  border-radius: 4px;
}

.beacon-body::-webkit-scrollbar-thumb:hover {
  background: #00f59b;
}

/* Actions Section & Toggle Header */
.beacon-actions-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.beacon-actions-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #8b949e;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.beacon-actions-toggle-btn:hover {
  background: #21262d;
  color: #00f59b;
  border-color: rgba(16, 185, 129, 0.3);
}

.beacon-actions-toggle-btn .badge-pill {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(16, 185, 129, 0.15);
  color: #00f59b;
  border-radius: 10px;
}

/* Action Buttons Grid */
.beacon-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  transition: all 0.2s ease;
}

/* Quick Actions Bar in Chat Tab */
.beacon-quick-actions-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  margin-bottom: 6px;
}

.beacon-quick-actions-title {
  font-size: 11px;
  font-weight: 700;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.beacon-quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.beacon-action-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f0f6fc;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.beacon-action-chip:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #00f59b;
  transform: translateY(-1px);
}

.beacon-actions-grid.collapsed {
  display: none;
}

.beacon-action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 14px;
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  color: #f0f6fc;
}

.beacon-action-card:hover {
  background: #21262d;
  border-color: rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.beacon-action-card:active {
  transform: translateY(0);
}

.beacon-action-card.full-width {
  grid-column: span 2;
}

.beacon-action-card .icon {
  font-size: 16px;
}

.beacon-action-card .title {
  font-size: 12.5px;
  font-weight: 600;
}

.beacon-action-card .desc {
  font-size: 11px;
  color: #8b949e;
}

.beacon-action-card .badge {
  font-size: 10px;
  font-weight: 700;
  color: #00f59b;
  background: rgba(16, 185, 129, 0.15);
  padding: 1px 5px;
  border-radius: 4px;
  margin-top: 2px;
}

/* Response Container */
.beacon-response-box {
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.beacon-response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #21262d;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 600;
  color: #8b949e;
}

.beacon-copy-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f0f6fc;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.beacon-copy-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.beacon-copy-btn.copied {
  background: rgba(16, 185, 129, 0.2);
  color: #00f59b;
  border-color: #00f59b;
}

.beacon-markdown {
  padding: 16px;
  font-size: 13.5px;
  line-height: 1.65;
  color: #c9d1d9;
  overflow-x: auto;
}

.beacon-markdown h1, .beacon-markdown h2, .beacon-markdown h3, .beacon-markdown h4 {
  color: #f0f6fc;
  margin: 16px 0 8px;
  font-weight: 600;
}

.beacon-markdown h1 { font-size: 17px; }
.beacon-markdown h2 { font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px; }
.beacon-markdown h3 { font-size: 14px; color: #00f59b; }

.beacon-markdown p {
  margin-bottom: 10px;
}

.beacon-markdown ul, .beacon-markdown ol {
  margin-left: 20px;
  margin-bottom: 12px;
}

.beacon-markdown li {
  margin-bottom: 4px;
}

.beacon-markdown code:not(pre code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  background: rgba(110, 118, 129, 0.25);
  color: #00f59b;
  padding: 2px 6px;
  border-radius: 4px;
}

.beacon-markdown pre {
  margin: 12px 0;
  border-radius: 8px;
  background: #090d13;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
}

.beacon-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11px;
  color: #8b949e;
  font-family: ui-monospace, monospace;
}

.beacon-markdown pre code {
  display: block;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #e6edf3;
}

.beacon-markdown blockquote {
  border-left: 3px solid #10b981;
  padding-left: 12px;
  margin: 10px 0;
  color: #8b949e;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 0 4px 4px 0;
  padding-top: 4px;
  padding-bottom: 4px;
}

/* Chat Stream */
.beacon-chat-stream {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.beacon-chat-msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 90%;
}

.beacon-chat-msg.user {
  align-self: flex-end;
}

.beacon-chat-msg.assistant {
  align-self: flex-start;
  max-width: 98%;
}

.beacon-chat-bubble {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.beacon-chat-msg.user .beacon-chat-bubble {
  background: #1f6feb;
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.beacon-chat-msg.assistant .beacon-chat-bubble {
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #c9d1d9;
  border-bottom-left-radius: 2px;
}

.beacon-chat-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: #161b22;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: auto !important;
  position: relative;
  z-index: 10;
}

.beacon-chat-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.beacon-chat-textarea {
  flex: 1;
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: #f0f6fc;
  resize: none;
  min-height: 42px;
  max-height: 120px;
  outline: none;
  font-family: inherit;
  line-height: 1.4;
  transition: border-color 0.15s ease;
  pointer-events: auto !important;
  user-select: text !important;
  -webkit-user-select: text !important;
  cursor: text;
}

.beacon-chat-textarea:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.4);
}

.beacon-send-btn {
  background: #10b981;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d1117;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 16px;
  font-weight: 700;
}

.beacon-send-btn:hover:not(:disabled) {
  background: #00f59b;
  transform: translateY(-1px);
}

.beacon-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.beacon-chat-tip {
  font-size: 11px;
  color: #6e7681;
}

/* Skeleton Loading State */
.beacon-skeleton-box {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.beacon-skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #161b22 25%, #21262d 50%, #161b22 75%);
  background-size: 200% 100%;
  animation: beacon-shimmer 1.5s infinite;
}

@keyframes beacon-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.beacon-pulse-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #00f59b;
  font-weight: 600;
}

/* Error & Quota Banners */
.beacon-alert {
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.beacon-alert.error {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
  color: #f85149;
}

.beacon-alert.warning {
  background: rgba(210, 153, 34, 0.1);
  border: 1px solid rgba(210, 153, 34, 0.3);
  color: #d29922;
}

.beacon-retry-btn {
  align-self: flex-start;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  cursor: pointer;
  margin-top: 4px;
}

.beacon-retry-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Settings Form */
.beacon-settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.beacon-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.beacon-form-label {
  font-size: 12px;
  font-weight: 600;
  color: #f0f6fc;
}

.beacon-form-input, .beacon-form-select {
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: #f0f6fc;
  outline: none;
}

.beacon-form-input:focus, .beacon-form-select:focus {
  border-color: #10b981;
}

.beacon-save-btn {
  background: #10b981;
  color: #0d1117;
  font-weight: 700;
  font-size: 13px;
  padding: 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.beacon-save-btn:hover {
  background: #00f59b;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
`;
