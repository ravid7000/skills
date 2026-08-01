---
name: instrumenting-for-observability
description: Use when a new or changed feature, endpoint, background job, or client-side flow is about to ship and needs logging, metrics, or tracing — or when reviewing whether a change would be diagnosable once it's running in production. Triggers on "add observability", "add logging/metrics/telemetry", "instrument this", "how will we know if this breaks", "we had no data during that incident", or a post-incident finding that a failure was invisible.
license: MIT
compatibility: Assumes a codebase with existing telemetry, metrics, or structured logging to match. With none present, degrades to recommending signals and a setup rather than writing call sites. No specific vendor, language, or framework required.
metadata:
  category: diagnostics
---

# Instrumenting for Observability

## Overview

Once code is running in production nobody can watch it directly. The only thing knowable about it is what it records about itself, so a failure that was never instrumented is a failure nobody can explain — and unlike most engineering debt, this one can't be paid off later. The moment the data is needed is *after* the incident, and by then the window to collect it has closed.

The core discipline of this skill is one inversion:

> **Instrumentation is designed backwards from the questions it must answer, never forwards from the code.**

Walking a diff and adding a log line wherever something interesting happens produces volume proportional to code complexity rather than to operational risk. Writing the failure questions first, then adding one signal per question, produces the opposite — and gives a pruning rule in both directions: **a question with no signal is a gap, and a signal that answers no question gets deleted.**

## When to Use

- A new endpoint, job, consumer, or user-facing flow is about to merge
- An existing path is being changed in a way that alters how it can fail
- Reviewing a diff for whether it could be debugged at 3am
- A retro concluded that an outage took too long to diagnose because the data wasn't there
- An engineer asks for "logging" or "metrics" without saying which, or which fields

**Do not use for:**

- **Product analytics** — funnels, activation, feature adoption. Different consumer, different taxonomy, different privacy posture. Conflating operational telemetry with behavioural event tracking is a common and costly mistake; instrument that a checkout *failed*, not that a button was *clicked*
- **Dashboard, alert, or SLO configuration** — this skill adds the signals those are built from, and stops there
- **Retrofitting an entire service** — scope is one change. A service-wide audit is a different, much larger piece of work
- **Diagnosing a live incident** — that's using telemetry, not adding it. Add the missing signals afterwards, once the questions the incident raised are known
- **Researching an unfamiliar telemetry library's API** — use `finder` for that first, then return here for what to instrument

## Core Process

### 1. Match what the codebase already does

Before writing anything, find how this repo already emits telemetry, and copy it. Look for:

- Telemetry imports and initialisation (`opentelemetry`, `prometheus_client`, `@sentry/*`, `structlog`, `winston`, a local `lib/telemetry` wrapper)
- Two or three existing metric registrations and span creations — note the naming convention, unit suffixes, and standard labels
- Whether logs are structured key-value or interpolated strings
- Any existing helper that wraps the vendor SDK — prefer it over calling the SDK directly

This step is what makes the skill portable. The **decision framework below is stack-independent; the syntax comes from the repo.** It also prevents a second failure: a parallel naming scheme living alongside the existing one, which fragments every dashboard built on top.

If there is genuinely no telemetry setup, stop and report that. Recommend the signals and a library, but don't unilaterally introduce a telemetry vendor as a side effect of a feature PR.

### 2. Write the failure questions first

Before choosing any signal, write the questions someone will need answered when this breaks. The standard set, adapted to the change:

- How do I know this is working at all?
- How do I know it broke?
- Is it broken, or just slow?
- Is it everyone, or a subset — one tenant, region, plan tier, browser, device?
- What do I need to decide whether to roll back?
- For one specific failed case, what exactly happened?

Write them down explicitly. They are the justification for every line of instrumentation that follows, and they belong in the PR description.

### 3. Map each question to exactly one signal

| Signal | Use when | Answers |
| --- | --- | --- |
| **Counter** | Something happens repeatedly and you need the rate | How often? How often *failing*? |
| **Histogram / timing** | You need a distribution, not an average | How slow, at p50 vs p99? |
| **Gauge** | A level that rises and falls | Queue depth, in-flight, pool saturation |
| **Span (trace)** | A flow crosses steps, services, or processes | *Where* did the time or failure go? |
| **Log** | You need the detail of one specific event, later | What exactly happened to this one request? |

The heuristic that resolves most cases in one line: **if you would ever graph it or alert on it, it's a metric; if you would only ever read it while investigating a single case, it's a log.**

For anything that handles requests or processes jobs, the default starting set is RED — a counter of attempts labelled by outcome, a latency histogram, and (when there's a queue) a saturation gauge — plus a structured error log carrying enough context to reproduce. Start there and deviate deliberately, rather than from a blank page.

### 4. Apply the hard rules

**Bounded cardinality on metric labels.** This is the most common and most expensive mistake in the whole discipline. Every distinct combination of label values creates a separate time series. A label must come from a set that is small and enumerable *at design time*: status class, region, plan tier, error category, event type.

| Safe as a metric label | Never a metric label |
| --- | --- |
| outcome, status class, error category | user / order / request / session ID |
| region, plan tier, event type | email, full URL with path params |
| browser family, queue name | raw exception message, full user-agent |

Unbounded identifiers belong on spans and log lines, which are indexed differently. Correlate back via trace ID. In code an ID looks like any other string, which is exactly why this needs to be a stated rule rather than left to judgement — the feedback arrives as a monitoring bill, not a test failure.

**Never record secrets or personal data.** No credentials, tokens, full request bodies, or PII — including on the failure path, which is the most tempting place to dump everything. Instrument the *shape* of the data instead of the data: a size bucket rather than the payload, a mime type rather than the filename, a domain rather than the address. This is a compliance concern, not a style preference, and logs are retained and widely readable.

**Respect the recurring cost.** Every signal is billed for as long as it exists. Debug-level logging inside a hot loop, or a per-request info log on a path serving tens of thousands of calls a day, is real money buying information a counter already provides. Sample high-volume traces.

### 5. Write the code

Use the conventions found in step 1. Keep the emission close to the thing being measured, and make sure a single failure counter can say *which stage* failed — one well-labelled counter beats five separate ones.

Instrumentation must never change behaviour: it cannot throw, cannot swallow an existing exception, and cannot add a blocking network call to a request path.

### 6. Verify by exercising the path

Instrumentation has silent failure modes that no test or build catches: a span opened and never closed, a metric declared but never registered, a label set that doesn't match its declaration, a reporting line placed after the `throw` that skips it.

Run the code and confirm the data actually comes out — hit the endpoint and read the `/metrics` output, trigger the flow in a browser and watch the network tab, force the failure path deliberately rather than only the happy one. **A metric that is never incremented produces a graph that sits at zero, which looks exactly like a system that is working perfectly.**

## Output

Report the signal table before or alongside the diff, so a reviewer can check the reasoning without reading the implementation:

```markdown
## Signals added

| Question it answers | Signal | Type | Labels / fields |
| --- | --- | --- | --- |
| Are uploads working? | `avatar_upload_total` | Counter | outcome, stage |
| Slow, or broken? | `avatar_upload_duration_ms` | Histogram | stage |
| What happened to this one? | error report | Log | size bucket, mime, stage |

## Considered and cut

- `avatar_upload_button_clicked` — product analytics, not observability
- Info log per successful upload — the counter already answers this at lower cost

## Verified by

<!-- What was actually run, and what came out -->
```

The "considered and cut" section matters as much as the additions. It's the visible evidence that the pruning rule was applied rather than everything plausible being added.

## References

- [`references/frontend-signals.md`](references/frontend-signals.md) — browser and mobile client specifics: device and network dimensions, client-side cardinality traps, PII in filenames and URLs, delivery reliability
- [`references/backend-signals.md`](references/backend-signals.md) — services, jobs, and consumers: RED in practice, queue and saturation signals, error categorisation, cross-process correlation

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Walking the diff and adding logs at interesting lines | Write the failure questions first; add one signal per question |
| Adding every signal that seems plausible | Delete any signal that answers no listed question, and say so in the PR |
| Putting a user, order, or request ID in a metric label | Move it to the log line or span; keep labels bounded at design time |
| Labelling by raw exception message | Label by error *category*; the message goes in the log |
| Introducing a new telemetry library or naming scheme | Match what the repo already uses; report the gap instead of filling it unilaterally |
| Logging the request body or user object "for context" | Record shape — size bucket, mime type, field count — never contents |
| An info log on every success on a high-volume path | The counter already answers it; keep logs for failures and rare events |
| Instrumenting only the happy path | The failure path is the one that will be read at 3am |
| Assuming it works because it compiles | Exercise the path and confirm the data is actually emitted |
| Treating feature-usage tracking as observability | That's product analytics — different skill, different consumer, different privacy rules |
