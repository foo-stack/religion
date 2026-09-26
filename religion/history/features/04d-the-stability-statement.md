# The stability statement

**Type:** Feature
**From build plan:** item 4d
**Status:** verified

## Goal

The last three items made the command-line surface strict, made `update` keep its promises,
and wrote the public surface into a record that the suite enforces. None of that is a
promise yet, because nothing tells a user what they can rely on. When this is done, a user
can read one document that says what is public and what is internal, what a 1.x update
guarantees and what it never touches, what counts as a breaking change, and which Node
versions are supported; a second document walks them through updating; the claims elsewhere
in the repository agree with both; a check fails if the statement stops naming something
the record promises; and a major changeset makes the next release 1.0.

## In scope

- Node 22 or later, as the project plan already says: `engines`, the getting-started guide,
  a CI matrix of 22 and 24, and the range recorded in the surface record
- `docs/stability.md`: public and internal, the three promises, what a 1.x update
  guarantees, what counts as breaking, minor and patch, and the Node policy
- `docs/upgrading.md`: updating a project, written from real runs, covering every outcome an
  update can report
- A verification check that the statement names every recorded command, option, skill,
  adapter, setting and the Node range, and one that the shipped code opens no network
  connection
- Correcting the claims the statement would contradict: stale counts, the OpenCode tree, the
  state model's omissions, and the release notes' versioning rule, which moves into the
  statement
- The documentation index, both readmes, and decision entries for what 1.0 settles
- A major changeset

## Out of scope

- **The open findings.** None blocks this item. The statement names the ones a user could
  meet as known limitations rather than fixing them here.
- **Publishing 1.0.** The changeset only proposes it; the version pull request and the
  publish are the user's.
- **Recording exit codes, state file formats and the manifest in the surface record.** The
  statement promises them in words, and they are pinned by the command-line tests and the
  upgrade check. Recording them as entries is a later change to the record.
- **Validating setting types in `doctor`**, and the record's use of the default's type for
  settings that are not enumerated (F-56). The statement describes settings from the
  configuration reference, which documents their accepted values.
- **A documentation site**, as before.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - Node 22 or later, checked** - raise the package's `engines` to `>=22`, add a
  matrix of 22 and 24 to the CI workflow, say Node 22 in the getting-started guide, and add
  the range to the surface record, derived from the package's `engines` by the surface
  check. *Done when:* `npm test` passes when run on Node 22.18 and on Node 24, and changing
  `engines` fails the surface check, shown by a temporary edit.
- [x] **Step 2 - the statement** - write `docs/stability.md` from `surface.json`: what is
  public (commands, options and exit codes, the JSON shapes, skill names and how they are
  invoked, adapters and the paths they install, settings and their values, where state
  lives and who owns it, the Node range), what is internal (skill wording and steps, the
  token vocabulary, adapter definitions, library modules, the dashboard's data, the
  verification checks), the three promises, what a 1.x update guarantees, what counts as
  breaking, minor and patch, and known limitations. *Done when:* every claim about
  behaviour cites the check, test or document that holds the code to it, and each is
  confirmed by reading that check.
- [x] **Step 3 - the upgrade guide** - write `docs/upgrading.md` from runs in a scratch
  project: running `update`, reading its summary, and every outcome it reports (updated,
  kept, conflict and `--force`, merged, rebuilt, removed, released, linked, declined,
  refused as newer), recovering from a backup, and what it never touches. *Done when:*
  every command shown was run and every quoted line of output appears verbatim in a
  captured run, with each outcome triggered at least once.
- [x] **Step 4 - checks behind the words** - a verification check that every command, option,
  skill, adapter, setting and the Node range in `surface.json` appears in
  `docs/stability.md`; and a second that the shipped code, the command-line tool and the
  hooks, imports no module that can open a network connection, the dashboard's loopback
  server excepted, since the statement promises that and nothing checks it today. *Done
  when:* both pass, adding an entry to the record without naming it in the statement fails,
  and adding a `fetch` call or a `node:https` import to a shipped module fails, each shown by
  a temporary edit.
- [x] **Step 5 - claims that agree** - correct the stale claims: twenty-two skills and nine
  checks in `README.md` and the entry sources, OpenCode reading either tree, the state
  model's missing paths and its claim that `CLAUDE.md` imports `AGENTS.md`, thirteen
  settings in the configuration reference, and the versioning rule in the release notes,
  which now points at the statement. Rebuild the rendered trees. *Done when:* each corrected
  claim is checked against the code or a count taken from it, and `npm test` passes with
  the rendered trees in sync.
- [x] **Step 6 - where to find it** - add both documents to `docs/README.md` and link them
  from `README.md` and the package readme; add decision entries for the settled promises,
  the Node policy, and the retired shell-command hook, which never got one. *Done when:*
  every file under `docs/` is in the index and every new relative link resolves.
- [x] **Step 7 - the major changeset** - add `.changeset/one-point-zero.md` as a major bump
  naming the stability statement and every breaking change since 0.5.0: Node 22, refused
  input and exit codes, the `doctor --json` shape, and conflicts and declined merges
  exiting 1. *Done when:* the changeset exists, names each, and `npm test` passes.
- [x] **Repair F-80 - the handoff hook never writes through a link** - the hook leaves the
  handoff unwritten when `religion`, `religion/context` or `handoff.md` is a symbolic link.
  *Done when:* a test running the hook against each link leaves the outside target intact,
  and a normal project still gets its handoff.
- [x] **Repair F-81 - a network check that holds** - each shipped file may import only a
  fixed allowlist, dynamic imports must be literal, the escape hatches are refused, every
  shipped extension is walked recursively, the dashboard's only allowed request is its own
  `/state.json`, and the dashboard page carries a content security policy. Also a test that
  the dashboard binds loopback and refuses a foreign host (F-87). *Done when:* every evasion
  the audit reported fails the check, shown by temporary edits, and the new tests pass.
- [x] **Repair F-83 - a linked settings file exits 1** - *Done when:* a scratch run with a
  linked `.claude/settings.json` exits 1.
- [x] **Repair F-82 - the statement and guide say only what is true** - correct the guide and
  the tool's hint about the settings template, and fix F-85, F-86 and F-88 in the statement,
  the guide, the changesets, the decision log and the overview, listing the settings
  template and a retired hook's wiring (F-84) as known limitations. *Done when:* each
  corrected sentence is checked against the code or a run.
- [x] **Repair F-81 - a network check that reads code, not text** - rebuild the check on the
  TypeScript parser, so comments and strings are never mistaken for code: module specifiers,
  run-time loads, forbidden globals, dangerous members, and `process` and the dashboard's
  `http` are judged on the syntax tree; the dashboard page's script is parsed too and may make
  only its one request, and its HTML may load nothing; every dashboard response goes through
  one helper that sends one exact security policy; `src/hooks` may hold only scanned file
  types, and every settings-template command must run one of them. Fix the broken sentence
  in the statement (F-95) and say what the check does and does not prove; the rewrite also
  removes the false positives (F-96). *Done when:* every evasion and accidental change
  reported so far fails the check, every reported false positive passes it, a test shows
  every dashboard response carries the exact policy, and the unmodified code passes.

## Files and areas

- `packages/create-religion/package.json`, `.github/workflows/ci.yml` - Node 22
- `packages/create-religion/surface.json`, `scripts/surface-current.ts` - the Node range
- `docs/stability.md`, `docs/upgrading.md` - new
- `scripts/verify.ts` - the statement check
- `README.md`, `packages/create-religion/README.md`, `src/entry/` and the rendered entry
  files, `docs/getting-started.md`, `docs/README.md`, `docs/decisions.md`,
  `docs/architecture/state-model.md`, `docs/architecture/config.md`,
  `docs/architecture/releasing.md`
- `.changeset/one-point-zero.md` - new

## Data and contracts

- **`docs/stability.md` and `docs/upgrading.md` are load-bearing** once published: they are
  the promise, and their paths become linked URLs. Neither is renamed later.
- **The surface record gains `node`**, the package's `engines` range, derived by the surface
  check like every other entry.
- **The versioning rule** lives in the statement from now on: removing or narrowing anything
  recorded is major; adding is minor; a fix that changes no recorded entry is patch;
  dropping a Node line after its end-of-life is minor.

## Testing

The gate is on: the entry file declares `Test: npm test` and `Verify: npm test`.

This item adds two checks, the statement check and the network check, each proved by
passing on the real code and failing on a deliberate break, as the other surface checks
were. The documents
are proved by reading: every behavioural claim traced to what enforces it, and every quoted
output traced to a captured run.

| Step | Evidence beyond `npm test` |
| --- | --- |
| 1 | the suite run on Node 22.18 and on Node 24; a changed `engines` failing the surface check |
| 2 | each claim traced to its check, test or document |
| 3 | every outcome triggered in a scratch project and every quoted line matched |
| 4 | an unnamed record entry, and a network call in a shipped module, each failing |
| 5 | each corrected claim checked against code or a count |
| 6 | the index complete and every link resolving |

## Notes for the agent

- **Branch.** Cut from `feature/compatibility-guards`, the tip of three stacked branches none
  of which is merged.
- **Promise only what is enforced.** Each behavioural sentence in the statement cites what
  holds the code to it. A promise nothing checks is a hope, and the point of the last three
  items was to stop making those.
- **Write the upgrade guide from runs**, as the other guides were: every quoted line
  captured, never transcribed from the source.
- **Say what is not promised plainly**: skill wording changes in any release, seeded files
  are never refreshed, and a user's settings file is never rewired.
- **Run the suite after every commit, bookkeeping included.** Twice in this plan a
  completion commit broke a check nobody ran.
- **Coding standards apply.** No em dashes, and no plan or item numbers in anything that
  lands in git, including the documents and the changeset.

## Outcome

Religion now says in writing what 1.x keeps stable, and the suite holds it to most of what
it says. `docs/stability.md` names the public surface and what enforces each part of it,
what is internal, the three promises about the repository, what an update guarantees and
never does, what counts as a major, minor or patch release, the Node policy, and the known
limitations. `docs/upgrading.md` walks through every outcome an update can report, quoted
from real runs. Node 22 or later is required, recorded, and tested in CI. A check fails
when the statement stops naming something the surface record promises, and another fails
when shipped code reaches for the network, now read by the TypeScript parser and held to a
committed corpus of every probe reviewers have tried. The claims elsewhere in the repository
agree, the decision log records what 1.0 settles, and a major changeset proposes 1.0.

Evidence behind it: `npm test` green on Node 22.18 and 24 (fourteen checks, 90 unit tests
including the 180-probe corpus, 158 routing cases); every document claim traced to its
check or test; every quoted output matched to a captured run; a two-lens audit and six
independent re-reviews.

### What went wrong on the way

**The statement promised more than the code held.** The audit found the handoff hook
writing through symbolic links, a linked settings file exiting 0, the guide sending users to
a settings template that update never refreshes, and a string of citations that did not
enforce what they cited. Each was fixed and re-reviewed; where a promise could not be held,
the statement now says so under known limitations.

**The network check took six rounds.** A denylist of spellings was evaded twenty ways; an
allowlist over source text was blinded by a glob string containing a comment opener and
flagged plain English; a parser-based rebuild still missed named imports, an unscanned
folder, responses outside the policy helper and a class extending `WebSocket`; the next
round found inline event handlers, dependencies and entry points. The run stopped twice for
a decision. The user chose to rebuild on the parser, then a final bounded round whose
closure rule was a committed probe corpus confirmed by a reviewer. It closed on that rule.

**Several slips were the agent's own.** A test harness truncated the files it meant to edit,
so some early results meant nothing until it was fixed and every probe rerun. A scripted
edit cut a source file at the wrong brace. An upgrade-check run orphaned a process for over
an hour. And one commit's message claimed a ledger change whose script had failed; the
following commit made the change.

### Deferred

- **F-97 (P2):** a symlinked directory inside a scanned folder can ship code the network
  check never reads. **F-98 (P3):** four package rules are guarded only in combination.
- **F-90 (P2):** the handoff hook still reads state files through links.
- **F-46 (P2):** hook wiring reads its template through a link.
- **The rest of the ledger**, none blocking, from this and earlier items.
- **Publishing 1.0** is the user's: the major changeset proposes it, and the version pull
  request and the release publish it.

## Findings

### 4d/F-80 [P1] closed - The handoff hook writes through symbolic links

**File:** src/hooks/write-handoff.mjs:82
**Found:** 2026-09-26 by audit (scope: current; lens: security, quality)
**Why it matters:** It writes `religion/context/handoff.md` with no link check, so a cloned repository linking that path, or either directory above it, elsewhere has the target overwritten at the end of every turn, partly with text the repository controls. Reproduced: an outside file was replaced. The statement promises the hooks write nothing outside the project.
**Suggested fix:** Leave the handoff unwritten when any component of its path is a link, and test it.
**Resolution:** Repaired 2026-09-26: the hook leaves the handoff unwritten when `religion`, `religion/context` or `handoff.md` is a link; `scripts/hooks.test.ts` runs the real hook against each and the outside target stays intact, and two of its three tests fail against the unguarded hook. Re-reviewed 2026-09-26 in a fresh-context adversarial pass: links at each component left the outside target intact, a linked project root wrote only inside the real project, and the other two hooks write only to standard output. Closed; a hard link and the check-to-write race remain, neither reachable from a git clone.

### 4d/F-81 [P1] closed - The network check can be evaded

**File:** scripts/promises.ts:45
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** It denies a list of spellings over part of what ships, so a computed dynamic import, `createRequire`, `child_process` running curl, a stored `fetch`, `process.binding`, a worker, `http["request"]`, a protocol-relative `fetch("//evil.example")` in the dashboard page, an `<img>` pixel, a subdirectory under `lib/`, or a `.cjs` hook all passed it. The shipped code is clean today, but the check cannot catch a regression, and the statement cites it.
**Suggested fix:** Allow only a fixed set of imports per file, reject non-literal imports and the escape hatches, walk every shipped extension recursively, and give the dashboard page a content security policy.
**Resolution:** Repaired 2026-09-26: the check is now an allowlist of seven module names, with `node:http` for the dashboard alone; it strips block comments, refuses any Node module named anywhere outside the list, any computed or unlisted run-time load, and `fetch`, `WebSocket`, `EventSource`, `XMLHttpRequest`, `sendBeacon`, `createRequire`, workers, `eval`, `Function`, `globalThis` and other global lookups, and the native bindings; it walks every code extension recursively; the dashboard may use only its server and must send a content security policy confining the page to its own server, and its page's only allowed request is its own data. Twenty-two evasions, including every one reported, each failed it in a scratch copy, and the unmodified code passes.  Re-reviewed 2026-09-26: coverage confirmed (everything that ships as code is walked) and no false positives, but evasions were not tested independently, so it stays fixed pending that. Re-reviewed adversarially 2026-09-26: not closed; `process.getBuiltinModule("net")`, a constructor chain reaching the global object, and `(http).get` in the dashboard each opened a real connection past it. Repaired again 2026-09-26 (the second and last attempt): `getBuiltinModule`, `constructor` and `mainModule` are refused, `process` may be used only through the seven members the tool uses, and the dashboard may mention `http` only in its import, its three server members and its own address; every evasion found so far, 31 in all, fails the check in a scratch copy and the unmodified code passes. The statement now says the check guards against accidental change rather than proving the absence of deliberately hidden code, which is left to review. Re-reviewed 2026-09-26 against the scoped claim: not closed, and the repair attempts are spent. Every reported evasion is caught, but plausible accidental changes still pass: a string containing `/*`, such as a glob, makes the comment stripping swallow the file up to the next `*/`, hiding a real `fetch` added to `doctor.ts`; the page policy is checked only for two phrases, so loosening it for fonts or badges passes, as does a second HTML route with no policy; hooks in other file types and the settings template's commands are not scanned. The rules also flag ordinary words in strings and trailing comments. A regex over source text is the wrong tool; the suggested direction is the TypeScript scanner for comments and strings, an exact policy on every HTML response, and hooks restricted to scanned file types. Repaired a third time 2026-09-26, with the user's approval after the run stopped: the check is rebuilt on the TypeScript parser, so comments and strings are never read as code. Module specifiers, run-time loads, forbidden globals and members, and uses of `process` and the dashboard's `http` are judged on the syntax tree; the dashboard page's script is parsed and may make only its one request, its HTML may load nothing, and every response goes through one helper sending one exact policy; hooks must be files the check reads, and every settings-template command must run a shipped hook. In a scratch copy, 44 evasions and accidental changes, including every one reported, each failed the check; a 45th, an import-equals, crashed the suite before the check ran and is seen by the parser; all 13 reported false positives pass; and the unmodified code passes. Re-reviewed 2026-09-26: not closed; named or namespace imports of `node:http` in the dashboard, a relative import into an unscanned package folder, responses written outside `send`, and `class extends WebSocket` each passed. Repaired again 2026-09-26: the dashboard may import `node:http` only as its default `http`; a relative import must reach a scanned, non-test file; every response member is allowed only inside `send`, which must carry the policy, and only `PAGE` may be served as HTML; a class's `extends` is read as the running expression it is; page scripts with attributes, markup strings able to load or navigate, `.src` and `.href` assignments and string timers are refused; install-time package scripts and non-command hook entries are refused; `require` and `setEngine` members are refused. Against the reviewer's own 116 probes, all 39 earlier evasions and 39 of 40 accidental changes are caught (the 40th, binding every interface, is not outbound and fails the dashboard test), 21 of 24 legitimate patterns pass (a local `global` or `process` and `location.reload()` stay flagged by choice), and the four structural passes do not ship. Re-reviewed 2026-09-26: not closed. All 39 earlier evasions and 39 of 40 earlier accidental changes stay caught, but three new classes pass: inline event handlers in the page HTML (a handler calling `window.open` navigated away in a real browser under the exact policy); package dependencies, which are not checked at all, so a dependency's install script would run despite the statement; and entry points outside the hardcoded roots, which would be read by nothing if package.json or the tsconfig added one. Six imprecise false positives were also found (`http.STATUS_CODES`, `process.stdout.write` in the dashboard, `declare global`, a JSON import, the string `"node: "`, `export type` from `node:http`). Final bounded round 2026-09-26, with the user's approval: inline event handlers and page script tags the check cannot parse are refused; the package may declare no dependencies of any kind, no install-time script, entry points only in `dist/bin`, and publish only the compiled output, the template and two documents, and the build may compile only the folders the check reads; `send` may set only its type and the policy; the settings template may set only hooks; and the six imprecise flags are fixed. All 180 probes from the last two reviews are committed as `scripts/fixtures/network-probes.json` with the verdict each must keep, 139 caught and 41 clean, and `scripts/network-probes.test.ts` replays them; dropping `fetch` from the forbidden list made 13 of them fail. By the user's decision, F-81 closes when that corpus passes and a reviewer confirms it; a gap found later is a new finding. Re-reviewed 2026-09-26 against the closure criteria the user set: the corpus test and `npm test` pass; all 180 probes match both review harnesses exactly and every one of the 41 clean verdicts is legitimate code, does not ship, is not outbound, or is a named known limitation; the three classes and the smaller gaps from the previous review are each caught by the intended rule; relaxing any of seven single rules fails the corpus test; and the statement matches the check. Closed; a symlinked directory and four rules covered only in combination are F-97 and F-98.

### 4d/F-82 [P1] closed - The update guide says a new hook reaches the settings template, which update never refreshes

**File:** docs/upgrading.md:196
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** `religion/.state/settings-template.json` is under `religion/`, so it is seeded once and never updated; the guide and the tool's own hint send users to merge a stale file. This repository's own template still wires the hook removed in 0.5.0.
**Suggested fix:** Correct the guide and the hint, and list it as a known limitation.
**Resolution:** Repaired 2026-09-26: the guide now says the settings template is seeded once and never refreshed and points at a fresh install instead; the tool's hint says the same, recaptured from a run; and the statement lists it under known limitations. Re-reviewed 2026-09-26 in a fresh-context adversarial pass: the guide, the statement and the tool's hint are true, and the hint matches a real run for both the existing and the linked case. Closed.

### 4d/F-83 [P1] closed - A linked settings file exits 0 though the statement and changesets say 1

**File:** packages/create-religion/bin/religion.ts:216
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The linked branch of hook wiring prints a message but sets no exit code, contradicting the statement's exit table, the major changeset and the pending update changeset.
**Suggested fix:** Exit 1 there, as every other linked file does.
**Resolution:** Repaired 2026-09-26: the linked branch now sets exit code 1; a scratch update with a linked `.claude/settings.json` printed the linked message, exited 1, and wrote nothing through the link. Re-reviewed 2026-09-26 in a fresh-context adversarial pass: `update` and `install` with a linked settings file exit 1 with the target unchanged, and an ordinary existing one exits 0. Closed.

### 4d/F-85 [P2] closed - The statement overstates who owns the entry files

**File:** docs/stability.md:133
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** A fresh install writes them without markers, so until the first update or merge the file is Religion's, and the one-time rebuild drops edits inside Religion's sections and any import lines the user added.
**Suggested fix:** Qualify the row.
**Resolution:** Repaired 2026-09-26: the row says the entry files are Religion's until the first update or merge, and what the first rebuild keeps and what survives only in the backup. Re-reviewed 2026-09-26 in a fresh-context adversarial pass: a scratch rebuild kept the edited title, a Commands line and an added section, and left an added import line and an edit inside a Religion section only in the backup, exactly as the row says. Closed.

### 4d/F-86 [P2] closed - The settings row claims the record holds values it does not

**File:** docs/stability.md:123
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** Only seven enumerated settings have recorded values; the rest are recorded by their default's type, so ranges, formats and even booleans are unchecked, and `doctor` accepts `"parallelSteps": "yes"`.
**Suggested fix:** Say exactly what is recorded, and widen the known limitation.
**Resolution:** Repaired 2026-09-26: the settings citation says exactly what is recorded and checked, and the known limitation names booleans, ranges and formats. Re-reviewed 2026-09-26 in a fresh-context adversarial pass: `doctor` failed an unknown `git.mode` and passed a string boolean, an out-of-range number, a bad prefix and a negative limit, as the row and the limitation say. Closed.

### 4d/F-87 [P2] closed - Nothing tests that the dashboard binds loopback or refuses a foreign host end to end

**File:** packages/create-religion/lib/dashboard.ts:27
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** Only the pure host check is tested; binding every interface and skipping the check both passed the suite, though the statement cites the dashboard's tests.
**Suggested fix:** Start the dashboard in a test and assert its address and a foreign host's 403.
**Resolution:** Repaired 2026-09-26: a test starts the real dashboard and asserts it is bound to 127.0.0.1, answers a foreign host with 403, serves its own host, and sends the page's content security policy. Re-reviewed 2026-09-26 in a fresh-context adversarial pass: binding every interface, binding `0.0.0.0`, skipping the host check and removing the policy header each failed the dashboard test. Closed.

### 4d/F-88 [P3] closed - Smaller inaccuracies in the statement and its companions

**File:** docs/stability.md:29
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** The statement and the command-line changeset still say "read or written"; the exit table's citation says the help lists the same meanings when it omits two; a dry run exits 0 with conflicts planned, unsaid; the `religion/` row ignores created and rewritten state; decision 100 overstates what the statement check checks; the overview stamp's parsing is cited but untested; the major changeset omits the dashboard's host check; the guide claims every line is quoted when some are omitted; the breaking-change table leaves marker text and state formats unclassified and calls skill changes minor while calling them internal; and the generated overview still counts ten checks.
**Suggested fix:** Correct each.
**Resolution:** Repaired 2026-09-26: each inaccuracy corrected, in the statement, the guide, both changesets, the help text and readme, the decision log and the overview's code map. Re-reviewed 2026-09-26: not closed, since the stamp citation pointed at a check that compares types only, and breaking the stamp parser passed the whole suite. Repaired again 2026-09-26: a state test now reads matching, stale and missing stamps through `readProjectState`, fails on that same broken parser, and the statement cites it. Re-reviewed 2026-09-26: a broken stamp pattern fails the new state test, which passes unmodified. Closed.
