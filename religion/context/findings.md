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

### F-04 [P3] fixed - "Nothing was read" overstates what a usage error does

**File:** packages/create-religion/bin/religion.ts:238
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** An unknown first word is checked with `statSync` before it is refused, so `religion stauts` stats `./stauts`. No contents are read and nothing is written, but the help text, the package readme and the changeset promise "nothing was read or written".
**Suggested fix:** Say "nothing was written" or "nothing was changed" in all three.
**Resolution:** Repaired 2026-09-26: the help text, the package readme and the stability statement now say a usage error writes nothing, which is true; the directory check that precedes it is a read.

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

### F-54 [P2] open - The surface comparison compares array items as strings

**File:** scripts/surface.ts:18
**Found:** 2026-09-26 by audit (scope: current; lens: tests)
**Why it matters:** Items go through `String()`, so arrays of objects always compare equal and `[1]` matches `["1"]`. Latent while every recorded array holds strings.
**Suggested fix:** Compare items by their JSON.
**Resolution:**

### F-56 [P2] open - A setting is recorded by its default's type

**File:** packages/create-religion/surface.json:152
**Found:** 2026-09-26 by audit (scope: current; lens: quality, tests)
**Why it matters:** `auto.maxItems` is recorded as `"null"` though the configuration reference documents a positive integer or null, so the statement would promise less than the tool accepts and a numeric default would read as breaking.
**Suggested fix:** Let the config record use unions, and record the documented type.
**Resolution:**

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

### F-65 [P3] fixed - The release notes do not say what an upgrade failure means

**File:** docs/architecture/releasing.md:51
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The table covers only the surface check, and it sets a versioning rule the stability statement should own.
**Suggested fix:** Say an upgrade failure is a regression to fix, never re-record.
**Resolution:** Repaired 2026-09-26: the release notes now point at the stability statement for which release a change belongs in, and say an upgrade failure is a regression to fix.

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

### F-79 [P3] open - Every update tells the user to enable hooks that are already enabled

**File:** packages/create-religion/bin/religion.ts:217
**Found:** 2026-09-26 while writing the upgrade guide from runs
**Why it matters:** Once Religion has written `.claude/settings.json`, each later update prints "already exists and was left alone. To enable the hooks, merge ... into it", even when the file is Religion's own and the hooks are on, so the instruction reads as a problem on every run.
**Suggested fix:** Say nothing when the settings file already wires every hook in the template.
**Resolution:**

### F-80 [P1] fixed - The handoff hook writes through symbolic links

**File:** src/hooks/write-handoff.mjs:82
**Found:** 2026-09-26 by audit (scope: current; lens: security, quality)
**Why it matters:** It writes `religion/context/handoff.md` with no link check, so a cloned repository linking that path, or either directory above it, elsewhere has the target overwritten at the end of every turn, partly with text the repository controls. Reproduced: an outside file was replaced. The statement promises the hooks write nothing outside the project.
**Suggested fix:** Leave the handoff unwritten when any component of its path is a link, and test it.
**Resolution:** Repaired 2026-09-26: the hook leaves the handoff unwritten when `religion`, `religion/context` or `handoff.md` is a link; `scripts/hooks.test.ts` runs the real hook against each and the outside target stays intact, and two of its three tests fail against the unguarded hook. Awaiting re-review.

### F-81 [P1] fixed - The network check can be evaded

**File:** scripts/promises.ts:45
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** It denies a list of spellings over part of what ships, so a computed dynamic import, `createRequire`, `child_process` running curl, a stored `fetch`, `process.binding`, a worker, `http["request"]`, a protocol-relative `fetch("//evil.example")` in the dashboard page, an `<img>` pixel, a subdirectory under `lib/`, or a `.cjs` hook all passed it. The shipped code is clean today, but the check cannot catch a regression, and the statement cites it.
**Suggested fix:** Allow only a fixed set of imports per file, reject non-literal imports and the escape hatches, walk every shipped extension recursively, and give the dashboard page a content security policy.
**Resolution:** Repaired 2026-09-26: the check is now an allowlist of seven module names, with `node:http` for the dashboard alone; it strips block comments, refuses any Node module named anywhere outside the list, any computed or unlisted run-time load, and `fetch`, `WebSocket`, `EventSource`, `XMLHttpRequest`, `sendBeacon`, `createRequire`, workers, `eval`, `Function`, `globalThis` and other global lookups, and the native bindings; it walks every code extension recursively; the dashboard may use only its server and must send a content security policy confining the page to its own server, and its page's only allowed request is its own data. Twenty-two evasions, including every one reported, each failed it in a scratch copy, and the unmodified code passes. Awaiting re-review.

### F-82 [P1] fixed - The update guide says a new hook reaches the settings template, which update never refreshes

**File:** docs/upgrading.md:196
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** `religion/.state/settings-template.json` is under `religion/`, so it is seeded once and never updated; the guide and the tool's own hint send users to merge a stale file. This repository's own template still wires the hook removed in 0.5.0.
**Suggested fix:** Correct the guide and the hint, and list it as a known limitation.
**Resolution:** Repaired 2026-09-26: the guide now says the settings template is seeded once and never refreshed and points at a fresh install instead; the tool's hint says the same, recaptured from a run; and the statement lists it under known limitations. Awaiting re-review.

### F-83 [P1] fixed - A linked settings file exits 0 though the statement and changesets say 1

**File:** packages/create-religion/bin/religion.ts:216
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The linked branch of hook wiring prints a message but sets no exit code, contradicting the statement's exit table, the major changeset and the pending update changeset.
**Suggested fix:** Exit 1 there, as every other linked file does.
**Resolution:** Repaired 2026-09-26: the linked branch now sets exit code 1; a scratch update with a linked `.claude/settings.json` printed the linked message, exited 1, and wrote nothing through the link. Awaiting re-review.

### F-84 [P2] open - Update removes a hook script that settings still run

**File:** packages/create-religion/lib/install.ts:143
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** A retired, unedited hook is removed while `.claude/settings.json`, which update never rewires, still runs it; the hook then fails with `MODULE_NOT_FOUND` on every call. Neither the statement nor the guide says so.
**Suggested fix:** Warn naming the settings file when a removed file is a hook, and document it.
**Resolution:** Documented 2026-09-26 as a known limitation in the statement and in the guide's section on removed files; the warning in the tool is not built.

### F-85 [P2] fixed - The statement overstates who owns the entry files

**File:** docs/stability.md:133
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** A fresh install writes them without markers, so until the first update or merge the file is Religion's, and the one-time rebuild drops edits inside Religion's sections and any import lines the user added.
**Suggested fix:** Qualify the row.
**Resolution:** Repaired 2026-09-26: the row says the entry files are Religion's until the first update or merge, and what the first rebuild keeps and what survives only in the backup.

### F-86 [P2] fixed - The settings row claims the record holds values it does not

**File:** docs/stability.md:123
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** Only seven enumerated settings have recorded values; the rest are recorded by their default's type, so ranges, formats and even booleans are unchecked, and `doctor` accepts `"parallelSteps": "yes"`.
**Suggested fix:** Say exactly what is recorded, and widen the known limitation.
**Resolution:** Repaired 2026-09-26: the settings citation says exactly what is recorded and checked, and the known limitation names booleans, ranges and formats.

### F-87 [P2] fixed - Nothing tests that the dashboard binds loopback or refuses a foreign host end to end

**File:** packages/create-religion/lib/dashboard.ts:27
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** Only the pure host check is tested; binding every interface and skipping the check both passed the suite, though the statement cites the dashboard's tests.
**Suggested fix:** Start the dashboard in a test and assert its address and a foreign host's 403.
**Resolution:** Repaired 2026-09-26: a test starts the real dashboard and asserts it is bound to 127.0.0.1, answers a foreign host with 403, serves its own host, and sends the page's content security policy.

### F-88 [P3] fixed - Smaller inaccuracies in the statement and its companions

**File:** docs/stability.md:29
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The statement and the command-line changeset still say "read or written"; the exit table's citation says the help lists the same meanings when it omits two; a dry run exits 0 with conflicts planned, unsaid; the `religion/` row ignores created and rewritten state; decision 100 overstates what the statement check checks; the overview stamp's parsing is cited but untested; the major changeset omits the dashboard's host check; the guide claims every line is quoted when some are omitted; the breaking-change table leaves marker text and state formats unclassified and calls skill changes minor while calling them internal; and the generated overview still counts ten checks.
**Suggested fix:** Correct each.
**Resolution:** Repaired 2026-09-26: each inaccuracy corrected, in the statement, the guide, both changesets, the help text and readme, the decision log and the overview's code map.

### F-89 [P3] unverified - Hooks resolve the project from their working directory

**File:** src/hooks/write-handoff.mjs:14
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** They use `process.cwd()` and are launched by a relative path; if a hook ever runs from another directory it would act on that directory. How the tool chooses a hook's working directory was not confirmed.
**Suggested fix:** Use the project directory the tool passes in.
**Resolution:**
