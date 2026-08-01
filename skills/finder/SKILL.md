---
name: finder
description: Use when an engineer needs researched, sourced, up-to-date information rather than an answer from model memory — e.g. "research best practices for X", "investigate this issue/bug", "find out how the community/industry handles Y", "what does the official documentation say about Z". Triggers on requests to research, investigate, or find authoritative information on a topic, library, API, error message, or design decision.
license: MIT
compatibility: Works best with a host that provides web search/fetch tools and can launch parallel sub-agents/tasks. Falls back to a single sequential session if sub-agent spawning isn't available; requires at least a web search/fetch tool to be useful at all.
metadata:
  category: research
  tagline: Answers research questions from current, cited sources instead of model memory.
---

# Finder

## Overview

Finder answers a research question by gathering current, external, sourced evidence instead of relying on the model's own memory. It fans out across a small, dynamically-sized set of research angles (docs, community discussion, general web, and — when relevant — this repository), then synthesizes everything into one cited report. Code is only included when the question is actually about implementation, and only as a short illustrative snippet — Finder never edits repository files.

## When to Use

- "Research the best practices for `<pattern/library/technology>`"
- "Investigate this bug/issue/error and find out what's known about it"
- "What does the community/Stack Overflow say about `<approach>`?"
- "What do the official docs recommend for `<topic>`?"
- Any request where an answer from memory alone risks being stale, unverified, or generic

**Do not use for:**

- Trivial factual lookups with no ambiguity or need for citation
- Direct implementation requests ("add a button that does X") — just implement it
- Requests where the user has already supplied all needed context and just wants code written

## Core Process

### 1. Decompose the question

Break the research question into a small set of independent angles. Choose only the angles that are actually relevant — don't force all of them:

- **Official docs** — the authoritative source for the technology/library in question
- **Community discussion** — Stack Overflow, GitHub issues/discussions, RFCs, blog posts describing real-world tradeoffs and pitfalls
- **General web** — broader search for consensus, recent changes, comparisons
- **This repository** — *only include this angle if the topic plausibly relates to the current codebase* (e.g. a question about a pattern, library, or convention that this repo actually uses). Skip it entirely for purely conceptual/off-repo questions (e.g. "explain the CAP theorem"). When in scope, this angle should inspect actual usage in the repo (existing patterns, versions/dependencies, prior art, conventions) — not just guess.

Pick the number of angles dynamically based on the question's breadth and ambiguity — a narrow, well-scoped question may only need 1–2 angles; a broad or contested one may need more. **Cap the total at 3 concurrent research angles/sub-agents per invocation.** If the question is broad enough to want more, prioritize the 3 most valuable angles first and note in the report which angles were deprioritized and why, rather than silently dropping coverage.

### 2. Fan out (or fall back)

- If the host environment supports launching parallel sub-agents/tasks, dispatch one sub-agent per chosen angle, running concurrently. Give each sub-agent a narrow, specific brief (the angle, the original question, and instructions to return findings with source URLs).
- If parallel sub-agent/task spawning is **not** available in the current harness, do **not** fail or refuse. Instead, work through the same angles sequentially in the current session, one at a time, and proceed as normal — this is a graceful degradation, not an error condition.

### 3. Bound the research per angle

To keep cost and time predictable, cap each angle's research to roughly **5–8 web searches/fetches** (or repo-file reads, for the repo angle). If an angle needs more than that to find a solid answer, stop, report what was found plus its confidence level, and note that deeper investigation would be needed rather than continuing indefinitely.

### 4. Synthesize

Combine all angles' findings into a single report. Explicitly reconcile:

- General best practice / community consensus vs. what this repository currently does (when the repo angle was in scope)
- Conflicting sources — call out the disagreement and give a recommendation with reasoning, rather than silently picking one
- Outdated vs. current guidance — prefer the most recent authoritative source when advice conflicts across time

### 5. Decide whether code is warranted

Only include a code example if the research question is implementation-oriented (e.g. "how should I structure X" or "what's the right pattern for Y"). If it's a purely conceptual/explanatory question (e.g. "why does X happen" or "what are the tradeoffs of Y"), give a prose explanation only — do not force in a code sample.

When code is included:

- It's a **short illustrative snippet only**, not a full implementation
- It reflects the recommendation just given, ideally adapted to match this repo's existing conventions if the repo angle was in scope
- Finder never edits actual repository files as part of this skill — the snippet is presented in the report for the engineer to apply

### 6. Cite everything

Every non-trivial claim must be traceable to a source. Do not present unsourced claims as fact. End the report with a **Sources** list of every URL used. If a claim is genuinely well-known/uncontested and a specific citation isn't practical, it's fine, but default to citing.

### 7. Output

Print the final report directly in the conversation. Do not write it to a file.

## Quick Reference

Report template:

```markdown
## Summary

<!-- 2-4 sentences directly answering the question -->

## Key Findings

- Finding 1 — source: <url>
- Finding 2 — source: <url>
- ...

## Repo-Specific Notes

<!-- Only include this section if the repo angle was in scope -->
<!-- What this repo currently does, and how it compares to the general findings above -->

## Recommendation

<!-- The synthesized, actionable recommendation, with reasoning -->

## Code Snippet (optional)

<!-- Only if the question is implementation-oriented; short illustrative snippet only -->

## Sources

- <url 1>
- <url 2>
- ...
```

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Answering from memory without doing any research | Always gather current sourced evidence first; that's the whole point of this skill |
| Presenting claims with no citation | Every non-trivial claim needs a source URL; end with a Sources list |
| Always including a code snippet | Only include code when the question is implementation-oriented |
| Always exploring the repo, even for unrelated conceptual questions | Only add the repo angle when the topic plausibly relates to this codebase |
| Refusing/failing when the harness has no sub-agent support | Fall back to a sequential single-session research process instead |
| Spawning unbounded sub-agents or doing unlimited web browsing | Cap at 3 concurrent research angles and ~5–8 fetches per angle |
| Editing repository files as part of "research" | Finder is read-only/advisory — present findings and snippets, don't apply changes |
