# Agent Instructions

This repository is a collection of reusable [Agent Skills](https://agentskills.io/specification), published to npm as `@ravid7000/skills`. Each skill is a directory under `skills/` containing a `SKILL.md`.

## Git identity

Commit as **`Ravi Dhiman <ravid7000@gmail.com>`**, never as an agent or bot account. Cloud VMs start with a default identity, so set it before your first commit:

```bash
git config user.name "Ravi Dhiman"
git config user.email "ravid7000@gmail.com"
```

## Before you commit

```bash
npm run validate     # every skill's frontmatter and required sections
npm run index        # regenerates the README skills table
```

Both run in CI, so a PR fails without them. Never hand-edit the skills table in `README.md` — it's generated from frontmatter.

## Changesets

If you changed anything under `skills/`, add a changeset:

```bash
npx changeset
```

Skill names are the package's public API because consumers install by name: removing or renaming a skill is a `major` bump, adding one is `minor`, editing content is `patch`. PRs that only touch scripts, CI, or docs don't ship to consumers and don't need one.

## Writing or editing a skill

Read [`skills/creating-agent-skills/SKILL.md`](skills/creating-agent-skills/SKILL.md) first — it documents the required layout, the frontmatter rules, the closed `metadata.category` vocabulary, and the mandatory "When to Use" / "Do not use for" sections. Don't reconstruct those rules from other skills.

Two things it's easy to get wrong:

- The `description` should say **when** to reach for the skill, never summarize its steps — a summary invites agents to shortcut instead of reading the body.
- Keep `SKILL.md` under ~500 lines. Heavy material goes in `references/`, reusable code in `scripts/`.

## Pull requests

**One PR per logical change.** Split only when the pieces are genuinely independent and each stands on its own. Don't split work where one part supersedes or modifies another — a reviewer should never be reading code that a sibling PR already deletes.

Prefer squash merges. Explain *why* in the description, not just what changed; the diff already covers what.
