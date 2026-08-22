---
name: debug-flow
description: Use when a flow breaks and needs runtime evidence — button does nothing, wrong data after save, an endpoint returns the wrong result, a CLI command or job fails silently, a request dies between layers — or when the user will reproduce locally and wants temporary debug logs / a flow trace. Triggers on "add logs and I'll repro", "trace this flow", "why is this request wrong", "instrument this bug", or guessing from code alone without a repro trail.
license: MIT
compatibility: Expects a human to reproduce locally (browser, terminal, curl, test run). Automation MCPs such as Playwright or Chrome DevTools are not required and are out of scope for this skill.
metadata:
  category: diagnostics
  tagline: Traces broken flows across any stack with temporary correlated logs, then tears them out.
---

# Debug Flow

## Overview

Static reading of code often produces confident wrong guesses. A broken flow — a UI journey, an API request, a CLI command, a background job — needs a **temporary, correlated trail** across every layer it crosses: the human reproduces once, the agent reads the sink (or a paste), and the first divergence names the real fault.

Core discipline:

> **No fix until the trail shows the first divergence — then densify only there, fix the cause, and delete every debug line you added.**

This skill is for *this bug's* trail. It is not permanent production observability.

## When to Use

- A bug needs reproduction (“button does nothing”, “wrong data after save”, “job never runs”, “CLI exits wrong”)
- The flow fails at a specific step and it is unclear which layer is wrong — client, API, service, worker, DB, script, or the wiring between them
- The agent is guessing from code alone and needs runtime evidence
- The user will reproduce locally (“add logs and I’ll repro”, “trace this flow”, “why is this request wrong”)

**Do not use for:**

- **Permanent production observability** — logging, metrics, or tracing meant to ship and stay. Use `instrumenting-for-observability` instead
- **Static-only code review** with no planned runtime reproduction
- **Agent-driven automation loops** via Playwright MCP, Chrome DevTools MCP, or similar (out of scope for this skill)
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

Sketch the minimal path that can explain the bug, whatever the stack:

`entry (UI event / HTTP request / CLI invocation / job trigger) → handlers and state → calls across boundaries → core logic / DB → response or side effect → output applied`

Mark unknowns. Prefer the smallest path that can produce the symptom. Do not add logs yet.

### 3. Instrument sparsely (temporary)

Generate one `debugRunId` for the session. Using whatever logger, `console`, or print facility the repo already uses, add **boundary** logs only — one at each point where the flow enters or leaves a layer:

| Step id pattern | Where |
| --- | --- |
| `entry` | The flow's entry point (UI click/submit, route handler, CLI main, job start) |
| `<layer>.request` | Immediately before a call across a boundary — HTTP, queue, RPC, subprocess (target, decisive non-sensitive fields / shape) |
| `<layer>.entry` | The receiving side of that boundary |
| `<layer>.exit` / `<layer>.error` | The receiving side's success or failure path |
| `<layer>.response` | After the caller gets the result back (status, parsed shape, branch taken) |
| `apply` | Final state, UI, file, or DB update from the result |

Name layers after the code: `ui`, `client`, `api`, `service`, `worker`, `db`, `cli`. Every line must carry the [log contract](#log-contract) fields so lines from all layers sort into one story.

Do **not** log every function on this first pass.

### 4. Ask the human to reproduce once

Tell them exactly:

1. What actions to perform (the repro steps)
2. What to watch or copy — server terminal, CLI output, log file, or browser console, filtered by `DEBUG_FLOW` / `debugRunId`; plus the status of the failing call if the flow crosses HTTP
3. That you prefer sinks you can read locally; otherwise paste the matching log lines

Wait for evidence. Do not invent a root cause while waiting.

### 5. Locate the first divergence

Walk the trail in order for this `debugRunId`:

- Mark the **last line that still looks expected**
- Mark the **first line that is wrong, missing, or never reached**

That span is the only place to densify next. If the trail never crosses a boundary, the break is on the calling side (or the call never fired). If a layer returns correctly and its consumer is wrong, densify on the consuming side.

### 6. Densify only around the break

Add more **temporary** logs inside that span: branches taken, parsed values (non-sensitive), empty vs populated collections, status codes, error categories.

Reproduce again. Repeat steps 5–6 until the cause is specific enough to fix.

**Cap:** after 2–3 densify loops without a clear cause, stop logging and **remap** the flow — the bug may sit on a path you did not include.

### 7. Fix the root cause

Change production behavior. Do not “fix” the bug by leaving debug logs in place or by papering over the symptom with guesses the trail contradicts.

### 8. Cleanup and verify (hard gate)

Before claiming done:

- [ ] Remove every temporary debug log, helper, flag, and file added for this session
- [ ] Grep the diff / tree for `DEBUG_FLOW`, the `debugRunId`, and obvious debug leftovers
- [ ] Confirm the original repro is fixed **without** debug noise

The task is not done while temporary instrumentation remains — cleanup is part of the fix, not a follow-up. If the investigation exposed a lasting production blind spot, mention handing that gap to `instrumenting-for-observability` **after** cleanup — do not convert temporary debug lines into shipped telemetry inside this skill.

## Log Contract

Apply with the project’s existing logger, `console`, or print facility. Same fields in every layer.

**Required on every debug line:**

| Field | Meaning |
| --- | --- |
| `debugRunId` | One id for the whole repro session |
| `flow` | Short journey name (`checkout.submit`, `import.run`) |
| `step` | Stable step id from the table above (or a clear sub-step under the densify span) |
| `note` or `hypothesis` | What this line is meant to prove or disprove |

**Useful optional fields:** outcome/status, timing, existing non-PII domain ids, branch taken, payload **shape** (keys, lengths), error category.

**Never log:** secrets, tokens, passwords, raw auth headers; full PII by default; full request/response bodies by default. Prefer shape + the few decisive non-sensitive fields.

**Sink preference:**

1. Stdout / log file the agent can read locally (server terminal, CLI output, worker logs)
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
> 3. Watch the terminal (or paste console/log lines) containing `DEBUG_FLOW` or `run=<debugRunId>`
> 4. If the flow crosses HTTP, note the status code of `<method> <path>`
>
> I’ll read local logs if they’re in a sink I can reach; otherwise paste the matching lines.

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
