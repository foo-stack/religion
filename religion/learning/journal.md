# Journal

> **Generated file.** Raw observations appended as work happens: what went wrong, what was
> surprising, what a correction revealed. Not loaded into context. `distill` reads
> it, promotes what has proved stable into `lessons.md`, and archives what it processed.

## 2026-09-05 - carried over from the build

Written down when this project stopped keeping a separate progress file. These are the
observations from building Religion that were worth more than the record they sat in.

**Silent wrong results come from paths nobody exercised, not from code nobody read.** Five
bugs were found by running things end to end rather than by reading them, and the two worst
produced no error at all: the update manifest recorded on-disk hashes rather than what was
installed, so conflict protection worked exactly once and then overwrote the edit it had
preserved; and the renderer's directory walk skipped every dot-entry, so `.state/` and its
settings template rendered without error and were absent from every install. The other three
were a hook that stripped real blank lines along with conditional ones, state files being
re-rendered over a project's real work, and a plan parser that counted the template's own
worked examples as plan items.

**The npm registry lags a publish, and the gap looks exactly like failure.** A publish
reported success and the version became readable about 76 seconds later, once over five
minutes. Reading inside that window returns the previous version. This produced a confident
and entirely wrong diagnosis, built on a single stale read, that only collapsed when the
staging list disproved it. Re-read with cache busting before concluding anything about a
publish.

**A green check is not evidence that the check ran.** A verification step once reported
"typecheck clean" while typechecking a file that had never been written, because the heredoc
that should have created it had failed. Every check added since has been deliberately broken
to confirm it fails, and that habit has caught two checks that could not fail.

**Version pull requests arrive with no checks.** A pull request opened with the default token
does not trigger workflows, so the required check never appears and merging needs an admin
bypass. This is settled and accepted here, not a problem to solve.

**Documentation drifts from the thing it documents, quietly.** The enforcement reference
described four hooks when there were three, advertising a mechanism that had no file and was
wired nowhere. Two configuration settings shipped undocumented. Both classes now have a
verification check, and both were found by hand first.

## 2026-10-21 - A journal that something writes

**Archive:** history/features/07-a-journal-that-something-writes.md
**Surprised:** The journal had one entry, carried over on 2026-09-05, and nothing since: the learning loop was complete except for its input, and nothing reported that it was idle.
**Went wrong:** A sentence in distill still implied it edits the journal after the rewrite, caught only by reading every grep match rather than counting them.
**Deferred:** Entries for items finished before this one, since their archives already record the same.

## 2026-10-21 - Learning made visible

**Archive:** history/features/08-learning-made-visible.md
**Surprised:** The audit measured the new parsers before judging them: a 120,000-line journal parsed in 38 ms, which settled the cost question with a number instead of an argument.
**Went wrong:** The heading pattern used `\s`, which crosses newlines, a mistake the spec parser's own comment already warns about; reading the neighbouring parser's comments first would have avoided it.
**Deferred:** Matching entries on their archive line as well as their heading, and ignoring code fences, both rare enough to leave as P3 findings.

## 2026-10-21 - Locally modified managed files

**Archive:** history/features/09-locally-modified-managed-files.md
**Surprised:** This repository's own install record is from 0.5.0, so the first real run of the check named six edited skills: the rendered trees here are built, never installed, and the manifest has not followed them.
**Went wrong:** An advisory check could still crash doctor through an unguarded read, and the first test encoded the wrong answer for a symlink rather than catching it.
**Deferred:** Showing what changed inside an edited file.

## 2026-10-21 - Doctor checks every documented setting

**Archive:** history/features/10-doctor-checks-every-documented-setting.md
**Surprised:** The surface record already carried a type for every setting, built from the shipped defaults, so a schema existed in three partial copies before this item made it one.
**Went wrong:** The verification check was written to the spec's wording but not its aim; only planting a drift and watching it pass showed the gap. A check is proved by a case it fails on, not by passing.
**Deferred:** Flagging keys the reference does not name.

## 2026-10-21 - Documentation checked against the public surface

**Archive:** history/features/11-documentation-checked-against-the-public-surface.md
**Surprised:** Twenty-six documents and forty relative links held no mistake at all, so the value of the check is entirely in what it will catch next.
**Went wrong:** Nothing beyond a trailing slash in a fixture; a check that passes first time needed a planted failure before it counted as evidence, the same lesson the settings check taught one item earlier.
**Deferred:** Running the tool to compare exit codes, and external links.

## 2026-10-21 - Everything deferred, in one place

**Archive:** history/features/12-everything-deferred-in-one-place.md
**Surprised:** The page's script is forbidden from writing any `href`, so even an in-page anchor has to be static markup; the network check reads the script's string literals.
**Went wrong:** A checkpoint was committed on a failing suite because `npm test | grep ... && git commit` takes grep's exit status, the same slip archive 05 records twice. Gate commits on the test command's own exit code, never on a filtered pipe.
**Deferred:** Marking deferred notes as done.

## 2026-10-21 - Doctor confirms the hooks are wired

**Archive:** history/features/13-doctor-confirms-the-hooks-are-wired.md
**Surprised:** This repository's own Claude Code settings have never wired the injection scan, and its seeded settings template is from 0.5.0, so the seed-once rule had quietly left the project that builds Religion without one of its own hooks.
**Went wrong:** Comparing against the project's seeded copy instead of what the package ships, and matching commands as exact strings; running the check on a real, old project caught the first, the audit the second.
**Deferred:** Writing missing hook entries for the user.

## 2026-10-21 - Update shows what changed

**Archive:** history/features/14-update-shows-what-changed.md
**Surprised:** The network check governs which files the package may publish, not only what code runs, so shipping a markdown file was a change to the promise's allowlist.
**Went wrong:** The commit gate worked as intended this time: the red suite stopped the commit, where two items earlier a filtered pipe had let one through. A read-only reviewer still ran a stash and pop; reviewer prompts should forbid git commands that touch the working tree.
**Deferred:** Prerelease notes.

## 2026-10-21 - Settings explained in the dashboard

**Archive:** history/features/15-settings-explained-in-the-dashboard.md
**Surprised:** Item 10's schema made this item small: one field per setting and one function, because the kinds, ranges, defaults and the reference's wording already lived in one place.
**Went wrong:** A display case the reference table never exercised, a range with one value, only showed up on the real page; looking at the rendered output caught what the tests did not ask about.
**Deferred:** Editing settings from the page.

## 2026-10-21 - A clean way out

**Archive:** history/features/16-a-clean-way-out.md
**Surprised:** The first destructive command in the tool needed the review more than any item before it: one P1 and two P2s, each a way to touch something the plan never meant to, and each reproduced by the reviewer on a throwaway project.
**Went wrong:** Reused helpers carried assumptions that suit reading and not deleting: a root found by walking up, a link check on a folder but not its contents, a plan treated as still true at the moment of removal.
**Deferred:** Removing `religion/` itself.

## 2026-10-21 - Evidence that outlives the session

**Archive:** history/features/17-evidence-that-outlives-the-session.md
**Surprised:** The archive needed no change at all to keep the evidence: putting the record in the spec made the existing archive step carry it.
**Went wrong:** Test counts were typed from memory twice in a row and were wrong both times; numbers in a record should be copied from the output that produced them, never recalled.
**Deferred:** Per-step evidence from implement.

## 2026-10-21 - A handoff that tells the whole story

**Archive:** history/features/18-a-handoff-that-tells-the-whole-story.md
**Surprised:** The handoff is imported into every session, which makes the hook that writes it an injection path into always-loaded context; that was the deciding fact for what it may copy.
**Went wrong:** Unverified finding titles were copied verbatim, the least trusted text in the ledger, until the audit planted bidi and escape characters and a 3,000-entry ledger.
**Deferred:** Refreshing this repository's own ignored hook copy.

## 2026-10-21 - Backfill discrepancies kept

**Archive:** history/features/19-backfill-discrepancies-kept.md
**Surprised:** nothing
**Went wrong:** nothing
**Deferred:** nothing

## 2026-10-21 - CI runs doctor

**Archive:** history/features/20-ci-runs-doctor.md
**Surprised:** The `blocks` field doctor already reported for ordering its output turned out to be exactly the line between what a runner can and cannot check.
**Went wrong:** nothing
**Deferred:** Running doctor in this repository's own workflow.

## 2026-10-21 - A review packet for the pull request

**Archive:** history/features/24-a-review-packet-for-the-pull-request.md
**Surprised:** Item 17 had already done the real work: once evidence lived in the archive, the packet was a matter of reading it out.
**Went wrong:** nothing
**Deferred:** nothing
