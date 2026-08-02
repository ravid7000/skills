---
name: plan-with-me
description: Use when a request is too large, vague, or contested to start coding — "plan this with me", "help me think through X", "let's design this before I build it", "write an implementation plan / design doc / RFC", "how should I approach this refactor, migration, or integration". Triggers when requirements are ambiguous, when several designs are defensible, when a feature ask hides decisions nobody has made yet, or when an engineer wants to be walked through those decisions interactively before any code is written.
license: MIT
compatibility: Needs an interactive session where the user can answer between turns, read access to the codebase, and permission to write one Markdown file. Uses the host's structured question tool when there is one (AskUserQuestion, AskQuestion, ask_user, request_user_input, ask_followup_question) and falls back to plain prose. Web search is strongly recommended for closing unknowns. Not for unattended runs — with nobody to answer, the no-assumption rule cannot hold.
metadata:
  category: workflow
  tagline: Turns a vague request into an agreed, written plan by asking one grounded question at a time.
---

# Plan With Me

## Overview

A plan is worth writing only if it removes decisions the implementer would otherwise get wrong. A plan generated in one pass from a one-line request does the opposite: it relocates the guesswork. Every unstated requirement becomes a confident-sounding sentence that nobody agreed to, and the document reads as settled precisely where it was invented.

This skill replaces that with a conversation that converges. Two rules do most of the work:

> **One question per turn, and every question worth the user's attention.**
>
> **Every unknown is resolved by evidence or handed back to the user — never filled with an assumption.**

The first keeps each round cheap enough that the user keeps engaging, and lets every answer reshape the question that follows it. Note what it does *not* say: that a question is only worth asking when the codebase can't answer it. Precedent in the code is a strong default, not a decision the user has delegated — where a choice is genuinely theirs, it gets asked, with the code's answer offered as the recommended option. What never gets asked is a *fact* you could have looked up.

The second rule is what makes the output trustworthy: a plan in which every line is traceable to a file, a source, or the user's own words.

## When to Use

- A one-line feature request that hides decisions nobody has made yet
- Several designs are defensible and the choice changes the shape of the work
- A refactor, migration, or new integration where sequencing and blast radius matter
- The user explicitly asks for a plan, design doc, RFC, or "let's think this through first"
- You started implementing and realised you don't actually know what the user wants

**Do not use for:**

- A change whose implementation is obvious once you've read the code — just do it; the ceremony has a real cost
- A bug with an unknown cause — that's diagnosis, not planning. Find the root cause first, then plan the fix if it's large enough to need one
- Answering a research question — use `finder` for that. This skill *calls on* research to close one specific unknown; it doesn't produce a research report
- Choosing what telemetry a change needs — that's `instrumenting-for-observability`
- Unattended or autonomous runs with nobody to answer (see `compatibility`) — without a user the loop degenerates into assumption-making, the one thing it exists to prevent
- Executing a plan that already exists, or reviewing someone else's

## Guardrails

These hold for every invocation, including the ones where the user sounds impatient and the change looks trivial. Nothing enforces them mechanically — they're the skill's contract, so say them at the start of the session rather than assuming they're understood.

**No code. The only artifact is one Markdown document.** Not a scaffold, not a type definition "to make the interface concrete", not a stub full of `TODO`s, not a dependency added, not a migration, not a config tweak, not a commit. If a decision genuinely can't be expressed in prose, a short snippet may appear *inside the plan document* to illustrate it — and it stays there, never landing in a source file.

**Implementation needs an explicit go-ahead, given in a turn after the plan exists.** Writing the file ends the skill; the next turn belongs to the user. Momentum is not consent — not an enthusiastic planning session, not a plan that's obviously ready, not a change small enough to do in the time it takes to ask.

This holds even when the original request bundled both: "plan this and then build it." The plan is the thing that changed the user's information, and the most common reaction to reading a good one is wanting something slightly different. Ask, and read the answer, before the first edit. Once the go-ahead comes, implementing is ordinary work and no longer this skill's business.

**One file, at a confirmed path, and nothing else in the repo.** No README, index, or changelog updates thrown in as a courtesy; no reformatting of files opened during grounding. If a document already exists at the target path, ask before overwriting it — a stale plan may still be someone's reference.

**Grounding is read-only.** Reading files, searching, and inspecting history with `git log` or `git show` are all fine. Switching branches, stashing, installing dependencies, running migrations, or running a build or test suite that writes files are not. If running something really is the only way to learn what you need, ask first.

**Nothing sensitive in the document.** Plans get committed, shared, and pasted into tickets. Credentials, tokens, customer records, and personal data copied out of logs or fixtures stay out of it — describe the shape of the data instead.

## Core Process

### 1. Ground yourself before asking anything

Read the code first. Grounding isn't there to reduce the number of questions — it's there to upgrade them. An open "how should we handle X?" becomes "the code already does X this way; keep it or deviate here?", which costs the user one keystroke instead of a paragraph and is far likelier to get answered.

Spend a bounded pass — roughly 5–15 file reads — establishing:

- **Where the change lands** — the actual files, modules, and boundaries involved
- **Prior art** — has something shaped like this been done here before? If so, the plan should probably copy it
- **Constraints already decided** — framework, data model, auth, error handling, test setup, naming conventions
- **What sits adjacent** — callers, consumers, and jobs that a change here would disturb

Then restate what you understood and what you found, in a few lines with file paths. Wrong grounding is cheap to correct now and expensive to correct once it's load-bearing in a plan. This restatement, not a question, is the first thing the user sees.

### 2. Fix the intent before the details

Write one sentence for the goal and a short list of what "done" looks like, then get it confirmed. Everything after this is judged against it: a question whose answer can't change the plan *for this goal* doesn't get asked.

Scope drift caught here costs one line. Caught at step 6, it costs the whole plan.

### 3. Ask one real question per turn

A batch of eight questions gets one answer to the easiest of them, and the rest are quietly filled in by the agent — which is how assumptions enter a document that looks collaborative. One at a time also lets each answer reshape the next question, which is the entire value of planning interactively rather than sending a questionnaire.

Order by leverage: the question whose answer invalidates the most of the plan goes first. Data model and boundary questions come before naming and error-copy questions.

Each question carries four parts:

| Part | Why it's there |
| --- | --- |
| **Context** | One line on what in the code raised the question. Proves it isn't a lazy question, and lets the user correct a false premise instead of answering it |
| **Options** | 2–4 concrete, viable choices, each with its real tradeoff *in this codebase* — not a generic pros-and-cons list |
| **Recommendation** | Which you'd pick and why. The user is usually here for a decision, not a quiz |
| **Consequence** | What changes in the plan depending on the answer |

The filter for whether a question earns a turn is **would the user want a say?** — not whether you could find an answer yourself. Those come apart, and the difference is facts versus decisions:

| Kind | Test | What to do |
| --- | --- | --- |
| **Fact** | One right answer, discoverable | Never ask. Look it up: which test runner, what a function does, which version is pinned, where analogous code lives |
| **Decision** | More than one answer is defensible, and a reasonable engineer might pick differently | Ask — *including* when the codebase shows what was done last time |

So a convention found in step 1 doesn't close a question, it seeds one. "The repo validates at the controller; keep that here, or push it into the service?" is worth a turn even though the code plainly says what happens today, because the user may well want this change to be where that changes. Consistency is a default worth recommending, never one worth assuming.

Two failure modes to avoid at this step. Never ask an open "any preferences on X?" with no options attached — that outsources the thinking you were asked to do. And when an earlier answer makes a queued question moot, drop it and say you're dropping it, rather than asking it because it was on your list.

Accept delegation gracefully. If the user says "you decide", take your recommendation, record it as **your** decision with its reasoning attached, and move on. A recorded decision the user can veto later is not an assumption. An unrecorded one is.

#### Ask through the host's question tool, not in prose

Most agent hosts have a dedicated tool for asking the user something: it renders clickable options, pauses the turn, and returns the answer as structured data. **Use it for every question in this loop, and never type a question as plain prose when the tool exists** — a picker is answered in one click, while a paragraph ending in a question mark competes with everything else on the user's screen and often gets a partial answer.

Check your own available tools first; that list is the only authoritative source. Known names at the time of writing:

| Host | Tool | Notes |
| --- | --- | --- |
| Claude Code | `AskUserQuestion` | 1–4 questions per call, 2–4 options each, `header` ≤12 chars. An "Other" free-text choice is appended automatically. Unavailable inside `Task` subagents |
| Cursor | `AskQuestion` | Always available in Plan mode; in Agent mode it depends on the selected model |
| Gemini CLI | `ask_user` | 1–4 questions, `type` of `choice`, `text`, or `yesno`, `header` ≤16 chars |
| Codex CLI | `request_user_input` | Experimental — needs `collaboration_modes = true`, and is plan-mode only |
| Cline / Roo Code | `ask_followup_question` | One `question` plus a short list of suggested answers |

Mapping the four parts onto a tool call: **context** and **consequence** go in the message immediately before the call (keep the question text able to stand alone, since some hosts show only the picker); **options** become the choices, each `description` carrying the tradeoff rather than restating the label; the **recommendation** goes first in the list, marked "(Recommended)".

Three rules for using these tools:

- **One question per call**, even though most schemas accept up to four. The schema's allowance is not permission to batch — it's the temptation this skill exists to resist.
- **Never hand-write an "Other" or "Something else" option** on a host that adds one, and never present options as the complete space. The free-text escape is load-bearing: it's how the user says "neither" or "I don't know", which is what keeps step 4 honest.
- **Fall back gracefully.** If no such tool exists in the current host, ask in prose using the shape in [Quick Reference](#quick-reference) and end the turn. Never fake a picker with numbered lists the host can't render, and never treat a missing tool as licence to stop asking.

### 4. Resolve unknowns; never paper over them

When some part of the problem isn't clear, work this ladder in order and stop at the first rung that settles it:

1. **The codebase.** Read it. Search for prior art, config, tests, migrations, feature flags, the commit that introduced the thing.
2. **Authoritative external sources.** Official docs, changelogs, issue trackers, release notes, web search. Cite the URL in the plan — a version-specific claim recalled from memory is an assumption wearing a fact's clothes.
3. **The user.** Ask it as a step-3 question, and say what you already checked and why it didn't settle the matter. That framing is what distinguishes a good question from an admission you didn't look.
4. **The plan's Open Questions.** If the user doesn't know either, write it down as unresolved, note which step it blocks, and name what or who would settle it.

What is forbidden is the fifth option: picking something plausible and writing it as if it were decided. **An unresolved gap in a plan is strictly better than an assumption in one** — the gap is visible and gets closed, while the assumption gets implemented.

Two reliable tells that an assumption is being smuggled in: hedging language doing load-bearing work ("presumably", "should be fine to", "we'll likely want to"), and any sentence you couldn't attribute to a file, a URL, or something the user actually said.

### 5. Keep the running state visible

After each answer, show the decision list so far — one line each, decision plus what settled it. It costs a few lines per turn and buys three things: the user reviews continuously instead of all at once at the end, contradictions surface immediately, and the loop stops re-asking something answered three turns ago.

### 6. Stop when the intent is met — from either side

The loop ends when **either** of these happens.

**The user calls it.** "That's enough, write it up." Honour it immediately. Remaining gaps go into Open Questions; don't argue for more questions.

**Or the plan passes this test on its own:**

- [ ] The goal and "done" conditions are unchanged since they were confirmed
- [ ] Every step names the files or modules it touches
- [ ] Every decision is traceable to code, a cited source, the user, or a labelled agent decision with its reasoning
- [ ] No unresolved unknown blocks the first step
- [ ] Verification is defined — how anyone would know the plan worked
- [ ] What's explicitly *out* of scope is written down
- [ ] The questions you have left wouldn't change any step

That last line is the real stopping condition, and it arrives sooner than expected. Prefer stopping early to interrogating: once answers stop changing steps, or the user starts replying "whatever you think", write the plan. An over-planned change and an unplanned one both waste the same engineer's afternoon.

If you've asked roughly 8–10 questions and the plan still isn't converging, that's not a sign to keep asking — the scope is too large to plan as one unit. Say so, propose splitting it into phases, and plan only the first phase.

### 7. Write the file

Match the repo before inventing a location: look for an existing `docs/plans/`, `docs/rfcs/`, `design/`, or equivalent and follow its naming. If nothing like that exists, propose `docs/plans/<yyyy-mm-dd>-<slug>.md` and confirm the path before writing.

Write exactly one file. Then finish by printing the path, a three-line summary of what was decided, and the question of whether to implement it — asked through the same question tool as everything else, since this is the one answer the whole loop was building towards — and stop there. Stopping short of code is the point of the skill, not a limitation of it: per the guardrails above, the go-ahead is the user's to give, in their own turn, after they've read what they're agreeing to.

## Plan Document Template

```markdown
# <Title>

## Goal

<!-- One or two sentences: the confirmed intent from step 2 -->

## Done when

<!-- Observable conditions, not tasks -->

## Context

<!-- What exists today, with file paths — the grounding from step 1 -->

## Decisions

| Decision | Choice | Settled by |
| --- | --- | --- |
| <the question> | <the choice> | user / `path/to/file.ts:42` / <url> / agent (reasoning) |

## Considered and rejected

<!-- Options that lost, and why. Stops the debate reopening mid-implementation -->

## Plan

### 1. <step>

- **Files:** `...`
- **Change:** ...
- **Verify:** ...

## Verification

<!-- How the whole thing gets checked: tests to add or run, manual steps, what to watch after it ships -->

## Out of scope

## Open questions

| Question | Blocks | What would settle it |
| --- | --- | --- |

## Risks
```

## Quick Reference

The prose fallback for a single question, used only on hosts with no question tool:

```markdown
**<The question>**

Context: <what in the code raised this>

- **A — <option>** — <tradeoff, in terms of this codebase>
- **B — <option>** — <tradeoff>

I'd go with **B**, because <reason>. If you'd rather not decide, I'll take B and record it as my call.

This changes <which part of the plan>.
```

## References

- [`references/question-bank.md`](references/question-bank.md) — what's worth asking per kind of change (new feature, refactor, migration, integration, API, data model), which facts to look up instead of asking, how a discovered fact turns into a real question, and the questions that only look useful

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Producing a finished plan in one pass from the first message | That's the failure this skill exists to prevent — ground, confirm intent, then ask |
| Sending eight questions at once | One per turn, highest-leverage first, each reshaped by the last answer |
| Asking a fact you could have looked up — the test runner, the conventions, what a function does | Find it in the step 1 grounding pass; turns are for decisions |
| Skipping a real decision because the code shows what was done last time | Precedent is the default, not the decision — ask it as keep-or-deviate with the precedent recommended |
| Typing questions as prose on a host that has a question tool | Use the tool; a picker gets a click, a paragraph gets skimmed |
| Batching four questions into one tool call because the schema allows it | One question per call — the allowance isn't permission |
| "Any preferences on X?" with no options attached | Attach 2–4 concrete options, real tradeoffs, and a recommendation |
| Filling a gap with a plausible-sounding sentence | Work the ladder: code, then sources, then the user, then Open Questions |
| Stating version-specific behaviour from memory | Verify it against docs and cite the URL, or ask |
| Treating "you decide" as permission to leave it unattributed | Record it as an agent decision with its reasoning, so it can be vetoed |
| Interrogating until the user disengages | Stop once the remaining questions can't change a step |
| Arguing for more questions after "just write it up" | Honour it immediately; unknowns become Open Questions |
| Asking more questions when nothing is converging | The scope is too big — propose phases and plan phase 1 only |
| Steps like "update the backend" | Name the files and the verification for each step |
| Writing "just the interface" or a stub to make the plan concrete | No code — an illustrative snippet belongs inside the document, never in a source file |
| Implementing because the plan was clearly agreed | Agreement on the plan isn't a go-ahead to build it; ask, in a separate turn |
| Reading "plan it and then build it" as pre-authorisation | The plan is what may change the user's mind; confirm after they've read it |
| Tidying or reformatting files opened during grounding | Touch exactly one file: the plan |
| Rewriting the whole document after every answer | Keep a running decision list in the conversation; write the file once, at the end |
