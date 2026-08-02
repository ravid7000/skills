---
"@ravid7000/skills": minor
---

Adds `plan-with-me` — an interactive planning skill that turns a vague request into an agreed, written plan. It reads the code before it asks anything, then works through one question per turn, each with concrete options and a recommendation, until the plan is settled by either the user or its own completion test, and finally writes the plan to a single Markdown file.

Questions go through the host's structured question tool where one exists — `AskUserQuestion`, `AskQuestion`, `ask_user`, `request_user_input`, or `ask_followup_question` — so each is answered with a click rather than a paragraph, with a prose fallback where none is available.

Two constraints define it. Unknowns are resolved by evidence or handed back to the user, never filled with an assumption. And it writes no code and starts no implementation: the plan document is the whole deliverable, and building it requires an explicit go-ahead from the user in a later turn.
