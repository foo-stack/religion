# The update manifest records what was installed, not what is on disk

After an install or update, the manifest stores the hash of each file as it was shipped. It
does not hash the copy sitting in the project.

**Why the difference matters.** Update compares the shipped hash against the file on disk to
tell a stale managed file from one the user edited. Recording the working copy instead
writes a local edit into the manifest as though it were the installed version, so the next
update sees no difference and overwrites it. The protection appears to work and then works
exactly once.

**Why a skipped conflict keeps its old entry.** If the user declines to replace a
locally-changed file, the manifest must keep remembering what was originally installed.
Updating the entry on a skip would lose the only record of what the file is diverging from.

**What would change this.** Nothing. This was a real defect, found by running three
consecutive updates against a project with a hand-edited file.

**Reversed:** no.
