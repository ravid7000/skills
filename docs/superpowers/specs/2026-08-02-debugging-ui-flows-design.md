# Design: `debugging-ui-flows`

**Date:** 2026-08-02  
**Status:** Approved for planning  
**Category:** `diagnostics`  
**Approach:** Pure process skill (no scripts, no browser MCP in v1)

## Problem

When a UI flow breaks, agents often guess from static code. Frontend developers need a repeatable way to **reproduce**, **instrument temporarily**, **read a correlated trail**, and **locate the first divergence** across the UI and the APIs behind it — then remove the instrumentation.

This is different from permanent production observability.

## Goals

- Teach agents a fixed investigate loop for broken UI → API flows
- Prefer human-driven reproduction (no browser automation required)
- Prefer local readable sinks; fall back to human-pasted console/network evidence
- Use adaptive log density: sparse boundaries first, densify only around the first break
- Always remove temporary debug instrumentation before calling the work done
- Stay stack-agnostic (principles + conventions; syntax from the target repo)

## Non-goals (v1)

- Playwright MCP, Chrome DevTools MCP, or any agent-driven browser loop
- Helper scripts or shared logging libraries
- Stack-specific recipe packs (React/Next/etc.)
- Permanent metrics/tracing setup (that is `instrumenting-for-observability`)
- Performance profiling, visual QA, or E2E test authorship

## Sibling boundary

| Skill | Job |
| --- | --- |
| `instrumenting-for-observability` | Lasting signals designed backwards from failure questions |
| `debugging-ui-flows` | Temporary correlated trail to catch *this* bug, then tear it out |

After cleanup, if the incident revealed a lasting observability gap, the agent may *hand off* to `instrumenting-for-observability` — that promotion is outside this skill’s workflow.

## When to use / not use

**Use when:**

- A UI bug needs reproduction (“button does nothing”, “wrong data after save”, “stuck loading”)
- The flow fails at a specific step and it is unclear whether client, API, or wiring is wrong
- The agent is guessing from code alone and needs runtime evidence
- The user offers to reproduce (“add logs and I’ll repro”, “trace this flow”)

**Do not use for:**

- Permanent production observability → `instrumenting-for-observability`
- Pure static code review with no runtime repro planned
- Browser automation / Playwright / Chrome DevTools MCP workflows
- Performance profiling, visual polish, or flaky E2E authorship

## Core workflow

Hard rule: **no fix until the trail shows the first divergence.**

1. **Capture symptom** — expected vs actual, repro steps, environment, one example input
2. **Map the flow** (no code changes yet) — UI action → client handlers/state → request → API handler/service → response → UI update; mark unknowns; keep the path minimal
3. **Instrument sparsely (temporary)** — one `debugRunId`; logs only at boundaries (UI entry, client pre-request, API entry, API exit/error, client post-response, UI apply)
4. **Human reproduces once** — agent gives exact steps and what to capture; prefer sinks the agent can read; else human pastes
5. **Locate first divergence** — last expected line vs first wrong/missing line
6. **Densify only there** — more temporary logs in that span; repro again; repeat until cause is specific (cap ~2–3 densify loops before remapping)
7. **Fix the root cause** — change production logic, not the debug trail
8. **Cleanup + verify** — remove every temporary debug addition; confirm the original repro is fixed without debug noise

**Stop conditions:** cause fixed, or evidence proves the bug is outside the mapped path (remap; do not log forever).

## Log contract

Lightweight convention applied with the project’s existing logger / `console`. Same fields on client and server.

**Required:**

- `debugRunId` — one id for the repro session
- `flow` — short journey name (`checkout.submit`, `profile.save`)
- `step` — stable step id (`ui.click`, `client.request`, `api.entry`, `api.exit`, `client.response`, `ui.apply`)
- `hypothesis` / `note` — what this line proves or disproves

**Optional:** outcome/status, timing, existing domain ids (non-PII), branch taken, payload shape (keys/length), error category

**Never:** secrets/tokens/auth headers; full PII by default; full request/response bodies by default (shape + decisive fields only)

**Sink preference:**

1. Existing structured logger / server stdout the agent can read
2. Client console with shared prefix (human pastes if needed)
3. Temporary local debug file, clearly marked for deletion in cleanup

**Example prefix shape** (illustrative):

```text
[DEBUG_FLOW run=a3f2 flow=checkout.submit step=api.entry] paymentMethod=card items=2
```

## Packaging

```text
skills/debugging-ui-flows/
  SKILL.md
```

No `scripts/`, no MCP dependencies. No `references/` unless the body would exceed ~500 lines (not expected in v1).

**Frontmatter:**

- `name`: `debugging-ui-flows`
- `description`: trigger-shaped; starts with “Use when…”; does **not** summarize internal steps
- `license`: `MIT`
- `metadata.category`: `diagnostics`
- `metadata.tagline`: human one-liner ≤120 chars (not “Use when…”)
- `compatibility` (optional): human repro expected; browser automation MCPs not required

**Body sections:** Overview, When to Use / Do not use for, Core Process (8 steps), Log Contract, Human Communication, Cleanup Gate, Common Mistakes

**Release:** changeset `minor` (new skill name is public install-by-name API)

## Anti-patterns the skill must forbid

| Mistake | Fix |
| --- | --- |
| Fixing before any trail exists | Map + instrument + repro first |
| Logging every line on the first pass | Sparse boundaries, then densify |
| Leaving debug logs after the fix | Cleanup is a hard done-gate |
| Dumping full bodies / secrets “for context” | Shape + decisive non-sensitive fields |
| Treating this as permanent observability | Hand off gaps to `instrumenting-for-observability` after cleanup |
| Endless densify loops | Cap loops; remap the flow |

## Success criteria

- An agent following the skill asks for a human repro and does not claim a root cause without trail evidence
- Instrumentation is temporary and removed before finish
- Client and server lines share `debugRunId` / `flow` / `step` so one session reads as a single story
- `npm run validate` and `npm run index` succeed after the skill is added
- Clear exclusion of `instrumenting-for-observability` and browser MCP workflows

## Future extensions (explicitly deferred)

- Optional observe-only mode if Chrome DevTools / Playwright MCP is available
- Stack-specific recipes under `references/`
- Tiny helpers for run-id / checklist generation
