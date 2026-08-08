---
name: handing-off-work
description: Use when a session is ending or running out of context and the work isn't finished — "write a handoff", "summarise this session", "I'm out of context, save state", "continue this in Claude Code / Codex / Cursor", "pick up where we left off tomorrow", "hand this over to another agent", "brief the next person on this branch". Triggers whenever unfinished work has to survive the end of the session it was done in — across a compaction, a new session, a different agent harness, or a different engineer — and when picking work back up from a handoff document someone else left.
license: MIT
compatibility: Needs read access to the repository and permission to write one Markdown file. Uses `git` for the state sections and degrades to explicitly-marked uncertainty without it. Works unattended, so it can run at the end of an autonomous session with nobody to ask.
metadata:
  category: workflow
  tagline: Writes a handoff a fresh agent can resume from — decisions, dead ends, and verified code state.
---

# Handing Off Work

## Overview

A session ends with two things in it. One is recoverable: what the code looks like now, which `git` will tell anyone who asks. The other is not: why it looks like that, what was tried and rejected, and what the next move was going to be. That second half exists only in the session, and when the session ends it is gone.

A handoff document is the attempt to save it. Most attempts fail the same two ways, and everything in this skill follows from avoiding them.

> **State comes from the repository. Reasons come from the session. Never swap them.**

An agent writing "I updated the auth middleware" from memory is reporting an intention, not a fact — the edit may have been reverted, superseded by a later one, or never applied. Every claim about what the code *is* gets read out of `git`. Memory is used only where the repo genuinely cannot answer: why one approach won, what the third attempt broke, what the user actually wanted.

> **Write for a reader with no memory of the session.**

"The refactor we discussed", "that approach", "the file above", a name coined mid-conversation, an appeal to a todo list the next harness cannot see — each of these is a dead reference to whoever reads the document, and a handoff full of them costs more time than it saves. Every noun must resolve from the document plus the repository alone.

## When to Use

- The session is ending with the work unfinished, and someone will continue it
- Context is running out and the state has to survive a compaction or a fresh session
- The work is moving to a different agent harness — Claude Code, Codex, Cursor, Copilot — with no shared history
- An autonomous run finished partway and a human or another agent takes it from here
- A branch is being passed to another engineer who wasn't there for any of it
- You're resuming *from* a handoff and need to know how far to trust it (see [Resuming from a handoff](#resuming-from-a-handoff))

**Do not use for:**

- **Planning work that hasn't happened yet** — use `plan-with-me`. A handoff records decisions already made; if the next step is genuinely undecided, what's needed is a planning session, and its plan document is a different artifact with a different reader
- **A pull request description** — written for a reviewer judging a finished change, not for someone resuming an unfinished one. It argues that the work is correct; a handoff says where the work stopped
- **Permanent documentation, an ADR, or a runbook** — a handoff decays the moment the branch moves and is meant to be thrown away. A decision worth keeping should be promoted into real docs instead of left in a handoff nobody will find
- **Answering "what did you just do?"** — that's a reply in the conversation. This skill's output is a file, and writing one for a question is overkill
- **A session with nothing to resume** — finished, merged, or abandoned work needs no handoff, and the ceremony has a real cost
- **Diagnosing why something is broken** — `debugging-ui-flows` or `instrumenting-for-observability` produce the evidence; hand off the conclusions once you have them

## Core Process

### 1. Read the state out of the repository

Before recalling anything, establish what is actually true right now. This is the section the next agent will act on first, and the one memory is worst at.

```bash
git status -sb                # branch, ahead/behind, and what's dirty
git rev-parse --short HEAD    # exact commit every claim below refers to
git log --oneline @{u}..HEAD  # commits not yet pushed (use `<base>..HEAD` with no upstream)
git diff --stat               # unstaged shape of the change
git diff --stat --cached      # staged
```

Then find the command that says whether things still work — the test script in `package.json`, `Makefile`, `pyproject.toml`, or whatever this repo uses — and confirm you know what it currently reports. "Tests pass" written without running them is the single most expensive false claim a handoff can carry, because the next agent builds on it.

Without `git` available, say so in the document and mark every state claim as unverified rather than presenting recollection as fact.

### 2. Recover the reasons

Now go to the session for what the repo can't show. Two kinds:

**Decisions.** Each one is a choice, a reason, and a place it shows up in the code. The reason is the load-bearing part: code shows *what* was chosen and never *why*, so an undocumented decision gets silently reversed by the next agent who finds it odd.

**What didn't work** — both the alternatives investigated and rejected, and the approaches actually tried and abandoned. Either way, record what went wrong. A fresh agent facing the same problem reaches for the same obvious first idea; without this, it spends the same hours discovering the same wall. Negative results are the most perishable knowledge in the session and the most likely to be left out, because they feel like failures rather than findings.

Distinguish a dead end from a narrative. "First I tried X, then I changed it to Y, then I refactored Z" is a diary and helps nobody. "X doesn't work because the adapter serialises dates as strings — see `src/adapters/date.ts`" is a finding.

### 3. Write the resume instruction first

The first section of the document, and the first thing you draft, is the single next concrete action. Not "continue the refactor" — the actual next edit or command, specific enough to start on without reading the rest of the document.

Drafting it first is a test as much as a courtesy. If you can't state the next action concretely, that's a finding rather than a writing problem: either the work needs a decision nobody has made, which belongs in Open questions and probably in a planning session, or step 1 was too shallow and you don't yet know the state well enough to say.

### 4. Draft against the relevance filter

For every line, ask: **would this change what the next agent does?** If not, it doesn't go in.

A handoff competes for the same attention as the code itself, and one that runs several screens gets skimmed, which is worse than one that's short and complete. Aim for one to two screens. There's no hard cap, because a cap tempts you to cut the rationale — the one thing that isn't recoverable — in order to keep the file listings that are.

What earns its place is anything the next agent would otherwise have to rediscover: a non-obvious constraint, a flaky test, a required environment variable, a service that must be running, an API that behaves differently from its docs.

### 5. Strip the session out, and the secrets with it

Two passes over the draft.

**Dangling references.** Search for "we", "as discussed", "the above", "that file", "the new approach", and any name invented during the session. Replace each with something a stranger can resolve: a path, a symbol, a command, a full description.

**Secrets.** Handoffs get committed, pasted into tickets, and forwarded. Tokens, keys, connection strings, customer data, and personal data copied out of logs or fixtures stay out. Name the variable and where it comes from; never its value.

### 6. Cold-read check

Read the draft as someone who has never seen the session, against this list. It takes a minute and catches nearly everything that makes a handoff useless.

- [ ] The first action is executable without reading further, and without asking a question
- [ ] Every state claim matches what step 1 actually returned — branch, commit, dirty files, test result
- [ ] Every file mentioned is given as a path that exists
- [ ] Every decision has a reason attached, not just an outcome
- [ ] Nothing refers to the conversation, a todo list, or a tool the next harness might not have
- [ ] No credentials, tokens, or customer data
- [ ] Someone could tell, from the document alone, which claims to re-verify before trusting them

### 7. Write the file and say how to hand it over

Match the repo before inventing a location: if `docs/handoffs/`, `docs/notes/`, or an equivalent exists, follow its naming. Otherwise propose `docs/handoffs/<yyyy-mm-dd>-<slug>.md`. Write exactly one file — a handoff that also tidies imports or updates a README is no longer a handoff.

Then print the path and deal with the part that silently breaks handoffs: **uncommitted work does not travel.** If the worktree is dirty and the next agent will be on another machine, in another clone, or in a cloud session, the changes described don't exist for them. Say which of these applies:

- **Commit and push** — the reliable option. Offer it; don't do it unattended without the go-ahead, and never force-push or amend
- **Stash or patch** — `git diff > handoff.patch`, referenced by path from the document
- **Same machine, same worktree** — nothing to do, but say so explicitly, because the reader can't tell otherwise

Committing the handoff document itself is usually right when it crosses machines, and is the user's call.

## Handoff Document Template

```markdown
# Handoff: <what this work is>

**Status:** in progress | blocked | ready for review
**Branch:** `<branch>` at `<sha>` · **Worktree:** clean | <n> uncommitted files
**Verify with:** `<command>` — currently <what it reports>

## Resume here

<!-- The next concrete action. Executable without reading further. -->

## Goal

<!-- What the work is meant to achieve, in two or three lines. -->

## State

- **Done:** <what's finished and verified>
- **Remaining:** <what's left, in order>
- **Deferred:** <consciously out of scope, so it isn't re-litigated>

## Decisions

| Decision | Choice | Why | Where it lives |
| --- | --- | --- | --- |

## Tried and abandoned

| Approach | Why it was dropped |
| --- | --- |

## Code changes

| File | What changed | Committed? |
| --- | --- | --- |

## Environment and commands

<!-- How to run, test, and reset. Services that must be up. Env vars by name. -->

## Gotchas discovered

<!-- Non-obvious things that cost time. Flaky tests, misleading docs, sharp edges. -->

## Open questions

| Question | Blocks | What would settle it |
| --- | --- | --- |
```

Two columns carry disproportionate weight. **Verify with** gives the next agent a way to check the document against reality in one command. **Committed?** is what separates a claim they can trust from one they must confirm still exists.

## What Goes In and What Stays Out

| In | Out |
| --- | --- |
| The next concrete action | "Continue where I left off" |
| A decision plus its reason | A decision with only its outcome |
| An approach that failed, and what broke | A chronological diary of every edit |
| Branch, commit, and dirty-file state from `git` | Recollection of what was probably changed |
| The command that verifies the work, and its current result | "Tests pass" with nothing behind it |
| A constraint that cost an hour to discover | Anything the next agent finds in ten seconds by reading the file |
| An env var by name and where it comes from | Its value |
| Paths, symbols, commands | "The file we changed", "that approach" |
| Questions still open, and what would settle them | Questions already answered during the session |

## Resuming From a Handoff

On the receiving end, a handoff is **a set of claims with a timestamp**, not a set of facts. Branches move, colleagues push, worktrees get reset. Treat it accordingly:

1. **Read the resume instruction and the decisions first.** They're what the rest of the document exists to support.
2. **Check the anchors before writing any code.** Are you on the branch it names, at or after the commit it names? Does the worktree match the state it describes? A mismatch is the first thing to reconcile.
3. **Re-run the verification command** before trusting any claim about things working. This is one command and it invalidates the most dangerous kind of stale handoff.
4. **Treat "Tried and abandoned" as binding** unless something in the current state contradicts it. Re-deriving the same dead end is the specific waste the section exists to prevent.
5. **Say what diverged.** If the document is stale, tell the user which parts no longer hold rather than quietly working around them.

## Quick Reference

| To establish | Command |
| --- | --- |
| Branch, push state, and dirty files | `git status -sb` |
| Exact commit | `git rev-parse --short HEAD` |
| Shape of the change | `git diff --stat` and `git diff --stat --cached` |
| Commits not yet pushed | `git log --oneline @{u}..HEAD` |
| What a specific commit did | `git show --stat <sha>` |
| Capture dirty state for another machine | `git diff > handoff.patch` |

## References

- [`references/handoff-template.md`](references/handoff-template.md) — the annotated template with guidance per section, plus a filled-in worked example showing the level of detail each section needs

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Writing the code-change section from memory | Read it out of `git status` and `git diff --stat`; memory is only for reasons |
| "Tests pass" without having run them | Run the verification command and record what it actually reported |
| Recording decisions as outcomes with no reason | The reason is the part `git` can't reconstruct — it's the whole point of the document |
| Leaving out what was tried and failed | Dead ends are the most perishable knowledge in the session; the next agent will hit the same wall |
| A chronological narrative of every edit | Nobody resumes from a diary — state, decisions, and next action only |
| "Continue the refactor" as the next step | Name the next edit or command; if you can't, the work needs a decision, not a handoff |
| "As we discussed" / "that file" / mid-session codenames | Every noun must resolve from the document plus the repo |
| Pointing at a todo list or a host-specific artifact | The next harness can't see it — inline whatever it said |
| A handoff several screens long | Cut anything that wouldn't change what the next agent does; keep the rationale, drop the padding |
| Describing uncommitted work that the next agent can't reach | Commit and push, or attach a patch — and say which applies |
| Pasting a token or connection string as "context" | Name the variable and its source, never its value |
| Also tidying imports or updating the README while you're there | Write one file |
| Resuming from a handoff without checking the branch and sha | It's a timestamped claim; verify the anchors, then re-run the verification command |
