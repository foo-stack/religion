---
"create-religion": minor
---

`religion import <file>` unpacks a bundle that `religion export` wrote on another machine into
this project's `religion/`. It checks every file's hash and that the bundle was made for this
repository, and refuses entries that could land outside `religion/` or in `religion/.state/`,
including spellings that a case-insensitive filesystem folds onto it. It also refuses to replace
any file changed here since the last export or import. It shows its plan and asks before
writing, unless given `--yes`, and `--dry-run` writes nothing.
