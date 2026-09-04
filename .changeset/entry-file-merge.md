---
"create-religion": minor
---

Installing into a repository that already has a `CLAUDE.md` or `AGENTS.md` now offers to merge
instead of leaving the workflow unwired.

Previously those files were reported as conflicts and left alone, which was safe and not much
use: the skills and state landed on disk, but nothing told the agent that Religion existed.
Replacing them was never an option, since an entry file someone wrote by hand is often the
most carefully considered file in the repository.

Everything you wrote stays exactly where it is. Religion's sections are appended inside
markers, and a later `update` replaces only what is between them and never reads what is
outside. Your own `Commands` section is left alone rather than overwritten with the
placeholder, and the import lines live inside the block so new context files keep arriving.

Decline and the file is untouched and reported as a conflict, exactly as before. The original
is backed up under `religion/.state/backups/` either way.
