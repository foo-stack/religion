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

### F-06 [P3] fixed - Flag dispatch ends in a catch-all branch

**File:** packages/create-religion/lib/args.ts:72
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The known-flag list and the if/else chain duplicate each other, and the final `else options.yes = true` catches any other known flag, so a flag added to the list without its own branch silently becomes `--yes`.
**Suggested fix:** Make the last branch explicit, or drive scope and effect from one table.
**Resolution:** Repaired 2026-09-26: options are dispatched from one table of commands and effects (`FLAGS`), so an option cannot be listed without its effect, and `GRAMMAR` is read from the same table. Tested.

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

### F-13 [P3] fixed - A repeated adapter flag is recorded twice

**File:** packages/create-religion/lib/args.ts:77
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-01)
**Why it matters:** `install --claude --claude --dry-run --yes` prints "Adapters: Claude Code, Claude Code", and the list reaches `writeManifest` unchanged, so a real install would record the adapter twice. Seen in a dry run; the written manifest was not inspected.
**Suggested fix:** push only when the adapter is not already in the list.
**Resolution:** Repaired 2026-09-26: an adapter option adds its adapter only when it is not already chosen, keeping first-seen order. Tested.

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

### F-42 [P3] open - The rebuild gate's comment overstates what it stops

**File:** packages/create-religion/lib/install.ts:303
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** Any 16-hex-digit value, not only a genuine hash, still enables an unprompted rebuild of the project's own entry file. That stays within the exception for Religion's own file, but the comment and F-15's resolution claim a forged value cannot.
**Suggested fix:** Say it rejects malformed records, not forged ones.
**Resolution:**

### F-45 [P3] open - A case or normalisation variant of a shipped path is retired

**File:** packages/create-religion/lib/install.ts:152
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-14 to F-19)
**Why it matters:** On a case-insensitive disk, `.claude/skills/Audit/SKILL.md` recorded with the real hash is not a shipped path, so it removed the shipped `audit/SKILL.md`; an NFD spelling of an NFC path does the same. It cannot leave the tree and the next update re-creates the file.
**Suggested fix:** Compare against shipped paths case- and normalisation-insensitively.
**Resolution:**

### F-46 [P2] open - Wiring the hooks reads its template through a link

**File:** packages/create-religion/lib/install.ts:445
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-36 to F-44)
**Why it matters:** `wireHooks` guards the settings path but follows a linked `religion/.state/settings-template.json`, so a plain `update` copied an outside file's contents into `.claude/settings.json` for the victim to commit, even though the plan had just reported the template as linked. `copyFile` also carries the source's mode: a template linked to `/dev/zero` produced a world-writable settings file.
**Suggested fix:** Refuse a linked template with the same check, and write the contents rather than copying the file.
**Resolution:**

### F-47 [P3] open - A hard link can alias one project file to another

**File:** packages/create-religion/lib/install.ts:313
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-36 to F-44)
**Why it matters:** `throughLink` sees only symbolic links, so a skill file hard-linked to `religion/build-plan.md` with a matching record had the build plan overwritten by the skill template. Stays inside the project, and git cannot deliver hard links.
**Suggested fix:** Refuse files with more than one link, or write to a temporary file and rename.
**Resolution:**

### F-48 [P3] open - Checks and writes are separate calls

**File:** packages/create-religion/lib/install.ts:258
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-36 to F-44)
**Why it matters:** No write uses `O_NOFOLLOW` or `O_EXCL`, so a process racing the run could swap a link in between a check and its write. Needs a concurrent local attacker; no prompt sits between them.
**Suggested fix:** Open with no-follow flags where Node allows it.
**Resolution:**

### F-49 [P3] open - A removal released because of a link is described as edited

**File:** packages/create-religion/bin/religion.ts:195
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-36 to F-44)
**Why it matters:** The release message says "because you edited them" even when the reason was a link swapped in.
**Suggested fix:** Word it as left alone, without giving a reason it cannot know.
**Resolution:**

### F-50 [P3] open - A dropped path reached through a link leaves the manifest silently

**File:** packages/create-religion/lib/install.ts:161
**Found:** 2026-09-26 by audit (scope: current; lens: security re-review of F-36 to F-44)
**Why it matters:** It is never deleted, which is safe, but it drops out of the manifest without being reported.
**Suggested fix:** Report it as linked.
**Resolution:**

### F-51 [P1] closed - The upgrade check passes when the update does nothing

**File:** scripts/upgrade.ts:48
**Found:** 2026-09-26 by audit (scope: current; lens: tests, quality)
**Why it matters:** Everything it asserts is already true before the update: the entry files hold their edits once, the plans are intact, and a second run matches the first. A stub that only rewrote the manifest's version passed, so a planner marking everything unchanged, skipped skill writes, or a dropped managed section would all go unnoticed.
**Suggested fix:** Require every managed file to match the current template afterwards, each template heading once in the entry files, and doctor's install checks to pass.
**Resolution:** Repaired 2026-09-26: after the update the check requires every managed file to match the current template, each template heading exactly once in both entry files with the edits kept, and doctor's required-files, configuration, adapters and entry-file checks to pass. A no-op update now fails with the stale managed files named. Re-reviewed 2026-09-26: not closed, since the check could only notice files that differed between the release and the current template, which after a capture is none. Repaired again 2026-09-26: the update now runs against a copy of the current tool whose template changes every managed file, adds a skill and retires one, and the check asserts managed files, leftovers, entry sections and imports taken from the template text, the owner's title, sections and edits, backups, every owned file (each carrying an edit), doctor checks by name, and the manifest's version and hashes. Thirteen regressions each failed it in a scratch copy, a correct update passed, and with the skill trees made identical to the release a no-op update still failed. Re-reviewed 2026-09-26 in a second fresh-context adversarial pass on a scratch copy: every regression from the first re-review failed the check, as did deleting files whose template is unchanged, skipping the added skill, keeping the retired one, keeping stale sections, and a self-consistent change to the hash; with the template made byte-identical to the release, a no-op update still failed with 57 stale files. Closed; the regressions that still pass are F-71 to F-78.

### F-52 [P1] closed - A shipped skill can be removed without failing the surface check

**File:** scripts/surface-current.ts:33
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** Skills are read from `PLANNED_SKILLS`, a hand-kept roster, and the only related check requires authored skills to be a subset of it. Removing `src/skills/try` and its routing cases passed the whole suite; so does a rename that leaves the old name listed.
**Suggested fix:** Derive skill names from the authored sources.
**Resolution:** Repaired 2026-09-26: skill names are read from the authored sources with `readSkills`, so moving `src/skills/try` aside failed the check as `breaking: skills no longer includes try`. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: removing, renaming or hiding the `try` skill source, or removing it from the roster or rendered trees, each failed the suite. Closed; dropping a skill at render or pack time is F-69.

### F-53 [P2] closed - The executed fixture has no integrity pin

**File:** scripts/upgrade.ts:24
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** The upgrade check runs the tarball's code in every `npm test`, including the release job, which holds OIDC and write permissions. A replaced tarball shows only as a binary diff, and nothing records or checks what npm published.
**Suggested fix:** Record the registry integrity with the version and refuse to extract a fixture that does not match it.
**Resolution:** Repaired 2026-09-26: `lastReleaseIntegrity` records the registry integrity and the check refuses to extract a fixture whose sha512 differs; a tampered fixture was refused. The release notes tell the reviewer how to confirm the recorded value. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: a repacked, appended-to or swapped tarball, and a missing, empty, sha1, array or padded integrity, were each refused before extraction. Closed; the integrity sits in the same reviewable file by design, and the release notes say how to confirm it.

### F-54 [P2] open - The surface comparison compares array items as strings

**File:** scripts/surface.ts:18
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** Items go through `String()`, so arrays of objects always compare equal and `[1]` matches `["1"]`. Latent while every recorded array holds strings.
**Suggested fix:** Compare items by their JSON.
**Resolution:**

### F-55 [P2] closed - The upgrade check makes only some of setup's edits

**File:** scripts/upgrade.ts:83
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** It never edits `religion/context/coding-standards.md` or `religion/config.json`, which setup does, so an update that overwrote either would pass. Current behaviour keeps both.
**Suggested fix:** Edit and assert both.
**Resolution:** Repaired 2026-09-26: the check also edits the coding standards and the configuration and requires both unchanged after the update. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: overwriting the coding standards or the configuration during the update failed the check. Closed.

### F-56 [P2] open - A setting is recorded by its default's type

**File:** packages/create-religion/surface.json:152
**Found:** 2026-09-26 by audit (scope: current; lens: quality, tests)
**Why it matters:** `auto.maxItems` is recorded as `"null"` though the configuration reference documents a positive integer or null, so the statement would promise less than the tool accepts and a numeric default would read as breaking.
**Suggested fix:** Let the config record use unions, and record the documented type.
**Resolution:**

### F-57 [P3] closed - The old installer inherits the environment and has no timeout

**File:** scripts/upgrade.ts:95
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** The fixture runs with the full environment, including the release job's token request variables, and a hang stalls the suite.
**Suggested fix:** Pass a minimal environment and a timeout.
**Resolution:** Repaired 2026-09-26: every spawned command gets only `PATH`, a scratch `HOME` and `TMPDIR`, and a sixty-second limit. Re-reviewed 2026-09-26: the environment half held, but a fixture ignoring SIGTERM hung the suite. Repaired again 2026-09-26: the time limit now kills with SIGKILL; a process ignoring SIGTERM returned after two seconds with SIGKILL. The parent's environment remains readable through the process table, which only an isolated runner would close. Re-reviewed 2026-09-26 in a second fresh-context adversarial pass on a scratch copy: a child ignoring SIGTERM, a shell whose grandchild held the pipe, and a detached grandchild each returned at the limit with SIGKILL, and an update that never exits failed the check after sixty seconds with no orphan left. Closed.

### F-58 [P3] closed - The last release's version is used in a path unchecked

**File:** scripts/upgrade.ts:24
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** A value like `../../x` would name another tarball, which would then be run.
**Suggested fix:** Validate it as a version first.
**Resolution:** Repaired 2026-09-26: `lastRelease` must match a strict version pattern before it names a file. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: `../../x`, `latest`, `0.5`, padded, empty and missing values were rejected. Closed.

### F-59 [P3] closed - The capture script accepts tag-shaped versions and can delete the tarball it fetched

**File:** scripts/capture-release.ts:16
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** `\w` admits `_`, which npm reads as a tag, so the packed file can be named differently from the one kept and is then deleted.
**Suggested fix:** Take the file name and integrity from `npm pack --json` and use a strict version pattern.
**Resolution:** Repaired 2026-09-26: the capture script takes the file name, version and integrity from `npm pack --json`, refuses a mismatched version, and uses the strict pattern, which rejects tag-shaped input. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: thirteen malformed or tag-shaped arguments exited 2 before any npm call, and a version mismatch left the record alone. Closed; its leftovers are F-70.

### F-60 [P3] closed - The upgrade check throws instead of failing

**File:** scripts/upgrade.ts:40
**Found:** 2026-09-26 by audit (scope: current; lens: tests, quality)
**Why it matters:** Missing `tar`, an installer that writes no entry file, or a missing `tsx` throw, stopping the suite with a message that names no check.
**Suggested fix:** Return a problem line.
**Resolution:** Repaired 2026-09-26: spawn failures and any thrown error become a problem line naming the check. Re-reviewed 2026-09-26 in a fresh-context adversarial pass on a scratch copy: missing `tar`, missing `tsx` and an installer that writes nothing each produced a problem line. Closed.

### F-61 [P3] open - The shape language cannot pin literal values

**File:** scripts/surface.ts:49
**Found:** 2026-09-26 by audit (scope: current; lens: tests, quality)
**Why it matters:** `schemaVersion`, `checks[].blocks` and `next.command` are recorded as plain strings or numbers, so a change of value passes; `"object"` and `"array"` match anything of that kind unchecked.
**Suggested fix:** Add literals, and reject unknown kind names.
**Resolution:**

### F-62 [P3] open - Help bypasses the option table

**File:** packages/create-religion/lib/args.ts:85
**Found:** 2026-09-26 by audit (scope: current; lens: tests, quality)
**Why it matters:** `parseArgs` returns early on help, so the table's help entries never run and help accepts any other option, which the recorded grammar does not say.
**Suggested fix:** Record help's precedence, or route it through the table.
**Resolution:**

### F-63 [P3] open - The scripts test pattern is unguarded

**File:** scripts/verify.ts:289
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The check that unit tests exist looks only under the package, and an unmatched glob is silently ignored, so moving the surface tests would drop them.
**Suggested fix:** Extend the check to `scripts/`.
**Resolution:**

### F-64 [P3] open - The surface check ignores record keys it does not derive

**File:** scripts/verify.ts:264
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** A misspelt or extra top-level key or JSON kind passes, and a missing section reads as a change from null.
**Suggested fix:** Compare the record's keys too.
**Resolution:**

### F-65 [P3] open - The release notes do not say what an upgrade failure means

**File:** docs/architecture/releasing.md:51
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The table covers only the surface check, and it sets a versioning rule the stability statement should own.
**Suggested fix:** Say an upgrade failure is a regression to fix, never re-record.
**Resolution:**

### F-66 [P3] open - Shape tests never fail a primitive on its own

**File:** scripts/surface.test.ts:52
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** String, number, boolean and null fail only through the union case.
**Suggested fix:** Add one failing case each.
**Resolution:**

### F-67 [P3] unverified - A local run can test a stale staged template

**File:** scripts/upgrade.ts:27
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** The check only confirms the template exists; `build:skills` alone does not restage it. CI builds first.
**Suggested fix:** Compare the staged template with its sources, or say so in the failure.
**Resolution:**

### F-68 [P3] unverified - Some installed paths are not recorded

**File:** packages/create-religion/surface.json:1
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** `.claude/settings.json` and the shared `religion/` tree are installed but absent from the adapter record. The spec scoped trees and entry files narrowly.
**Suggested fix:** Decide in the stability statement whether they are promised.
**Resolution:**

### F-69 [P2] open - Skills can be dropped at render or pack time without failing the surface check

**File:** scripts/surface-current.ts:35
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-51 to F-60)
**Why it matters:** Skill names come from the sources, so filtering a skill out of the render loop, or excluding its trees in the package's `files`, removed it from what ships while the suite passed.
**Suggested fix:** Also compare the staged template's skill trees, and the packed file list, with the sources.
**Resolution:**

### F-70 [P3] open - The capture script leaves a stray tarball and throws on unexpected output

**File:** scripts/capture-release.ts:31
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-51 to F-60)
**Why it matters:** On a version mismatch the tarball npm wrote stays in `fixtures/`, and output that is not JSON throws uncaught.
**Suggested fix:** Remove the stray file and report the parse failure.
**Resolution:**

### F-71 [P2] open - The upgrade check never changes the entry template's imports or sections

**File:** scripts/upgrade.ts:137
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** Only the Workflow body is perturbed, so a rebuild that keeps the file's existing imports instead of the template's passed the whole suite, which is the loss the managed block exists to prevent.
**Suggested fix:** Add an import, add a section and remove one in the perturbed entry templates.
**Resolution:**

### F-72 [P2] open - The project's own `.claude/settings.json` is never checked

**File:** scripts/upgrade.ts:235
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** It is neither edited nor asserted, and no unit test covers `wireHooks`, so an update that overwrote or corrupted it passed the whole suite.
**Suggested fix:** Edit it as a project would and require it unchanged.
**Resolution:**

### F-73 [P3] open - The rest of `religion/.state/` is unchecked

**File:** scripts/upgrade.ts:236
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** An update deleting `settings-template.json` on every run passed, since each run recreates and deletes it.
**Suggested fix:** Assert the seeded state files survive.
**Resolution:**

### F-74 [P3] open - The update never meets an unchanged managed file

**File:** scripts/upgrade.ts:133
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** Every managed file is perturbed, so behaviour that fires only for unchanged files across versions is invisible; a version-gated deletion of unchanged files passed.
**Suggested fix:** Leave some managed files unperturbed.
**Resolution:**

### F-75 [P3] open - The entry perturbation can silently do nothing

**File:** scripts/upgrade.ts:139
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** The replace of the Workflow heading does nothing if the heading is renamed, and the check carries on without its entry perturbation.
**Suggested fix:** Fail when the replacement changed nothing.
**Resolution:**

### F-76 [P3] open - Really retiring the `try` skill breaks the check misleadingly

**File:** scripts/upgrade.ts:144
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** Removing a file that no longer exists throws, reported as the upgrade not being checkable.
**Suggested fix:** Retire whichever skill exists, or tolerate a missing one.
**Resolution:**

### F-77 [P3] open - Nothing asserts the update writes only inside the project

**File:** scripts/upgrade.ts:69
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** An update that appended to a file outside the project passed.
**Suggested fix:** Run in a directory whose surroundings are snapshotted, or record writes.
**Resolution:**

### F-78 [P3] open - Expected manifest hashes use the hash function under test

**File:** scripts/upgrade.ts:226
**Found:** 2026-09-26 by audit (scope: current; lens: second re-review of F-51)
**Why it matters:** Contrary to the principle the entry checks follow; not exploitable today because the release's own manifest pins the real function.
**Suggested fix:** Compute the expected hash independently.
**Resolution:**
