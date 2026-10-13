(() => {
  // src/extractors/github.js
  function isGitHub() {
    return window.location.hostname === "github.com";
  }
  function extractGitHubContext() {
    if (!isGitHub()) return null;
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) {
      return {
        platform: "github",
        type: "home",
        title: "GitHub Home",
        url: window.location.href
      };
    }
    const owner = parts[0];
    const repo = parts[1];
    const repoFullName = parts.length >= 2 ? `${owner}/${repo}` : null;
    if (parts[2] === "issues" && parts[3]) {
      const issueNumber = parts[3];
      const titleEl = document.querySelector('bdi, .gh-header-title, [data-testid="issue-title"]');
      const title = titleEl ? titleEl.innerText.trim() : document.title.replace(` \xB7 #${issueNumber} \xB7 ${repoFullName}`, "").trim();
      const stateEl = document.querySelector('.State, [title*="Status:"], span[data-component="PHState"]');
      const state = stateEl ? stateEl.innerText.trim() : "Unknown";
      const authorEl = document.querySelector('.author, [data-testid="issue-header-author"]');
      const author = authorEl ? authorEl.innerText.trim() : "Unknown";
      const bodyEl = document.querySelector('.comment-body, .markdown-body, [data-testid="issue-body"]');
      const body = bodyEl ? bodyEl.innerText.trim() : "";
      const labelEls = document.querySelectorAll('.IssueLabel, a[data-name], [data-testid="issue-labels"] a');
      const labels = Array.from(labelEls).map((el) => el.innerText.trim()).filter(Boolean);
      const commentEls = document.querySelectorAll('.timeline-comment .comment-body, [data-testid="comment-body"]');
      const comments = Array.from(commentEls).slice(1, 6).map((el) => el.innerText.trim()).filter(Boolean);
      return {
        platform: "github",
        type: "issue",
        repo: repoFullName,
        number: issueNumber,
        title,
        state,
        author,
        labels,
        body,
        comments,
        url: window.location.href
      };
    }
    if (parts[2] === "pull" && parts[3]) {
      const prNumber = parts[3];
      const titleEl = document.querySelector('bdi, .gh-header-title, [data-testid="pr-title"]');
      const title = titleEl ? titleEl.innerText.trim() : document.title.replace(` \xB7 #${prNumber} \xB7 ${repoFullName}`, "").trim();
      const stateEl = document.querySelector('.State, [title*="Status:"], span[data-component="PHState"]');
      const state = stateEl ? stateEl.innerText.trim() : "Unknown";
      const authorEl = document.querySelector('.author, [data-testid="pr-header-author"]');
      const author = authorEl ? authorEl.innerText.trim() : "Unknown";
      const bodyEl = document.querySelector(".comment-body, .markdown-body");
      const body = bodyEl ? bodyEl.innerText.trim() : "";
      const labelEls = document.querySelectorAll(".IssueLabel, a[data-name]");
      const labels = Array.from(labelEls).map((el) => el.innerText.trim()).filter(Boolean);
      const diffstatEl = document.querySelector('#diffstat, .diffstat, [data-testid="diff-stat"]');
      const diffSummary = diffstatEl ? diffstatEl.innerText.trim() : "";
      const changedFileEls = document.querySelectorAll('.file-info a, [data-tag="file-path"]');
      const changedFiles = Array.from(changedFileEls).slice(0, 15).map((el) => el.innerText.trim()).filter(Boolean);
      const comments = Array.from(document.querySelectorAll(".timeline-comment .comment-body")).slice(1, 6).map((el) => el.innerText.trim()).filter(Boolean);
      return {
        platform: "github",
        type: "pull_request",
        repo: repoFullName,
        number: prNumber,
        title,
        state,
        author,
        labels,
        body,
        diffSummary: `${diffSummary}
Files: ${changedFiles.join(", ")}`,
        comments,
        url: window.location.href
      };
    }
    if (parts.length === 2 || parts.length > 2 && parts[2] === "tree") {
      const descEl = document.querySelector('p.f4.my-3, [data-testid="repo-description"]');
      const description = descEl ? descEl.innerText.trim() : "";
      const starsEl = document.querySelector('#repo-stars-counter-star, [aria-label*="starred"]');
      const stars = starsEl ? starsEl.innerText.trim() : "";
      const langEls = document.querySelectorAll('.repository-lang-stats-numbers li, [data-ga-click*="Repository, language"]');
      const languages = Array.from(langEls).map((el) => el.innerText.trim()).filter(Boolean);
      const readmeEl = document.querySelector("#readme article, .markdown-body");
      const readme = readmeEl ? readmeEl.innerText.slice(0, 4e3).trim() : "";
      return {
        platform: "github",
        type: "repository",
        repo: repoFullName,
        title: repoFullName,
        description,
        stars,
        language: languages[0] || "Unknown",
        readme,
        url: window.location.href
      };
    }
    if (parts[2] === "blob") {
      const filename = parts.slice(4).join("/");
      const codeEl = document.querySelector('.blob-wrapper, [data-tag="blob-code-inner"], .react-blob-print-hide');
      const code = codeEl ? codeEl.innerText.slice(0, 5e3).trim() : "";
      return {
        platform: "github",
        type: "blob",
        repo: repoFullName,
        title: filename || "Source File",
        filename,
        userCode: code,
        url: window.location.href
      };
    }
    return {
      platform: "github",
      type: "general",
      repo: repoFullName || "GitHub",
      title: document.title.replace(" \xB7 GitHub", "").trim(),
      url: window.location.href
    };
  }

  // src/extractors/leetcode.js
  function isLeetCode() {
    const host = window.location.hostname;
    return host === "leetcode.com" || host === "leetcode.cn";
  }
  function extractLeetCodeContext() {
    if (!isLeetCode()) return null;
    const path = window.location.pathname;
    const match = path.match(/\/problems\/([^/]+)/);
    if (!match) {
      return {
        platform: "leetcode",
        type: "general",
        title: "LeetCode",
        url: window.location.href
      };
    }
    const slug = match[1];
    let title = "";
    const titleEl = document.querySelector(
      'div[data-cy="question-title"], span[class*="text-title-large"], div[class*="text-title-large"], h4[data-cypress="QuestionTitle"]'
    );
    if (titleEl) {
      title = titleEl.innerText.trim();
    } else {
      title = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    let difficulty = "Medium";
    const diffCandidates = document.querySelectorAll(
      'div[class*="text-difficulty-"], div[class*="text-olive"], div[class*="text-yellow"], div[class*="text-pink"], span[class*="difficulty"]'
    );
    for (const el of diffCandidates) {
      const text = el.innerText.trim();
      if (["Easy", "Medium", "Hard"].includes(text)) {
        difficulty = text;
        break;
      }
    }
    if (!difficulty || difficulty === "Medium") {
      const badges = Array.from(document.querySelectorAll("div, span")).filter((el) => ["Easy", "Medium", "Hard"].includes(el.innerText?.trim()) && el.children.length === 0);
      if (badges.length > 0) {
        difficulty = badges[0].innerText.trim();
      }
    }
    const tagEls = document.querySelectorAll('a[href*="/tag/"], div[class*="topic-tag"], a[class*="topic-tag"]');
    const tags = Array.from(tagEls).map((el) => el.innerText.trim()).filter(Boolean);
    const descEl = document.querySelector(
      'div.elfjS, div[data-track-load="description_content"], div[class*="_1l1M"], div.content__uRqi, [data-key="description-content"]'
    );
    const rawDesc = descEl ? descEl.innerText.trim() : "";
    let description = rawDesc;
    const examples = [];
    const constraints = [];
    if (rawDesc) {
      const constraintSplit = rawDesc.split(/Constraints:|Follow up:/i);
      if (constraintSplit.length > 1) {
        description = constraintSplit[0].trim();
        const constraintLines = constraintSplit[1].split("\n").map((l) => l.trim()).filter(Boolean);
        constraints.push(...constraintLines.slice(0, 10));
      }
      const preEls = descEl ? descEl.querySelectorAll('pre, [class*="example"]') : [];
      preEls.forEach((el) => {
        const text = el.innerText.trim();
        if (text && text.length < 1e3) {
          examples.push(text);
        }
      });
    }
    let userCode = "";
    const monacoLines = document.querySelectorAll(".monaco-editor .view-lines .view-line");
    if (monacoLines.length > 0) {
      userCode = Array.from(monacoLines).map((l) => l.innerText).join("\n").trim();
    } else {
      const codeMirror = document.querySelector(".CodeMirror-code");
      if (codeMirror) {
        userCode = codeMirror.innerText.trim();
      }
    }
    let language = "python";
    const langButton = document.querySelector(
      'button[id*="headlessui-listbox-button"], div[class*="rounded"] button'
    );
    if (langButton) {
      const btnText = langButton.innerText.toLowerCase();
      if (btnText.includes("python")) language = "python";
      else if (btnText.includes("javascript") || btnText.includes("js")) language = "javascript";
      else if (btnText.includes("typescript") || btnText.includes("ts")) language = "typescript";
      else if (btnText.includes("c++") || btnText.includes("cpp")) language = "cpp";
      else if (btnText.includes("java")) language = "java";
      else if (btnText.includes("go")) language = "go";
      else if (btnText.includes("rust")) language = "rust";
    }
    return {
      platform: "leetcode",
      type: "problem",
      slug,
      title,
      difficulty,
      tags: Array.from(new Set(tags)).slice(0, 8),
      description: description.slice(0, 6e3),
      examples: examples.slice(0, 3),
      constraints,
      userCode: userCode.slice(0, 4e3),
      language,
      url: window.location.href
    };
  }

  // src/ui/styles.js
  var SHADOW_STYLES = `
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

  // src/ui/markdown.js
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function renderMarkdown(markdown) {
    if (!markdown) return "";
    let text = markdown.replace(/\r\n/g, "\n");
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `%%BEACONCODEBLOCK${codeBlocks.length}%%`;
      const cleanLang = lang.trim() || "code";
      const escapedCode = escapeHtml(code.trim());
      codeBlocks.push({
        id,
        html: `<pre><div class="beacon-code-header"><span>${cleanLang}</span><button class="beacon-copy-btn" data-clipboard="${encodeURIComponent(code.trim())}">\u{1F4CB} Copy</button></div><code class="language-${cleanLang}">${escapedCode}</code></pre>`
      });
      return id;
    });
    text = escapeHtml(text);
    text = text.replace(/^&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:^&gt;.*$\n?)+)/gim, (match, type, content) => {
      const cleanContent = content.replace(/^&gt;\s*/gm, "").trim();
      return `<blockquote><strong>${type}:</strong> ${cleanContent}</blockquote>
`;
    });
    text = text.replace(/^&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*$)/gim, (match, type, content) => {
      return `<blockquote><strong>${type}:</strong> ${content}</blockquote>`;
    });
    text = text.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    text = text.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    text = text.replace(/^# (.*$)/gim, "<h1>$1</h1>");
    text = text.replace(/^---$/gim, '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:12px 0;" />');
    text = text.replace(/^&gt;\s*(.*$)/gim, "<blockquote>$1</blockquote>");
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.*?)__/g, "<strong>$1</strong>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#00f59b; text-decoration:underline;">$1</a>');
    text = text.replace(/^\s*[-*]\s+(.*)$/gim, "<li>$1</li>");
    text = text.replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>");
    text = text.replace(/<\/ul>\s*<ul>/g, "");
    text = text.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ol-item">$1</li>');
    text = text.replace(/(<li class="ol-item">.*<\/li>)/gims, "<ol>$1</ol>");
    text = text.replace(/<\/ol>\s*<ol>/g, "");
    const paragraphs = text.split(/\n\n+/);
    text = paragraphs.map((p) => {
      p = p.trim();
      if (p.startsWith("<h") || p.startsWith("<pre") || p.startsWith("<ul") || p.startsWith("<ol") || p.startsWith("<block") || p.startsWith("<hr") || p.startsWith("%%BEACONCODEBLOCK")) {
        return p;
      }
      return `<p>${p.replace(/\n/g, "<br />")}</p>`;
    }).join("\n");
    for (const block of codeBlocks) {
      text = text.replace(block.id, block.html);
    }
    return text;
  }
  function bindCopyButtons(container) {
    if (!container) return;
    const buttons = container.querySelectorAll(".beacon-copy-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const encoded = btn.getAttribute("data-clipboard");
        if (!encoded) return;
        const code = decodeURIComponent(encoded);
        try {
          await navigator.clipboard.writeText(code);
          const originalHtml = btn.innerHTML;
          btn.innerHTML = "\u2705 Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove("copied");
          }, 2e3);
        } catch (err) {
          console.error("[Beacon AI] Copy failed:", err);
        }
      });
    });
  }

  // src/ui/components.js
  var BeaconUI = class {
    constructor({ onAction, onChat, onSaveSettings, onCheckHealth }) {
      this.onAction = onAction;
      this.onChat = onChat;
      this.onSaveSettings = onSaveSettings;
      this.onCheckHealth = onCheckHealth;
      this.isOpen = false;
      this.activeTab = "actions";
      this.isLoading = false;
      this.loadingActionName = "";
      this.context = null;
      this.hintLevel = 1;
      this.actionsExpanded = true;
      this.lastAction = null;
      this.lastActionPayload = null;
      this.responseTitle = "";
      this.responseText = "";
      this.error = null;
      this.chatHistory = [];
      this.backendStatus = "connecting";
      this.settings = {
        backendUrl: "http://localhost:3001",
        preferredLanguage: "python",
        model: "gemini-2.5-flash"
      };
      this.container = null;
      this.shadowRoot = null;
    }
    mount(hostElement) {
      this.shadowRoot = hostElement.attachShadow({ mode: "open" });
      this.container = document.createElement("div");
      this.container.className = "beacon-app-root";
      this.shadowRoot.appendChild(this.container);
      this.render();
      this.bindGlobalShortcuts();
    }
    setContext(newContext) {
      this.context = newContext;
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
    setLoading(isLoading, actionName = "") {
      this.isLoading = isLoading;
      this.loadingActionName = actionName;
      if (isLoading) {
        this.error = null;
        this.actionsExpanded = false;
      }
      this.render();
      if (isLoading) {
        setTimeout(() => {
          const skeleton = this.shadowRoot?.querySelector(".beacon-skeleton-box");
          if (skeleton) {
            skeleton.scrollIntoView({ behavior: "smooth", block: "start" });
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
        const stream = this.shadowRoot?.querySelector(".beacon-chat-stream");
        if (stream && stream.lastElementChild) {
          stream.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
          const respBox = this.shadowRoot?.querySelector(".beacon-response-box");
          respBox?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
    }
    executeAction(action, title) {
      let hintLevelToUse = this.hintLevel;
      if (action === "leetcode_hint") {
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
      this.chatHistory.push({ role: "user", content: title });
      this.activeTab = "chat";
      this.setLoading(true, title);
      this.onAction(action, this.context, options, (err, res) => {
        if (err) {
          this.chatHistory.push({
            role: "assistant",
            content: `\u26A0\uFE0F **Action Failed:** ${err.message || String(err)}`
          });
          this.setError(err.message || String(err));
        } else {
          this.chatHistory.push({
            role: "assistant",
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
        const stream = this.shadowRoot?.querySelector(".beacon-chat-stream");
        if (stream && stream.lastElementChild) {
          stream.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 50);
    }
    bindGlobalShortcuts() {
      window.addEventListener("keydown", (e) => {
        if (e.altKey && (e.key === "b" || e.key === "B")) {
          e.preventDefault();
          this.toggleSidebar();
        }
        if (e.key === "Escape" && this.isOpen) {
          this.isOpen = false;
          this.render();
        }
      });
    }
    updateStatusPill() {
      const pill = this.shadowRoot?.querySelector(".beacon-status-indicator");
      if (!pill) return;
      pill.className = `beacon-status-indicator ${this.backendStatus}`;
      const text = pill.querySelector(".status-text");
      if (text) {
        if (this.backendStatus === "online") text.innerText = "Gemini Ready";
        else if (this.backendStatus === "unconfigured") text.innerText = "Key Missing";
        else if (this.backendStatus === "connecting") text.innerText = "Connecting";
        else text.innerText = "Backend Offline";
      }
    }
    render() {
      if (!this.container) return;
      const ctx = this.context || {};
      const platform = ctx.platform || "General";
      const isLC = platform === "leetcode";
      const isGH = platform === "github";
      let badgeText = "Companion";
      if (isLC && ctx.slug) {
        badgeText = `${ctx.title || ctx.slug} [${ctx.difficulty || "M"}]`;
      } else if (isGH && ctx.number) {
        badgeText = `${ctx.type === "pull_request" ? "PR" : "Issue"} #${ctx.number}`;
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
      <aside class="beacon-sidebar ${this.isOpen ? "open" : ""}" id="beacon-sidebar">
        <!-- Header -->
        <header class="beacon-header">
          <div class="beacon-brand">
            <span style="font-size: 18px;">\u{1F7E2}</span>
            <div class="beacon-brand-name">Beacon AI</div>
            <div class="beacon-brand-tag">v1.0</div>
          </div>
          <div class="beacon-header-actions">
            <div class="beacon-status-indicator ${this.backendStatus}">
              <div class="dot"></div>
              <span class="status-text">
                ${this.backendStatus === "online" ? "Gemini Ready" : this.backendStatus === "unconfigured" ? "Key Missing" : this.backendStatus === "connecting" ? "Connecting" : "Offline"}
              </span>
            </div>
            <button class="beacon-icon-btn" id="btn-settings-toggle" title="Settings">\u2699\uFE0F</button>
            <button class="beacon-icon-btn" id="btn-close" title="Close (Esc)">\u2715</button>
          </div>
        </header>

        <!-- Active Context Banner -->
        <div class="beacon-context-card">
          <div class="beacon-context-meta">
            <div class="beacon-context-type">
              ${isLC ? "\u26A1 LeetCode Problem" : isGH ? `\u{1F419} GitHub ${ctx.type || "Repo"}` : "\u{1F310} Web Page"}
            </div>
            ${ctx.difficulty ? `<span class="beacon-difficulty-badge ${ctx.difficulty}">${ctx.difficulty}</span>` : ""}
            ${ctx.state ? `<span class="beacon-tag" style="color:#00f59b; border:1px solid #10b981;">${ctx.state}</span>` : ""}
          </div>
          <div class="beacon-context-title" title="${ctx.title || "Page Detected"}">
            ${ctx.title || "Scanning current page..."}
          </div>
          ${ctx.tags?.length ? `
            <div class="beacon-tag-list">
              ${ctx.tags.map((t) => `<span class="beacon-tag">${t}</span>`).join("")}
            </div>
          ` : ""}
        </div>

        <!-- Navigation Tabs -->
        <nav class="beacon-tabs">
          <button class="beacon-tab-btn ${this.activeTab === "actions" ? "active" : ""}" data-tab="actions">
            \u26A1 Actions
          </button>
          <button class="beacon-tab-btn ${this.activeTab === "chat" ? "active" : ""}" data-tab="chat">
            \u{1F4AC} Chat
          </button>
          <button class="beacon-tab-btn ${this.activeTab === "settings" ? "active" : ""}" data-tab="settings">
            \u2699\uFE0F Settings
          </button>
        </nav>

        <!-- Main Body Area -->
        <main class="beacon-body">
          ${this.renderActiveTabContent()}
        </main>

        <!-- Footer / Chat Input Bar (only in Chat tab) -->
        ${this.activeTab === "chat" ? this.renderChatInputBar() : ""}
      </aside>
    `;
      this.bindEvents();
      bindCopyButtons(this.shadowRoot);
    }
    renderActiveTabContent() {
      if (this.activeTab === "settings") {
        return this.renderSettingsTab();
      }
      if (this.activeTab === "chat") {
        return this.renderChatTab();
      }
      return this.renderActionsTab();
    }
    renderActionsTab() {
      const ctx = this.context || {};
      const isLC = ctx.platform === "leetcode";
      const isGH = ctx.platform === "github";
      const hasResponseOrLoading = Boolean(this.responseText || this.isLoading || this.error);
      return `
      <!-- Action Buttons Section -->
      <div class="beacon-actions-section">
        ${hasResponseOrLoading ? `
          <button class="beacon-actions-toggle-btn" id="btn-toggle-actions" title="Click to show/hide action shortcuts">
            <span>\u26A1 Available Actions</span>
            <span class="badge-pill">${this.actionsExpanded ? "\u25B4 Hide" : "\u25BE Show All"}</span>
          </button>
        ` : ""}

        <div class="beacon-actions-grid ${!this.actionsExpanded && hasResponseOrLoading ? "collapsed" : ""}">
          ${isLC ? this.renderLeetCodeActions() : isGH ? this.renderGitHubActions() : this.renderGeneralActions()}
        </div>
      </div>

      <!-- Loading State -->
      ${this.isLoading ? `
        <div class="beacon-response-box">
          <div class="beacon-skeleton-box">
            <div class="beacon-pulse-avatar">
              <div class="beacon-launcher-dot"></div>
              <span>Beacon is generating ${this.loadingActionName || "analysis"}...</span>
            </div>
            <div class="beacon-skeleton-line" style="width: 85%;"></div>
            <div class="beacon-skeleton-line" style="width: 95%;"></div>
            <div class="beacon-skeleton-line" style="width: 70%;"></div>
            <div class="beacon-skeleton-line" style="width: 90%;"></div>
          </div>
        </div>
      ` : ""}

      <!-- Error / Quota Alert -->
      ${this.error ? `
        <div class="beacon-alert error">
          <strong>\u26A0\uFE0F Action Failed</strong>
          <div>${this.error}</div>
          <button class="beacon-retry-btn" id="btn-retry-action">\u{1F504} Retry</button>
        </div>
      ` : ""}

      <!-- Backend Offline Warning -->
      ${this.backendStatus === "offline" && !this.error ? `
        <div class="beacon-alert warning">
          <strong>\u{1F50C} Backend Offline</strong>
          <div>Could not reach Beacon server at <code>${this.settings.backendUrl}</code>. Ensure the server is running (<code>npm start</code> in <code>server/</code>).</div>
          <button class="beacon-retry-btn" id="btn-retry-health">Check Connection</button>
        </div>
      ` : ""}

      <!-- Unconfigured Gemini Key Warning -->
      ${this.backendStatus === "unconfigured" && !this.error ? `
        <div class="beacon-alert warning">
          <strong>\u{1F511} Gemini API Key Required</strong>
          <div>Your backend server does not have <code>GEMINI_API_KEY</code> set in <code>server/.env</code>. Add your key from Google AI Studio.</div>
        </div>
      ` : ""}

      <!-- Response Viewer -->
      ${this.responseText && !this.isLoading ? `
        <div class="beacon-response-box" id="beacon-active-response">
          <div class="beacon-response-header">
            <span>\u2728 ${this.responseTitle || "Beacon Response"}</span>
            <div style="display:flex; gap:6px;">
              <button class="beacon-copy-btn" id="btn-view-in-chat" title="View in scrollable Chat">
                \u{1F4AC} Open in Chat
              </button>
              <button class="beacon-copy-btn" id="btn-copy-full-response">
                \u{1F4CB} Copy All
              </button>
            </div>
          </div>
          <div class="beacon-markdown">
            ${renderMarkdown(this.responseText)}
          </div>
        </div>
      ` : ""}
    `;
    }
    renderLeetCodeActions() {
      return `
      <button class="beacon-action-card" data-action="leetcode_explain">
        <span class="icon">\u2728</span>
        <span class="title">Explain Problem</span>
        <span class="desc">Mental model & requirements</span>
      </button>

      <button class="beacon-action-card" data-action="leetcode_hint">
        <span class="icon">\u{1F4A1}</span>
        <span class="title">Progressive Hint</span>
        <span class="desc">Socratic guidance without spoilers</span>
        <span class="badge">Next: Hint Level ${this.hintLevel}/3</span>
      </button>

      <button class="beacon-action-card" data-action="leetcode_approach">
        <span class="icon">\u{1F9E0}</span>
        <span class="title">Optimal Approach</span>
        <span class="desc">Data structures & key insight</span>
      </button>

      <button class="beacon-action-card" data-action="leetcode_complexity">
        <span class="icon">\u23F1\uFE0F</span>
        <span class="title">Big-O Complexity</span>
        <span class="desc">Rigorous Time & Space bounds</span>
      </button>

      <button class="beacon-action-card full-width" data-action="leetcode_solution">
        <span class="icon">\u{1F4BB}</span>
        <span class="title">Optimal Solution Walkthrough</span>
        <span class="desc">Clean ${this.settings.preferredLanguage.toUpperCase()} code + line-by-line explanation</span>
      </button>
    `;
    }
    renderGitHubActions() {
      const isPR = this.context?.type === "pull_request";
      const isRepo = this.context?.type === "repository";
      if (isRepo) {
        return `
        <button class="beacon-action-card full-width" data-action="github_repo_overview">
          <span class="icon">\u{1F4D6}</span>
          <span class="title">Repository Architecture Overview</span>
          <span class="desc">Tech stack, design & codebase structure</span>
        </button>
        <button class="beacon-action-card full-width" data-action="github_next_step">
          <span class="icon">\u{1F680}</span>
          <span class="title">Contributor Quickstart Guide</span>
          <span class="desc">How to set up and start contributing</span>
        </button>
      `;
      }
      if (isPR) {
        return `
        <button class="beacon-action-card" data-action="github_review">
          <span class="icon">\u{1F50D}</span>
          <span class="title">Review PR Changes</span>
          <span class="desc">Code smells, risks & suggestions</span>
        </button>
        <button class="beacon-action-card" data-action="github_explain">
          <span class="icon">\u2728</span>
          <span class="title">Explain Pull Request</span>
          <span class="desc">Executive summary & impact</span>
        </button>
        <button class="beacon-action-card" data-action="github_next_step">
          <span class="icon">\u{1F3AF}</span>
          <span class="title">Verification Steps</span>
          <span class="desc">Checklist before merge</span>
        </button>
        <button class="beacon-action-card" data-action="github_summarize">
          <span class="icon">\u{1F4DD}</span>
          <span class="title">Summarize Review</span>
          <span class="desc">Feedback & consensus</span>
        </button>
      `;
      }
      return `
      <button class="beacon-action-card" data-action="github_explain">
        <span class="icon">\u2728</span>
        <span class="title">Explain Issue</span>
        <span class="desc">Core problem & edge cases</span>
      </button>
      <button class="beacon-action-card" data-action="github_next_step">
        <span class="icon">\u{1F3AF}</span>
        <span class="title">Next Practical Step</span>
        <span class="desc">Concrete developer action plan</span>
      </button>
      <button class="beacon-action-card" data-action="github_debug">
        <span class="icon">\u{1F41B}</span>
        <span class="title">Debug & Root Cause</span>
        <span class="desc">Isolate bug & suggested fix</span>
      </button>
      <button class="beacon-action-card" data-action="github_summarize">
        <span class="icon">\u{1F4DD}</span>
        <span class="title">Summarize Thread</span>
        <span class="desc">Key comments & conclusions</span>
      </button>
    `;
    }
    renderGeneralActions() {
      return `
      <button class="beacon-action-card full-width" data-action="explain_page">
        <span class="icon">\u2728</span>
        <span class="title">Analyze Page</span>
        <span class="desc">Summarize context and purpose</span>
      </button>
    `;
    }
    renderChatTab() {
      const ctx = this.context || {};
      const isLC = ctx.platform === "leetcode";
      const isGH = ctx.platform === "github";
      const isPR = ctx.type === "pull_request";
      return `
      <!-- Quick Action Chips at the Top of Chat -->
      <div class="beacon-quick-actions-bar">
        <div class="beacon-quick-actions-title">\u26A1 Quick Actions:</div>
        <div class="beacon-quick-chips">
          ${isLC ? `
            <button class="beacon-action-chip" data-action="leetcode_explain">\u2728 Explain</button>
            <button class="beacon-action-chip" data-action="leetcode_hint">\u{1F4A1} Hint ${this.hintLevel}/3</button>
            <button class="beacon-action-chip" data-action="leetcode_approach">\u{1F9E0} Approach</button>
            <button class="beacon-action-chip" data-action="leetcode_complexity">\u23F1\uFE0F Complexity</button>
            <button class="beacon-action-chip" data-action="leetcode_solution">\u{1F4BB} Solution</button>
          ` : isGH ? `
            <button class="beacon-action-chip" data-action="github_explain">\u2728 Explain</button>
            <button class="beacon-action-chip" data-action="github_next_step">\u{1F3AF} Next Step</button>
            <button class="beacon-action-chip" data-action="github_debug">\u{1F41B} Debug</button>
            <button class="beacon-action-chip" data-action="github_summarize">\u{1F4DD} Summarize</button>
            ${isPR ? `<button class="beacon-action-chip" data-action="github_review">\u{1F50D} Review PR</button>` : ""}
          ` : `
            <button class="beacon-action-chip" data-action="explain_page">\u2728 Analyze</button>
          `}
        </div>
      </div>

      <div class="beacon-chat-stream">
        ${this.chatHistory.length === 0 ? `
          <div style="text-align: center; color: #8b949e; padding: 25px 10px;">
            <div style="font-size: 28px; margin-bottom: 6px;">\u{1F7E2}</div>
            <div style="font-weight: 600; color: #f0f6fc; margin-bottom: 4px;">Ask Beacon Anything</div>
            <div style="font-size: 12px;">Click a quick action above or type below to chat.</div>
          </div>
        ` : ""}

        ${this.chatHistory.map((msg) => `
          <div class="beacon-chat-msg ${msg.role}">
            <div class="beacon-chat-bubble">
              ${msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        `).join("")}

        ${this.isLoading ? `
          <div class="beacon-chat-msg assistant">
            <div class="beacon-chat-bubble" style="display:flex; align-items:center; gap:8px;">
              <div class="beacon-launcher-dot"></div>
              <span>Beacon is generating ${this.loadingActionName || "response"}...</span>
            </div>
          </div>
        ` : ""}
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
            placeholder="Ask about this ${this.context?.platform === "leetcode" ? "problem" : "task"}..."
          ></textarea>
          <button class="beacon-send-btn" id="btn-chat-send" title="Send message (Enter)">\u27A4</button>
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
            value="${this.settings.backendUrl || "http://localhost:3001"}"
            placeholder="http://localhost:3001"
          />
          <span style="font-size:11px; color:#8b949e;">Local Node.js backend handling Google Gemini requests.</span>
        </div>

        <div class="beacon-form-group">
          <label class="beacon-form-label">LeetCode Solution Language</label>
          <select class="beacon-form-select" id="setting-language">
            <option value="python" ${this.settings.preferredLanguage === "python" ? "selected" : ""}>Python 3</option>
            <option value="javascript" ${this.settings.preferredLanguage === "javascript" ? "selected" : ""}>JavaScript</option>
            <option value="typescript" ${this.settings.preferredLanguage === "typescript" ? "selected" : ""}>TypeScript</option>
            <option value="cpp" ${this.settings.preferredLanguage === "cpp" ? "selected" : ""}>C++</option>
            <option value="java" ${this.settings.preferredLanguage === "java" ? "selected" : ""}>Java</option>
            <option value="go" ${this.settings.preferredLanguage === "go" ? "selected" : ""}>Go</option>
            <option value="rust" ${this.settings.preferredLanguage === "rust" ? "selected" : ""}>Rust</option>
          </select>
        </div>

        <div class="beacon-form-group">
          <label class="beacon-form-label">Gemini Model</label>
          <select class="beacon-form-select" id="setting-model">
            <option value="gemini-2.5-flash" ${this.settings.model === "gemini-2.5-flash" ? "selected" : ""}>gemini-2.5-flash (Fast & Intelligent)</option>
            <option value="gemini-2.0-flash" ${this.settings.model === "gemini-2.0-flash" ? "selected" : ""}>gemini-2.0-flash (Fallback)</option>
            <option value="gemini-1.5-flash" ${this.settings.model === "gemini-1.5-flash" ? "selected" : ""}>gemini-1.5-flash</option>
            <option value="gemini-1.5-pro" ${this.settings.model === "gemini-1.5-pro" ? "selected" : ""}>gemini-1.5-pro (Deep Reasoning)</option>
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
      root.querySelector("#beacon-launcher")?.addEventListener("click", () => {
        this.toggleSidebar();
      });
      root.querySelector("#btn-close")?.addEventListener("click", () => {
        this.isOpen = false;
        this.render();
      });
      root.querySelector("#btn-settings-toggle")?.addEventListener("click", () => {
        this.activeTab = this.activeTab === "settings" ? "actions" : "settings";
        this.render();
      });
      root.querySelectorAll(".beacon-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.activeTab = btn.getAttribute("data-tab");
          this.render();
        });
      });
      root.querySelector("#btn-toggle-actions")?.addEventListener("click", () => {
        this.actionsExpanded = !this.actionsExpanded;
        this.render();
      });
      const sidebar = root.querySelector("#beacon-sidebar");
      sidebar?.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.isOpen = false;
          this.render();
        }
        e.stopPropagation();
      });
      sidebar?.addEventListener("keyup", (e) => {
        e.stopPropagation();
      });
      sidebar?.addEventListener("keypress", (e) => {
        e.stopPropagation();
      });
      sidebar?.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      sidebar?.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
      sidebar?.addEventListener("wheel", (e) => {
        e.stopPropagation();
      }, { passive: true });
      root.querySelectorAll(".beacon-action-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = card.getAttribute("data-action");
          const title = card.querySelector(".title")?.innerText || action;
          this.executeAction(action, title);
        });
      });
      root.querySelectorAll(".beacon-action-chip").forEach((chip) => {
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = chip.getAttribute("data-action");
          const title = chip.innerText.trim();
          this.executeAction(action, title);
        });
      });
      root.querySelector("#btn-view-in-chat")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.activeTab = "chat";
        this.render();
        setTimeout(() => {
          const stream = this.shadowRoot?.querySelector(".beacon-chat-stream");
          if (stream && stream.lastElementChild) {
            stream.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" });
          }
        }, 50);
      });
      root.querySelector("#btn-retry-action")?.addEventListener("click", (e) => {
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
      root.querySelector("#btn-retry-health")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onCheckHealth();
      });
      root.querySelector("#btn-test-connection")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onCheckHealth();
      });
      root.querySelector("#btn-copy-full-response")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const btn = root.querySelector("#btn-copy-full-response");
        if (!btn) return;
        try {
          await navigator.clipboard.writeText(this.responseText);
          const originalText = btn.innerHTML;
          btn.innerHTML = "\u2705 Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove("copied");
          }, 2e3);
        } catch (err) {
          console.error("Failed to copy response:", err);
        }
      });
      const chatInput = root.querySelector("#beacon-chat-input");
      const sendBtn = root.querySelector("#btn-chat-send");
      const handleSendChat = () => {
        const message = chatInput?.value?.trim();
        if (!message || this.isLoading) return;
        chatInput.value = "";
        chatInput.style.height = "42px";
        this.addChatMessage("user", message);
        this.setLoading(true, "Chat Response");
        this.onChat(message, this.context, this.settings, this.chatHistory, (err, res) => {
          if (err) {
            this.addChatMessage("assistant", `\u26A0\uFE0F **Error:** ${err.message || String(err)}`);
            this.setLoading(false);
          } else {
            this.addChatMessage("assistant", res.text);
            this.setLoading(false);
          }
        });
      };
      sendBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        handleSendChat();
      });
      chatInput?.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendChat();
        }
      });
      chatInput?.addEventListener("keyup", (e) => {
        e.stopPropagation();
      });
      chatInput?.addEventListener("keypress", (e) => {
        e.stopPropagation();
      });
      chatInput?.addEventListener("input", (e) => {
        e.stopPropagation();
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
      });
      if (this.activeTab === "chat") {
        setTimeout(() => {
          chatInput?.focus();
        }, 50);
      }
      root.querySelector("#btn-save-settings")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const backendUrl = root.querySelector("#setting-backend-url")?.value?.trim();
        const preferredLanguage = root.querySelector("#setting-language")?.value;
        const model = root.querySelector("#setting-model")?.value;
        const newSettings = {
          backendUrl: backendUrl || "http://localhost:3001",
          preferredLanguage,
          model
        };
        this.settings = newSettings;
        this.onSaveSettings(newSettings);
        const saveBtn = root.querySelector("#btn-save-settings");
        if (saveBtn) {
          saveBtn.innerText = "\u2705 Saved!";
          setTimeout(() => {
            this.activeTab = "actions";
            this.render();
          }, 800);
        }
      });
    }
  };

  // src/index.js
  var uiInstance = null;
  var lastUrl = window.location.href;
  function initBeacon() {
    if (document.getElementById("beacon-ai-root")) {
      return;
    }
    const host = document.createElement("div");
    host.id = "beacon-ai-root";
    document.body.appendChild(host);
    uiInstance = new BeaconUI({
      onAction: handleAction,
      onChat: handleChat,
      onSaveSettings: handleSaveSettings,
      onCheckHealth: checkBackendHealth
    });
    uiInstance.mount(host);
    loadSettings();
    setTimeout(() => {
      refreshContext();
      checkBackendHealth();
    }, 500);
    setupNavigationWatchers();
    console.log("\u{1F7E2} Beacon AI successfully mounted with Shadow DOM isolation!");
  }
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
  function checkBackendHealth() {
    if (!uiInstance) return;
    uiInstance.setBackendStatus("connecting");
    chrome.runtime.sendMessage({ type: "CHECK_BACKEND" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[Beacon AI] Runtime message error:", chrome.runtime.lastError.message);
        uiInstance.setBackendStatus("offline");
        return;
      }
      if (response?.success && response.data) {
        if (response.data.configured) {
          uiInstance.setBackendStatus("online");
        } else {
          uiInstance.setBackendStatus("unconfigured");
        }
      } else {
        uiInstance.setBackendStatus("offline");
      }
    });
  }
  function handleAction(action, context, options, callback) {
    chrome.runtime.sendMessage(
      {
        type: "EXECUTE_ACTION",
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
          callback(new Error(response?.error || "Action failed"));
        }
      }
    );
  }
  function handleChat(message, context, settings, history2, callback) {
    chrome.runtime.sendMessage(
      {
        type: "SEND_CHAT",
        message,
        context,
        options: {
          language: settings.preferredLanguage,
          model: settings.model
        },
        history: history2
      },
      (response) => {
        if (chrome.runtime.lastError) {
          callback(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.success) {
          callback(null, response);
        } else {
          callback(new Error(response?.error || "Chat request failed"));
        }
      }
    );
  }
  function loadSettings() {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (res) => {
      if (res?.success && res.settings) {
        uiInstance?.setSettings(res.settings);
      }
    });
  }
  function handleSaveSettings(settings) {
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings }, () => {
      checkBackendHealth();
    });
  }
  function setupNavigationWatchers() {
    document.addEventListener("turbo:render", () => {
      setTimeout(refreshContext, 300);
    });
    document.addEventListener("pjax:end", () => {
      setTimeout(refreshContext, 300);
    });
    window.addEventListener("popstate", () => {
      setTimeout(refreshContext, 300);
    });
    const wrapHistory = (type) => {
      const orig = history[type];
      return function(...args) {
        const res = orig.apply(this, args);
        window.dispatchEvent(new Event("beacon:locationchange"));
        return res;
      };
    };
    history.pushState = wrapHistory("pushState");
    history.replaceState = wrapHistory("replaceState");
    window.addEventListener("beacon:locationchange", () => {
      setTimeout(refreshContext, 400);
    });
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        refreshContext();
      }
    }, 1e3);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBeacon);
  } else {
    initBeacon();
  }
})();
