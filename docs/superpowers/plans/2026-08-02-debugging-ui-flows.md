# debugging-ui-flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `diagnostics` skill `debugging-ui-flows` that teaches agents to trace broken UI→API flows with temporary correlated logs, human reproduction, adaptive densification, and mandatory cleanup.

**Architecture:** Pure process skill — a single `SKILL.md` under `skills/debugging-ui-flows/`, no scripts or MCP deps. Follows `creating-agent-skills` packaging rules; cross-links `instrumenting-for-observability` as the sibling for permanent telemetry. Spec: `docs/superpowers/specs/2026-08-02-debugging-ui-flows-design.md`.

**Tech Stack:** Agent Skills markdown (`SKILL.md` frontmatter + body), repo scripts `npm run validate` / `npm run index`, Changesets for npm package bump.

## Global Constraints

- Skill directory name and frontmatter `name` must both be exactly `debugging-ui-flows`
- `metadata.category` must be `diagnostics`
- `description` must start with “Use when…” and must **not** summarize the 8-step workflow
- `metadata.tagline` ≤120 chars, must not start with “Use when”
- Body must include “When to Use” and “Do not use for” (naming `instrumenting-for-observability`)
- No `scripts/`, no browser MCP instructions as required path, no stack-specific recipes in v1
- Temporary instrumentation only — cleanup is a hard done-gate
- Keep `SKILL.md` under ~500 lines
- Commit as `Ravi Dhiman <ravid7000@gmail.com>`
- Touching `skills/` requires a Changeset with bump type `minor`

---

## File structure

| Path | Responsibility |
| --- | --- |
| `skills/debugging-ui-flows/SKILL.md` | Full skill: frontmatter, workflow, log contract, human prompts, cleanup, anti-patterns |
| `README.md` | Regenerated skills table via `npm run index` (do not hand-edit) |
| `.changeset/<id>.md` | `minor` bump noting the new skill for consumers |

No other files required for v1.

---

### Task 1: Author `skills/debugging-ui-flows/SKILL.md`

**Files:**
- Create: `skills/debugging-ui-flows/SKILL.md`
- Test: `npm run validate` (run in Task 2; author against the template rules here)

**Interfaces:**
- Consumes: design decisions in `docs/superpowers/specs/2026-08-02-debugging-ui-flows-design.md`; packaging rules in `skills/creating-agent-skills/SKILL.md`
- Produces: loadable skill `debugging-ui-flows` with valid frontmatter + required body sections

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p skills/debugging-ui-flows
```

- [ ] **Step 2: Write `SKILL.md` with the content below**

Create `skills/debugging-ui-flows/SKILL.md` exactly as follows (wording may be tightened for clarity, but do not drop required sections, sibling exclusion, log contract fields, cleanup gate, or adaptive densify loop):

```markdown
---
name: debugging-ui-flows
description: Use when a UI flow breaks and needs runtime evidence — button does nothing, wrong data after save, stuck loading, client vs API unclear — or when the user will reproduce locally and wants temporary debug logs / a flow trace. Triggers on "add logs and I'll repro", "trace this flow", "why is this request wrong", "instrument this bug", or guessing from code alone without a repro trail.
license: MIT
compatibility: Expects a human to reproduce in their browser. Browser automation MCPs (Playwright, Chrome DevTools) are not required and are out of scope for this skill.
metadata:
  category: diagnostics
  tagline: Traces broken UI→API flows with temporary correlated logs, then tears them out.
---

# Debugging UI Flows

## Overview

Static reading of frontend and API code often produces confident wrong guesses. A broken user journey needs a **temporary, correlated trail** across the UI and the handlers behind it: the human reproduces once, the agent reads the sink (or a paste), and the first divergence names the real fault.

Core discipline:

> **No fix until the trail shows the first divergence — then densify only there, fix the cause, and delete every debug line you added.**

This skill is for *this bug's* trail. It is not permanent production observability.

## When to Use

- A UI bug needs reproduction (“button does nothing”, “wrong data after save”, “stuck loading”)
- The flow fails at a specific step and it is unclear whether the client, the API, or the wiring is wrong
- The agent is guessing from code alone and needs runtime evidence
- The user will reproduce locally (“add logs and I’ll repro”, “trace this flow”, “why is this request wrong”)

**Do not use for:**

- **Permanent production observability** — logging, metrics, or tracing meant to ship and stay. Use `instrumenting-for-observability` instead
- **Static-only code review** with no planned runtime reproduction
- **Browser automation** via Playwright MCP, Chrome DevTools MCP, or similar agent-driven browser loops (out of scope for this skill)
- **Performance profiling**, visual polish, or authoring flaky E2E tests

## Core Process

### 1. Capture the symptom

Before editing code, lock:

- Expected vs actual behavior
- Exact repro steps
- Environment (local / staging / which env file)
- One concrete example input

If any of these are missing, ask. Do not instrument a vague “it’s broken.”

### 2. Map the flow (no code changes yet)

Sketch the minimal path that can explain the bug:

`UI action → client handler/state → request → API entry → service/DB → API response → client handling → UI apply`

Mark unknowns. Prefer the smallest path that can produce the symptom. Do not add logs yet.

### 3. Instrument sparsely (temporary)

Generate one `debugRunId` for the session. Using whatever logger or `console` the repo already uses, add **boundary** logs only:

| Step id | Where |
| --- | --- |
| `ui.click` / `ui.submit` | User-facing entry to the flow |
| `client.request` | Immediately before the network call (method, URL path, decisive non-sensitive fields / shape) |
| `api.entry` | API handler entry |
| `api.exit` / `api.error` | Handler success or failure path |
| `client.response` | After response received (status, parsed shape, branch taken) |
| `ui.apply` | State/UI update from the result |

Every line must carry the [log contract](#log-contract) fields so client and server lines sort into one story.

Do **not** log every function on this first pass.

### 4. Ask the human to reproduce once

Tell them exactly:

1. What actions to perform (the repro steps)
2. What to watch or copy (server terminal, browser console filtered by `DEBUG_FLOW` / `debugRunId`, network status for the call)
3. That you prefer sinks you can read locally; otherwise paste the matching log lines plus the failing request’s status

Wait for evidence. Do not invent a root cause while waiting.

### 5. Locate the first divergence

Walk the trail in order for this `debugRunId`:

- Mark the **last line that still looks expected**
- Mark the **first line that is wrong, missing, or never reached**

That span is the only place to densify next. If the trail never enters the API, the break is on the client (or the request never fired). If the API returns correctly and the UI is wrong, densify on the client apply path.

### 6. Densify only around the break

Add more **temporary** logs inside that span: branches taken, parsed values (non-sensitive), empty vs populated collections, status codes, error categories.

Reproduce again. Repeat steps 5–6 until the cause is specific enough to fix.

**Cap:** after 2–3 densify loops without a clear cause, stop logging and **remap** the flow — the bug may sit on a path you did not include.

### 7. Fix the root cause

Change production behavior. Do not “fix” the bug by leaving debug logs in place or by papering over a missing request with UI-only guesses contradicted by the trail.

### 8. Cleanup and verify (hard gate)

Before claiming done:

- [ ] Remove every temporary debug log, helper, flag, and file added for this session
- [ ] Grep the diff / tree for `DEBUG_FLOW`, the `debugRunId`, and obvious debug leftovers
- [ ] Confirm the original repro is fixed **without** debug noise

If the investigation exposed a lasting production blind spot, mention handing that gap to `instrumenting-for-observability` **after** cleanup — do not convert temporary debug lines into shipped telemetry inside this skill.

## Log Contract

Apply with the project’s existing logger or `console`. Same fields on client and server.

**Required on every debug line:**

| Field | Meaning |
| --- | --- |
| `debugRunId` | One id for the whole repro session |
| `flow` | Short journey name (`checkout.submit`, `profile.save`) |
| `step` | Stable step id from the table above (or a clear sub-step under the densify span) |
| `note` or `hypothesis` | What this line is meant to prove or disprove |

**Useful optional fields:** outcome/status, timing, existing non-PII domain ids, branch taken, payload **shape** (keys, lengths), error category.

**Never log:** secrets, tokens, passwords, raw auth headers; full PII by default; full request/response bodies by default. Prefer shape + the few decisive non-sensitive fields.

**Sink preference:**

1. Existing structured logger / server stdout the agent can read
2. Client console with a shared prefix (human pastes if needed)
3. Temporary local debug file only if both are awkward — mark it for deletion in cleanup

**Illustrative prefix** (adapt to the repo’s logger; the fields matter more than the syntax):

```text
[DEBUG_FLOW run=a3f2 flow=checkout.submit step=api.entry] paymentMethod=card items=2
```

## Human Communication

When asking for a repro, be concrete. Example shape:

> Repro with debug trail `run=<debugRunId>`:
> 1. <step>
> 2. <step>
> 3. Watch the server terminal / paste browser console lines containing `DEBUG_FLOW` or `run=<debugRunId>`
> 4. Note the status code of `<method> <path>` if it appears in the Network panel
>
> I’ll read local logs if they’re in the terminal; otherwise paste the matching lines.

## Cleanup Gate

The task is not done while temporary instrumentation remains. Cleanup is part of the fix, not a follow-up.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Fixing before any trail exists | Capture symptom → map → instrument → repro first |
| Logging every line on the first pass | Sparse boundaries only; densify after the first break |
| Leaving `DEBUG_FLOW` / debug files after the fix | Cleanup checklist is a hard done-gate |
| Dumping full bodies or secrets “for context” | Log shape + decisive non-sensitive fields |
| Treating temporary logs as shipped observability | Remove them; hand lasting gaps to `instrumenting-for-observability` |
| Endless densify loops | Cap at 2–3; remap the flow |
| Skipping the human repro because the code “looks wrong” | Code hypotheses are fine; claims need trail evidence |
```

- [ ] **Step 3: Commit the skill file**

```bash
git add skills/debugging-ui-flows/SKILL.md
git commit -m "feat: add debugging-ui-flows skill"
```

---

### Task 2: Validate frontmatter and required sections

**Files:**
- Verify: `skills/debugging-ui-flows/SKILL.md`
- Test: `npm run validate`

**Interfaces:**
- Consumes: skill authored in Task 1
- Produces: clean `npm run validate` exit code 0

- [ ] **Step 1: Ensure dependencies are installed**

```bash
npm install
```

Expected: lockfile install succeeds (or already up to date).

- [ ] **Step 2: Run validation**

```bash
npm run validate
```

Expected: exit 0; `debugging-ui-flows` listed/checked with no errors about name mismatch, missing When to Use / Do not use for, category, or tagline.

- [ ] **Step 3: Fix any validation failures in `SKILL.md` and re-run**

If validate fails, edit only what the validator reports (frontmatter length, tagline shape, missing sections), then repeat Step 2 until green. Do not weaken the sibling exclusion or cleanup gate to pass validation.

- [ ] **Step 4: Commit fixes if any**

```bash
git add skills/debugging-ui-flows/SKILL.md
git commit -m "fix: satisfy skill validation for debugging-ui-flows"
```

(Skip this commit if Step 2 was already green with no edits.)

---

### Task 3: Regenerate the README skills index

**Files:**
- Modify: `README.md` (generated Skills table only)
- Test: `npm run index:check`

**Interfaces:**
- Consumes: frontmatter `name` + `metadata.tagline` from Task 1
- Produces: README Skills table including `debugging-ui-flows`

- [ ] **Step 1: Regenerate the index**

```bash
npm run index
```

Expected: `README.md` Skills table gains a row for **debugging-ui-flows** with tagline roughly: “Traces broken UI→API flows with temporary correlated logs, then tears them out.”

- [ ] **Step 2: Confirm the check is clean**

```bash
npm run index:check
```

Expected: exit 0 (table up to date).

- [ ] **Step 3: Commit the README diff**

```bash
git add README.md
git commit -m "docs: index debugging-ui-flows in README"
```

---

### Task 4: Add a minor changeset

**Files:**
- Create: `.changeset/<generated-or-chosen-name>.md`

**Interfaces:**
- Consumes: new skill under `skills/` (public install-by-name API)
- Produces: Changesets file selecting bump `minor` for `@ravid7000/skills`

- [ ] **Step 1: Create the changeset file**

Either run `npx changeset` interactively and select `@ravid7000/skills` → `minor`, or write a changeset file directly:

```markdown
---
"@ravid7000/skills": minor
---

Add debugging-ui-flows skill for tracing broken UI→API flows with temporary correlated logs.
```

Suggested path if writing directly: `.changeset/debugging-ui-flows-minor.md`

- [ ] **Step 2: Commit the changeset**

```bash
git add .changeset
git commit -m "chore: changeset minor for debugging-ui-flows"
```

---

### Task 5: Final verification gate

**Files:**
- Verify: `skills/debugging-ui-flows/SKILL.md`, `README.md`, `.changeset/*`

- [ ] **Step 1: Re-run validate + index check**

```bash
npm run validate && npm run index:check
```

Expected: both exit 0.

- [ ] **Step 2: Spot-check skill content against the spec**

Confirm these are present in `SKILL.md`:

- Human-driven repro (not browser MCP as required)
- Frontend + API scope in the flow map
- Adaptive densify (sparse → zoom)
- Log contract fields: `debugRunId`, `flow`, `step`, note/hypothesis
- Sink preference + paste fallback
- Hard cleanup gate
- Explicit “Do not use for” → `instrumenting-for-observability`
- Cap on densify loops / remap guidance

- [ ] **Step 3: Push the branch**

```bash
git push -u origin HEAD
```

---

## Plan self-review

| Spec requirement | Task |
| --- | --- |
| New skill `debugging-ui-flows` / diagnostics | Task 1 |
| Pure process, no scripts / no browser MCP | Task 1 content + Global Constraints |
| 8-step workflow + adaptive densify | Task 1 |
| Log contract + PII rules + sinks | Task 1 |
| Sibling boundary with `instrumenting-for-observability` | Task 1 |
| Validate + index | Tasks 2–3, 5 |
| Minor changeset | Task 4 |
| Design docs already written | Prior commits / this branch’s docs |

No placeholders left in tasks. Implementation of the skill body is fully specified in Task 1 Step 2.
