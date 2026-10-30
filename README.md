# 🟢 Beacon AI — Contextual AI Coding Companion

> **Beacon AI** is an intelligent, developer-first Chrome extension companion for **GitHub** and **LeetCode**, powered by **OpenAI** (`gpt-4o-mini`, `gpt-4o`, `o3-mini`) and **Google Gemini** (`gemini-2.5-flash`).

---

## 🌟 Features

### 🐙 GitHub Companion
- **Issue Breakdown**: Plain-English executive summary, key requirements, breaking changes, and relevant files.
- **Actionable Next Steps**: Concrete checklists with filenames, tests, and commit advice.
- **Root-Cause Debugging**: Pinpoint suspected failure causes, edge cases, and patch snippets.
- **PR Code Review**: Senior-engineer level code review evaluating security, race conditions, code smells, and performance.
- **Discussion Summarization**: Summarize thread sentiment, consensus, and action items.
- **Repository Architecture Overview**: High-level system design, module map, and contributor setup guide.

### ⚡ LeetCode Companion
- **Problem Statement & Mental Model**: Intuitive conceptual explanation with real-world analogies.
- **Socratic Progressive Hints**:
  - *Level 1 (Intuition)*: Subtle nudge on the core mental model.
  - *Level 2 (Data Structure & Pattern)*: Reveal the optimal pattern (e.g., Two Pointers, Monotonic Stack, DP).
  - *Level 3 (Invariant & Transition)*: Exact state transition and base cases without spoiling the solution.
- **Optimal Approach**: Step-by-step algorithmic technique and clean pseudocode.
- **Big-O Complexity Breakdown**: Mathematical justification for Time & Space complexity.
- **Optimal Solution Walkthrough**: Clean, fully commented solution in your language of choice (**Python, JavaScript, TypeScript, C++, Java, Go, Rust**) with a line-by-line breakdown.

### 🎨 Premium Developer UI/UX
- **Obsidian & Emerald Aesthetic**: Sophisticated dark theme (`#0d1117`) with glowing mint/emerald accents (`#10b981`, `#00f59b`).
- **Complete Style Isolation**: 100% Shadow DOM container ensuring zero CSS bleed or conflict with host sites.
- **Interactive Floating Launcher**: Subtle glow, active context badge (e.g. `LeetCode: Two Sum [Easy]` or `Issue #1000`), draggable/docked.
- **Interactive Chat**: Follow-up discussion retaining conversation history and page context.
- **Keyboard Shortcuts**: `Alt+B` toggles sidebar, `Esc` closes, `Enter` sends message.
- **Formatted Markdown & Copy Buttons**: Formatted code blocks with language labels and one-click copy buttons.

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐           ┌─────────────────────────────┐
│  Browser: GitHub & LeetCode     │           │  Local Node.js Service      │
│                                 │           │  (Port 3001)                │
│  ┌───────────────────────────┐  │           │                             │
│  │ Context Extractors        │  │           │  ┌───────────────────────┐  │
│  │ (GitHub & LeetCode DOM)   │  │           │  │ Express API           │  │
│  └─────────────┬─────────────┘  │           │  │ (Rate Limit, Helmet)  │  │
│                │                │  Messages │  └───────────┬───────────┘  │
│  ┌─────────────▼─────────────┐  ├──────────►│              │              │
│  │ Shadow DOM Beacon Studio  │  │           │  ┌───────────▼───────────┐  │
│  │ (Launcher, Panel, Chat)   │  │           │  │ Google GenAI SDK      │  │
│  └─────────────┬─────────────┘  │           │  │ (@google/genai)       │  │
│                │                │           │  └───────────┬───────────┘  │
│  ┌─────────────▼─────────────┐  │           └──────────────┼──────────────┘
│  │ background.js (MV3)       │  │                          │
│  └───────────────────────────┘  │                          ▼
└─────────────────────────────────┘              Google Gemini API
                                           (gemini-2.5-flash / fallback)
```

---

## 🚀 Quickstart

### Method A: Direct Mode (Instant — No Server Required) ⚡

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select this folder (or download `beacon-ai.zip` from Releases and unzip).
4. Navigate to any [GitHub Issue / PR](https://github.com) or [LeetCode Problem](https://leetcode.com/problems/two-sum/).
5. Click the floating **🟢 Beacon** launcher at the bottom-right or press **`Alt+B`**.
6. Click the ⚙️ **Settings** icon:
   - Select **Connection Mode: Direct Browser Mode**.
   - Paste your **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/app/apikey)) or **OpenAI API Key**.
   - Click **Save Settings** (or click **Test Connection** to verify).
7. That's it! Beacon AI is immediately ready to analyze code, generate hints, and assist you.

---

### Method B: Self-Hosted Server Mode (Optional) 🖥️

If you prefer proxying requests through your own local Node.js service:

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Configure your API Key
cp .env.example .env
# Edit .env and set your key:
# AI_PROVIDER=gemini
# GEMINI_API_KEY=AIzaSy...

# 4. Start the server
npm start
```

The server runs on `http://localhost:3001`. In the extension Settings, switch Connection Mode to **Backend Server**.

---

## 🛠️ Development & Testing

```bash
# Run all automated tests (Frontend extractors, Markdown renderer, Backend routes, Gemini integration)
npm test

# Rebuild extension content script bundle
npm run build

# Watch mode for automatic rebuild during extension UI development
npm run watch

# Start backend in development mode (with auto-reload)
npm run server:dev
```

---

## 🔒 Security & Privacy

- **Zero API Key Leakage**: The Google Gemini API key resides strictly in `server/.env` and is never included in extension bundles or git history.
- **Local Isolation**: Extension requests route to your local backend (`localhost:3001`).
- **Input Sanitization**: HTML output is strictly escaped and code blocks are sanitized to prevent injection attacks.
- **Request Bounding**: Context payloads are bounded and rate-limited to avoid memory denial or quota exhaustion.
