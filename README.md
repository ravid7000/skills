# Skills

A growing collection of reusable [Agent Skills](https://agentskills.io/specification) — self-contained instructions that coding agents (Claude Code, Cursor, and other compatible tools) can load on demand to perform a task well.

## What's a Skill?

A skill is a directory containing a `SKILL.md` file with YAML frontmatter (`name`, `description`, and a few optional fields) followed by Markdown instructions. Agents read the `name`/`description` of every skill up front, and load the full body only when a task matches. See the [specification](https://agentskills.io/specification) for the full format.

```
skills/
  skill-name/
    SKILL.md              # required: frontmatter + instructions
    scripts/               # optional: executable helpers
    references/            # optional: detailed docs loaded on demand
    assets/                 # optional: templates, images, data
```

## Available Skills

<!-- SKILLS_INDEX_START -->
| Skill | Category | Description |
| --- | --- | --- |
| [`creating-agent-skills`](skills/creating-agent-skills) | `meta` | Use when adding a new skill to this repository, editing an existing skill, or reviewing a skill contribution before merging. Covers the required SKILL.md layout, frontmatter fields, naming rules, and the validate/index workflow. |
| [`finder`](skills/finder) | `research` | Use when an engineer needs researched, sourced, up-to-date information rather than an answer from model memory — e.g. "research best practices for X", "investigate this issue/bug", "find out how the community/industry handles Y", "what does the official documentation say about Z". Triggers on requests to research, investigate, or find authoritative information on a topic, library, API, error message, or design decision. |
| [`instrumenting-for-observability`](skills/instrumenting-for-observability) | `diagnostics` | Use when a new or changed feature, endpoint, background job, or client-side flow is about to ship and needs logging, metrics, or tracing — or when reviewing whether a change would be diagnosable once it's running in production. Triggers on "add observability", "add logging/metrics/telemetry", "instrument this", "how will we know if this breaks", "we had no data during that incident", or a post-incident finding that a failure was invisible. |
<!-- SKILLS_INDEX_END -->

This table is generated from each skill's frontmatter — do not edit it by hand. Run `npm run index` to regenerate it after adding or editing a skill.

Every skill declares one category from a closed set — `meta`, `research`, `workflow`, `diagnostics`, or `maintenance` — enforced by `npm run validate`. See [Categories](skills/creating-agent-skills/SKILL.md#categories) for what each covers and how to propose a new one.

## Installing These Skills

### With a skills CLI (recommended)

Either of the two common CLIs can install straight from this repository, and both resolve skills from the standard `skills/*/SKILL.md` layout — supporting files in `references/` come along with the skill.

```bash
# npx skills — no install needed, supports ~70 agents
npx skills add ravid7000/skills                                    # pick interactively
npx skills add ravid7000/skills --skill instrumenting-for-observability
npx skills add ravid7000/skills --list                             # just look

# agent-skills-cli — global install, adds search/doctor/private registries
npm install -g agent-skills-cli
skills add ravid7000/skills -a claude,cursor
```

Both default to installing into the current project and accept `-g` for a user-wide install. `npx skills` symlinks by default (pass `--copy` to copy instead), which is useful if you want repo updates to apply automatically.

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

## Adding a New Skill

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, or read the [`creating-agent-skills`](skills/creating-agent-skills/SKILL.md) skill itself — it documents its own creation process.

Quick version:

```bash
npm install
mkdir skills/your-skill-name
cp skills/creating-agent-skills/references/skill-template.md skills/your-skill-name/SKILL.md
# edit skills/your-skill-name/SKILL.md
npm run validate
npm run index
```

## Validation

This repo validates every skill's frontmatter against the spec on every push/PR via GitHub Actions. Run the same checks locally:

```bash
npm install
npm run validate     # checks frontmatter format/required fields for every skill
npm run index:check  # verifies the README skills table above is up to date
```

## License

[MIT](LICENSE) unless a skill's own frontmatter specifies otherwise.
