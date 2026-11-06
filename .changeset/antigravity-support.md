---
"create-religion": minor
---

Antigravity is a fifth adapter. `religion install --antigravity` renders every skill into
`.agent/skills` with Antigravity's `/skill` invocation and installs a `GEMINI.md` entry file,
merging into one the project already has. `doctor` now compares every installed skill tree and
reads `GEMINI.md`, and rollback leaves the new tree and entry file alone.
