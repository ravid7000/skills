---
"@ravid7000/skills": major
---

Rename `debugging-ui-flows` to `debug-flow` and generalize it beyond the frontend: the skill now traces any broken flow (UI journey, API request, CLI command, background job) with temporary correlated logs, using generic layer-boundary step ids instead of hardcoded UI→API steps. Consumers installing by the old name must switch to `debug-flow`.
