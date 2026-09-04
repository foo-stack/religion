# Build Plan

> The second planning document you own. Keep it high level even when `project-plan.md` is
> detailed: one line per feature, in rough build order. The depth lives in each work
> item's spec.

## Format

Use checkboxes. The build loop reads them: {{cmd:feature}} with no argument specs the
first unchecked item, and {{cmd:complete}} checks it off. That is what makes progress
survive a cleared context, so keep the list a checklist.

Each item should be a feature-sized outcome, not a loose task or a whole product area.

Good:

- [ ] 1. **Skill submission** - upload a package and save its metadata
- [ ] 2. **Validation result** - run checks and show pass or fail per submission
- [ ] 3. **Directory listing** - browse and filter what has been published

Avoid: "Upload stuff", "Database", "Make it look nice", or one line holding auth, billing,
and deployment at once.

A large item gets split into sub-items when it is spec'd, as `4a`, `4b`, and so on. Each
sub-item is its own work item with its own review and its own archive entry.

## Keeping it going

This is a living roadmap, not a frozen record of the first release. Keep completed items
checked and append new unchecked ones as the project grows. Headings such as `## Later`
keep a long plan readable without changing how the next item is found.

Do not renumber completed items: their archives refer back to those numbers. Continue with
the next unused number. If a new feature changes the product direction, users, data,
stack, or deployment, update `project-plan.md` too, then re-run {{cmd:overview}}.

Scaffolding the application and prototyping the look are pre-build steps, not features.
Start with the first real slice of functionality.

## Plan

- [ ] 1. **Feature one** - what it delivers
- [ ] 2. **Feature two** - what it delivers
