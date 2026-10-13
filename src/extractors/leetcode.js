/**
 * LeetCode DOM Context Extractor for Beacon AI
 */

export function isLeetCode() {
  const host = window.location.hostname;
  return host === 'leetcode.com' || host === 'leetcode.cn';
}

export function extractLeetCodeContext() {
  if (!isLeetCode()) return null;

  const path = window.location.pathname;
  const match = path.match(/\/problems\/([^/]+)/);

  if (!match) {
    return {
      platform: 'leetcode',
      type: 'general',
      title: 'LeetCode',
      url: window.location.href
    };
  }

  const slug = match[1];

  // 1. Problem Title
  let title = '';
  const titleEl = document.querySelector(
    'div[data-cy="question-title"], span[class*="text-title-large"], div[class*="text-title-large"], h4[data-cypress="QuestionTitle"]'
  );
  if (titleEl) {
    title = titleEl.innerText.trim();
  } else {
    // Fallback: capitalize slug words (e.g. "two-sum" -> "Two Sum")
    title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // 2. Difficulty (Easy, Medium, Hard)
  let difficulty = 'Medium';
  const diffCandidates = document.querySelectorAll(
    'div[class*="text-difficulty-"], div[class*="text-olive"], div[class*="text-yellow"], div[class*="text-pink"], span[class*="difficulty"]'
  );
  for (const el of diffCandidates) {
    const text = el.innerText.trim();
    if (['Easy', 'Medium', 'Hard'].includes(text)) {
      difficulty = text;
      break;
    }
  }

  // If not found above, scan all text nodes for standalone Easy/Medium/Hard
  if (!difficulty || difficulty === 'Medium') {
    const badges = Array.from(document.querySelectorAll('div, span'))
      .filter(el => ['Easy', 'Medium', 'Hard'].includes(el.innerText?.trim()) && el.children.length === 0);
    if (badges.length > 0) {
      difficulty = badges[0].innerText.trim();
    }
  }

  // 3. Topic Tags
  const tagEls = document.querySelectorAll('a[href*="/tag/"], div[class*="topic-tag"], a[class*="topic-tag"]');
  const tags = Array.from(tagEls).map(el => el.innerText.trim()).filter(Boolean);

  // 4. Problem Description / Body
  const descEl = document.querySelector(
    'div.elfjS, div[data-track-load="description_content"], div[class*="_1l1M"], div.content__uRqi, [data-key="description-content"]'
  );
  const rawDesc = descEl ? descEl.innerText.trim() : '';

  // Separate Examples and Constraints if discernible
  let description = rawDesc;
  const examples = [];
  const constraints = [];

  if (rawDesc) {
    // Extract constraints section
    const constraintSplit = rawDesc.split(/Constraints:|Follow up:/i);
    if (constraintSplit.length > 1) {
      description = constraintSplit[0].trim();
      const constraintLines = constraintSplit[1].split('\n').map(l => l.trim()).filter(Boolean);
      constraints.push(...constraintLines.slice(0, 10));
    }

    // Extract example blocks
    const preEls = descEl ? descEl.querySelectorAll('pre, [class*="example"]') : [];
    preEls.forEach(el => {
      const text = el.innerText.trim();
      if (text && text.length < 1000) {
        examples.push(text);
      }
    });
  }

  // 5. User Code Editor Attempt
  let userCode = '';
  const monacoLines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
  if (monacoLines.length > 0) {
    userCode = Array.from(monacoLines).map(l => l.innerText).join('\n').trim();
  } else {
    const codeMirror = document.querySelector('.CodeMirror-code');
    if (codeMirror) {
      userCode = codeMirror.innerText.trim();
    }
  }

  // 6. Selected Programming Language
  let language = 'python';
  const langButton = document.querySelector(
    'button[id*="headlessui-listbox-button"], div[class*="rounded"] button'
  );
  if (langButton) {
    const btnText = langButton.innerText.toLowerCase();
    if (btnText.includes('python')) language = 'python';
    else if (btnText.includes('javascript') || btnText.includes('js')) language = 'javascript';
    else if (btnText.includes('typescript') || btnText.includes('ts')) language = 'typescript';
    else if (btnText.includes('c++') || btnText.includes('cpp')) language = 'cpp';
    else if (btnText.includes('java')) language = 'java';
    else if (btnText.includes('go')) language = 'go';
    else if (btnText.includes('rust')) language = 'rust';
  }

  return {
    platform: 'leetcode',
    type: 'problem',
    slug,
    title,
    difficulty,
    tags: Array.from(new Set(tags)).slice(0, 8),
    description: description.slice(0, 6000),
    examples: examples.slice(0, 3),
    constraints,
    userCode: userCode.slice(0, 4000),
    language,
    url: window.location.href
  };
}
