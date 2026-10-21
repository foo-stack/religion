---
"create-religion": minor
---

`religion update` on a project an older version installed starts by saying what changed in
between: each release, newest first, with the first sentence of each change, and where the
full changelog is. The package now ships its `CHANGELOG.md`, so this needs no network. It
prints on `--dry-run` too, and nothing when the project is already current.
