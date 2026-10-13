/**
 * GitHub DOM Context Extractor for Beacon AI
 */

export function isGitHub() {
  return window.location.hostname === 'github.com';
}

export function extractGitHubContext() {
  if (!isGitHub()) return null;

  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) {
    return {
      platform: 'github',
      type: 'home',
      title: 'GitHub Home',
      url: window.location.href
    };
  }

  const owner = parts[0];
  const repo = parts[1];
  const repoFullName = parts.length >= 2 ? `${owner}/${repo}` : null;

  // 1. Issue Page (/owner/repo/issues/123)
  if (parts[2] === 'issues' && parts[3]) {
    const issueNumber = parts[3];
    const titleEl = document.querySelector('bdi, .gh-header-title, [data-testid="issue-title"]');
    const title = titleEl ? titleEl.innerText.trim() : document.title.replace(` · #${issueNumber} · ${repoFullName}`, '').trim();

    const stateEl = document.querySelector('.State, [title*="Status:"], span[data-component="PHState"]');
    const state = stateEl ? stateEl.innerText.trim() : 'Unknown';

    const authorEl = document.querySelector('.author, [data-testid="issue-header-author"]');
    const author = authorEl ? authorEl.innerText.trim() : 'Unknown';

    // First issue description body
    const bodyEl = document.querySelector('.comment-body, .markdown-body, [data-testid="issue-body"]');
    const body = bodyEl ? bodyEl.innerText.trim() : '';

    // Labels
    const labelEls = document.querySelectorAll('.IssueLabel, a[data-name], [data-testid="issue-labels"] a');
    const labels = Array.from(labelEls).map(el => el.innerText.trim()).filter(Boolean);

    // Discussion comments
    const commentEls = document.querySelectorAll('.timeline-comment .comment-body, [data-testid="comment-body"]');
    const comments = Array.from(commentEls).slice(1, 6).map(el => el.innerText.trim()).filter(Boolean);

    return {
      platform: 'github',
      type: 'issue',
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

  // 2. Pull Request Page (/owner/repo/pull/123)
  if (parts[2] === 'pull' && parts[3]) {
    const prNumber = parts[3];
    const titleEl = document.querySelector('bdi, .gh-header-title, [data-testid="pr-title"]');
    const title = titleEl ? titleEl.innerText.trim() : document.title.replace(` · #${prNumber} · ${repoFullName}`, '').trim();

    const stateEl = document.querySelector('.State, [title*="Status:"], span[data-component="PHState"]');
    const state = stateEl ? stateEl.innerText.trim() : 'Unknown';

    const authorEl = document.querySelector('.author, [data-testid="pr-header-author"]');
    const author = authorEl ? authorEl.innerText.trim() : 'Unknown';

    const bodyEl = document.querySelector('.comment-body, .markdown-body');
    const body = bodyEl ? bodyEl.innerText.trim() : '';

    const labelEls = document.querySelectorAll('.IssueLabel, a[data-name]');
    const labels = Array.from(labelEls).map(el => el.innerText.trim()).filter(Boolean);

    // Diffs / Changed Files stats
    const diffstatEl = document.querySelector('#diffstat, .diffstat, [data-testid="diff-stat"]');
    const diffSummary = diffstatEl ? diffstatEl.innerText.trim() : '';

    const changedFileEls = document.querySelectorAll('.file-info a, [data-tag="file-path"]');
    const changedFiles = Array.from(changedFileEls).slice(0, 15).map(el => el.innerText.trim()).filter(Boolean);

    const comments = Array.from(document.querySelectorAll('.timeline-comment .comment-body'))
      .slice(1, 6)
      .map(el => el.innerText.trim())
      .filter(Boolean);

    return {
      platform: 'github',
      type: 'pull_request',
      repo: repoFullName,
      number: prNumber,
      title,
      state,
      author,
      labels,
      body,
      diffSummary: `${diffSummary}\nFiles: ${changedFiles.join(', ')}`,
      comments,
      url: window.location.href
    };
  }

  // 3. Repository Root or Code Tree (/owner/repo)
  if (parts.length === 2 || (parts.length > 2 && parts[2] === 'tree')) {
    const descEl = document.querySelector('p.f4.my-3, [data-testid="repo-description"]');
    const description = descEl ? descEl.innerText.trim() : '';

    const starsEl = document.querySelector('#repo-stars-counter-star, [aria-label*="starred"]');
    const stars = starsEl ? starsEl.innerText.trim() : '';

    const langEls = document.querySelectorAll('.repository-lang-stats-numbers li, [data-ga-click*="Repository, language"]');
    const languages = Array.from(langEls).map(el => el.innerText.trim()).filter(Boolean);

    const readmeEl = document.querySelector('#readme article, .markdown-body');
    const readme = readmeEl ? readmeEl.innerText.slice(0, 4000).trim() : '';

    return {
      platform: 'github',
      type: 'repository',
      repo: repoFullName,
      title: repoFullName,
      description,
      stars,
      language: languages[0] || 'Unknown',
      readme,
      url: window.location.href
    };
  }

  // 4. Code Blob (/owner/repo/blob/...)
  if (parts[2] === 'blob') {
    const filename = parts.slice(4).join('/');
    const codeEl = document.querySelector('.blob-wrapper, [data-tag="blob-code-inner"], .react-blob-print-hide');
    const code = codeEl ? codeEl.innerText.slice(0, 5000).trim() : '';

    return {
      platform: 'github',
      type: 'blob',
      repo: repoFullName,
      title: filename || 'Source File',
      filename,
      userCode: code,
      url: window.location.href
    };
  }

  // Generic fallback
  return {
    platform: 'github',
    type: 'general',
    repo: repoFullName || 'GitHub',
    title: document.title.replace(' · GitHub', '').trim(),
    url: window.location.href
  };
}
