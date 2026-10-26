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

## 2026-10-21 - Verified outcomes become regression checks

**Archive:** history/features/28-verified-outcomes-become-regression-checks.md
**Surprised:** The plan line said check would keep the capture as a test, but check may not write source; the right split was check offering and tests writing, which the one-writer rule decided before any design did.
**Went wrong:** nothing
**Deferred:** Turning repaired findings into tests.

## 2026-10-21 - Plan lines that know what they wait on

**Archive:** history/features/29-plan-lines-that-know-what-they-wait-on.md
**Surprised:** The plan's own line for this item tripped the parser, since describing a syntax and using it look the same to a regex; running against the real plan found it before any test did.
**Went wrong:** Sub-items not inheriting their parent's wait would have defeated the feature for exactly the items it exists to hold back.
**Deferred:** Nothing beyond the fixed findings' review.

## 2026-10-21 - Recurring findings become standards

**Archive:** history/features/31-recurring-findings-become-standards.md
**Surprised:** This project's own archives already show the pattern the item looks for: findings about following a link recur across items 4b, 4d, 5 and 16, each repaired locally and none turned into a rule.
**Went wrong:** A template token was written into rendered state and caught by the verification suite.
**Deferred:** Running distill here.

## 2026-10-21 - Spec from an issue

**Archive:** history/features/33-spec-from-an-issue.md
**Surprised:** The untrusted-input rule already named issue text, so the safety half of this item was a pointer rather than new prose.
**Went wrong:** nothing
**Deferred:** Hosts without a command-line tool.

## 2026-10-21 - Spec amendments recorded

**Archive:** history/features/30a-spec-amendments-recorded.md
**Surprised:** Building the feature on its own spec found its gaps faster than any test: the missing hash source, the fenced example, and a scratch edit that silently did nothing.
**Went wrong:** A sed edit across a wrapped line did not apply and the check that followed looked like a failure of the code; confirm a scratch edit landed before reading its result.
**Deferred:** The drift hook, item 30b.

## 2026-10-21 - A hook that warns on drift

**Archive:** history/features/30b-a-hook-that-warns-on-drift.md
**Surprised:** A test that the hook allowed named files passed while the hook allowed everything, because every path looked outside the project; an allow test proves nothing without a deny test beside it run first.
**Went wrong:** The hook would have asked about a file this very item had to change, the uninstall tests, which is the drift it exists to catch, recorded as an amendment.
**Deferred:** Wave partners; wiring it in this repository's own settings.

## 2026-10-21 - Check the preview deployment

**Archive:** history/features/32-check-the-preview-deployment.md
**Surprised:** "One provider first" turned out to be the host rather than a provider: Vercel, Netlify and Render all publish previews to the pull request's deployments, so reading those covers all three.
**Went wrong:** nothing
**Deferred:** Hosts without deployments; protected previews.

## 2026-10-21 - Complete drafts the release note

**Archive:** history/features/34-complete-drafts-the-release-note.md
**Surprised:** Every automated run in this repository had been deciding bumps without saying so; the new rule writes down what those runs did by habit, and puts the decision in front of the reviewer.
**Went wrong:** nothing
**Deferred:** Other release tools.

## 2026-10-21 - Accessibility as evidence

**Archive:** history/features/35-accessibility-as-evidence.md
**Surprised:** The first run of the fallback, on Religion's own dashboard, found that the selectable items added two runs ago are invisible to a screen reader as controls; the dashboard had been checked by screenshot each time.
**Went wrong:** nothing
**Deferred:** F-160; a required-scan setting.

## 2026-10-24 - Waves built in isolation

**Archive:** history/features/27-waves-built-in-isolation.md
**Surprised:** The spike's clean answer hid most of the work: a shell routine an agent runs one command at a time, from wherever its directory happens to be, failed in ways no single run showed, and five rounds of independent review each found a smaller gap in what the last repair added.
**Went wrong:** `check` caught the untracked-file and untracked-link defects only on its second and third runs, and the completion audit found two P1s in the join, a subdirectory cwd and a pipe hiding a missing patch, either of which would have deleted step work.
**Deferred:** F-163 to F-178, F-180, F-182, F-186 and F-188 in the ledger; Windows; the other three tools' shells.

## 2026-10-25 - Finding identifiers scoped to their item

**Archive:** history/features/39a-finding-identifiers-scoped-to-their-item.md
**Surprised:** The dashboard had quietly assumed every identifier was `F-` followed by a number, reading `39a/F-1` as 0; only red-teaming the spec against the code caught it, since nothing tests the page script.
**Went wrong:** A "fails without the fix" check stashed the test along with the fix and proved nothing until redone.
**Deferred:** Prefixes for unplanned work, until item 39c.

## 2026-10-25 - Items in flight are visible

**Archive:** history/features/39b-items-in-flight-are-visible.md
**Surprised:** The spec planned to run `git worktree list`, but `verify` refuses `node:child_process` in shipped code because it backs the no-network promise, so worktrees are read from git's own files instead; nobody caught that while red-teaming the spec.
**Went wrong:** Reading another worktree's spec safely took six repair rounds: each fix for a symlinked spec (a hang on `/dev/zero`, a leaked heading, a race, a linked directory, whole-path resolution, Windows without `O_NOFOLLOW`) opened a narrower gap that the next independent review found, and the run stopped once on its repair bound.
**Deferred:** 39b/F-7 to F-15, all P3, including the handoff's next-up line not passing over items in flight and the two readers living in two copies.

## 2026-10-25 - Each item starts in its own worktree

**Archive:** history/features/39c-each-item-starts-in-its-own-worktree.md
**Surprised:** A shell routine an agent runs one block at a time cannot share variables between blocks; the check passed only because the test harness set them itself, and the audit, running each block in a fresh shell, found the routine did nothing past its first block.
**Went wrong:** Two repair rounds: the first made the copy block safe to repeat and so let a rerun put the stub over the moved spec; the second guarded that and, in turn, refuses a first run when the base commit carries an active spec.
**Deferred:** 39c/F-15 (P3) and 39c/F-11 behind it; Windows; landing items one at a time and removing their worktrees.


## 2026-10-26 - Items land one at a time

**Archive:** history/features/39d-items-land-one-at-a-time.md
**Surprised:** Taking the landed copy of each state file and redoing the share worked first time; nearly all the trouble was in giving up a merge half way, which the spec treated as a one-line `git merge --abort`.
**Went wrong:** Abandoning the merge took nine repair rounds. Each hand-built abort that staged, set back and cleared paths opened a narrower case the next independent review found; replacing it with one reset to the work commit, and finding what the reset removed by listing untracked files with git before and after, ended the chain.
**Deferred:** 39d/F-23 (P2) and 39d/F-31 (P3), ignored files a target starts tracking that block 1's merge overwrites; removing an item's worktree after it lands, which asks.


## 2026-10-26 - Runs that know their items

**Archive:** history/features/49a-runs-that-know-their-items.md
**Surprised:** The code was right first time apart from one gap: a held parent did not hold its sub-items, because `status` only offers leaves. Almost every later finding was in the skill prose, not the code.
**Went wrong:** The rule for when a run releases its items took four re-review rounds. Each version keyed it on the record's status, and each status turned out to fit some stop that still meant to resume; keying it on whether any named item is left to build ended the chain.
**Deferred:** 49a/F-20 (P2) waiting on 49a/F-21 and 49a/F-22 (P3), when the releasing write happens under `pull-request` and items already ticked; six P3s from the first audit; all for 49b, which rewrites how a run starts and stops.


## 2026-10-26 - Each run in its own worktree

**Archive:** history/features/49b-each-run-in-its-own-worktree.md
**Surprised:** Reusing the item routine for a run needed only one switch, but turning off its spec checks also turned off its only rerun guard, which the security review found by reverting a run's ledger and plan tick with a second copy.
**Went wrong:** The activity record's "first action" rule clashed with a run that moves: the first record landed in the main checkout holding the run's items and read as a phantom run from the worktree. Two repair rounds settled it by writing no items until preflight knows where the run runs.
**Deferred:** nine P2s for the next item or a fix, chiefly the run-mode rerun guard (49b/F-3), the inherited spec under ignored state (49b/F-4), the budget template's branch name (49b/F-5), adopting a pre-created worktree (49b/F-6) and per-item landing order (49b/F-11); 49a/F-6, F-10, F-21 and F-22 were repaired here but not yet re-reviewed.


## 2026-10-26 - A run catches up after another lands

**Archive:** history/features/49c-a-run-catches-up-after-another-lands.md
**Surprised:** The land-on-top routine needed no new code for a whole run, only a section saying the share is every item the run completed; the hard part was everything around the merge: which branch, which record, and what a rejected push leaves behind.
**Went wrong:** A throwaway test script failed midway and its later commands ran in the real repository, committing two blank lines that a forward commit removed; the proof was rerun behind a guard that refuses to run outside the scratchpad. 49c/F-2 took three repairs, the run stopping at its limit after two; the third, at the user's request, made a merge left on a stale branch a named stop whose reset is the person's.
**Deferred:** 49c/F-4, F-6, F-7 (P2: changes to existing findings dropped, the rename rule for run-level findings, block 3's failure path) and P3s including F-15, whether a refresh's push may be granted up front, which is the user's to decide in the Authority section.
