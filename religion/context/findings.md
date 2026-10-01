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

### F-84 [P2] open - Update removes a hook script that settings still run

**File:** packages/create-religion/lib/install.ts:143
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** A retired, unedited hook is removed while `.claude/settings.json`, which update never rewires, still runs it; the hook then fails with `MODULE_NOT_FOUND` on every call. Neither the statement nor the guide says so.
**Suggested fix:** Warn naming the settings file when a removed file is a hook, and document it.
**Resolution:** Documented 2026-09-26 as a known limitation in the statement and in the guide's section on removed files; the warning in the tool is not built.

### F-89 [P3] unverified - Hooks resolve the project from their working directory

**File:** src/hooks/write-handoff.mjs:14
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** They use `process.cwd()` and are launched by a relative path; if a hook ever runs from another directory it would act on that directory. How the tool chooses a hook's working directory was not confirmed.
**Suggested fix:** Use the project directory the tool passes in.
**Resolution:**

### F-90 [P2] open - The handoff hook reads state files through links

**File:** src/hooks/write-handoff.mjs:18
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-80 to F-88)
**Why it matters:** It reads with `readFileSync`, so a repository linking `religion/context/findings.md` to `/dev/zero` grew the hook to about 9 GB before it was killed, and a linked build plan copies outside lines into the handoff.
**Suggested fix:** Skip links and anything that is not a plain file, and cap the size read.
**Resolution:**

### F-91 [P3] fixed - The page policy is checked only for two phrases

**File:** scripts/promises.ts:111
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-80 to F-88)
**Why it matters:** The check and the test look for `default-src 'none'` and `connect-src 'self'`, so adding `img-src *` passed both; and the changeset's "may reach nothing but its own server" overstates what the policy governs.
**Suggested fix:** Compare the whole policy, and soften the changeset's wording.
**Resolution:** Repaired 2026-09-26: the check requires the exact policy constant and that every response goes through the helper that sends it, the dashboard test compares the header on every route with the exact constant, and the changeset no longer overstates what the policy governs.

### F-92 [P3] open - A missing settings file is recreated from the stale template

**File:** packages/create-religion/lib/install.ts:444
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-80 to F-88)
**Why it matters:** When `.claude/settings.json` is absent, `update` copies the seeded template, which can wire a hook the current version no longer ships; the known limitations do not say so.
**Suggested fix:** Wire from the shipped template, or document it.
**Resolution:**

### F-93 [P3] open - The handoff hook fails when the handoff is a directory

**File:** src/hooks/write-handoff.mjs:82
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-80 to F-88)
**Why it matters:** It exits non-zero with EISDIR. Predates this work.
**Suggested fix:** Skip anything that is not a plain file.
**Resolution:**

### F-94 [P3] open - The upgrade check's time limit leaves the update running

**File:** scripts/upgrade.ts:208
**Found:** 2026-09-26 by audit (scope: current; lens: re-review of F-80 to F-88)
**Why it matters:** The limit kills the `tsx` wrapper, but the Node process it starts survives: an update that ignored its signal kept running for over an hour, orphaned, until stopped by hand.
**Suggested fix:** Run the update in its own process group and kill the group, or run Node with the loader directly.
**Resolution:**

### F-95 [P3] fixed - A sentence in the statement's network promise is broken

**File:** docs/stability.md:182
**Found:** 2026-09-26 by audit (scope: current; lens: final re-review of F-81)
**Why it matters:** The last edit left "...review of every change to shipped code. the install tests that...", a fragment in the middle of the promise's citations, and the scoping sentence is not prominent.
**Suggested fix:** Make the scoping its own sentence after the promise and restore the list.
**Resolution:** Repaired 2026-09-26: the citations are a list again, and the check's limit is its own paragraph after them.

### F-96 [P3] fixed - The network check flags ordinary words

**File:** scripts/promises.ts:82
**Found:** 2026-09-26 by audit (scope: current; lens: final re-review of F-81)
**Why it matters:** Strings and trailing comments such as "could not fetch the template", "another process holds the lock", a class `constructor`, or `window.addEventListener` all fail it, which pushes a contributor to weaken the check.
**Suggested fix:** Tokenize, so only code is matched.
**Resolution:** Repaired 2026-09-26: with the parser, strings and comments are no longer matched; every reported false positive passes.

### F-97 [P2] open - A symlinked directory in a scanned folder ships code the check never reads

**File:** scripts/promises.ts:509
**Found:** 2026-09-26 by audit (scope: current; lens: confirmation of F-81)
**Why it matters:** The walk recurses only into real directories and a relative import is judged by its written path, so `lib/extra -> ../extra` with a `fetch` inside passed the whole suite and compiled into the output. The same holds under `src/hooks`.
**Suggested fix:** Refuse a symbolic link under a shipped folder, or follow it.
**Resolution:**

### F-98 [P3] open - Four package rules are guarded only in combination

**File:** scripts/fixtures/network-probes.json:1
**Found:** 2026-09-26 by audit (scope: current; lens: confirmation of F-81)
**Why it matters:** The bin, files, main or exports, and tsconfig include rules are each tripped only alongside another by the recorded probes, so removing any one alone leaves the corpus green.
**Suggested fix:** Add a probe that trips each on its own.
**Resolution:**

### F-100 [P2] open - The page counts the active spec's steps two ways

**File:** packages/create-religion/lib/dashboard.ts:630
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** The rail and the overview tile use `status.work` from `parseWork`, which counts every checkbox in the file at any indent; the Active work panel and the Work view use `parseSpec`, which counts only top-level steps under `## Build steps`. A spec with a nested sub-task and a Testing checkbox shows 0/3 in the rail and 0 of 2 in the Work view, and the banner's "step N" and the Work tile's next label can name different steps when ticks are out of order.
**Suggested fix:** Take every step number on the page from `data.work.steps`, keep `status.work` for `status --json`, and read `current-work.md` once in `readState`.
**Resolution:**

### F-103 [P2] open - History numbers and order are wrong for fixes, refactors and rollbacks

**File:** packages/create-religion/lib/state.ts:225
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** `parseArchive` assumes `NN-slug.md`, but rollbacks are named `YYYY-MM-DD-NN-name.md`, so a rollback's number reads as its year, and `readHistory` lists every feature before any fix and sorts the other kinds reverse-alphabetically, while the page says "newest first" and "Recently shipped".
**Suggested fix:** Take the number only where the kind's naming carries one, and drop the ordering claims or order on something the archive records.
**Resolution:**

### F-104 [P2] open - The same view logic is repeated across render functions

**File:** packages/create-religion/lib/dashboard.ts:646
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** The plan and blocking tiles, the nothing-in-progress empty state, the closed-findings filter (seven times), the passing-checks count, the severity bar mapping, the finding list markup and two identifier comparators are each written more than once, and the step counts have already drifted between views.
**Suggested fix:** Hoist small helpers to the top of the page script and use them in every view.
**Resolution:**

### F-105 [P2] open - The manifest sanitising has no test

**File:** packages/create-religion/lib/dashboard.ts:114
**Found:** 2026-10-01 by audit (scope: current; lens: tests)
**Why it matters:** Every dashboard test uses an empty project, so `readInstall`'s handling of a hand-edited manifest never runs; returning the raw manifest, dropping the string filter on adapters, or counting an array as `managed` each passed the suite, and a non-array `adapters` would throw in the Health view.
**Suggested fix:** Write a malformed manifest in a dashboard test and assert the sanitised `health.install`, and that unparseable JSON gives `null`.
**Resolution:**

### F-106 [P2] open - An empty label crossing into the next line is unpinned

**File:** packages/create-religion/lib/state.ts:316
**Found:** 2026-10-01 by audit (scope: current; lens: tests)
**Why it matters:** The only empty label in the test fixture is the last line of its entry, so changing `[ \t]*` to `\s*` in `labelled()` passes the suite while an empty `**File:**` above `**Found:**` would then capture the next line.
**Suggested fix:** Put an empty `**File:**` directly above `**Found:**` in the details test and assert `file: null`.
**Resolution:**

### F-108 [P3] open - The history reader follows links and reads any file type

**File:** packages/create-religion/lib/state.ts:249
**Found:** 2026-10-01 by audit (scope: current; lens: security)
**Why it matters:** `readdir` and `readFile` follow symbolic links, so a cloned repository can link a history folder or archive outside the project and have its headings served on the loopback port, or link a FIFO or `/dev/zero` to hang every poll. The fixed state files share this class; this adds reads a directory listing controls. Not reproduced.
**Suggested fix:** Skip entries that are not regular files and refuse a linked history folder, as `install.ts` does.
**Resolution:**

### F-109 [P3] open - The findings view is rendered by one long function

**File:** packages/create-religion/lib/dashboard.ts:746
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** `renderFindings` builds tiles, three charts, two chip bars, the table and the detail in about 70 lines of concatenation, against the short-functions standard; `renderWork` and `renderHistory` are similar.
**Suggested fix:** Split it the way the overview already is.
**Resolution:**

### F-110 [P3] open - An unused parameter and leftover CSS from the mockups

**File:** packages/create-religion/lib/dashboard.ts:735
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** `hbars` never reads `max`; `--heat-0` and `.steps.flat li` match nothing the page writes; and the check-list dot rules are redefined further down instead of merged.
**Suggested fix:** Drop the parameter and the unused rules, and merge the overrides.
**Resolution:**

### F-111 [P3] open - Spikes are counted as shipped

**File:** packages/create-religion/lib/state.ts:215
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** `HISTORY_KINDS` includes spikes, which never ship, so each spike raises the Shipped tile and the History count and lowers the commits-per-item average.
**Suggested fix:** Count spikes separately from shipped work.
**Resolution:**

### F-112 [P3] open - A wave marker lands in the step's description

**File:** packages/create-religion/lib/state.ts:186
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** A step marked `**Step 3 - x** (with 2) - ...` keeps `(with 2) -` at the start of its description, as archives 01 and 04a show.
**Suggested fix:** Strip the marker from the description, or expose it as its own field.
**Resolution:**

### F-113 [P3] open - The health contract in the spec omits questions

**File:** packages/create-religion/lib/dashboard.ts:108
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** The spec's contract lists `checks`, `config`, `install`, `tool` and `inbox`; the code and its test also carry `questions`.
**Suggested fix:** Name it in the contract line.
**Resolution:**

### F-114 [P3] open - Several parser tolerance branches are unpinned

**File:** packages/create-religion/lib/state.ts:177
**Found:** 2026-10-01 by audit (scope: current; lens: tests)
**Why it matters:** Mutations survived for list termination after a stray paragraph, an unbolded step in a spec, short commit hashes, unprefixed archive finding headings, a lens without a scope, the `.md` filter in `readHistory`, and the repair label match.
**Suggested fix:** Add one fixture line per branch.
**Resolution:**

### F-115 [P3] open - The 500 test relies on doctor throwing and on its message

**File:** packages/create-religion/lib/dashboard.test.ts:91
**Found:** 2026-10-01 by audit (scope: current; lens: tests)
**Why it matters:** Its only trigger is `runDoctor` failing on a skill tree that is a file, and it asserts `ENOTDIR`; hardening doctor to report that case would break the test and leave the guard untriggered.
**Suggested fix:** Assert only the 500 and a non-empty error, and say in the test why doctor throws there.
**Resolution:**

### F-118 [P3] open - Every poll re-reads and re-sends the whole history

**File:** packages/create-religion/lib/state.ts:244
**Found:** 2026-10-01 by audit (scope: current; lens: performance)
**Why it matters:** Archives never change, but each poll reads and parses all of them one at a time and sends their lessons and deferrals, which the page shows only for the selected one: 2.8 ms and 67 KB at 7 archives, 114 ms and 3.1 MB at 1007.
**Suggested fix:** Cache parsed archives by name and modification time, read independent files concurrently, and send lessons only when needed.
**Resolution:**

### F-121 [P3] open - Three lookup tables show inherited members as text

**File:** packages/create-religion/lib/dashboard.ts:698
**Found:** 2026-10-01 by audit (scope: current; lens: re-review of F-99 to F-117)
**Why it matters:** `GATES`, `CHECKPOINTS` and `ADAPTER_NAMES` are indexed by configuration and manifest text, so a value of `constructor` or `toString` shows native function source or `[object Object]` instead of the value. Nothing throws.
**Suggested fix:** Make them prototype-free, or check own properties before indexing.
**Resolution:**

### F-122 [P3] open - A poll that re-renders drops keyboard focus

**File:** packages/create-religion/lib/dashboard.ts:993
**Found:** 2026-10-01 by audit (scope: current; lens: re-review of F-99 to F-117)
**Why it matters:** Focus is restored only after a click; a poll that brings changed state re-renders every view and focus falls to the body, which happens whenever the activity record changes during a run.
**Suggested fix:** Remember and restore focus around `render()` itself.
**Resolution:**

### F-124 [P3] open - An older browser without AbortSignal.timeout never loads the page's state

**File:** packages/create-religion/lib/dashboard.ts:566
**Found:** 2026-10-01 by audit (scope: current; lens: re-review of F-123)
**Why it matters:** `AbortSignal.timeout` needs Safari 16, Chrome 103 or Firefox 100. On an older browser the call throws inside the request's `try`, so every poll reports "Disconnected, retrying" and nothing renders. A local dashboard is unlikely to meet one.
**Suggested fix:** Pass the signal only when `AbortSignal.timeout` exists.
**Resolution:**
