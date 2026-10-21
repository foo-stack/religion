---
"create-religion": minor
---

The workflow `ci` writes also runs `religion doctor --json` on every pull request, pinned to the
installed major version, and fails the build for any failed check that blocks work or
completion, such as a stale overview or invalid configuration. Advisory checks a runner cannot
pass honestly, like `hooks` without a committed `.claude/settings.json`, appear as warnings. A
doctor that prints no report fails the build.
