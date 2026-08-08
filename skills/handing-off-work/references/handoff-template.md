# Handoff Template, Annotated

The skeleton in [`SKILL.md`](../SKILL.md) is the copy-paste version. This file explains what each section is for, what a weak version of it looks like, and ends with a filled-in example at the level of detail to aim for.

Sections are not mandatory. Drop any that would be empty — an empty "Tried and abandoned" table is noise, and a handoff with six headings and one line under each is harder to read than four short paragraphs. What is not optional is **Resume here**, the status header, and a reason attached to every decision.

---

## Header block

```markdown
**Status:** in progress | blocked | ready for review
**Branch:** `<branch>` at `<sha>` · **Worktree:** clean | <n> uncommitted files
**Verify with:** `<command>` — currently <what it reports>
```

Three lines that let a reader decide, before reading anything else, whether the document still describes reality.

`Status` is the reader's first filter. **blocked** is the one that carries information: it means the next action is not code, and whatever it is belongs at the top of *Resume here*.

`Branch at sha` is the anchor for everything below. Without it, a document that says "the parser now handles quotes" is unfalsifiable — with it, the reader can check out that commit and see for themselves.

`Verify with` is what makes the document self-checking. Give the command *and* what it currently reports, including when the answer is unflattering:

```markdown
**Verify with:** `npm test -- parser` — 14 pass, 2 fail (both in `quotes.test.ts`, expected, see State)
```

A known failure recorded here saves the next agent from treating it as a regression they caused.

## Resume here

The single next concrete action, specific enough to start without reading further.

```markdown
<!-- Weak -->
## Resume here
Continue implementing the CSV parser.

<!-- Strong -->
## Resume here
Add escaped-quote handling to `parseField()` in `src/parser/csv.ts:88`. The two
failing cases in `test/quotes.test.ts` are already written and describe the
expected behaviour — make them pass without changing them.
```

When the work is blocked, this section says what unblocks it and who or what can do that, not what to code.

## Goal

Two or three lines on what the work is meant to achieve — enough that the reader can tell whether a given change serves it. This is where a reader catches that the remaining steps have drifted from the point.

If a plan document already exists (see the `plan-with-me` skill), link it rather than restating it.

## State

Three lists, and the third matters more than it looks.

```markdown
- **Done:** <finished and verified — say how it was verified>
- **Remaining:** <what's left, in the order it should happen>
- **Deferred:** <consciously out of scope>
```

**Deferred** is what stops the next agent "helpfully" doing something that was already decided against, or reopening a scope question that was settled. `Remaining` should be ordered, because ordering is a decision the session made and the reader would otherwise have to re-derive.

## Decisions

```markdown
| Decision | Choice | Why | Where it lives |
| --- | --- | --- | --- |
| Streaming vs. buffering input | Stream | Files hit 400 MB in prod; buffering OOMs the worker | `src/parser/stream.ts` |
```

The **Why** column is the reason this document exists. A decision recorded without one reads as arbitrary, and an arbitrary-looking decision gets reversed by the next agent who finds it inconvenient.

**Where it lives** matters nearly as much: it turns the decision from trivia into something the reader will encounter, and tells them what they'd be undoing.

Record who decided when it wasn't obvious — a user's explicit instruction and an agent's judgement call carry very different weight when someone later wants to change it.

## Tried and abandoned

```markdown
| Approach | Why it was dropped |
| --- | --- |
| `csv-parse` library | Doesn't expose byte offsets, which the error reporting needs |
| Regex-based field splitting | Fails on embedded newlines inside quoted fields |
```

The section most often skipped and most expensive to omit. A fresh agent reaches for the obvious approach first — the same obvious approach — and rediscovers the same wall.

Include only what was actually attempted or seriously investigated. A list of everything imaginable that might not work is padding.

## Code changes

```markdown
| File | What changed | Committed? |
| --- | --- | --- |
| `src/parser/csv.ts` | New `parseField()`, quote handling incomplete | uncommitted |
| `test/quotes.test.ts` | 2 failing cases describing intended behaviour | `a3f9c21` |
```

Built from `git status -sb` and `git diff --stat`, never from memory. **What changed** should say what it means, not repeat the diffstat — "+42 −3" is already in git; "handles quoted fields, escapes still broken" is not.

The **Committed?** column tells the reader which claims they can rely on. Anything marked uncommitted is unreachable from another machine unless the handoff also says how to get it (commit, push, patch file).

## Environment and commands

Everything needed to get to a running state: install and run commands, services that must be up, ports, env vars **by name and source**, fixture or seed data, and how to reset.

```markdown
- `npm run dev` (needs Postgres on :5432 — `docker compose up db`)
- `STRIPE_KEY` required; test key is in 1Password under "Billing / dev"
- Reset fixtures with `npm run seed:reset` — the parser tests mutate them
```

Never the value of a secret. Name it and say where it comes from.

## Gotchas discovered

The non-obvious things that cost time. A flaky test and the incantation that settles it, documentation that's wrong, an API that behaves differently from its spec, a build step with a hidden dependency.

The test for inclusion: did it surprise someone this session? If the next agent would find it in ten seconds by reading the file, leave it out.

## Open questions

```markdown
| Question | Blocks | What would settle it |
| --- | --- | --- |
| Should malformed rows fail the batch or be skipped? | Error handling in step 3 | Product decision — ask @user |
```

**Blocks** tells the reader whether they can start anyway. **What would settle it** turns an open question into an action; without it the question just sits there being reread.

An unresolved question written down is strictly better than a guess written as fact — the question gets asked, the guess gets implemented.

---

## Worked example

```markdown
# Handoff: CSV import for the bulk-upload endpoint

**Status:** in progress
**Branch:** `feat/csv-import` at `a3f9c21` · **Worktree:** 2 uncommitted files
**Verify with:** `npm test -- parser` — 14 pass, 2 fail (both in `quotes.test.ts`, expected)

## Resume here

Add escaped-quote handling to `parseField()` in `src/parser/csv.ts:88`. The two
failing cases in `test/quotes.test.ts` describe the expected behaviour — make
them pass without changing them. Everything else in the parser is done.

## Goal

Let admins bulk-upload subscribers as CSV through `POST /admin/import`, with
per-row errors reported back rather than a single opaque failure.

## State

- **Done:** streaming reader, header detection, field splitting, per-row error
  collection. Covered by `test/parser/*.test.ts`.
- **Remaining:** (1) escaped quotes, (2) wire the parser into the route handler
  at `src/routes/admin/import.ts`, (3) a size limit — unbounded uploads today.
- **Deferred:** TSV support and encoding detection. Decided out of scope with
  the user; the endpoint documents UTF-8 CSV only.

## Decisions

| Decision | Choice | Why | Where it lives |
| --- | --- | --- | --- |
| Streaming vs. buffering | Stream | Customer files reach 400 MB; buffering OOMs the worker | `src/parser/stream.ts` |
| Error reporting | Collect all rows, then report | Users fix one upload once instead of iterating per error — user's explicit ask | `src/parser/errors.ts` |
| Hand-rolled parser | Yes | See below; the libraries evaluated couldn't report byte offsets | `src/parser/csv.ts` |

## Tried and abandoned

| Approach | Why it was dropped |
| --- | --- |
| `csv-parse` | No byte offsets, so "error on row 812" can't point at a column |
| Regex field splitting | Breaks on newlines inside quoted fields — the failing tests came from this |

## Code changes

| File | What changed | Committed? |
| --- | --- | --- |
| `src/parser/csv.ts` | New parser; `parseField()` quote handling incomplete | uncommitted |
| `src/parser/stream.ts` | Chunked reader, 64 KB buffer | `a3f9c21` |
| `test/quotes.test.ts` | 2 failing cases describing intended behaviour | uncommitted |

Both uncommitted files are on this machine only. To pick this up elsewhere,
commit and push `feat/csv-import` first.

## Environment and commands

- `npm test -- parser` runs the relevant suite; the full suite needs Postgres
  (`docker compose up db`) and is unrelated to this work
- Sample files in `fixtures/csv/`; `large.csv` is 400 MB and gitignored —
  regenerate with `node scripts/gen-fixture.js`

## Gotchas discovered

- `test/parser/stream.test.ts` is flaky under `--runInBand`; it passes reliably
  with the default runner. Not caused by this change
- The endpoint sits behind a 30 s gateway timeout, so streaming is a hard
  requirement, not an optimisation

## Open questions

| Question | Blocks | What would settle it |
| --- | --- | --- |
| Malformed rows: fail the batch or skip and report? | Step 2, the route handler | Product decision — ask the user |
| Upload size limit | Step 3 | Whatever the gateway already caps at; check infra config |
```

Two things this example is doing deliberately. Every claim about the code is checkable against `a3f9c21`, so a reader who suspects the document is stale can find out in one command. And the parts that only existed in the session — why the library was rejected, why streaming is non-negotiable, which test is flaky for unrelated reasons — are exactly the parts that would have cost the next agent an afternoon each.
