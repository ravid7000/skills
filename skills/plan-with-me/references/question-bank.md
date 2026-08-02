# Question Bank

Material for step 3 of [`SKILL.md`](../SKILL.md). Use it to find the *highest-leverage* question for the change in front of you — not as a checklist to walk. Most changes need three to six questions total, and a question only earns a turn if its answer changes a step in the plan.

Every question here still has to be asked in the four-part shape (context, options, recommendation, consequence) from the skill body, and delivered through the host's question tool where one exists. A bare question copied from this file is worse than no question.

## Facts to look up, not to ask

The line isn't "can I find the answer myself?" — it's fact versus decision. The questions below have one right answer sitting in the repo, so asking them tells the user you haven't looked. Answer them yourself in the step 1 grounding pass.

| Don't ask | Find it in |
| --- | --- |
| "What framework/language/test runner do you use?" | `package.json`, lockfiles, config files, `pyproject.toml`, CI workflows |
| "How do you handle errors / logging / auth?" | Two or three existing call sites in the same layer |
| "What are your naming conventions?" | Neighbouring files; linter and formatter config |
| "Do you have tests for this?" | The test directory, and the test file next to the module |
| "Where should this file go?" | Where the closest analogous thing already lives |
| "What does this function do?" | Read it |
| "Which version of `<library>` are you on?" | The lockfile — then check that version's docs, not your memory |
| "Has this been tried before?" | Search the repo, then `git log` for the area |

The pattern: **anything with one right answer is yours to find.** Reserve turns for intent, priorities, and tradeoffs.

What a fact often *does* do is turn into a decision worth asking. Each of these is a real question, and the discovered fact is what makes it a good one:

| Found in the code | Question it seeds |
| --- | --- |
| The module has no tests | "Nothing here is tested today. Add coverage for this change only, or backfill the module while we're in it?" |
| Validation happens in the controller | "Keep validation at the controller like the rest, or push it into the service for this flow?" |
| A near-identical helper already exists | "Extend the existing helper and change its two callers, or add a parallel one and leave them alone?" |
| The library is three majors behind | "Plan against the pinned version, or upgrade first as its own phase?" |

Consistency with what's there is a default worth recommending. It is never a default worth assuming — a change is often exactly where someone wants the existing pattern to stop.

## By kind of change

### New feature or endpoint

- Who triggers it, and what does the caller have in hand when they do? Fixes the interface before the internals.
- What's the smallest version that would be worth shipping? Splits phase 1 from the rest.
- Does it need to be visible to existing users immediately, or gated?
- What should happen on the unhappy paths — invalid input, missing permission, downstream timeout? Silence here becomes an assumption in the plan.
- Is this the first of its kind, or one more of something that exists? If the latter, the plan should match the existing shape and the question is whether to extend or generalise.

### Refactor

- What problem is the current shape causing? A refactor with no symptom has no success condition, and no way to stop.
- Must behaviour be identical, or is this the chance to fix behaviour too? Answering "both" is the most common way a refactor overruns.
- What proves nothing broke — existing tests, new characterisation tests, a staged rollout?
- One sweep or incremental with both shapes coexisting? Decides whether the plan needs an adapter or a deprecation window.
- Which callers are out of your control (other teams, published API, persisted data)?

### Migration or data change

- Can old and new coexist, or is there a cutover? Determines whether the plan is one phase or four.
- Is it reversible, and what's the rollback if step 3 fails in production?
- How much data, and does the change need to be online? Answers backfill strategy and whether locking matters.
- What reads the old shape that isn't in this repo — dashboards, analytics, ETL, another service?
- Does anything need to be dual-written or dual-read during the transition?

### New dependency or third-party integration

- Build, buy, or extend something already here? Check what's already in the lockfile before asking.
- What's the failure behaviour when the third party is down or slow — fail closed, fail open, queue?
- Where do credentials live, and who can rotate them?
- What are the rate limits, quotas, and cost per call at the volume expected? Verify from docs and cite; guessing this is how a plan ships a bill.
- Is there a sandbox to develop against?

### API or contract design

- Who consumes it, and can they be changed at the same time? Decides whether backwards compatibility is a constraint or a nicety.
- Is it versioned, and what's the deprecation path?
- Synchronous response or accepted-and-processed-later? Shapes everything downstream.
- What's the pagination, filtering, and error-shape convention already used here?

### Data model

- What's the identity and uniqueness of the thing being modelled?
- Which relationships are required versus optional, and what cascades on delete?
- Is history needed, or does the current state suffice? Retrofitting history is a rewrite.
- What are the read patterns? Indexes and shape follow from queries, not from the diagram.
- Does any of it count as personal or regulated data?

## Questions that only look useful

Usually the topic is fine and the *shape* is wrong: no options attached, or only one answer a person would ever give. Each of these has a version worth a turn.

| Don't ask | Ask instead |
| --- | --- |
| "Should I write tests?" | Nobody says no. "Unit tests at the service, or one integration test through the endpoint?" if the level is genuinely contested |
| "Do you want this clean/maintainable/performant?" | Name the specific tradeoff and what it costs: "cache this and accept staleness of up to a minute, or query live?" |
| "Any other requirements?" | Unanswerable in the abstract. Propose the specific thing you suspect is missing and let it be confirmed |
| "Shall I proceed?" mid-planning | Nothing — the loop is the work. Save the one go-ahead question for after the file is written |
| "How do you want it structured?" | Propose a structure grounded in what's already there, as options, and let it be corrected |
| Anything already answered earlier in the conversation | Nothing. Keep the running decision list (step 5) so this can't happen |

## When the user doesn't know

A common and legitimate answer is "I don't know". It's not a dead end and it's not licence to assume. In order:

1. Offer the recommendation as a default, with what it costs to reverse later. Cheap to reverse plus a clear default usually ends it in one turn.
2. If it's expensive to reverse, narrow it: ask the smaller sub-question that actually decides it.
3. If it stays open, put it in **Open questions** with the step it blocks and what would settle it — a spike, a stakeholder, a measurement, a document.
4. If it blocks step 1, say so plainly. A plan whose first step is blocked is not ready, and reporting that is a more useful outcome than a plan that hides it.
