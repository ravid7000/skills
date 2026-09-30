---
name: clean-code-review
description: Use when the user asks to "review this PR", "review my diff", "check for clean-code violations", "comment on these changes", or wants structured review comments on existing code rather than new code written. Covers PR hygiene (constants/types split, single responsibility, comments, reuse, dead code, naming, magic values, scope creep, test hygiene) and code analysis (bug hunting, error handling, type looseness, performance smells, edge cases). Produces blunt prefixed review comments and can post them to GitHub on request.
license: MIT
compatibility: Works best with a host that can launch parallel sub-agents and has `git` available. Posting to a PR requires the `gh` CLI logged in; without it, comments print locally only.
metadata:
  category: workflow
  tagline: Reviews a diff in two passes and emits blunt, prefixed PR comments a reviewer can post as-is.
---

# Clean Code Review

## Overview

Review the given changes and produce PR-style comments. Two passes run in parallel: one for structure and conventions, one for behaviour and correctness. Do not fix anything unless asked. Do not praise. Only report findings.

## When to Use

- "Review this PR" or "review my diff"
- "Check this branch for clean-code violations"
- "Comment on my changes before I open the PR"
- The user wants review feedback on existing code, not new code written

**Do not use for:**

- Writing or refactoring code - this skill only reports findings
- Researching a library or pattern before reviewing - use `finder` for that
- Reviewing a plan or design rather than a diff - use `plan-with-me`

## Scope

1. Determine what to review, in this order: an explicit PR number or URL, an explicit diff or file list, otherwise `git diff <merge-base>...HEAD` against the repo's main branch.
2. Review only added or modified lines. Pre-existing code is out of scope unless the change makes it worse or a touched region contains an oversized comment.
3. Read enough surrounding file context to judge responsibility, reuse, and correctness, not just the hunk.
4. Identify the repo's shared directories for utilities, hooks, constants, and types (for example `src/utils`, `src/hooks`, `src/constants`, `src/types`). Reuse checks run against these.

## Execution

Run the two passes in parallel with sub-agents, then merge results.

1. Resolve the diff and the list of changed files once, in the main session.
2. Spawn one agent for Pass 1 and one for Pass 2, each given the diff, the file list, and the full text of its pass section and the Output section. Each returns comments in the output format only.
3. If more than roughly eight files changed, split each pass further by file group (one agent per directory or module) so reuse checks stay scoped and bug hunting keeps whole-function context.
4. The reuse check (`grep`/`find` against the shared directories) runs inside the Pass 1 agent, never from memory.
5. Merge in the main session: group by file, order by line, drop duplicates both passes reported, apply `SAA` where consecutive comments share a fix. Only then move to Delivery.

Never let an agent post to GitHub. Posting happens only in the main session after the user chooses.

## Pass 1 - PR hygiene

Structure and conventions. Run against every changed file.

- **Constants and types split.** Constants, types, interfaces, and enums declared inline in a logic file belong in `./constants` or `./types`. If such a file already exists next to the changed code, point to it. Flag a new one created when a sibling already exists. Verify with `ls` before reporting.
- **One responsibility per unit.** Functions, hooks, or components doing more than one thing: fetching plus transforming, rendering plus computing, validating plus saving. Name both responsibilities and propose the split. Applies to units added in this PR. Do not propose relocating a decision between existing modules the PR only touched.
- **No new code comments.** Any added `//`, `/* */`, JSDoc, `TODO`, or `FIXME`. Suggest the name or structure change that makes it unnecessary. Test descriptions and lint directives are not comments.
- **Reuse before you write.** New utilities, helpers, constants, or types that duplicate an existing one. Search the shared directories, then the same module. Cite the existing symbol and path. A helper kept inside a module that a sibling now imports should move to a common place. Duplication counts only when the shared block has real logic, roughly three lines or more. A single predicate, null check, or filter is not duplication. Confirm with `grep`/`find`; never report reuse from memory.
- **Prefer the utility library.** If the repo depends on lodash or similar, flag hand-written `isEmpty`, nested optional chains that `get` replaces, manual `groupBy`, `pick`, `omit`, `debounce`, `uniq`. Show the library call. Collection and object operations only. Never flag `!= null`, `!== undefined`, or other single-token checks.
- **Prefer the date library.** If the repo depends on dayjs or similar, flag raw `new Date()` arithmetic, manual formatting, `getTime()` comparisons, custom date helpers. Show the equivalent.
- **Sub-modules are directories.** Prefixed sibling files (`FooHeader.tsx`, `fooUtils.ts` in the parent dir) instead of `./foo/`. Sub-module constants or types outside `./foo/constants` or `./foo/types`.
- **Dead code.** Unused imports, exports, params, variables, commented-out blocks.
- **Naming.** Only when the name misleads: a boolean without `is`/`has` that reads as a value, a handler not named `handleX`/`onX`, or a name that contradicts what the code does. Do not flag style preferences or minor abbreviations. Report as `Nit:` only.
- **Magic values.** Inline strings and numbers that carry meaning and should be a named constant.
- **Scope creep.** Unrelated refactors, renames, or files that have nothing to do with the feature. Ignore small lint fixes such as `async`/`void`, import ordering, or formatting in files the PR already touches.
- **Test hygiene.** Tests that mock the module they test, its internal functions, or sibling helpers it depends on. Mocks of network, timers, third-party SDKs, and browser APIs are fine. Tests asserting implementation details instead of behaviour.

## Pass 2 - Code analysis

Behaviour and correctness. Read each changed function fully before judging.

- **Static bug hunting.** Null or undefined paths, off-by-one, wrong equality or operator, unhandled promise or missing `await`, stale closures in hooks, missing effect dependencies, unreachable branches, swallowed errors, state updated after unmount, wrong key in lists. Report as `Look Like Bug:` with the concrete input that breaks it.
- **Simplification.** Within a single function only: nesting three deep or more, two branches with the same body, a loop a single library call replaces, an intermediate variable used once. Require a concrete readability defect; correct logic with readable branches is not a finding. Never propose extracting a shared helper or moving logic across units here. Fewer lines is never the goal.
- **Oversized comments.** Any comment longer than one line in a touched region. Ask whether the code can carry the meaning through naming or extraction, and propose the shorter form or removal.
- **Error handling gaps.** `try/catch` that logs and continues, missing failure state in UI, errors thrown without context, catch blocks that hide the original error.
- **Type looseness.** `any`, unnecessary `as` casts, non-null assertions hiding a real check, `string` where an existing enum or union fits. Do not flag a harmless `?.` on a value that is optional in its type.
- **Performance smells.** Only when the cost is certain and user-visible: an effect with a missing or object dependency that refires every render, an API call inside a loop, or an expensive computation over a large list rerun on every render. Never flag missing `useMemo`/`useCallback` on its own.
- **Edge cases.** Empty arrays, zero, empty string treated as falsy, single-element lists, missing default branch.

Every Pass 2 finding must be derivable from the code alone. Never raise product or data questions such as migrations, backfills, or what the backend guarantees.

## Output

Every comment starts with exactly one prefix:

- `Look Like Bug:` a defect with a concrete failing case.
- `Sugg:` a change that should be made.
- `Good to have:` a change worth making but not blocking.
- `Nit:` style or naming.
- `SAA` same as above - same fix as the previous comment, no repeated text.

Rules:

- One comment per finding, grouped by file, ordered by line, `L<n>` or `L<n>-<m>` prefix.
- Blunt and plain. One sentence where possible, never more than 25 words.
- No rule names, no narrative, no compliments, no summary table, no closing paragraph.
- Use a single hyphen, never `--` or em dashes.
- When a comment states an issue and a suggested fix, put the fix on its own second line. Never join issue and fix with a hyphen.
- If nothing is found, return exactly: "No findings."

```
### src/hooks/useOrderStatus.ts

L12 Sugg: `POLL_INTERVAL_MS` inline.
Move to `src/hooks/constants.ts`.
L20-48 Sugg: hook polls and maps to view labels.
Move mapping to a selector.
L31 Nit: `Object.keys(data).length === 0` -> `isEmpty(data)`.
L44 Look Like Bug: `items[0].id` throws when `items` is empty.
L52 SAA
```

## Delivery

After the review is complete, state the finding count on one line and ask exactly one question:

"<n> findings. Print locally or post as PR comments?"

- **Local.** Print the comments in the format above.
- **PR comments.** Post each as an inline review comment via `gh api` on the PR, using the currently logged-in `gh` user. Never approve or request changes. Never add an agent, LLM, or AI trailer, signature, or attribution to any comment. Post the comment text verbatim.

Never post to GitHub without the user choosing that option.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Reporting reuse or duplication from memory | Run `grep`/`find` and cite the path |
| Reviewing untouched code | Only added or modified lines are in scope |
| Letting a sub-agent post to GitHub | Posting happens in the main session after the user chooses |
| Padding comments with praise or rule names | One blunt sentence per finding |
