/**
 * System instructions and prompt templates for Beacon AI
 */

export const SYSTEM_INSTRUCTION = `You are Beacon AI, an elite AI coding companion integrated into GitHub and LeetCode.
Your mission is to provide concise, intelligent, practical, and beautifully formatted developer assistance.

Formatting rules:
- Format all responses in clean GitHub Flavored Markdown.
- Use fenced code blocks with language tags (e.g. \`\`\`python, \`\`\`typescript, \`\`\`cpp).
- Structure responses with crisp headers (###), bullet points, and bold highlights.
- Be direct, professional, and practical. Avoid fluff and filler phrases like "Sure! I'd be happy to help with that!".
- For code, prioritize idiomatic, clean, and well-commented implementations.
- When explaining problems or issues, focus on root cause, mental models, edge cases, and actionable next steps.`;

/**
 * Builds prompt and system instruction based on action type and payload
 */
export function buildPrompt(action, payload) {
  const { context, options = {}, userMessage, history = [] } = payload;
  const platform = context?.platform || 'general';
  const language = options?.language || 'python';
  const hintLevel = options?.hintLevel || 1;

  switch (action) {
    // ------------------------------------------------------------------------
    // GITHUB ACTIONS
    // ------------------------------------------------------------------------
    case 'github_explain':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `You are analyzing a GitHub ${context.type || 'item'}.
Title: ${context.title || 'Untitled'}
Number: #${context.number || 'N/A'}
Repository: ${context.repo || 'Unknown'}
Author: ${context.author || 'Unknown'}
State: ${context.state || 'Unknown'}
Labels: ${(context.labels || []).join(', ') || 'None'}

Description / Body:
${context.body || 'No description provided.'}

${context.comments?.length ? `Recent comments / discussion:\n${context.comments.slice(0, 5).join('\n---\n')}` : ''}
${context.diffSummary ? `PR Diff / Files Changed:\n${context.diffSummary}` : ''}

TASK:
Provide a comprehensive yet concise breakdown:
1. **Executive Summary**: What is this issue/PR about in 2-3 sentences?
2. **Key Requirements / Problem Statement**: What problem is being solved or requested?
3. **Important Nuances & Edge Cases**: Are there breaking changes, platform quirks, or specific constraints mentioned?
4. **Relevant Components**: Which files or areas of the codebase are affected?`
      };

    case 'github_next_step':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `You are guiding a developer on what to do next for this GitHub ${context.type || 'task'}.
Title: ${context.title || 'Untitled'}
Repository: ${context.repo || 'Unknown'}
Description:
${context.body || 'No description provided.'}

${context.diffSummary ? `Current Changes:\n${context.diffSummary}` : ''}

TASK:
Give the developer a concrete, step-by-step action plan:
1. **Immediate Next Step**: The single most effective action to take right now.
2. **Implementation Checklist**: 3-5 ordered tasks to complete the work (include filenames, tests, and commit advice).
3. **Verification & Testing**: How to prove the change works before opening/merging a PR.`
      };

    case 'github_debug':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `A developer needs help debugging this GitHub ${context.type || 'task'}.
Title: ${context.title || 'Untitled'}
Repository: ${context.repo || 'Unknown'}
Description:
${context.body || 'No description provided.'}

${context.comments?.length ? `Discussion:\n${context.comments.slice(0, 5).join('\n---\n')}` : ''}
${context.diffSummary ? `Diff Summary:\n${context.diffSummary}` : ''}

TASK:
Act as a principal debugging engineer:
1. **Suspected Root Cause**: Identify what is causing the failure, error, or regression based on the evidence.
2. **Reproduction Strategy**: Minimal conditions or test case to reproduce.
3. **Proposed Fix**: Code snippet showing how to patch the bug safely.
4. **Defensive Guardrails**: How to prevent similar regressions in the future.`
      };

    case 'github_review':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Perform a thorough senior code review for this GitHub Pull Request.
Title: ${context.title || 'Untitled'}
PR: #${context.number || 'N/A'}
Repository: ${context.repo || 'Unknown'}
Description:
${context.body || 'No description provided.'}

Files Changed & Diff:
${context.diffSummary || 'No diff provided.'}

TASK:
Provide a constructive, high-standard code review:
1. **Overall Assessment**: Quality score (Ready to merge / Needs revision / Blocked) with high-level summary.
2. **Strengths**: What is done well in this change.
3. **Potential Risks & Code Smells**: Identify race conditions, security vulnerabilities, memory/performance concerns, or missing test coverage.
4. **Actionable Recommendations**: Specific diff recommendations or code improvements.`
      };

    case 'github_summarize':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Summarize the discussion on this GitHub ${context.type || 'item'}.
Title: ${context.title || 'Untitled'}
Repository: ${context.repo || 'Unknown'}
Description:
${context.body || 'No description provided.'}

Comments & Thread:
${(context.comments || []).join('\n---\n') || 'No comments found.'}

TASK:
1. **Discussion Core**: What is the consensus or main debate?
2. **Stakeholder Positions**: Key viewpoints expressed by contributors.
3. **Current Blockers / Decisions Needed**: What is holding up progress?
4. **Action Items**: What needs to happen next.`
      };

    case 'github_repo_overview':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Provide an intelligent developer overview of this repository.
Repository: ${context.repo || 'Unknown'}
Description: ${context.description || 'N/A'}
Stars: ${context.stars || 'N/A'}
Primary Language: ${context.language || 'N/A'}

README Content:
${context.readme || context.body || 'No README text available.'}

TASK:
1. **Project Vision & Architecture**: What does this project do and what is the tech stack?
2. **Key Modules & Directories**: How is the repository structured?
3. **Quickstart for Contributors**: Essential setup commands and development workflow.
4. **Contribution Opportunities**: Where a new developer should start.`
      };

    // ------------------------------------------------------------------------
    // LEETCODE ACTIONS
    // ------------------------------------------------------------------------
    case 'leetcode_explain':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `You are explaining a LeetCode problem to a developer.
Problem Title: ${context.title || 'Unknown Problem'}
Difficulty: ${context.difficulty || 'Medium'}
Tags / Topics: ${(context.tags || []).join(', ') || 'N/A'}

Problem Statement:
${context.description || 'No description extracted.'}

${context.examples?.length ? `Examples:\n${context.examples.join('\n---\n')}` : ''}
${context.constraints?.length ? `Constraints:\n${context.constraints.join('\n')}` : ''}

TASK:
Explain the problem intuitively without spoiling the complete solution:
1. **Problem in Simple Words**: Plain English restatement using a relatable mental model or analogy.
2. **Input / Output Breakdown**: What we receive, what we must return, and what guarantees exist.
3. **Critical Constraints & Implications**: How the constraints bound our target time complexity (e.g. N <= 10^5 means O(N) or O(N log N)).
4. **Tricky Edge Cases**: Empty arrays, negative numbers, duplicates, overflow, single elements.`
      };

    case 'leetcode_hint':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Provide a progressive hint for this LeetCode problem.
Problem: ${context.title || 'Unknown Problem'}
Difficulty: ${context.difficulty || 'Medium'}
Requested Hint Level: Level ${hintLevel} of 3.

Problem Statement:
${context.description || ''}

${context.userCode ? `User's Current Code Attempt:\n\`\`\`${language}\n${context.userCode}\n\`\`\`` : ''}

IMPORTANT RULES FOR HINTS:
- Do NOT provide full code solutions. Keep the learner thinking and building intuition.
${
  hintLevel === 1
    ? `- **Level 1 (Intuition)**: Give a subtle nudge about the core observation or physical mental model. Ask a thought-provoking guiding question.`
    : hintLevel === 2
    ? `- **Level 2 (Data Structure & Pattern)**: Reveal the optimal algorithmic pattern (e.g. Two Pointers, Monotonic Stack, Dynamic Programming) and explain WHY this structure fits the constraints.`
    : `- **Level 3 (Algorithmic Invariant & State Transition)**: Detail the exact state transitions, base cases, or loop invariant. Guide them right up to the doorstep of writing the code without pasting the full solution.`
}

Provide the hint cleanly formatted with an encouraging tone.`
      };

    case 'leetcode_approach':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Detail the optimal algorithmic approach for this LeetCode problem.
Problem: ${context.title || 'Unknown'}
Difficulty: ${context.difficulty || 'Medium'}
Tags: ${(context.tags || []).join(', ')}

Problem Statement:
${context.description || ''}
${context.constraints?.length ? `Constraints:\n${context.constraints.join('\n')}` : ''}

TASK:
1. **Naive vs Optimal Comparison**: Why the brute force approach is too slow (Time/Space).
2. **The Key Insight / Eureka Moment**: The mathematical or structural property that unlocks the optimal solution.
3. **Step-by-Step Algorithm**:
   - Step 1: Initialization
   - Step 2: Main loop / traversal logic
   - Step 3: Termination & return value
4. **Pseudocode**: Clean, language-agnostic pseudocode.`
      };

    case 'leetcode_complexity':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Break down the Time and Space Complexity for solving:
Problem: ${context.title || 'Unknown'}
Difficulty: ${context.difficulty || 'Medium'}

Problem Statement & Constraints:
${context.description || ''}
${context.constraints?.join('\n') || ''}

${context.userCode ? `Analyze User's Code:\n\`\`\`${language}\n${context.userCode}\n\`\`\`` : 'Analyze the Optimal Approach for this problem.'}

TASK:
1. **Time Complexity**:
   - Big-O notation (e.g. \\(O(N \\log N)\\)).
   - Detailed justification: breakdown of every loop, sorting step, or recursive tree depth.
   - Best-case, Average-case, Worst-case if relevant.
2. **Space Complexity**:
   - Big-O notation (e.g. \\(O(1)\\) auxiliary or \\(O(N)\\) for hashmap/recursion stack).
   - Detailed breakdown of heap allocations vs stack memory.
3. **Constraint Feasibility Table**: Compare against LeetCode's ~10^8 operations per second limit.`
      };

    case 'leetcode_solution':
      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Provide the production-grade, optimal solution in ${language.toUpperCase()} for:
Problem: ${context.title || 'Unknown'}
Difficulty: ${context.difficulty || 'Medium'}

Problem Description:
${context.description || ''}
${context.examples?.slice(0, 2).join('\n---\n') || ''}
${context.constraints?.join('\n') || ''}

${context.userCode ? `User's current code attempt for reference:\n\`\`\`${language}\n${context.userCode}\n\`\`\`` : ''}

TASK:
1. **Optimal ${language.toUpperCase()} Solution**:
   - Clean, idiomatic, and LeetCode-accepted solution.
   - Meaningful variable names and clean comments explaining key operations.
2. **Line-by-Line Code Walkthrough**:
   - Explain how each block functions.
3. **Complexity Summary**:
   - Time Complexity: \\(O(...)\\) with reason.
   - Space Complexity: \\(O(...)\\) with reason.`
      };

    // ------------------------------------------------------------------------
    // GENERAL CHAT / FOLLOW-UP
    // ------------------------------------------------------------------------
    case 'chat':
    default: {
      const historyText = history
        .map(h => `${h.role === 'user' ? 'Developer' : 'Beacon AI'}: ${h.content}`)
        .join('\n\n');

      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `You are answering a developer's follow-up question.
Current Page Context:
- Platform: ${platform}
- Title: ${context?.title || 'Unknown'}
- State/Difficulty: ${context?.difficulty || context?.state || 'N/A'}
${context?.repo ? `- Repository: ${context.repo}` : ''}
${context?.description || context?.body ? `- Summary: ${(context.description || context.body || '').slice(0, 1000)}...` : ''}
${context?.userCode ? `- Current Code Editor Snippet:\n\`\`\`${language}\n${context.userCode.slice(0, 1500)}\n\`\`\`` : ''}

${historyText ? `Conversation History:\n${historyText}\n` : ''}

Developer's Question:
"${userMessage || 'How can I solve this?'}"

TASK:
Provide a clear, direct, and actionable answer tailored to the context above.`
      };
    }
  }
}
