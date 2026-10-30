/**
 * API Test Suite for Beacon AI Server
 */
import http from 'http';
import { app } from '../server.js';
import { isConfigured, getActiveProvider } from '../provider.js';
import { formatOpenAIError, isOpenAIConfigured } from '../openai.js';
import { formatGeminiError } from '../gemini.js';
import { buildPrompt } from '../prompts.js';

async function runTests() {
  console.log('🧪 Starting Beacon AI Backend Test Suite...\n');

  let passed = 0;
  let failed = 0;
  let serverInstance = null;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Prompt Builder Unit Tests
  console.log('--- Unit Tests: Prompt Builder ---');
  try {
    const leetExplain = buildPrompt('leetcode_explain', {
      context: { title: 'Two Sum', difficulty: 'Easy', description: 'Given an array of integers...' }
    });
    assert(leetExplain.prompt.includes('Two Sum') && leetExplain.prompt.includes('Easy'), 'buildPrompt generates LeetCode explanation prompt');

    const leetHint1 = buildPrompt('leetcode_hint', {
      context: { title: 'Two Sum' },
      options: { hintLevel: 1 }
    });
    assert(leetHint1.prompt.includes('Level 1') && leetHint1.prompt.includes('Intuition'), 'buildPrompt generates Level 1 hint');

    const ghExplain = buildPrompt('github_explain', {
      context: { type: 'issue', title: 'Bug in parser', number: 42, repo: 'owner/repo', body: 'Crash on line 10' }
    });
    assert(ghExplain.prompt.includes('#42') && ghExplain.prompt.includes('Bug in parser'), 'buildPrompt generates GitHub issue explanation');
  } catch (err) {
    console.error('Prompt builder test failed with error:', err);
    failed++;
  }

  // Test 2: Error Formatter Unit Tests
  console.log('\n--- Unit Tests: Error Formatters ---');
  try {
    const geminiErr = formatGeminiError(new Error('API_KEY_INVALID'));
    assert(geminiErr.includes('Invalid Gemini API key'), 'formatGeminiError handles API_KEY_INVALID');

    const openAiAuthErr = formatOpenAIError(new Error('401 Incorrect API key'));
    assert(openAiAuthErr.includes('Invalid OpenAI API key'), 'formatOpenAIError handles 401 Incorrect API key');

    const openAiQuotaErr = formatOpenAIError(new Error('429 insufficient_quota'));
    assert(openAiQuotaErr.includes('quota exceeded'), 'formatOpenAIError handles 429 quota error');
  } catch (err) {
    console.error('Error formatter test failed with error:', err);
    failed++;
  }

  // Test 3: HTTP Integration Tests
  console.log('\n--- Integration Tests: Server Endpoints ---');

  // Start in-process test server on an ephemeral port
  const testPort = await new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      resolve(serverInstance.address().port);
    });
  });

  const BASE_URL = `http://localhost:${testPort}`;

  async function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    // Health check
    const health = await makeRequest('/api/health');
    assert(health.status === 200, 'GET /api/health returns 200 status');
    assert(health.body.status === 'ok', 'Health status is ok');
    assert(typeof health.body.provider === 'string', 'Provider field present in health check');
    assert(Array.isArray(health.body.supportedModels), 'Supported models array present in health check');

    // Models check
    const models = await makeRequest('/api/models');
    assert(models.status === 200 && Array.isArray(models.body.models), 'GET /api/models returns model list');

    // Action validation
    const badAction = await makeRequest('/api/action', 'POST', {});
    assert(badAction.status === 400, 'POST /api/action returns 400 on empty body');

    const badChat = await makeRequest('/api/chat', 'POST', {});
    assert(badChat.status === 400, 'POST /api/chat returns 400 on empty body');

    // Config status & Provider verification
    const activeProvider = getActiveProvider();
    const configured = isConfigured(activeProvider);
    console.log(`\n  ℹ️ Active Provider: ${activeProvider.toUpperCase()} (Configured: ${configured})`);

    if (configured) {
      console.log(`\n--- Live ${activeProvider.toUpperCase()} API Integration Test ---`);
      const testAction = await makeRequest('/api/action', 'POST', {
        action: 'leetcode_explain',
        context: {
          platform: 'leetcode',
          title: 'Two Sum',
          difficulty: 'Easy',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
        }
      });
      assert(testAction.status === 200, `Live ${activeProvider} action returned 200`);
      assert(testAction.body.success === true && typeof testAction.body.text === 'string', 'Live action returned generated text');
      console.log(`     Model used: ${testAction.body.modelUsed}`);
    } else {
      console.log(`  ℹ️ Provider '${activeProvider}' is not yet populated with a live key. Testing 503 error handling...`);
      const testAction = await makeRequest('/api/action', 'POST', {
        action: 'leetcode_explain',
        context: { platform: 'leetcode', title: 'Two Sum' }
      });
      assert(testAction.status === 503, 'Unconfigured API key correctly returns 503 Service Unavailable');
    }

  } catch (err) {
    console.error('Server endpoint test failed:', err.message);
    failed++;
  } finally {
    if (serverInstance) {
      await new Promise(resolve => serverInstance.close(resolve));
    }
  }

  console.log(`\n=========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`=========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
