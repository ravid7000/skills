# Contributing a Skill

This repo follows the [Agent Skills specification](https://agentskills.io/specification). Every skill lives in its own directory under `skills/` with at least a `SKILL.md` file.

For the full walkthrough (with a copy-paste template), read the [`creating-agent-skills`](skills/creating-agent-skills/SKILL.md) skill — it documents the exact process this repo expects, including itself.

## Quick Checklist

- [ ] Directory name and frontmatter `name` match exactly, use only lowercase letters/numbers/hyphens, no leading/trailing/consecutive hyphens
- [ ] `description` explains **what** the skill does and **when** to use it, starts with "Use when..." where possible, and doesn't summarize the internal steps
- [ ] `metadata.category` is set to one of `meta`, `research`, `workflow`, `diagnostics`, `maintenance` (repo policy — see the [Categories](skills/creating-agent-skills/SKILL.md#categories) table; adding a new value means editing `scripts/validate-skills.js` in the same PR)
- [ ] Body has a "When to Use" section **and** a "Do not use for" statement, naming any overlapping sibling skill by name
- [ ] Body is focused and under ~500 lines; heavy reference material lives in `references/`, reusable code in `scripts/`
- [ ] Ran `npm run validate` locally with no errors
- [ ] Ran `npm run index` and committed the resulting `README.md` diff
- [ ] One skill per PR is preferred, to keep review focused

## Local Setup

```bash
npm install
npm run validate     # validate all skills' frontmatter
npm run index        # regenerate the README skills table
```

CI runs `npm run validate` and `npm run index:check` on every push and pull request; a PR won't pass checks if either fails.

## Releasing

This collection is published to npm as [`@ravid7000/skills`](https://www.npmjs.com/package/@ravid7000/skills) so consumers can pin a version instead of tracking a branch. Only the `skills/` tree ships; scripts and contributor docs stay in the repo.

Versioning treats the collection as an API, where the "surface" is the set of skill names:

| Change | Bump |
| --- | --- |
| A skill is removed or renamed | major — it breaks anyone installing it by name |
| A new skill is added | minor |
| An existing skill's content is edited | patch |

To cut a release, from an up-to-date `master`:

```bash
npm version minor          # updates package.json + package-lock.json, creates a v* tag
git push --follow-tags
```

Pushing the tag triggers [`publish.yml`](.github/workflows/publish.yml), which re-runs validation, verifies the tag matches `package.json`, and publishes with [npm provenance](https://docs.npmjs.com/generating-provenance-statements). A mismatched tag fails the job rather than publishing an untraceable version.

Requires an `NPM_TOKEN` repository secret — an automation token for an account with publish rights to the `@ravid7000` scope. To rehearse without publishing, run the workflow manually with `dry_run` left checked.

`prepublishOnly` runs the same validation locally, so a hand-run `npm publish` can't ship a broken skill either.

## Editing an Existing Skill

Same checklist applies. If you rename a skill, rename both the directory and the `name:` frontmatter field together, and re-run `npm run index`.
