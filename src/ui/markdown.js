/**
 * Safe, Lightweight Markdown Renderer for Beacon AI
 * Includes code block headers, syntax classes, and copy button bindings.
 */

/**
 * Escapes raw HTML characters to prevent XSS
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders Markdown into safe HTML with interactive code blocks
 */
export function renderMarkdown(markdown) {
  if (!markdown) return '';

  // Normalize Windows CRLF to LF
  let text = markdown.replace(/\r\n/g, '\n');

  const codeBlocks = [];

  // 1. Extract fenced code blocks first so they aren't mangled by paragraph/list regex
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const id = `%%BEACONCODEBLOCK${codeBlocks.length}%%`;
    const cleanLang = lang.trim() || 'code';
    const escapedCode = escapeHtml(code.trim());
    codeBlocks.push({
      id,
      html: `<pre><div class="beacon-code-header"><span>${cleanLang}</span><button class="beacon-copy-btn" data-clipboard="${encodeURIComponent(code.trim())}">📋 Copy</button></div><code class="language-${cleanLang}">${escapedCode}</code></pre>`
    });
    return id;
  });

  // 2. Escape HTML for the rest of the text
  text = escapeHtml(text);

  // 3. Multi-line Alert Callouts (> [!NOTE] followed by > text)
  text = text.replace(/^&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:^&gt;.*$\n?)+)/gim, (match, type, content) => {
    const cleanContent = content.replace(/^&gt;\s*/gm, '').trim();
    return `<blockquote><strong>${type}:</strong> ${cleanContent}</blockquote>\n`;
  });
  text = text.replace(/^&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*$)/gim, (match, type, content) => {
    return `<blockquote><strong>${type}:</strong> ${content}</blockquote>`;
  });

  // 4. Headers
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 5. Horizontal rules
  text = text.replace(/^---$/gim, '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:12px 0;" />');

  // 6. Blockquotes
  text = text.replace(/^&gt;\s*(.*$)/gim, '<blockquote>$1</blockquote>');

  // 7. Bold and Italics
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 8. Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 9. Markdown Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#00f59b; text-decoration:underline;">$1</a>');

  // 10. Unordered Lists
  text = text.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  text = text.replace(/<\/ul>\s*<ul>/g, '');

  // 11. Numbered Lists
  text = text.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ol-item">$1</li>');
  text = text.replace(/(<li class="ol-item">.*<\/li>)/gims, '<ol>$1</ol>');
  text = text.replace(/<\/ol>\s*<ol>/g, '');

  // 12. Paragraphs (double newlines)
  const paragraphs = text.split(/\n\n+/);
  text = paragraphs.map(p => {
    p = p.trim();
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<block') || p.startsWith('<hr') || p.startsWith('%%BEACONCODEBLOCK')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');

  // 13. Restore code blocks
  for (const block of codeBlocks) {
    text = text.replace(block.id, block.html);
  }

  return text;
}

/**
 * Attaches interactive copy functionality to all copy buttons inside container
 */
export function bindCopyButtons(container) {
  if (!container) return;
  const buttons = container.querySelectorAll('.beacon-copy-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const encoded = btn.getAttribute('data-clipboard');
      if (!encoded) return;

      const code = decodeURIComponent(encoded);
      try {
        await navigator.clipboard.writeText(code);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('[Beacon AI] Copy failed:', err);
      }
    });
  });
}
