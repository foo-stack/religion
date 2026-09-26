---
"create-religion": minor
---

The command-line tool refuses input it does not understand, and its exit codes and JSON
output are fixed.

Four changes are visible to anyone scripting against it:

- **Unrecognised input is refused.** An unknown command, an unknown option, an option that
  does not apply to the command, or more than one directory now prints a usage error and
  exits 2 before anything is read or written. Previously an unknown option was ignored, so
  `religion update --dryrun` performed a real update, and an unknown word became the target,
  so `religion stauts` installed into a new `./stauts`. A bare directory that already exists
  is still accepted, so `npx create-religion ./app` installs into it as before.
- **`install` and `update` exit 1 when conflicts remain.** A file left alone because it was
  edited locally used to exit 0, which made a partial update look complete. That includes
  an entry-file merge that was declined, and a non-interactive run without `--yes` declines
  it on its own. Exit codes are now `0` for success, `1` for a reported failure, and `2` for
  a usage error, listed in `--help` and the readme.
- **`doctor --json` is an object, not an array.** It prints
  `{ "schemaVersion": 1, "healthy": ..., "checks": [...] }`. Each check keeps its shape. Read
  `.checks` where you read the array before.
- **The dashboard refuses requests not addressed to it.** Anything whose `Host` header is not
  its own `127.0.0.1` or `localhost` address and port gets a 403, which closes a DNS
  rebinding path to the project state it serves.
