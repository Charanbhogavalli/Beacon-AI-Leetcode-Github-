/**
 * Frontend Unit Tests: Markdown Renderer and Context Extractors
 */
import { renderMarkdown } from '../../src/ui/markdown.js';
import { extractGitHubContext, isGitHub } from '../../src/extractors/github.js';
import { extractLeetCodeContext, isLeetCode } from '../../src/extractors/leetcode.js';

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    failed++;
  }
}

console.log('🧪 Running Frontend Unit Tests...\n');

// 1. Markdown Renderer Tests
console.log('--- Markdown Renderer ---');
const sampleMd = [
  '# Beacon AI Analysis',
  '## Problem Summary',
  'Here is the core logic:',
  '',
  '```python',
  'def two_sum(nums, target):',
  '    seen = {}',
  '    for i, num in enumerate(nums):',
  '        diff = target - num',
  '        if diff in seen:',
  '            return [seen[diff], i]',
  '        seen[num] = i',
  '    return []',
  '```',
  '',
  '> [!NOTE]',
  '> Time complexity is O(N) and Space complexity is O(N).',
  '',
  '- Step 1: Initialize hash map',
  '- Step 2: Iterate through nums'
].join('\n');

const rendered = renderMarkdown(sampleMd);
assert(rendered.includes('<h1>Beacon AI Analysis</h1>'), 'Renders h1 heading');
assert(rendered.includes('<h2>Problem Summary</h2>'), 'Renders h2 heading');
assert(rendered.includes('<pre>') && rendered.includes('<code class="language-python">'), 'Renders syntax-tagged code block');
assert(rendered.includes('data-clipboard='), 'Equips code block with clipboard attribute');
assert(rendered.includes('<blockquote><strong>NOTE:</strong>'), 'Renders GitHub-style alert callout');
assert(rendered.includes('<li>Step 1: Initialize hash map</li>'), 'Renders unordered list items');

// 2. Extractor Tests with Mock DOM
console.log('\n--- DOM Context Extractors ---');

// Mock window and document
global.window = {
  location: {
    hostname: 'github.com',
    pathname: '/facebook/react/issues/1000',
    href: 'https://github.com/facebook/react/issues/1000'
  }
};

global.document = {
  title: 'Bug in reconciler · #1000 · facebook/react',
  querySelector: (sel) => {
    if (sel.includes('issue-title') || sel.includes('bdi')) return { innerText: 'Bug in reconciler' };
    if (sel.includes('State')) return { innerText: 'Open' };
    if (sel.includes('author')) return { innerText: 'gaearon' };
    if (sel.includes('comment-body')) return { innerText: 'Fiber crashes on suspense boundary.' };
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('IssueLabel')) return [{ innerText: 'Component: Reconciler' }, { innerText: 'Type: Bug' }];
    if (sel.includes('comment-body')) return [{ innerText: 'Fiber crashes on suspense boundary.' }, { innerText: 'I can reproduce this.' }];
    return [];
  }
};

assert(isGitHub() === true, 'isGitHub() returns true for github.com');
const ghContext = extractGitHubContext();
assert(ghContext.platform === 'github', 'Platform is github');
assert(ghContext.type === 'issue', 'Extracts type as issue');
assert(ghContext.repo === 'facebook/react', 'Extracts repo name');
assert(ghContext.number === '1000', 'Extracts issue number');
assert(ghContext.title === 'Bug in reconciler', 'Extracts issue title');
assert(ghContext.author === 'gaearon', 'Extracts author');
assert(ghContext.labels.includes('Component: Reconciler'), 'Extracts issue labels');
assert(ghContext.comments.length > 0, 'Extracts discussion comments');

// Test LeetCode Mock
global.window.location = {
  hostname: 'leetcode.com',
  pathname: '/problems/two-sum/description/',
  href: 'https://leetcode.com/problems/two-sum/description/'
};

global.document = {
  title: 'Two Sum - LeetCode',
  querySelector: (sel) => {
    if (sel.includes('question-title') || sel.includes('text-title-large')) return { innerText: '1. Two Sum' };
    if (sel.includes('elfjS') || sel.includes('description_content')) return {
      innerText: 'Given an array of integers nums and an integer target, return indices of the two numbers.\nConstraints:\n2 <= nums.length <= 104',
      querySelectorAll: () => [{ innerText: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]' }]
    };
    if (sel.includes('button')) return { innerText: 'Python3' };
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('text-difficulty-') || sel.includes('text-olive')) return [{ innerText: 'Easy' }];
    if (sel.includes('topic-tag')) return [{ innerText: 'Array' }, { innerText: 'Hash Table' }];
    if (sel.includes('monaco-editor')) return [{ innerText: 'class Solution:\n    def twoSum(self, nums, target):\n        pass' }];
    return [];
  }
};

assert(isLeetCode() === true, 'isLeetCode() returns true for leetcode.com');
const lcContext = extractLeetCodeContext();
assert(lcContext.platform === 'leetcode', 'Platform is leetcode');
assert(lcContext.type === 'problem', 'Extracts type as problem');
assert(lcContext.slug === 'two-sum', 'Extracts slug');
assert(lcContext.difficulty === 'Easy', 'Extracts difficulty');
assert(lcContext.tags.includes('Array') && lcContext.tags.includes('Hash Table'), 'Extracts topic tags');
assert(lcContext.language === 'python', 'Extracts selected language');

console.log(`\n=========================================`);
console.log(`Frontend Test Results: ${passed} passed, ${failed} failed`);
console.log(`=========================================\n`);

process.exit(failed > 0 ? 1 : 0);
