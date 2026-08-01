# SKILL.md Template

Copy the block below into `skills/<your-skill-name>/SKILL.md` and fill in every section. Delete the instructional comments (in `<!-- -->`) once you're done. See the main [`SKILL.md`](../SKILL.md) in this skill for the full field reference and checklist.

```markdown
---
name: your-skill-name
description: Use when <specific triggering situations, symptoms, or tasks>. <Add more concrete keywords an agent might search for.>
license: MIT
metadata:
  category: <meta | research | workflow | diagnostics | maintenance>
  tagline: <One plain sentence on what the skill does, for humans. Max 120 chars. Not "Use when...".>
---

# Your Skill Title

## Overview

<!-- One or two sentences: what is this skill, and what's the core principle? -->

## When to Use

<!-- Bullet list of concrete situations/symptoms. -->

- ...
- ...

**Do not use for:**

<!-- Required. Where another skill or plain judgement is the better fit. Name
     overlapping sibling skills explicitly, and only ones that actually exist. -->

- ...
- ...

## Steps / Core Pattern

<!-- The main instructions. Use numbered steps for a process, or a before/after
     code comparison for a pattern. Keep code inline if it's short (<50 lines);
     otherwise put it in scripts/ or references/ and link to it. -->

1. ...
2. ...

## Quick Reference

<!-- Optional: a table or bullet list for fast scanning of common operations. -->

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| ... | ... |
```

## Optional supporting files

Only add these if genuinely needed:

- `scripts/` — self-contained executable helpers (document any dependencies inline)
- `references/` — detailed docs too long for the main body (keep each file focused)
- `assets/` — templates, sample data, or images the skill's instructions point to
