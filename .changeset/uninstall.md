---
"create-religion": minor
---

`religion uninstall` takes Religion back out of a project. It removes every installed skill
and hook nobody edited, and any directory that leaves empty; keeps and names the edited
ones; cuts only the managed block from the entry file, or removes it when it is still
exactly what was installed; takes only Religion's hook entries out of
`.claude/settings.json`; and removes the install record last. The plans, history and the rest
of `religion/` stay, and every file it changes rather than removes is backed up first. It
shows its plan and asks, defaulting to no; `--yes` skips the question, `--dry-run` only
plans, and outside a terminal it removes nothing without `--yes`.
