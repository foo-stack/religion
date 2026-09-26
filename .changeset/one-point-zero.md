---
"create-religion": major
---

Religion 1.0. From this release the public surface is stable: a 1.x release will not remove,
rename or narrow anything the [stability statement](https://github.com/foo-stack/religion/blob/main/docs/stability.md)
names as public, and [Updating a project](https://github.com/foo-stack/religion/blob/main/docs/upgrading.md)
walks through what an update does.

Breaking changes since 0.5.0:

- **Node 22 or later is required.** Node 20 has reached its end-of-life.
- **Unrecognised input is refused.** An unknown command, an unknown option, an option the
  command does not take, or a second directory now exits 2 with a usage error instead of
  being ignored or taken as the target directory.
- **Exit codes are fixed**: `0` for success, `1` for a reported failure, `2` for a usage
  error. `install` and `update` now exit 1 when they leave conflicts, a declined entry-file
  merge, or files reached through a symbolic link, where they used to exit 0.
- **`doctor --json` prints an object**, `{ "schemaVersion": 1, "healthy": ..., "checks": [...] }`,
  instead of a bare array. Read `.checks` where you read the array before.
- **`update` refuses a project a newer version installed**, and never writes through a
  symbolic link, even with `--force`.
