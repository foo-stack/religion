# Findings

> **Generated file.** The findings ledger: review findings raised by `audit` against
> the work in progress, each with a durable identifier, a severity from P0 to P3, and a
> status. `implement` marks a repair `fixed`, a later `audit` pass moves it to
> `closed`, and `complete` refuses to finish while any P0 or P1 finding is `open` or
> `fixed`, then archives the resolved ones with the work and resets this file.

### F-02 [P2] open - The upper edge of the command suggestion is not pinned

**File:** packages/create-religion/lib/args.test.ts:46
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** `stauts` pins distance 2, but the only no-suggestion case, `deploy`, is 4 or more from every command, so loosening `<= 2` to `<= 3` passes the suite.
**Suggested fix:** Assert `sta` (distance 3 from `status`) gets the no-suggestion message.
**Resolution:**

### F-03 [P2] open - The host check's wrong-port case is untested for localhost

**File:** packages/create-religion/lib/dashboard.test.ts:22
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** Only `127.0.0.1` is tested with the wrong port. A regression to `startsWith("localhost:")` would pass every test while accepting any port, on the guard that closes DNS rebinding.
**Suggested fix:** Assert `localhost:4322` and `LOCALHOST:4322` are refused for port 4321.
**Resolution:**

### F-04 [P3] open - "Nothing was read" overstates what a usage error does

**File:** packages/create-religion/bin/religion.ts:238
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** An unknown first word is checked with `statSync` before it is refused, so `religion stauts` stats `./stauts`. No contents are read and nothing is written, but the help text, the package readme and the changeset promise "nothing was read or written".
**Suggested fix:** Say "nothing was written" or "nothing was changed" in all three.
**Resolution:**

### F-05 [P3] open - Help text does not describe the grammar it enforces

**File:** packages/create-religion/bin/religion.ts:254
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** `status`, `doctor` and `dashboard` accept a directory but are listed without `[dir]`; the install-only flags do not say so although using them elsewhere is now a usage error; `-y`, `-h` and `help` are accepted but unlisted.
**Suggested fix:** Show `[dir]` on those commands and label the install flags as install and update only.
**Resolution:**

### F-06 [P3] open - Flag dispatch ends in a catch-all branch

**File:** packages/create-religion/lib/args.ts:72
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The known-flag list and the if/else chain duplicate each other, and the final `else options.yes = true` catches any other known flag, so a flag added to the list without its own branch silently becomes `--yes`.
**Suggested fix:** Make the last branch explicit, or drive scope and effect from one table.
**Resolution:**

### F-07 [P3] open - Thin coverage across flags and commands

**File:** packages/create-religion/lib/args.test.ts:62
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** `--copilot` never appears; `--opencode` only as a refusal; no flag is tested with an explicit `install`; `--yes` with `update` and `-y` with `install` are untested; `--json` is refused only with `install`; `help` as a later positional is untested.
**Suggested fix:** One table-driven test over every flag and command, plus `["install", "a", "b", "help"]`.
**Resolution:**

### F-08 [P3] open - The suggestion's edit distance runs over the whole argument

**File:** packages/create-religion/lib/args.ts:95
**Found:** 2026-09-26 by audit (scope: current; lens: performance)
**Why it matters:** Bounded and on the error path only, but a 1,000,000-character argument takes about 390 ms and is echoed whole to stderr.
**Suggested fix:** Skip commands whose length differs by more than 2; the result is identical.
**Resolution:**

### F-09 [P3] open - Unused import and dead export in the dashboard

**File:** packages/create-religion/lib/dashboard.ts:10
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** `import path` is unused (`tsc --noUnusedLocals` reports TS6133) and `historyCount` is exported and used nowhere. Both predate this work, in a file it touches.
**Suggested fix:** Delete both, after confirming nothing needs `historyCount`.
**Resolution:**

### F-10 [P3] unverified - A failed state read could crash the dashboard

**File:** packages/create-religion/lib/dashboard.ts:24
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** `void handle(...)` has no rejection handler, so a throw from `readProjectState` would be unhandled. Not reproduced. Predates this work.
**Suggested fix:** Catch in the request callback and answer 500.
**Resolution:**

### F-11 [P3] unverified - The package root is found before arguments are parsed

**File:** packages/create-religion/bin/religion.ts:58
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** `findPackageRoot` runs at module load, outside `main().catch`, so on an incomplete install even a usage error would exit 1 with an uncaught stack. Not run. Predates this work.
**Suggested fix:** Resolve the template lazily inside `main`.
**Resolution:**

### F-12 [P3] unverified - The manifest's adapter list is trusted unchecked

**File:** packages/create-religion/lib/install.ts:241
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** `readManifest` casts the JSON, so a manifest listing `__proto__` as an adapter would crash the way F-01 does. The file is the project's own. Predates this work.
**Suggested fix:** Filter adapters with `Object.hasOwn(ADAPTERS, name)` when reading.
**Resolution:**

### F-13 [P3] open - A repeated adapter flag is recorded twice

**File:** packages/create-religion/lib/args.ts:77
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-01)
**Why it matters:** `install --claude --claude --dry-run --yes` prints "Adapters: Claude Code, Claude Code", and the list reaches `writeManifest` unchanged, so a real install would record the adapter twice. Seen in a dry run; the written manifest was not inspected.
**Suggested fix:** push only when the adapter is not already in the list.
**Resolution:**

### F-14 [P0] closed - Removal follows a symlinked parent out of the project

**File:** packages/create-religion/lib/install.ts:146
**Found:** 2026-09-26 by audit (scope: current; lens: security, tests)
**Why it matters:** `planDropped` only `lstat`s the last path component and `isInsideProject` is lexical, so with `.claude/skills/evil` committed as a symlink to a directory elsewhere, a manifest entry hashing a file there gets it deleted, and `pruneEmptyParents` removes its emptied parents outside the project. Reproduced: `update --yes` exited 0 and the outside file and directory were gone.
**Suggested fix:** Refuse any recorded path with a symlink in any component, and re-check before deleting.
**Resolution:** Repaired 2026-09-26: a removal candidate must be a plain file with no symbolic link in any component (`isPlainFile`), and pruning stops at the tree. The symlinked-parent vector is refused by a test and by a CLI run that left the outside file intact. Awaiting re-review. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: symlinked skill directory, `.claude/skills` and `.claude` as links, and the file itself as a link all removed nothing; a parent swapped to a link between planning and applying was released. Closed.

### F-15 [P0] closed - A rebuild writes through symlinks, and a forged record skips the merge prompt

**File:** packages/create-religion/lib/install.ts:119
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** Any truthy manifest value for `CLAUDE.md` turns the consented `merge` into an unprompted `rebuild`, whose write follows a symlinked entry file and whose backup follows a symlinked `religion/.state/backups`. Reproduced non-interactively: a file outside the project was rewritten, and a file under a fake home `.claude/` was overwritten with attacker text.
**Suggested fix:** Rebuild only for a well-formed recorded hash and a plain file, and refuse to back up through a symlinked directory before writing anything.
**Resolution:** Repaired 2026-09-26: a rebuild needs a 16-hex-digit recorded hash and an entry file with no symbolic link in its path (`rebuildOrConflict`), re-checked at apply; otherwise it is a conflict. Any run that would back something up refuses before writing anything when the path to the backup passes through a link (`refuseLinkedBackups`). Both reported vectors refused by tests and by CLI runs that left the outside files intact. Awaiting re-review. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: the recorded vectors (a `true` record with a linked `CLAUDE.md`, a forged well-formed hash with `--yes`, and links at `backups`, `backups/CLAUDE.md`, `religion/.state`, `religion` and a nested backups subdirectory) were each refused before anything was written. Closed as scoped: writing through a linked entry file by merge, remerge or `--force` is tracked as F-36 and F-40.

### F-16 [P1] closed - A case variant of the state directory passes the removal guard

**File:** packages/create-religion/lib/install.ts:55
**Found:** 2026-09-26 by audit (scope: current; lens: security, tests)
**Why it matters:** `isManaged` compares `religion/` case-sensitively, so on the default macOS filesystem `Religion/config.json` or `RELIGION/context/findings.md` passes and deletes the real state file. Reproduced for both.
**Suggested fix:** Only consider paths under a known adapter tree, compared by exact case.
**Resolution:** Repaired 2026-09-26: only paths under a skill or hook tree, compared by exact case, can be retired (`retiringTree`), so `RELIGION/` and `Religion/` never qualify. Refused by a test and by a CLI run on a case-insensitive disk. Awaiting re-review. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: `RELIGION/`, `Religion/`, `.CLAUDE/` and `.claude/Skills/` keys were all refused and every target survived. Closed; a case variant below the tree prefix is F-45.

### F-17 [P1] closed - The manifest can remove any project file with predictable content

**File:** packages/create-religion/lib/install.ts:145
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** Removal candidates are any manifest key, so a committed manifest listing `.git/HEAD` or `package.json` with their current hashes deletes them. Reproduced: `git status` then failed with `not a git repository`.
**Suggested fix:** Only retire paths under a known adapter tree, and stop pruning at that tree.
**Resolution:** Repaired 2026-09-26: the same tree allowlist excludes `.git/`, `package.json` and entry files. Refused by a test and by a CLI run after which `git` still worked. Awaiting re-review. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: `.git/HEAD`, `.GIT/HEAD`, `package.json`, entry files in either case, `religion/config.json`, `..`, `./`, `//`, backslash, absolute and tree-root keys were all refused with real hashes. Closed.

### F-18 [P2] closed - A removal is not re-checked before deleting

**File:** packages/create-religion/lib/install.ts:195
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** The decision is made at planning and the merge prompt can wait indefinitely before applying, so a file edited in between is deleted, breaking "never deletes an edited file". Reproduced through the API.
**Suggested fix:** Re-check the path and hash immediately before removing; release on a mismatch.
**Resolution:** Repaired 2026-09-26: the remove branch re-checks the path and the planned hash immediately before deleting and releases on a mismatch; tested by editing between planning and applying. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: an edit between planning and applying, a parent swapped to a link, and forged plan entries for `package.json` and `religion/config.json` were all released. Closed.

### F-19 [P2] closed - The removal guard is wrong on Windows

**File:** packages/create-religion/lib/install.ts:158
**Found:** 2026-09-26 by audit (scope: current; lens: security, quality, tests)
**Why it matters:** `path.normalize` turns `/` into `\` on Windows, so every real key is rejected, while a backslash key such as `religion\config.json` passes. Simulated with `path.win32`; not run on Windows.
**Suggested fix:** Reject backslashes and normalise with `path.posix`.
**Resolution:** Repaired 2026-09-26: keys with a backslash are refused and paths are checked with `path.posix` and joined by segment. Covered by a backslash key in the hostile-path test; Windows itself not run. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: a backslash key is refused and checks use `path.posix` with segment joins. Closed by construction; Windows not run.

### F-20 [P2] open - The exit-code lists omit a declined merge

**File:** packages/create-religion/bin/religion.ts:300
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** A declined merge now exits 1 on its own line, but `--help` and the package readme only name conflicts.
**Suggested fix:** Add a declined entry-file merge to both lists.
**Resolution:**

### F-21 [P2] open - A doc comment still calls a declined merge a conflict

**File:** packages/create-religion/bin/religion.ts:231
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The comment on `confirmMerge` describes the behaviour this item replaced.
**Suggested fix:** Say it is reported as not merged and exits 1.
**Resolution:**

### F-22 [P2] open - The readme and doctor guide say update never overwrites an edited file

**File:** packages/create-religion/README.md:42
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** A setup-edited entry file is now rebuilt, replacing edits inside Religion's sections, and unedited dropped files are removed; neither is mentioned. `docs/doctor.md:59` states the rule generally though it only holds under `religion/`.
**Suggested fix:** Describe the rebuild and removal in the readme and scope the doctor sentence.
**Resolution:**

### F-23 [P2] closed - The backup location is spelled out five times

**File:** packages/create-religion/lib/install.ts:215
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** Three identical backup blocks in `applyInstall` and two in the CLI's messages must all agree for "says where" to stay true.
**Suggested fix:** One exported constant and one backup helper.
**Resolution:** Repaired 2026-09-26: one exported `BACKUPS` location and one `backUp` helper replace the three blocks and the CLI's two copies. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: one `BACKUPS` constant and one `backUp` helper, and the CLI uses the constant. Closed.

### F-24 [P2] open - The test that pruning stops at the project cannot fail

**File:** packages/create-religion/lib/install.test.ts:352
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** The project still holds other files, so `rmdir` of the root would fail even without the boundary.
**Suggested fix:** Test a project whose only file is the one removed.
**Resolution:**

### F-25 [P2] open - Unchosen adapters' recorded files are not pinned against removal

**File:** packages/create-religion/lib/install.test.ts:168
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** No test runs the dropped-file planning with another adapter's files recorded, so narrowing the template walk to the chosen adapters would delete them silently.
**Suggested fix:** Record `.agents/skills/...`, plan for `claude` only, assert no removal.
**Resolution:**

### F-26 [P2] open - A declined merge staying out of the manifest is unpinned

**File:** packages/create-religion/bin/religion.ts:173
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** Leaving declined files out of `writeManifest`'s skip list would record the user's own file, and the next update would rebuild it instead of asking. Reproduced by probe.
**Suggested fix:** A lib-level test of decline, write manifest, plan again, expecting `merge`.
**Resolution:**

### F-27 [P2] open - A renamed managed section survives a rebuild as a stale copy

**File:** packages/create-religion/lib/merge.ts:137
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** Managed headings come only from the new template, so a section a newer version renamed or dropped is kept outside the block as though the user wrote it. Reproduced against the real templates.
**Suggested fix:** Treat headings the previous template shipped as managed too, or decide and pin the behaviour.
**Resolution:**

### F-28 [P2] open - A rebuild drops the user's own import lines

**File:** packages/create-religion/lib/merge.ts:138
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** Every `@` line in the lead is dropped, including ones the user added, so their imports vanish (kept only in the backup). Seen in a scratch rebuild.
**Suggested fix:** Drop only import lines the template ships.
**Resolution:**

### F-29 [P3] open - A rebuild reports its backup twice

**File:** packages/create-religion/bin/religion.ts:182
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** Both the Rebuilt line and the Backed up line name the backup directory.
**Suggested fix:** Drop the location from the Rebuilt line.
**Resolution:**

### F-30 [P3] open - The dry-run summary says a rebuild's original was backed up

**File:** packages/create-religion/bin/religion.ts:143
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The plan line prints before the dry-run return, claiming a backup that never happens.
**Suggested fix:** Say it will be backed up.
**Resolution:**

### F-31 [P3] open - A manifest without `managed` crashes update

**File:** packages/create-religion/lib/install.ts:145
**Found:** 2026-09-26 by audit (scope: current; lens: quality, security)
**Why it matters:** `Object.entries(previous.managed)` throws for a missing or null field, where the spec says a corrupt manifest reads as absent. A regression: such a manifest used to work.
**Suggested fix:** Treat a non-object `managed` as empty, or the manifest as absent.
**Resolution:** Repaired 2026-09-26: a manifest whose `managed` is missing or not an object plans no removals instead of throwing; tested. Re-reviewed 2026-09-26 in a fresh-context adversarial pass over the whole of `lib/install.ts` on a case-insensitive APFS scratch disk: not closed. The guard covers only the dropped-file planning; `planInstall` still reads `previous.managed[relative]` for an edited file (install.ts:105), so a manifest without `managed`, or with `managed: null`, plus any edited file still exits 1 with `Cannot read properties of undefined`.

### F-32 [P3] open - A string schemaVersion is not refused

**File:** packages/create-religion/lib/install.ts:352
**Found:** 2026-09-26 by audit (scope: current; lens: security, tests)
**Why it matters:** `schemaVersion: "2"` passes because only numbers are compared.
**Suggested fix:** Refuse any value other than 1.
**Resolution:**

### F-33 [P3] open - Planning reads a dropped file whole

**File:** packages/create-religion/lib/install.ts:151
**Found:** 2026-09-26 by audit (scope: current; lens: performance)
**Why it matters:** A hostile entry can point at a file over 2 GiB, which aborts update with `ERR_FS_FILE_TOO_LARGE` before anything is written.
**Suggested fix:** Hash by stream, or skip files far larger than any template file.
**Resolution:**

### F-34 [P3] open - The template is walked three times per run

**File:** packages/create-religion/lib/install.ts:141
**Found:** 2026-09-26 by audit (scope: current; lens: performance)
**Why it matters:** `planInstall`, `planDropped` and `writeManifest` each walk it. A few milliseconds.
**Suggested fix:** Pass the first walk's list along.
**Resolution:**

### F-35 [P3] open - Rebuild and version edge cases are unpinned

**File:** packages/create-religion/lib/merge.test.ts:112
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** Untested: a user who deleted Commands (the rebuild then has none), a fenced `## ` line inside a user section (split and dropped), CRLF files, an AGENTS-shaped file, a recorded path that is now a directory or symlink, and version strings like `1.0`, `1.0.0+build` or a prerelease on the package side.
**Suggested fix:** Pin each with a small case.
**Resolution:**

### F-36 [P1] open - Older write paths follow symlinked parents

**File:** packages/create-religion/lib/install.ts:252
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** `create`, `update`, the forced conflict write and `writeManifest` also write through a symlinked `.claude` or `religion/.state`. Predates this work; not reproduced.
**Suggested fix:** Share one no-symlinked-component check with the removal guard.
**Resolution:** Confirmed 2026-09-26 by the re-review: a plain `update` overwrote an outside file through a linked `manifest.json`, created one through a dangling link, created outside files through a dangling shipped skill file and a dangling `religion/build-plan.md`, and `--force` wrote the template through a linked `CLAUDE.md`. Raised to P1.

### F-37 [P3] unverified - A later backup overwrites an earlier one

**File:** packages/create-religion/lib/install.ts:243
**Found:** 2026-09-26 by audit (scope: current; lens: quality, security, tests)
**Why it matters:** Backups go to the same path each time, so a forced conflict after a rebuild replaces the rebuild's original. Not reproduced.
**Suggested fix:** Timestamp or refuse to overwrite a backup.
**Resolution:**

### F-38 [P3] unverified - An entry file symlinked to the other gets the wrong block

**File:** packages/create-religion/lib/install.ts:119
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** With `CLAUDE.md` linked to `AGENTS.md`, both are planned and the second applies over the first's result. Read from the code; not run.
**Suggested fix:** Plan each real file once.
**Resolution:**

### F-39 [P0] open - Wiring the hooks writes attacker-chosen content outside the project

**File:** packages/create-religion/lib/install.ts:416
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** `wireHooks` checks `.claude/settings.json` with `stat`, which follows links, and copies the project's own `religion/.state/settings-template.json` to it. With `settings.json` a dangling link to an outside path and the template holding attacker text, a plain `update` with no flags and no terminal created the outside file with exactly that text and exited 0. Predates this work.
**Suggested fix:** Refuse a settings path with a link in any component, using the same check as removal.
**Resolution:**

### F-40 [P1] open - Merging and remerging write through a linked entry file

**File:** packages/create-religion/lib/install.ts:245
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** With `CLAUDE.md` linked to an outside file that carries Religion's markers, a plain non-interactive `update` rewrote the outside file; with no record and `--yes`, text was appended to any outside file and its contents copied into the backups directory. Predates this work.
**Suggested fix:** Treat a linked entry file as a conflict for merge and remerge too.
**Resolution:**

### F-41 [P2] open - A linked entry file's conflict advice writes through the link

**File:** packages/create-religion/bin/religion.ts:207
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** A linked entry file is now a conflict, and the message advises `--force`, which writes the template through the link and copies the outside file into backups. The rebuild guard's promise to leave the file alone depends on F-36.
**Suggested fix:** Fixed with F-36, or give linked files their own message.
**Resolution:**

### F-42 [P3] open - The rebuild gate's comment overstates what it stops

**File:** packages/create-religion/lib/install.ts:303
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** Any 16-hex-digit value, not only a genuine hash, still enables an unprompted rebuild of the project's own entry file. That stays within the exception for Religion's own file, but the comment and F-15's resolution claim a forged value cannot.
**Suggested fix:** Say it rejects malformed records, not forged ones.
**Resolution:**

### F-43 [P3] open - The backup refusal says to make a directory when the link is the file

**File:** packages/create-religion/lib/install.ts:347
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** A dangling link at `backups/CLAUDE.md` is refused with "Make it a real directory".
**Suggested fix:** Name what to fix by what the link is.
**Resolution:**

### F-44 [P3] open - A linked managed file can hang update

**File:** packages/create-religion/lib/install.ts:96
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** With a shipped skill file linked to `/dev/zero`, `update` read forever and had to be killed after 150 seconds. Related to F-33.
**Suggested fix:** Skip anything that is not a plain file before reading it.
**Resolution:**

### F-45 [P3] open - A case or normalisation variant of a shipped path is retired

**File:** packages/create-religion/lib/install.ts:152
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** On a case-insensitive disk, `.claude/skills/Audit/SKILL.md` recorded with the real hash is not a shipped path, so it removed the shipped `audit/SKILL.md`; an NFD spelling of an NFC path does the same. It cannot leave the tree and the next update re-creates the file.
**Suggested fix:** Compare against shipped paths case- and normalisation-insensitively.
**Resolution:**
