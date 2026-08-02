# @ravid7000/skills

## 0.3.0

### Minor Changes

- [#12](https://github.com/ravid7000/skills/pull/12) [`af44881`](https://github.com/ravid7000/skills/commit/af44881c9f5ddd085e4c9b575fc2376890a548e0) Thanks [@ravid7000](https://github.com/ravid7000)! - Add debugging-ui-flows skill for tracing broken UI→API flows with temporary correlated logs.

- [#13](https://github.com/ravid7000/skills/pull/13) [`2f2e29d`](https://github.com/ravid7000/skills/commit/2f2e29d991d9ba3e95eb5a39e00e4d1e42cefbc8) Thanks [@ravid7000](https://github.com/ravid7000)! - Adds `plan-with-me` — an interactive planning skill that turns a vague request into an agreed, written plan. It reads the code before it asks anything, then works through one question per turn, each with concrete options and a recommendation, until the plan is settled by either the user or its own completion test, and finally writes the plan to a single Markdown file.

  Questions go through the host's structured question tool where one exists — `AskUserQuestion`, `AskQuestion`, `ask_user`, `request_user_input`, or `ask_followup_question` — so each is answered with a click rather than a paragraph, with a prose fallback where none is available.

  Two constraints define it. Unknowns are resolved by evidence or handed back to the user, never filled with an assumption. And it writes no code and starts no implementation: the plan document is the whole deliverable, and building it requires an explicit go-ahead from the user in a later turn.

## 0.2.0

### Minor Changes

- [#10](https://github.com/ravid7000/skills/pull/10) [`10792de`](https://github.com/ravid7000/skills/commit/10792deb9d4cb6d366c2680a945628ba3783885d) Thanks [@ravid7000](https://github.com/ravid7000)! - Every skill now carries a `metadata.tagline` — a plain one-sentence summary written for humans, separate from the agent-facing `description`. The README's Skills section is generated from these, so installation and what each skill does are visible without scrolling.

## 0.1.0

### Minor Changes

- [#7](https://github.com/ravid7000/skills/pull/7) [`6f63f74`](https://github.com/ravid7000/skills/commit/6f63f742ff8867ed714ede05d053065c38411104) Thanks [@ravid7000](https://github.com/ravid7000)! - First published release. Ships three skills:

  - `creating-agent-skills` — authoring, validating, and reviewing skills in this collection
  - `finder` — researched, sourced answers instead of answers from model memory
  - `instrumenting-for-observability` — designing logging, metrics, and tracing backwards from the questions they need to answer
