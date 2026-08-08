---
"@ravid7000/skills": minor
---

Adds `handing-off-work` — a skill for the end of a session that leaves the work unfinished, producing a single Markdown document a fresh agent can resume from in a different session, a different harness, or someone else's hands.

It is built around one division of labour: state is read out of the repository, and reasons come from the session. Claims about what the code is — branch, commit, dirty files, what the test command actually reports — are established from `git` rather than recollection, which is the failure that makes most session summaries confidently wrong. Memory is reserved for what `git` can't reconstruct: why each decision went the way it did, what was tried and abandoned, and what the next concrete action was going to be.

The document is written for a reader with no memory of the session, so references that only resolve in the conversation — "the refactor we discussed", a name coined mid-session, a todo list the next harness can't see — are stripped before it's written. It also covers the receiving end: a handoff is a set of claims with a timestamp, so the resuming agent checks the branch and commit and re-runs the verification command before trusting any of it.
