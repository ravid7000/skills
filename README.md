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
| Skill | Description |
| --- | --- |
| [`creating-agent-skills`](skills/creating-agent-skills) | Use when adding a new skill to this repository, editing an existing skill, or reviewing a skill contribution before merging. Covers the required SKILL.md layout, frontmatter fields, naming rules, and the validate/index workflow. |
<!-- SKILLS_INDEX_END -->

This table is generated from each skill's frontmatter — do not edit it by hand. Run `npm run index` to regenerate it after adding or editing a skill.

## Using These Skills

Skills are consumed by copying or symlinking a skill's folder into the location your agent tool loads skills from, for example:

- **Claude Code:** `~/.claude/skills/<skill-name>` (personal) or `.claude/skills/<skill-name>` (per-project)
- **Cursor:** `.cursor/skills/<skill-name>` (per-project) — check your Cursor version's docs for the current expected path
- Other tools that support the `agentskills.io` spec: consult that tool's docs for where it looks for skill directories

A simple way to pull in one or more skills without duplicating files is a symlink, e.g.:

```bash
ln -s /path/to/this/repo/skills/creating-agent-skills ~/.claude/skills/creating-agent-skills
```

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
