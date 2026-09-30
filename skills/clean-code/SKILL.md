---
name: clean-code
description: Use when writing, refactoring, or extending code in any repo and the user wants strict working rules applied throughout - no comments, one responsibility per unit, constants and types in their own files, reuse existing helpers before writing new ones, prefer the repo's utility and date libraries, no dead code or magic values, strict types, handled edge cases and errors, tests and lint always green, no mocking the module under test, ask instead of assume, verify library APIs against current docs, and surface decisions to the user. Code written under these rules passes the clean-code-review skill with no findings. Triggers on "follow clean-code rules", "write this cleanly", "apply the working rules", or any coding task where the user has opted into this convention.
license: MIT
metadata:
  category: workflow
  tagline: Applies strict clean-code working rules to every coding task - structure, process, and output.
---

# Clean Code Working Rules

## Overview

A fixed set of rules for how code gets written and how the work is communicated. Follow every rule below for the whole task. They are not optional. Code written under these rules should pass `clean-code-review` with "No findings."; before showing a step, self-check the work against every rule here.

## When to Use

- Writing new code, features, or tests in any repo
- Refactoring or extending existing code
- Any coding task where the user has asked for clean-code rules to be followed

**Do not use for:**

- Reviewing an existing diff and reporting findings - use `clean-code-review`
- Researching a library or pattern with no code to write yet - use `finder`
- Designing or planning before implementation - use `plan-with-me`

## Code style

1. **No code comments.** Never add comments, JSDoc, or TODO notes. Express intent through naming and structure.
2. **Communicate with code.** Show the diff or the code. Do not explain in prose what the code already says.
3. **One responsibility per unit.** Every function, method, hook, and component does exactly one thing. Split anything that does two.
4. **No mixed files.** Constants live in their own file. Types and interfaces live in their own file. Never inline them next to logic.
5. **Reuse existing constants/types files.** Before adding a constant or type, check whether a `./constants` or `./types` file (or directory) already exists next to the code being changed. If it does, add to it. Only create a new one when none exists.
6. **Reuse before you write.** Before adding a utility, helper, constant, or type, search the codebase for an existing one - first in the repo's shared directories (for example `src/utils`, `src/hooks`, `src/constants`, `src/types`), then in the same module or scope. Look around neighbouring files. If it exists, use it. If it exists inside the same module but is needed by a sibling, move it to a common place for that module and import it from there. Never reinvent something that already exists.
7. **Prefer the utility library.** If the repo depends on lodash or similar, use its utilities (`get`, `isEmpty`, `pick`, `omit`, `debounce`, `groupBy`) instead of hand-written equivalents wherever they reduce code.
8. **Use the date library.** If the repo depends on dayjs or similar, route all date and time parsing, formatting, comparison, and arithmetic through it. Never use raw `Date` math or write custom date helpers.
9. **Sub-modules are directories.** When a new sub-module is needed, create `./[module-name]/` and put the module files inside it. If the sub-module needs its own constants or types, create `./[module-name]/constants` and `./[module-name]/types` inside that directory. Never scatter sub-module files as prefixed siblings in the parent directory.
10. **No dead code.** Remove unused imports, exports, params, variables, and commented-out blocks before showing a step.
11. **Names say what they are.** Booleans start with `is`/`has`. Handlers are `handleX` or `onX`. A name must never contradict what the code does.
12. **No magic values.** Any inline string or number that carries meaning becomes a named constant in the `constants` file.
13. **Stay in scope.** Touch only what the task needs. No unrelated refactors, renames, or drive-by changes in other files.

## Correctness

14. **Handle the empty and null paths.** Before finishing a unit, walk it with an empty array, zero, empty string, a single element, `null`, and `undefined`. Add the missing guard or default branch, never a non-null assertion.
15. **No swallowed errors.** A `try/catch` either recovers meaningfully, rethrows with context, or surfaces a failure state to the UI. Never log and continue silently.
16. **Await every promise.** No floating promises, no missing `await`, no state updates after unmount.
17. **Hooks declare their dependencies.** Effects and memoised callbacks list every value they read. Never pass a fresh object or array literal as a dependency.
18. **Strict types.** No `any`, no unnecessary `as` casts, no `!` in place of a real check. Use an existing enum or union instead of `string` where one fits.
19. **No certain, user-visible waste.** No API call inside a loop and no expensive computation over a large list rerun on every render. Do not add `useMemo`/`useCallback` without such a cost.
20. **Keep each unit flat.** No nesting three deep or more, no two branches with the same body, no intermediate variable used once, no loop a single library call replaces.

## Process

21. **One thing at a time.** Complete a single step, show it, then move to the next. Do not batch unrelated changes.
22. **Never assume.** When a requirement, name, location, or behavior is unclear, stop and ask a clarifying question before writing code.
23. **Do not rely on memory.** For any library API, framework behavior, or version-specific detail, verify against current official docs or a web search before using it.
24. **No unilateral decisions.** When a choice exists (naming, structure, approach, library), list the options and let the user pick. Do not choose silently.
25. **No agent attribution in git.** When committing, never use an agent or bot identity as author or committer, and never add a `Co-Authored-By` trailer or "Generated with" line naming an AI tool to commit messages or PR descriptions. Commits are authored by the user only.
26. **Tests and lint always pass.** After every change, run lint, type-check, and the relevant tests. Fix every error and warning before showing the step or committing. Never leave failing tests or lint errors behind.
27. **Test real behaviour, never mock the module under test.** When adding a test case, import and exercise the actual module. Do not mock the original module, its internal functions, or sibling helpers it depends on. Only mock true external boundaries (network, timers, third-party SDKs, browser APIs). Assert on observable behaviour, never on implementation details.

## Output

28. **Final summary under 50 words.** Lead with what changed. No narrative paragraphs.
29. **Highlight attention items.** Anything the user must decide, review, or act on goes at the top, bolded, prefixed with **⚠️ NEEDS YOUR ATTENTION**.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Inlining a constant or type next to logic | Move it to the sibling `constants` or `types` file |
| Writing a helper that already exists | Search shared directories and the module first, then import |
| Picking a name or structure silently | List the options and let the user choose |
| Mocking the module under test | Mock only network, timers, SDKs, and browser APIs |
| Leaving an unused import or a magic number behind | Remove dead code and name the value before showing the step |
| Guarding a null with `!` or a loose `as` cast | Add the real check or narrow the type |
| Catching an error and only logging it | Recover, rethrow with context, or surface a failure state |
