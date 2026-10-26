# create-religion

## 1.5.0

### Minor Changes

- 419f78b: A finding raised while a planned item is active is now headed with the item's number, such as
  `39a/F-1`, so items built side by side cannot hand out the same identifier. `religion status`,
  the handoff and the dashboard read prefixed and bare identifiers alike, so existing ledgers keep
  working, and the dashboard orders findings by their place in the ledger.
- 9d0c8ba: `religion status --json` gains `inFlight`, the work items active in any worktree of the
  repository, each with its worktree, branch, plan item, title, step counts and whether it is the
  one the command ran in. `religion status` lists items in flight elsewhere and passes over a plan
  item another worktree is building, and the handoff lists them too. Worktrees are read from git's
  own files, so nothing runs git, and a spec in another worktree is read only when it is a plain
  file inside that worktree.
- 76e2f5b: With items built in their own worktrees, `complete` now lands each one on top of whatever
  landed first: it merges the target without committing, takes the landed copy of the build plan,
  findings ledger, journal, overview and handoff, redoes the item's own tick, findings and journal
  entry, stops on any other conflict, and runs `Verify` again before committing the merge. A merge
  given up half way resets to the item's work commit and names everything it discarded.
- 4727989: A new setting, `workflow.parallelItems`, off by default, has `implement` start each planned
  feature in its own git worktree beside the project, on the item's branch, moving the spec there
  so the main checkout can spec the next item. `religion doctor` refuses the setting under
  `git.mode: trunk`, and inside a linked worktree names the main checkout and says where to copy a
  missing `.claude/settings.json` from.

## 1.4.0

### Minor Changes

- a15784b: With `workflow.parallelSteps` on, `implement` builds each wave step in its own detached git
  worktree outside the project and joins the steps' patches with one all-or-nothing `git apply`,
  stopping for review with the project unchanged when they do not apply. The commands live in the
  implement skill's `reference/worktrees.md`. The authority rules let a run remove the worktrees it
  created for a wave once that wave has joined; removing anything else still asks.

## 1.3.0

### Minor Changes

- 0731bce: For web work, `check` now scans each interface outcome for accessibility beside its browser
  evidence: with the project's own axe through its browser-test harness when it has one, and
  otherwise by reviewing the page's accessibility tree and keyboard focus. It reports violations per
  outcome, names the method and what it does not cover, records it in the Evidence section, installs
  nothing, and points anything serious at `audit`.
- 72cd015: `tests backfill` now offers to note each discrepancy it finds with `capture`, one line naming
  the file and what the code does instead of what it should, so the mismatch reaches the inbox
  that `fix` and `feature` read rather than being lost when the context is cleared. The failing
  tests stay as they are, and the skill never writes the inbox itself.
- 8ffa7af: `check` now records its verdict for each outcome, and what decided it, in an `## Evidence`
  section of the spec, stamped with the commit and whether the tree was clean, so the proof
  survives a cleared context and travels into the archive. `complete` reuses that record only
  when it names the current commit with a clean tree, and runs `check` again otherwise. The
  dashboard's Work view shows the section.
- ee85f1c: The workflow `ci` writes also runs `religion doctor --json` on every pull request, pinned to the
  installed major version, and fails the build for any failed check that blocks work or
  completion, such as a stale overview or invalid configuration. Advisory checks a runner cannot
  pass honestly, like `hooks` without a committed `.claude/settings.json`, appear as warnings. A
  doctor that prints no report fails the build.
- 02ba42a: In a project that uses Changesets, `complete` now drafts the finished item's changeset: the
  packages it touched, a proposed bump, and a summary written for the changelog's readers. It asks
  before writing when someone is there, and in an automated run writes the proposal and names it in
  the pull request for the reviewer to approve or change. An item that already has a changeset keeps
  it.
- 97e5ee0: The dashboard gains a Deferred view: every note each archive left under its Deferred
  heading, newest item first, each item linking to its archive in History. It is a record of
  what was set aside and why, not a to-do list, since an archive is never edited when a note
  is later done.
- 135f781: `religion doctor` checks every setting in the configuration reference with its type, not only
  the enumerated ones: booleans, branch prefixes, bounded integers such as
  `auto.maxRepairAttempts`, `auto.maxItems` (a positive integer or `null`), and the schema
  version. A failure names the key, the value it found, and what it accepts. Keys the reference
  does not name are still ignored.
- 6cd5493: A fourth Claude Code hook, `warn-on-drift.mjs`, asks before an edit to a file that neither the
  active spec's current step nor its Files and areas names, pointing at an amendment when the
  spec is what should change. The workflow's own state, changesets and rendered skill trees are
  always allowed, and it stays silent with no spec in progress. New installs wire it; on an
  existing project, `religion doctor`'s hooks check reports it until it is added to
  `.claude/settings.json`.
- c4bfb56: `distill` now reads the findings archived with each finished item as a second input. Where the
  same kind of finding has recurred across at least two different items, it proposes the
  coding-standard rule that would have prevented them, citing the findings, and waits for
  approval; each decided group is recorded so it is not proposed again.
- a346c2e: The handoff written at the end of each turn also says when the overview is stale, how many
  notes are waiting in the inbox, which findings are unverified, and when a recorded run is
  blocked, with the command that resumes it. Because every session loads the handoff, nothing
  free-form is copied into it from the activity record: only a skill name and a resume command
  that invokes that skill.
- 60f58ec: `religion doctor` gains a `hooks` check where Claude Code is installed: it confirms that
  `.claude/settings.json` registers each hook this version ships, under the right event, and
  that each hook's file exists, and names any that are missing with how to add them. Matchers
  you have tuned still count, and a settings file that is a link is not read. Since `update`
  never rewrites the settings, this is how a hook added by a later version gets noticed.
- 98c7c0e: `complete` now appends one entry to `religion/learning/journal.md` for every item it
  finishes, with what surprised, what went wrong, and what was deferred and why, so `distill`
  has something to read. `complete` is the journal's only writer: `distill` no longer moves
  entries out of it, and instead records what it decided about each one in
  `journal-archive.md`, skipping entries it has already decided on the next pass.
- 223f2e8: The dashboard gains a Learning view: the lessons every session loads, and the journal's
  entries, newest first, each marked waiting until `distill` has recorded a decision on it in
  `journal-archive.md`. `religion status` warns once five or more entries are waiting, which is
  when a `distill` pass is worth running.
- 1bb90fa: `religion doctor` gains an advisory `managed files` check, and the dashboard's Install panel
  a list, naming every installed skill or hook whose contents no longer match what was
  installed, and any that are missing. That is the list `update` will report as changed
  locally. Entry files are not compared, since `update` merges them, and a recorded path
  outside the skill and hook trees, or one that is a link, is never read.
- b4c6167: `check` now names the passing command-line and API outcomes that could become regression
  tests and, where a test command is declared, offers `tests evidence` to keep them. The new
  `evidence` mode of `tests` reads the spec's Evidence section, re-runs each capture, and writes
  one reviewed test per outcome, asserting the exit status and the stable parts of the output.
  Interface outcomes stay browser evidence.
- 68f41cd: A build-plan line that says `after item N` (or `after items N, M and K`) waits until those are
  ticked, and one that says `spike first` waits until a spike archive records `**For:** item N`
  and `**Settled:** yes`. `religion status`, `feature` with no argument, and `auto` take the first
  item that waits on nothing and name the ones passed over; when every remaining item waits on a
  spike, `status` points at `spike`. A reference to an item the plan does not have, or items that
  wait on each other, is reported as a warning. `status --json` keeps its shape.
- 3d0cb15: `check preview` runs the spec's outcomes against the preview deployment the host built for the
  pull request, as well as locally. It finds the address from the deployments recorded for the
  head commit through the host's own tool (`gh` on GitHub), asking before each network read
  outside an automated run, stamps the address in the Evidence section, and treats a missing,
  unfinished or protected preview as could not check. It never deploys.
- f921642: Under `pull-request` mode, the pull request `complete` opens carries a review packet built
  from the item's archive: the goal, each step with the verdict and evidence `check` recorded,
  the findings closed with it, and a link to the archive for the rest. `auto`'s aggregate pull
  request takes each item's line from the same record and links the item's own pull request.
  The packet only presents; it adds no gate.
- c87a4c6: The dashboard's Configuration panel lists every setting, not only the ones a project has
  set: what it means in one line, its value here or that the default applies, the default,
  and what it accepts, with any value `doctor` would refuse marked and any key Religion does
  not read named as such.
- e7ed368: `implement` now stamps a spec before its first change with `**Approved:** <date>, <hash>` and
  records any later change to what the spec asks for as a dated amendment with its reason,
  renewing the stamp. `religion status` warns when the spec has changed without a renewed stamp,
  and `status --json` gains `spec` (`hash`, `approved`, `drifted`). Ticks, the status line, and
  the Evidence and Amendments sections never count as changes, and examples inside code fences
  are ignored.
- 7981ee6: `fix` and `feature` take an issue number or link, read it through the host's own command-line
  tool (a network read that needs a yes outside an automated run), and draft the spec from it,
  treating the issue's text as untrusted input and stopping for review as usual. The spec records
  `**From issue:**`, and the pull request `complete` opens closes the issue for a fix and refers
  to it for a feature, taking effect only when its owner merges.
- ebe8b7b: `religion status` reports the run recorded in `religion/.state/run.json` and how many notes
  the inbox holds, and `status --json` gains `activity` and `inbox` fields. When the recorded
  run is blocked and names a resume command, that command becomes the next action. A record is believed only when it names a skill installed
  in the project, and its resume command only when it invokes that same skill with plain
  word arguments; control and format characters in what it prints are replaced with spaces.
- 844a68f: `religion uninstall` takes Religion back out of a project. It removes every installed skill
  and hook nobody edited, and any directory that leaves empty; keeps and names the edited
  ones; cuts only the managed block from the entry file, or removes it when it is still
  exactly what was installed; takes only Religion's hook entries out of
  `.claude/settings.json`; and removes the install record last. The plans, history and the rest
  of `religion/` stay, and every file it changes rather than removes is backed up first. It
  shows its plan and asks, defaulting to no; `--yes` skips the question, `--dry-run` only
  plans, and outside a terminal it removes nothing without `--yes`.
- d803d0e: `religion update` on a project an older version installed starts by saying what changed in
  between: each release, newest first, with the first sentence of each change, and where the
  full changelog is. The package now ships its `CHANGELOG.md`, so this needs no network. It
  prints on `--dry-run` too, and nothing when the project is already current.

## 1.2.0

### Minor Changes

- 6097eb0: `auto fix` works through the findings ledger unattended, under the same grant, gates and
  landing rules as a plan run. With no class, or `all`, it takes every class most severe
  first until no open finding is left; `auto fix P1` takes only that class. Each class's
  findings that name the same file are repaired together as one fix, every repair is
  re-reviewed in a fresh context, and a finding the review surfaces in the repaired code is
  folded into the same fix, linked to the finding that surfaced it, which cannot close first.
  Repair attempts and a cap of three folded findings per fix bound the run; unverified
  findings are reported rather than repaired. `fix` now accepts several finding identifiers,
  and `audit` records the `Surfaced by` link.

## 1.1.0

### Minor Changes

- 624001c: `religion dashboard` is rebuilt as an operational console with an overview and four views,
  following the system's light or dark theme and updating live. Work shows the active spec as
  written: its goal, every step with what it builds and when it is done, its scope and files.
  Findings charts the ledger by lens, by file and by the item that closed each one, and lists
  every finding in full with status and severity filters. History lists what shipped, with its
  commits, repairs, closed findings, lessons and deferrals, beside the plan. Health shows the
  activity record, doctor's checks, the configuration, the install and the inbox, and says
  when the project was installed by an older version than the one running. The page still
  loads nothing but its own data, under the same policy.
  
  `status --json` now reports the whole name of the next step in `work.nextStep`, such as
  `Step 3 - client`, where it was cut at the first ` - ` before. A dashboard that cannot read
  the project answers with the error instead of stopping.

## 1.0.0

### Major Changes

- 0794c6e: Religion 1.0. From this release the public surface is stable: a 1.x release will not remove,
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
  - **The dashboard answers only requests addressed to it.** A request whose `Host` is not its
    own `127.0.0.1` or `localhost` address and port gets a 403, so a tunnel that rewrites the
    host to another port is refused. Every response carries a content security policy, and
    the page loads nothing beyond its own data.
  - **`update` refuses a project a newer version installed**, and never writes through a
    symbolic link, even with `--force`.

### Minor Changes

- d175f26: The command-line tool refuses input it does not understand, and its exit codes and JSON
  output are fixed.
  
  Four changes are visible to anyone scripting against it:
  
  - **Unrecognised input is refused.** An unknown command, an unknown option, an option that
    does not apply to the command, or more than one directory now prints a usage error and
    exits 2 before anything is written. Previously an unknown option was ignored, so
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
- 5a7316a: A new `scout` skill proposes features to build next, grounded in what the codebase, the
  plans and the shipped history already contain. Run it as `scout`, `scout ambitious` or
  `scout super-ambitious`: normal suggests five low-risk extensions of what exists, ambitious
  three new capabilities that combine existing pieces or serve a new kind of user, and
  super-ambitious two bets that would change the product's direction, stack or deployment.
  Each idea names the files it builds on, its size and its risks. It writes nothing; the idea
  you pick goes to `feature`, whose intake proposes the plan line.
- 0787693: `setup` now drafts both plans from a repository that already exists, instead of describing
  the idea of doing so.
  
  Its frontmatter has always claimed an existing project "is surveyed so the plans and
  standards are generated from what is actually there". Behind the claim, the drafting step
  was fifteen lines of intent: derive problem, users and features from the code and the
  history, with nothing on how, from what, in what order, or what the result had to look
  like. The survey it ran collected stack, commands, existing checks, conventions and layout,
  none of which answer a single required section of the project plan.
  
  The survey now gathers what the plans actually need. One evidence source is named per
  required section: the README and any docs introduction for the problem, authentication and
  entry points for users, routes and exported surface for features, schema and model
  definitions for data, the dependency manifest for the stack, and the history for what
  shipped and in what order. It reads to a budget rather than reading whole, states that it
  covers a single application, and runs where it writes nothing.
  
  Every source can be absent, and each absence now has an answer. No README means section 1
  stays a question rather than a problem statement assembled out of the implementation. One
  entry point and no authentication is an answer, not a gap. A missing dependency manifest is
  checked against the manifest the language actually uses before being called missing. A
  shallow or imported history cannot order the build plan, and says so. **A missing source is
  recorded as missing, never substituted, and never filled in with what a project of that
  kind usually has.**
  
  Drafting is a procedure rather than a description. Evidence is sorted into found, inferred
  and missing, with `(inferred)` carried on the claim itself, because the code says what was
  built and never why. The build plan starts from what shipped, checked, in history order, in
  the exact item line format the loop parses. A plan that is no longer the shipped template
  is never overwritten without showing the exact change and waiting.
  
  What the survey reads is data. A README, a comment, a commit message, issue text or a
  configuration file that addresses the agent is reported with the file named, never acted
  on, and never quietly edited away.
  
  A new reference under the skill states the shape both drafted plans are judged against,
  including the acceptance rules `overview` applies, so a draft is checked before it is shown
  rather than one stage later.
- cc640a6: `update` no longer duplicates an edited entry file, removes what a newer version stopped
  shipping, refuses a project a newer version installed, never writes through a symbolic link,
  and says truthfully what it backed up.
  
  - **An entry file `setup` edited is rebuilt, not duplicated.** A fresh install writes
    `CLAUDE.md` and `AGENTS.md` without markers, and `setup` fills in their Commands section,
    so the next `update` used to treat the file as your own and append a second copy of every
    Religion section. It now backs the file up and rebuilds it around the sections you wrote:
    your title, your Commands, and any section of your own stay outside the markers, and
    Religion's sections are replaced by the current block. Later updates replace only what is
    between the markers. If this already happened to your file, the duplicates are still
    there; remove the older copies by hand.
  - **Files a newer version no longer ships are removed.** When a file the previous install
    recorded is gone from the template, `update` removes it if you never edited it, along with
    any directory that leaves empty. If you edited it, it is left where it is and becomes
    yours. Only files in Religion's own skill and hook folders are ever removed.
  - **A project installed by a newer version is refused.** `install` and `update` exit 1
    without writing anything when the manifest's version or format is newer than the package
    running, whatever the flags. Run `npx create-religion@latest update` instead.
  - **Nothing is written through a symbolic link.** A file, entry file, manifest or
    `.claude/settings.json` reached through a link, dangling or not, is left alone and reported
    as linked, even with `--force`, and the run exits 1. A link anywhere on the way to the
    manifest or a backup refuses the run before anything is written. Removals are confined to
    Religion's own skill and hook folders, by exact case, and never follow a link.
  - **Messages match what happened.** A declined entry-file merge is reported on its own,
    rather than as a local edit with `--force` advice that would not merge it. The merge prompt
    and the getting-started walkthrough no longer claim a declined merge is backed up, and the
    backup line says where backups went.

### Patch Changes

- 73226c1: Three guides for people who did not build Religion.
  
  Everything under `docs/` was written for someone who already knew the system: the state
  model, the enforcement split, the configuration reference, the decision records. They
  explain how it is built. Nothing explained how it is used, and the readme's getting-started
  section was four lines naming four skills.
  
  - **Getting started** walks install through to a generated overview, covering both branches
    `setup` takes, what the installer does when you already have a `CLAUDE.md` or `AGENTS.md`,
    what happens when a codebase's readme explains nothing, and the choice between committing
    the workflow files and keeping them local.
  - **What the loop actually feels like** walks one finished work item from spec to commit:
    the spec arriving before any code, the diff and evidence under each step, what the review
    options do, how progress survives a cleared context, what the findings ledger blocks, and
    what completion archives. Every artifact in it is quoted from a real file.
  - **What to do when doctor complains** covers every check, what each failure means, and the
    fix. Every failure was triggered deliberately and every fix was run and shown to clear it,
    which caught two that were wrong: `update` alone does not restore a working entry file,
    and deleting `config.json` makes the project invisible to the command-line tool rather
    than falling back to defaults.
  
  The readmes now point at these rather than half-repeating them, and the package readme's
  skill count is correct again.
- 195db9f: A repeated adapter option, such as `--claude --claude`, is recorded once. It used to be
  listed twice in the install summary and written twice into the manifest.

## 0.5.0

### Minor Changes

- 2fe62e1: The shell-command guard hook is removed.
  
  It asked before a push, merge, publish, deploy or recursive delete, and it matched how those
  commands are usually written rather than what they do. `bash deploy.sh` pushed and passed
  silently; so did a one-line script that deleted a tree. Meanwhile it asked about throwaway
  directories several times an hour.
  
  Adding patterns does not fix that. The next spelling is one substitution away, and a pattern
  broad enough to catch every script would ask about every script. A guard that catches the
  common spelling of a dangerous action and silently misses the rest is worse than no guard,
  because the gap is invisible to whoever is relying on the prompt.
  
  **Nothing about the Authority rules changed.** Merging, pushing, deploying, publishing,
  deleting data and rewriting history are still first tier and still need an explicit yes every
  time. That rule is carried by the prose loaded every session, which applies to all four
  supported tools rather than to one way of typing a command.
  
  Three hooks remain, all cases where a pattern can describe the thing being protected: a write
  into a rendered tree, content being read, and the end of a turn.

### Patch Changes

- 8148887: The first-tier guard hook no longer asks about `rm -rf`.
  
  The pattern caught the common spelling of a dangerous action and missed every other one:
  `find -delete`, a one-line script, or the same effect through any other tool all passed
  silently. Meanwhile it asked constantly about throwaway directories, which is most of what
  `rm -rf` is used for.
  
  A guard that catches one spelling and invisibly misses the rest is worse than no guard,
  because the person relying on it cannot see the gap. Deleting data is still first tier and
  still requires an explicit yes; that rule lives in the Authority prose, which applies to all
  four supported tools rather than to one way of typing a command.
  
  The enforcement reference now states plainly what these patterns match, and what they do
  not, so the hooks are not mistaken for a guarantee.

## 0.4.0

### Minor Changes

- 8eeb556: Installing into a repository that already has a `CLAUDE.md` or `AGENTS.md` now offers to merge
  instead of leaving the workflow unwired.
  
  Previously those files were reported as conflicts and left alone, which was safe and not much
  use: the skills and state landed on disk, but nothing told the agent that Religion existed.
  Replacing them was never an option, since an entry file someone wrote by hand is often the
  most carefully considered file in the repository.
  
  Everything you wrote stays exactly where it is. Religion's sections are appended inside
  markers, and a later `update` replaces only what is between them and never reads what is
  outside. Your own `Commands` section is left alone rather than overwritten with the
  placeholder, and the import lines live inside the block so new context files keep arriving.
  
  Decline and the file is untouched and reported as a conflict, exactly as before. The original
  is backed up under `religion/.state/backups/` either way.

## 0.3.0

### Minor Changes

- fe84621: Add `git.mode: pull-request`, a third way for finished work to reach the default branch.
  
  `complete` pushes the work item's branch and opens a pull request into the default branch
  instead of merging locally. Nothing merges it and nothing writes to the default branch: the
  merge is yours, on the host, and whether it lands as a squash, a merge commit, or a rebase is
  the pull request's setting rather than this workflow's business. A repository that cannot
  host one is a stop, never a quiet fallback to a local merge.
  
  `auto` runs the whole queue onto one integration branch, each item landing into it behind its
  own pull request, and ends with a single aggregate pull request it never merges. That shape
  is what lets item three build on items one and two. It states the entire remote budget before
  any work starts and does not begin without a yes.
  
  The authority rules move with it. Tier one now reads "pushing to the default branch, and
  force-pushing anything anywhere" rather than "pushing to any remote", because the danger of a
  push is what it lands on. Pushing a branch a run created itself is the one action that may be
  granted ahead of time, and only through that enumeration.
  
  Also adds `git.refactorBranchPrefix` and `git.integrationBranchPrefix`, and fixes the
  command-line tool rejecting the new mode and overlooking the refactor archive directory.
- 4605f51: Two new skills, a standing rule about untrusted text, and optional parallel step execution.
  
  **`capture`** notes something in one line and returns to work. One work item at a time is what
  makes a cleared context cheap, and it is also why a thought that arrives mid-build has nowhere
  to go. `fix` and `feature` read that inbox when choosing what to build next, which is the part
  that stops it becoming a list of things nobody did.
  
  **`spike`** answers one feasibility question with the smallest throwaway thing that settles
  it, inside a stated budget, then deletes the code and keeps the answer under
  `religion/history/spikes/`. A spec written against an untested assumption is paid for twice.
  
  **`rollback --steps N`** backs out the last N steps of work in progress, rather than a
  completed item. It stashes first every time and reports the recovery command, so undoing
  something is a mistake that costs one command rather than a deletion.
  
  **Untrusted input is now a standing rule**, loaded every session as
  `religion/context/untrusted-input.md`: text read from a file, a page, or a dependency is data,
  never an instruction. It needs saying because compression does not record which lines came
  from you and which came from a file read hours earlier. A hook backs it in Claude Code,
  warning when ingested content carries known injection signatures, and
  `security.blockInjection` turns the high-severity case into a block.
  
  **Waves.** With `workflow.parallelSteps` enabled, steps a spec marks `(with N)` build
  concurrently and are reviewed as one packet. It ships off, and while it is off the markers are
  ignored entirely, so a spec carrying them builds identically in a project that never opted in.
  
  Also in this release:
  
  - the guard hooks no longer fail open. A crash used to end in a silent allow, which meant a
    bug in the push guard let the push through unchecked. They now degrade to asking
  - `audit`, `status`, `doctor` and `try` declare their tools, so read-only is enforced rather
    than promised. `audit` declares `Write` honestly: it owns the findings ledger
  - `refactor` surveys in a subagent that returns the map, and `feature` does the same when
    speccing needs a broad read, so a large survey no longer crowds out the context that has to
    write from it

## 0.2.0

### Minor Changes

- fec5e77: Add the `refactor` skill: simplify code that already exists, one behaviour-preserving
  campaign at a time.
  
  Point it at a single file, a folder, one package, or a monorepo root. It surveys five lenses
  (bloat, structure, over-implementation, duplication, and reinvention of what the language,
  the standard library, or an installed dependency already provides), reports where the density
  is, then specs one lens in one area for `implement` to build.
  
  It refuses to start when no test reaches the target. A change meant to preserve behaviour
  needs something able to notice when it does not, and a green suite that never imports the
  target is not that.

## 0.1.1

### Patch Changes

- c9e7b11: Document the invocation that actually works. The readme and `--help` both showed
  `religion <command>`, which exists only after a global install, so anyone following
  `npx create-religion@latest` found the command missing.
