# Agent Skills for Engineering

**Reusable [Agent Skills](https://agentskills.io/specification) for Claude Code, Cursor, Codex, Copilot, and 70+ other AI coding agents.** Drop-in instructions that make an agent research properly, instrument what it ships, and write skills that actually load.

[![npm](https://img.shields.io/npm/v/@ravid7000/skills?color=cb3837&logo=npm)](https://www.npmjs.com/package/@ravid7000/skills)
[![CI](https://img.shields.io/github/actions/workflow/status/ravid7000/skills/validate-skills.yml?branch=master&label=validate)](https://github.com/ravid7000/skills/actions/workflows/validate-skills.yml)
[![license](https://img.shields.io/npm/l/@ravid7000/skills)](https://github.com/ravid7000/skills/blob/master/LICENSE)

## Install

```bash
npx skills add ravid7000/skills
```

That's it — the CLI detects your agent and installs there. Pick a single skill, or target specific agents:

```bash
npx skills add ravid7000/skills --skill finder      # just one
npx skills add ravid7000/skills --list              # look before installing
npx skills add ravid7000/skills -g                  # user-wide instead of this project
```

Prefer versioned installs, or using [agent-skills-cli](https://www.npmjs.com/package/agent-skills-cli)? See [all installation options](#all-installation-options).

## Skills

<!-- SKILLS_INDEX_START -->
| Skill | What it does |
| --- | --- |
| [**creating-agent-skills**](#creating-agent-skills) | Authors and validates new skills so they load reliably and survive review. |
| [**debugging-ui-flows**](#debugging-ui-flows) | Traces broken UI→API flows with temporary correlated logs, then tears them out. |
| [**finder**](#finder) | Answers research questions from current, cited sources instead of model memory. |
| [**instrumenting-for-observability**](#instrumenting-for-observability) | Adds logging, metrics, and tracing designed backwards from the questions an outage will ask. |
| [**plan-with-me**](#plan-with-me) | Turns a vague request into an agreed, written plan by asking one grounded question at a time. |

### creating-agent-skills

`meta` · [Read the skill →](https://github.com/ravid7000/skills/tree/master/skills/creating-agent-skills)

Authors and validates new skills so they load reliably and survive review.

```bash
npx skills add ravid7000/skills --skill creating-agent-skills
```

<details><summary>When the agent loads it</summary>

Use when adding a new skill to this repository, editing an existing skill, or reviewing a skill contribution before merging. Covers the required SKILL.md layout, frontmatter fields, naming rules, and the validate/index workflow.

</details>

### debugging-ui-flows

`diagnostics` · [Read the skill →](https://github.com/ravid7000/skills/tree/master/skills/debugging-ui-flows)

Traces broken UI→API flows with temporary correlated logs, then tears them out.

```bash
npx skills add ravid7000/skills --skill debugging-ui-flows
```

<details><summary>When the agent loads it</summary>

Use when a UI flow breaks and needs runtime evidence — button does nothing, wrong data after save, stuck loading, client vs API unclear — or when the user will reproduce locally and wants temporary debug logs / a flow trace. Triggers on "add logs and I'll repro", "trace this flow", "why is this request wrong", "instrument this bug", or guessing from code alone without a repro trail.

</details>

### finder

`research` · [Read the skill →](https://github.com/ravid7000/skills/tree/master/skills/finder)

Answers research questions from current, cited sources instead of model memory.

```bash
npx skills add ravid7000/skills --skill finder
```

<details><summary>When the agent loads it</summary>

Use when an engineer needs researched, sourced, up-to-date information rather than an answer from model memory — e.g. "research best practices for X", "investigate this issue/bug", "find out how the community/industry handles Y", "what does the official documentation say about Z". Triggers on requests to research, investigate, or find authoritative information on a topic, library, API, error message, or design decision.

</details>

### instrumenting-for-observability

`diagnostics` · [Read the skill →](https://github.com/ravid7000/skills/tree/master/skills/instrumenting-for-observability)

Adds logging, metrics, and tracing designed backwards from the questions an outage will ask.

```bash
npx skills add ravid7000/skills --skill instrumenting-for-observability
```

<details><summary>When the agent loads it</summary>

Use when a new or changed feature, endpoint, background job, or client-side flow is about to ship and needs logging, metrics, or tracing — or when reviewing whether a change would be diagnosable once it's running in production. Triggers on "add observability", "add logging/metrics/telemetry", "instrument this", "how will we know if this breaks", "we had no data during that incident", or a post-incident finding that a failure was invisible.

</details>

### plan-with-me

`workflow` · [Read the skill →](https://github.com/ravid7000/skills/tree/master/skills/plan-with-me)

Turns a vague request into an agreed, written plan by asking one grounded question at a time.

```bash
npx skills add ravid7000/skills --skill plan-with-me
```

<details><summary>When the agent loads it</summary>

Use when a request is too large, vague, or contested to start coding — "plan this with me", "help me think through X", "let's design this before I build it", "write an implementation plan / design doc / RFC", "how should I approach this refactor, migration, or integration". Triggers when requirements are ambiguous, when several designs are defensible, when a feature ask hides decisions nobody has made yet, or when an engineer wants to be walked through those decisions interactively before any code is written.

</details>
<!-- SKILLS_INDEX_END -->

## What is an Agent Skill?

A skill is a folder with a `SKILL.md` file: YAML frontmatter naming the skill and describing when to use it, followed by Markdown instructions. Your agent reads every skill's name and description up front, and loads the full body only when a task matches — so a dozen installed skills cost almost nothing until one is actually needed.

They're portable across tools, because the format is an [open specification](https://agentskills.io/specification) rather than any one vendor's feature.

```
skills/
  skill-name/
    SKILL.md        # required: frontmatter + instructions
    references/     # optional: detail loaded only when needed
    scripts/        # optional: executable helpers
```

## All installation options

### Other CLIs

[`agent-skills-cli`](https://www.npmjs.com/package/agent-skills-cli) is an alternative to `npx skills`, adding search, conflict detection, and private registry support:

```bash
npm install -g agent-skills-cli
skills add ravid7000/skills -a claude,cursor
```

Both CLIs read the standard `skills/*/SKILL.md` layout, and supporting files in `references/` come along with each skill. `npx skills` symlinks by default — pass `--copy` if you'd rather have independent copies.

### From npm

This collection is also published as [`@ravid7000/skills`](https://www.npmjs.com/package/@ravid7000/skills), which gives you a pinnable, versioned release instead of tracking a branch:

```bash
skills install npm:@ravid7000/skills          # latest
skills install npm:@ravid7000/skills@0.1.0    # pinned
```

> **Note:** `npm:` sources are supported by `agent-skills-cli`, not by `npx skills`. If you use the latter, install from the GitHub source above.

The published package contains only the `skills/` tree — the validation scripts and contributor docs stay in the repository.

### Manually

Skills are plain directories, so copying or symlinking one into wherever your agent loads skills from works fine:

```bash
ln -s /path/to/this/repo/skills/finder ~/.claude/skills/finder
```

Common locations are `~/.claude/skills/` or `.claude/skills/` for Claude Code and `~/.cursor/skills/` or `.agents/skills/` for Cursor. Paths move between versions, so check your tool's current docs — or let one of the CLIs above work it out for you.

## Contributing a skill

```bash
npm install
mkdir skills/your-skill-name
cp skills/creating-agent-skills/references/skill-template.md skills/your-skill-name/SKILL.md
# write it, then:
npm run validate     # frontmatter, required sections, category
npm run index        # regenerates the Skills section above
npx changeset        # release note for the change
```

Every skill is validated in CI, declares one category from a closed set (`meta`, `research`, `workflow`, `diagnostics`, `maintenance`), and must say both when to use it and when not to. The Skills section above is generated from frontmatter — don't edit it by hand.

Full guide in [CONTRIBUTING.md](https://github.com/ravid7000/skills/blob/master/CONTRIBUTING.md), or read the [`creating-agent-skills`](https://github.com/ravid7000/skills/blob/master/skills/creating-agent-skills/SKILL.md) skill, which documents its own creation process.

## License

[MIT](https://github.com/ravid7000/skills/blob/master/LICENSE) unless a skill's own frontmatter specifies otherwise.
