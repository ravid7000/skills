---
name: creating-agent-skills
description: Use when adding a new skill to this repository, editing an existing skill, or reviewing a skill contribution before merging. Covers the required SKILL.md layout, frontmatter fields, naming rules, and the validate/index workflow.
license: MIT
metadata:
  category: meta
---

# Creating Agent Skills

## Overview

This repository stores reusable [Agent Skills](https://agentskills.io/specification) — one directory per skill under `skills/`, each with a `SKILL.md` describing what the skill does and when an agent should use it. This skill explains how to add a new one correctly.

## When to Use

- You want to add a brand-new skill to this repository
- You're editing an existing skill's frontmatter or structure
- You're reviewing a PR that adds or changes a skill and need a checklist

**Do not use for:**

- Writing the subject-matter content of a skill — this covers the packaging (layout, frontmatter, validation workflow), not the domain expertise the skill itself teaches
- Installing or consuming skills in an agent tool — see [README.md](../../README.md) for where each tool loads skill directories from
- Editing Markdown elsewhere in the repo that isn't a `SKILL.md`

## Directory Layout

```
skills/
  your-skill-name/
    SKILL.md              # required
    scripts/              # optional: executable helpers
    references/           # optional: heavy/detailed docs loaded on demand
    assets/                # optional: templates, images, data files
```

Skills live in a **flat namespace** directly under `skills/` — no nested categories.

## Steps to Add a New Skill

1. **Pick a name.** Lowercase letters, numbers, and single hyphens only; no leading/trailing hyphen; verb-first / gerund style reads best (e.g. `writing-migrations`, not `migration-helper`). This exact string becomes both the directory name and the `name:` frontmatter value — they must match.
2. **Create the directory:** `skills/<your-skill-name>/`.
3. **Copy the template** from [`references/skill-template.md`](references/skill-template.md) into `skills/<your-skill-name>/SKILL.md` and fill it in.
4. **Write the frontmatter** (see field reference below). `name`, `description`, and `metadata.category` are required.
5. **Write the body.** Keep it under ~500 lines; move heavy reference material into `references/*.md` and reusable code into `scripts/`. Link to them with relative paths. It must include a "When to Use" section and a "Do not use for" statement.
6. **Validate:** run `npm install` (once) then `npm run validate`.
7. **Update the index:** run `npm run index` to regenerate the skills table in [README.md](../../README.md), and commit the result.
8. **Open a PR** — CI runs the same validate + index-check steps automatically.

## Frontmatter Field Reference

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Max 64 chars, lowercase letters/numbers/hyphens only, no leading/trailing/consecutive hyphens, must match the directory name |
| `description` | Yes | Max 1024 chars. Describe both *what* the skill does and *when* to use it; front-load "Use when..." plus concrete keywords/symptoms |
| `license` | No | License name, e.g. `MIT` |
| `compatibility` | No | Max 500 chars. Only add if the skill needs a specific environment (tools, network access, a particular agent product) |
| `metadata` | Yes (repo policy) | Free-form string-to-string map per the spec, but this repo requires a `category` key drawn from the list below. Other keys (e.g. `version`) are optional |
| `allowed-tools` | No | Space-separated list of pre-approved tools (experimental) |

## Categories

Every skill declares exactly one `metadata.category`. The vocabulary is closed and enforced by `npm run validate`:

| Category | Use for |
| --- | --- |
| `meta` | Skills about authoring, validating, or maintaining skills themselves |
| `research` | Gathering external or unfamiliar information before acting |
| `workflow` | How work gets planned, reviewed, and shipped |
| `diagnostics` | Finding out why something is wrong, or making a system diagnosable |
| `maintenance` | Changing existing code safely |

Requiring this field is **repo policy**, not part of the [agentskills.io specification](https://agentskills.io/specification), which treats `metadata` as free-form. If none of the five fits, that's a signal worth discussing in the PR — add the new value to `ALLOWED_CATEGORIES` in [`scripts/validate-skills.js`](../../scripts/validate-skills.js) and document it in the table above, so growing the vocabulary is a visible decision rather than a silent one.

## Declaring When *Not* to Use a Skill

Every `SKILL.md` must state both when to use it and what to use something else for. Validation enforces the presence of a "When to Use" section and a "Do not use for" statement — either as its own heading or as a bolded line inside "When to Use".

This matters more than it looks. Agents choose a skill from its `description` alone, and as the collection grows several skills will look plausible for the same request. Where two skills genuinely overlap, name the sibling skill explicitly in the exclusion list so the boundary is unambiguous. Only reference skills that actually exist — a stale name left behind after a rename is worse than no cross-reference.

## Writing a Good Description

The `description` is the only thing loaded into context for every skill up front — it's how an agent decides whether to read further. Follow the pattern used throughout this repo:

- Start with **"Use when..."** and name concrete triggering situations/symptoms
- Do **not** summarize the skill's internal steps or workflow in the description — that causes agents to shortcut based on the summary instead of reading the full instructions
- Write in the third person
- Include keywords an agent would search for (error messages, tool names, synonyms)

```yaml
# Good
description: Use when a database migration needs to run against production, when adding a new column with a default value, or when a migration must be reversible.

# Bad — too vague, no trigger
description: Helps with database migrations.

# Bad — summarizes the workflow, invites shortcutting
description: Use for migrations — write the up/down scripts, run them in a transaction, then verify row counts match.
```

## Validation

```bash
npm install        # once, installs the frontmatter parser used by the scripts
npm run validate    # checks every skill's frontmatter against the spec
npm run index       # regenerates the README skills table
npm run index:check # verifies the table is up to date without writing (used in CI)
```

`npm run validate` checks, per skill: required fields present, `name` format/length/directory match, `description` length, `metadata.category` present and drawn from the allowed vocabulary, the presence of "When to Use" and "Do not use for" in the body, correct types for optional fields, and warns if the body exceeds ~500 lines.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| `name` uses uppercase or underscores | Use lowercase letters, numbers, and hyphens only |
| `name` doesn't match the directory | Rename one to match the other |
| Description explains *how* the skill works step by step | Rewrite to describe only *when* to use it |
| Forgetting to run `npm run index` after adding a skill | CI's `index:check` will fail the PR — run it locally and commit the diff |
| Dumping a 1000-line reference doc straight into `SKILL.md` | Move it to `references/` and link to it |
| Inventing a new `metadata.category` value ad hoc | Pick one of the five, or propose adding one by editing `ALLOWED_CATEGORIES` and the Categories table together |
| Listing only when to use the skill | Add a "Do not use for" statement too; validation requires it |
| Cross-referencing a skill that doesn't exist (or was renamed) | Only name skills present under `skills/` |

## Reference

See [`references/skill-template.md`](references/skill-template.md) for a ready-to-copy `SKILL.md` starting point.
