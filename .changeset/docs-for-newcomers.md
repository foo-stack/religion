---
"create-religion": patch
---

Three guides for people who did not build Religion.

Everything under `docs/` was written for someone who already knew the system: the state
model, the enforcement split, the configuration reference, the decision records. They
explain how it is built. Nothing explained how it is used, and the readme's getting-started
section was four lines naming four skills.

- **Getting started** walks install through to a generated overview, covering both branches
  `setup` takes, what the installer does when you already have a `CLAUDE.md` or `AGENTS.md`,
  what happens when a codebase's readme explains nothing, and the choice between committing
  the workflow files and keeping them local.
- **What the loop actually feels like** walks one finished work item from spec to commit:
  the spec arriving before any code, the diff and evidence under each step, what the review
  options do, how progress survives a cleared context, what the findings ledger blocks, and
  what completion archives. Every artifact in it is quoted from a real file.
- **What to do when doctor complains** covers every check, what each failure means, and the
  fix. Every failure was triggered deliberately and every fix was run and shown to clear it,
  which caught two that were wrong: `update` alone does not restore a working entry file,
  and deleting `config.json` makes the project invisible to the command-line tool rather
  than falling back to defaults.

The readmes now point at these rather than half-repeating them, and the package readme's
skill count is correct again.
