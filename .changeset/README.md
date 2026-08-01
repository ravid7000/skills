# Changesets

This folder holds pending release notes. Each `.md` file here describes one user-visible change and the version bump it deserves; they're consumed and deleted when a release is cut.

## Adding one

```bash
npx changeset
```

Pick a bump type, write a sentence in the past tense describing the change from a consumer's point of view, and commit the generated file with your PR.

## Which bump

Consumers install skills **by name**, so the set of skill names is this package's public API:

| Change | Bump |
| --- | --- |
| A skill is removed or renamed | `major` — breaks anyone installing it by name |
| A new skill is added | `minor` |
| An existing skill's content is edited | `patch` |

Changes that don't ship — validation scripts, CI, `CONTRIBUTING.md` — don't need a changeset, because only the `skills/` tree is published.

Full documentation lives in the [changesets repository](https://github.com/changesets/changesets).
