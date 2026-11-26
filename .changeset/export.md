---
"create-religion": minor
---

`religion export` bundles the state a project keeps out of git, everything under `religion/`
except `.state/`, into `religion/.state/export/religion-bundle.zip`, with a hash per file and the
repository it came from. Point a sync client such as Google Drive for desktop at that folder to
carry it to another machine. Religion itself makes no network connection, and `--dry-run` lists
what would be bundled.
