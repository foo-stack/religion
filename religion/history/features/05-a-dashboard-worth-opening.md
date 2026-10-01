# A dashboard worth opening

**Type:** Feature
**From build plan:** item 5
**Status:** verified

## Goal

The dashboard is four generic cards over a status summary: it says what to run next and
little else. When this is done, `religion dashboard` opens a designed operational console
with an overview and four detail views. Work shows the active spec as it is written: its
goal, every step with what it builds and when it is done, scope, and files. Findings shows
analytics over the ledger and every finding in full. History shows the plan and each
shipped item with what it cost and what went wrong. Health shows the live activity record,
doctor's checks, the configuration, the install and the inbox. It does this inside every
rule the stability statement already promises for the page, follows the system's light or
dark theme, and updates live.

## Design reference

The approved static mockups under `prototypes/`, all sharing `prototypes/theme.css`:

- `prototypes/overview.html` - the primary screen
- `prototypes/work.html`, `prototypes/findings.html`, `prototypes/history.html`,
  `prototypes/health.html` - the detail views

`theme.css` is the source of truth for colour, type, spacing and the shared components. The
mockups are throwaway: Step 5 ports the theme into the page before any view is built on it,
and the last step deletes the folder, as the user approved.

Decided with the user before the run: all five screens are built as drafted, and the next
action shows the bare skill name (`implement`) rather than one adapter's syntax.

## In scope

- `/state.json` gains the data the views need: the active spec in full, each finding's
  file, origin, lens and text, every archive under `religion/history/`, doctor's checks,
  the configuration, the install record, the tool's version and the inbox
- `parseWork`'s `nextStep` keeps the whole step name, which closes the inbox note about its
  truncation
- A failed read answers with an error rather than crashing the server (F-10), since this
  item multiplies the reads behind `/state.json`
- The dead `historyCount` export and its import go (F-09), replaced by the history reader
- The page: the ported theme, a rail with five views, the overview, and the four detail
  views, with empty, loading and disconnected states
- A minor changeset

## Out of scope

- **Anything the page cannot know without running git.** Step commit hashes, branch, head
  and landing dates appear in the mockups but would need `child_process` or reading `.git`,
  which the network check refuses and the outside-the-repository promise argues against. The
  views show what the state files hold.
- **Which managed files changed since install.** Hashing paths taken from the manifest
  would read wherever the manifest points; the Health view shows the count only.
- **Descriptions of each setting.** The Health view lists settings and values; what they
  mean stays in `docs/architecture/config.md`.
- **The rest of the ledger.** F-03 and the other dashboard-adjacent findings stay open.
- **Any change to the policy, the host check, or what the network check allows.**

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the spec, in full** - `parseSpec` in `state.ts` reads the active spec's
  goal, in-scope and out-of-scope lists, files, and every step and repair with its label,
  title, description, *Done when* and tick; `parseWork`'s `nextStep` keeps the full bold
  name; `/state.json` gains `work`. *Done when:* tests over a spec in the template's shape,
  an empty spec, and a hand-mangled one pass, `nextStep` reads `Step 3 - client`, and
  `npm test` passes.
- [x] **Step 2 - findings in full** - `parseFindings` also reads each finding's file, when
  and how it was found, its lens, why it matters, the suggested fix and the resolution,
  tolerating the variant `Found` line a finding raised while building carries. *Done when:*
  tests cover a full entry, a bare heading, and the variant line, and the 68 entries in this
  repository's ledger each parse with a file.
- [x] **Step 3 - history** - `parseArchive` reads one archive's number, title, kind, status,
  step and repair counts, commits, closed findings, what went wrong and what was deferred;
  the dashboard reads every archive under the five history folders, replacing
  `historyCount` and its unused import (F-09). *Done when:* tests cover a full archive, one
  with no `Landed` or `Findings` section, and the folder README being skipped, and this
  repository's seven archives parse with 62 commits and 30 closed findings between them.
- [x] **Step 4 - health, and a read that cannot crash** - `/state.json` gains doctor's
  checks, the configuration, the install record's version, adapters and managed count, the
  tool's version passed in by the command, and the inbox parsed into dated notes; a failure
  building the response answers 500 with a JSON error instead of an unhandled rejection
  (F-10). *Done when:* an inbox parsing test passes, the dashboard test asserts the
  response's top-level keys and a 500 when state cannot be read, and `npm test` passes.
- [x] **Step 5 - the theme and the shell** - port `prototypes/theme.css` into `PAGE`; build
  the rail with the five views switched by `:target`, so links, the back button and a
  reload work with no script reading the address; the live indicator, the loading and
  disconnected states, and the tool's version. Until Step 6 the overview shows the next
  action, as the old page did, so the page stays useful between steps. *Done when:* the page
  renders the rail and switches views against this repository in light and dark, shown by
  screenshots, a stopped server shows as disconnected, and the network check passes.
- [x] **Step 6 - the overview** - the next action, the five tiles, Active work, the findings
  matrix and oldest unresolved, the plan, activity and health, and recently shipped. *Done
  when:* a screenshot against this repository shows every panel filled from its state files,
  and one against a fresh install shows each panel's empty state rather than a blank.
- [x] **Step 7 - work** - the spec view: tags, tiles, goal, step cards with the next one
  highlighted, scope, files, and how the work is built. *Done when:* a screenshot against a
  project with this spec in progress shows every step's description and *Done when*, and
  the view says plainly when nothing is in progress.
- [x] **Step 8 - findings** - tiles, the lens, file and per-item analytics, the ledger with
  status and severity filters, and the selected finding's detail. *Done when:* screenshots
  show the analytics against this repository's ledger, a filter narrowing the table, and a
  clicked row filling the detail panel.
- [x] **Step 9 - history** - tiles, the shipped table, the build plan, and the selected
  item's detail. *Done when:* a screenshot shows the seven archives and a clicked item's
  lessons and deferrals.
- [x] **Step 10 - health** - the update notice when the install is older than the tool,
  the activity record, doctor's checks, the configuration, the install and the inbox. *Done
  when:* a screenshot against this repository shows the notice for its 0.5.0 install, and
  one against a fresh install shows none.
- [x] **Step 11 - land it** - the changeset, and `prototypes/` deleted now its theme lives
  in the page. *Done when:* `npm test` passes and nothing references `prototypes/`.
- [x] **Repair F-99, F-116, F-117 - polling that cannot stall** - match a finding's lens
  from its last opening parenthesis, anchor `parseWork`'s step pattern to spaces and tabs,
  and schedule the page's next poll when the current one finishes. *Done when:* a test
  parses a 320,000-character `Found` line and a spec of 80,000 blank lines in well under a
  second each, and the page never has two requests in flight.
- [x] **Repair F-101, F-102, F-107 - the page says what it shows** - order "Oldest
  unresolved" by identifier, return focus to the picked row or filter after it re-renders,
  and key the page's tallies on prototype-free objects. *Done when:* the overview lists
  the lowest identifiers, a keyboard pick keeps focus on the row, and a finding filed
  under `constructor` renders every view.
- [x] **Repair F-99, F-119, F-120 - nothing can stall a poll** - match the lens without two
  patterns competing for the same spaces, keep the step separator on its line, and release
  the poll after ten seconds even if its request never answers. *Done when:* the timing
  test also covers a long run after `lens:` and inside a step line, two plain steps count
  as two, and the network check passes.
- [x] **Repair F-123 - an abandoned poll cannot land late** - cancel a request that has not
  answered in ten seconds rather than racing it. *Done when:* against a server that never
  answers, polling continues with no request left open, and the network check and the
  probe corpus pass.

## Files and areas

- `packages/create-religion/lib/state.ts`, `state.test.ts` - the parsers
- `packages/create-religion/lib/dashboard.ts`, `dashboard.test.ts` - the data and the page
- `packages/create-religion/bin/religion.ts` - passes the tool's version
- `.changeset/` - one new changeset
- `prototypes/` - deleted at the end
- `religion/context/inbox.md` - the `nextStep` note leaves, specced here

## Data and contracts

- **`/state.json` stays internal.** The statement names it as such, so its shape can grow
  freely, and nothing outside the page reads it.
- **Its top level is `project`, `status`, `plan`, `findings`, `activity`, `work`,
  `history` and `health`** (load-bearing for the page). `work` is the parsed spec or `null`; `history` is
  a list of archives; `health` holds `checks`, `config`, `install`, `tool` and `inbox`. A
  failure answers `{ "error": string }` with status 500.
- **`status --json` is public and keeps its shape.** `work.nextStep` stays `string|null`;
  only its value is corrected, from a truncated label to the full step name.
- **`Finding` gains optional fields** (`file`, `found`, `lens`, `why`, `fix`, `resolution`),
  all `string|null`. Nothing public emits `Finding` objects, so this is additive and
  internal.
- **The page rules are fixed.** One `PAGE` template literal with inline script and style,
  the exact policy, one request to `/state.json`, no markup able to load or navigate written
  by the script, and every repository-derived string escaped before it reaches the page.

## Testing

- The test command is declared (`npm test`), so the parsers in Steps 1 to 4 each ship with
  tests in `state.test.ts` or `dashboard.test.ts`: the spec, finding, archive and inbox
  parsers, and the 500 path.
- The views in Steps 5 to 10 are interface: verified by screenshots against this repository
  and against a fresh install, in both themes, and by the network check passing on the new
  page.
- The check gate drives the running dashboard; the audit gate applies, because the page is
  covered by the network promise.

## Notes for the agent

- The page script lives inside a template literal: backslashes are consumed and a backtick
  ends it, so avoid regular expressions that need escapes and use `split` instead.
- The network check refuses, in the page script: `location`, `open`, `navigator`, any
  string containing `href=`, `src=`, `url(` or `://`, computed lookups on `window` or
  `document`, and `.href` or `.src` assignment. Links between views are static HTML
  (`href="#work"`), never written by script.
- Escape before formatting: the inline renderer escapes the text, then turns `**bold**` and
  `` `code` `` into markup, so nothing the repository holds becomes a tag.
- The parsers stay tolerant, as the module's header says: a half-written spec or a
  hand-edited archive degrades into partial information, never an exception.
- No em dashes in anything written.

## Outcome

`religion dashboard` is a designed operational console rather than four generic cards. An
overview names the next action as the bare skill name and summarises the plan, the active
item, blocking and unresolved findings and what has shipped, beside the active spec's
steps, a severity by status matrix, the plan, the live activity record with doctor's checks,
and recently shipped items. Work shows the active spec as written: its goal, every step
with what it builds and when it is done, its scope, its files and how the configuration
builds and lands it. Findings charts unresolved findings by lens and by file and closed ones
by the item that closed them, and lists the ledger with status and severity filters beside
the selected finding in full. History lists every archive with its steps, repairs, commits,
closed findings, lessons and deferrals beside the plan. Health shows the activity record,
every doctor check with what it blocks, each setting, the install against the running
tool's version with a prompt to update, the inbox and open questions. Light and dark follow
the system, views switch by the address's target with no script reading it, polling is one
request at a time and gives up on a silent server after ten seconds, and every piece of
repository text is escaped before it reaches the page.

`/state.json` carries the parsed spec, each finding in full, every archive, doctor's checks,
the configuration, the install record, the tool's version and the inbox, and answers 500
with the error rather than crashing when the project cannot be read. `parseWork`'s
`nextStep` keeps the whole step name, which closed the inbox note about its truncation.

Evidence behind it: `npm test` green at every commit after the shell's (102 unit tests, the
180-probe corpus, every verification check, 172 routing cases); the network check clean on
every page change; screenshots of each view against this repository and a fresh install in
light and dark; the real `religion dashboard` driven in Chrome, with the back and forward
buttons, keyboard selection, no console errors and no request but the page and its data;
markup planted in every state file rendering as text; a four-lens audit; and three
fresh-context re-reviews of the repairs.

### What went wrong on the way

**A step was committed on a red suite, again.** The shell's commit chained the commit after
the test run with `;`, so it landed while the probe replay failed: the redesign had removed
the markup 37 probes anchor their edits on. The next commit re-anchored nine probes and kept
two anchors in the page, with no verdict changed, and every later commit was chained with
`&&` behind `npm test`. It is the same slip the compatibility guards recorded.

**Repairs needed reviewing as much as the code.** The first fix for the quadratic lens
pattern still had two parts competing for the same spaces, and the fix that released a hung
poll by racing it brought back the out-of-order repaint an earlier repair had closed. Each
was caught by a fresh-context re-review and repaired again, the lens pattern on its second
and last attempt.

**Tooling slips were the agent's own.** A mutation test run in the background was stopped
with its test process still alive and the mutant briefly on disk; the file was restored from
a backup and the process killed. Clicks issued by element reference did not follow links,
which looked like a broken view until real clicks showed the page was fine.

**The run's first push was refused** by the permission classifier until the user added
rules for this run's branches.

### Deferred

- **Findings from this item's audit, none blocking:** F-100 (the page counts steps through
  two parsers), F-103 (history numbering and order for non-feature archives), F-104 and
  F-109 (repeated view logic and a long render function), F-105 and F-106 and F-114 and
  F-115 (test gaps), F-108 (the history reader follows links), F-110 to F-113, F-118 (each
  poll re-reads all history), F-121 and F-122 (lookup tables and focus after a poll), and
  F-124 (older browsers).
- **What the page cannot know without running git:** step commit hashes, the branch, the
  head and landing dates. The network check refuses `child_process`, and reading `.git`
  argues against the promise to stay inside the project's own files.
- **Which managed files changed since install,** and descriptions of each setting.
- **The rest of the ledger**, from earlier items.

## Landed

**Base:** d3cd42a6bd76423bf16821c3be9732d628ec733d
**Commits:** fb6c4cd82cd8d228e2e5cb54e06d67ae54429953, 90d6c26e6d1a01346a33d1947949917b7e07d4e9, 59a80a7eda7fdb8cf4723287952c74a6e0909a12, 8c628ea007baf86fff33dcc2e419b1a93b9bb1c8, fe059e5d79e29ee61b789f86f0ff059e7a4a7af9, a35a9d8bb2eb3db8d16bc6a41a69e2d33924b9bb, 3e06d7358b883367947d4ac3c36a8a48c44fd5ab, 88ee08860ba68f9fa3067339e0732c759601c8a1, 8ac93b30d6a518859eda8d19ed8df4ad2c2708bd, 6dd25c05db70a940ca2014e239be636f02d0faaf, 4ef6ef3cca90cb7ff58ab1e3cdbdc929f3c00e36, 86e0e8a3ca6910526cc2417c45918410e3784c32, 624001cd862c286485377f8b5683fc0e25cb3696, 4054cdabb65c94b982d3e493e5971a30baa35280, 3caed66dd8435e523d6a6cf81c118ec6bc5982f3, 4d00770b1dba364d53ebcad2187b2ee75289f896, b888c0d21671a78005b04b6ad3cd91aa4f515fbb, cb0c160996368a4813540a139da23cdf31f88c27, 67eae2b2714ce208cbb2b19a3b08e9a27df1e311
**Product paths:** .changeset/a-dashboard-worth-opening.md, packages/create-religion/bin/religion.ts, packages/create-religion/lib/dashboard.test.ts, packages/create-religion/lib/dashboard.ts, packages/create-religion/lib/state.test.ts, packages/create-religion/lib/state.ts, scripts/fixtures/network-probes.json

The base is `main` when the automated run began; the run's integration branch,
`auto/2026-10-01`, was created from it. The changeset at
`.changeset/a-dashboard-worth-opening.md` travels with this item and is consumed by the next
release.

## Findings

### 5/F-09 [P3] closed - Unused import and dead export in the dashboard

**File:** packages/create-religion/lib/dashboard.ts:10
**Found:** 2026-09-26 by audit (scope: current; lens: quality)
**Why it matters:** `import path` is unused (`tsc --noUnusedLocals` reports TS6133) and `historyCount` is exported and used nowhere. Both predate this work, in a file it touches.
**Suggested fix:** Delete both, after confirming nothing needs `historyCount`.
**Resolution:** Repaired 2026-10-01: `historyCount` is gone, replaced by `readHistory` in `state.ts`, which the dashboard uses, and the unused `fs` import went with it, while `path` stayed because the dashboard now uses it for the project's name; `npm run typecheck` passes. Re-reviewed 2026-10-01 in a fresh-context audit pass over `dashboard.ts`: `historyCount` is gone, and `tsc --noUnusedLocals` reports nothing in the file. Closed.

### 5/F-10 [P3] closed - A failed state read could crash the dashboard

**File:** packages/create-religion/lib/dashboard.ts:24
**Found:** 2026-09-26 by audit (scope: current; lens: security)
**Why it matters:** `void handle(...)` has no rejection handler, so a throw from `readProjectState` would be unhandled. Not reproduced. Predates this work.
**Suggested fix:** Catch in the request callback and answer 500.
**Resolution:** Repaired 2026-10-01: building `/state.json` is caught and answers 500 with the error as JSON, under the same policy. A dashboard test starts it on a project whose skill tree is a file, which makes doctor's read throw, and asserts the 500 and that the page is still served; with the guard removed the same test fails. Re-reviewed 2026-10-01 in a fresh-context audit pass: the security lens traced the guarded `/state.json` path, and the tests lens removed the guard in a scratch copy and the 500 test failed. Closed; the test's reliance on doctor throwing is F-115.

### 5/F-99 [P2] closed - The lens pattern is quadratic on a long Found line

**File:** packages/create-religion/lib/state.ts:296
**Found:** 2026-10-01 by audit (scope: current; lens: performance, security)
**Why it matters:** The lazy `(.*?)` before `\((?:scope...)?lens:` rescans the rest of the line from every position, so one long `**Found:**` line blocks the event loop: 80,000 spaces took 3.2 s per parse and `(lens: x` repeated 40,000 times took 9.7 s. The dashboard parses the ledger twice per poll (directly and inside `runDoctor`), and `religion status` and `doctor` stall on the same input.
**Suggested fix:** Match only from `found.lastIndexOf("(")`, which is linear, and add a timing-bounded test.
**Resolution:** Repaired 2026-10-01: the lens is matched only from the finding's last opening parenthesis, which is linear. A test parses a 320,000-character `Found` line within a one-second bound, and all 88 entries in this ledger parse with the same lenses as before. Re-reviewed 2026-10-01 in a fresh-context pass: not closed. Matching from the last parenthesis helps only when the long run comes before it; `(lens:` followed by 80,000 spaces still took 2.5 s, because `\s*` and `[^)]+` both match spaces and the engine tries every split. Repaired again 2026-10-01, the second and last attempt: the lens is captured without a leading `\s*` and trimmed, so no two parts of the pattern can take the same spaces. `x (lens:` followed by 80,000 spaces took 2,451 ms with the previous pattern and 0 ms with this one; the timing test now includes that input, and all 92 ledger entries parse with the same lenses. Re-reviewed 2026-10-01 in a fresh-context pass: 25 adversarial `Found` shapes at 80,000 and 320,000 characters, runs of spaces, tabs, semicolons, parentheses and repeated `scope:` and `lens:` on both sides of the last parenthesis, each parsed in 2 ms or less; a fuzz of 200,000 lines against the previous pattern found no difference, and all 92 ledger entries parse identically. Closed.

### 5/F-101 [P2] closed - "Oldest unresolved" lists the most severe findings, not the oldest

**File:** packages/create-religion/lib/dashboard.ts:933
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** It sorts by severity, then identifier, so a new P1 is listed before a months-old P3 under a label that says oldest.
**Suggested fix:** Sort by identifier only, or relabel it "Most severe unresolved", and reuse `idNumber`.
**Resolution:** Repaired 2026-10-01: the list is ordered by identifier alone, using the page's one identifier helper; against this repository it shows F-02, F-03 and F-04. Re-reviewed 2026-10-01 in a fresh-context pass: the list sorts by identifier only, and shows F-02, F-03 and F-04 against this repository. Closed.

### 5/F-102 [P2] closed - Selecting a row or filter by keyboard loses focus

**File:** packages/create-religion/lib/dashboard.ts:972
**Found:** 2026-10-01 by audit (scope: current; lens: quality)
**Why it matters:** Enter or Space on a focusable row calls `click()`, whose handler re-renders the table and chips with `innerHTML`, destroying the focused element; focus drops to the body after every pick, which defeats the keyboard handler that exists for it.
**Suggested fix:** After rendering, refocus the element with the same `data-pick` or `data-filter` and `data-value`.
**Resolution:** Repaired 2026-10-01: after a pick or filter re-renders, focus returns to the element with the same role and value. In Chrome, Tab then Enter on a row selected F-27 and left focus on its row, and Tab then Space did the same for F-28. Re-reviewed 2026-10-01 in a fresh-context pass: keyboard picks on rows and chips return focus to the replacement element, roles are compared with values so no other element can match, and mouse use shows no ring because the style is focus-visible. Closed; a poll's re-render still drops focus, which is F-122.

### 5/F-107 [P3] closed - A finding's file named like an Object member breaks the page

**File:** packages/create-religion/lib/dashboard.ts:766
**Found:** 2026-10-01 by audit (scope: current; lens: security)
**Why it matters:** `files`, `lensCounts` and `kinds` are plain objects keyed by repository text, so a file named `constructor`, `toString` or `__proto__` makes `.push` throw; rendering stops before History and Health are drawn, and since the response text is remembered first, later identical polls never recover.
**Suggested fix:** Use `Object.create(null)` or a `Map` for the three.
**Resolution:** Repaired 2026-10-01: the lens, file and kind tallies are prototype-free objects. A project with a finding filed under `lib/constructor:12` and lens `constructor` rendered every view, with all seven doctor checks and the history tiles drawn. Re-reviewed 2026-10-01 in a fresh-context pass: findings filed under `constructor` and `__proto__`, such lenses, a history kind of `constructor` and hostile adapters all rendered every view. Closed; three lookup tables still show inherited members as text, which is F-121.

### 5/F-116 [P3] closed - The step pattern in parseWork is quadratic across blank lines

**File:** packages/create-religion/lib/state.ts:102
**Found:** 2026-10-01 by audit (scope: current; lens: performance)
**Why it matters:** `^\s*` under the multiline flag runs across newlines, so every blank line rescans the whitespace after it: 80,000 blank lines took 2.8 s, run twice per poll.
**Suggested fix:** Use `^[ \t]*`.
**Resolution:** Repaired 2026-10-01: the step pattern's leading and trailing whitespace is spaces and tabs only, so it no longer crosses lines. The same timing test parses a spec of 80,000 blank lines within the bound. Re-reviewed 2026-10-01 in a fresh-context pass: 80,000 blank lines parse in 0 ms and 80,000 space-only lines in 3 ms; every archive and the active spec count the same steps and next step as before. Closed; the tail of the same pattern is F-119.

### 5/F-117 [P3] closed - Polling starts a request every 3 seconds whether or not the last one finished

**File:** packages/create-religion/lib/dashboard.ts:989
**Found:** 2026-10-01 by audit (scope: current; lens: performance)
**Why it matters:** `setInterval` fires regardless, so a slow response (as F-99 can cause) builds an unbounded queue, and responses can arrive out of order and replace newer state with older.
**Suggested fix:** Schedule the next poll when the current one finishes.
**Resolution:** Repaired 2026-10-01: the page skips a poll while one is in flight. Against a server delaying every `/state.json` answer by 7 seconds, 20 seconds of polling made two requests, never more than one open at once. Re-reviewed 2026-10-01 in a fresh-context pass: the page script, run in a stubbed DOM, resets the busy flag after a malformed body, a throwing render, a 500 and a network error, and polling continues. Closed; a request that never settles is F-120.

### 5/F-119 [P3] closed - The tail of parseWork's step pattern is quadratic and joins plain steps

**File:** packages/create-religion/lib/state.ts:103
**Found:** 2026-10-01 by audit (scope: current; lens: re-review of F-99 to F-117)
**Why it matters:** `(.+?)(?:\s+-\s|$)` lets `\s+` cross a newline, so `- [ ] Plain one` followed by `- [ ] Plain two` counts as one step, and a step line with a long run of spaces takes seconds (80,000 spaces took 3.3 s). It predates this item; the repair of F-116 kept it.
**Suggested fix:** Use `[ \t]-[ \t]` for the separator.
**Resolution:** Repaired 2026-10-01: the separator is a dash between spaces or tabs on the same line. A step line with 80,000 spaces took 3,239 ms before and 0 ms after, the timing test covers it, and a test counts two consecutive unbolded steps as two. Re-reviewed 2026-10-01 in a fresh-context pass: adversarial step lines and blank runs at 320,000 characters parsed in 4 ms or less, two plain steps count as two, and the active spec, the seven archives and the history readmes give the same counts and next step as before. Closed.

### 5/F-120 [P3] closed - A request that never answers stops polling for good

**File:** packages/create-religion/lib/dashboard.ts:550
**Found:** 2026-10-01 by audit (scope: current; lens: re-review of F-99 to F-117)
**Why it matters:** The busy flag that keeps polls from overlapping is cleared only when the request settles, so one that hangs leaves the page frozen for the rest of its life. The server always answers, so this is unlikely.
**Suggested fix:** Give the request a timeout, for example an abort signal of ten seconds; the existing catch already handles it.
**Resolution:** Repaired 2026-10-01: a poll releases after ten seconds even if its request never answers. Against a server that never answered, the page went on making requests every 12 to 13 seconds. Re-reviewed 2026-10-01 in a fresh-context pass: in the page script run against a fake clock, polling resumed after a hung request, and a late rejection was caught. Closed as stated; the race it used lets an abandoned request repaint older state, which is F-123.

### 5/F-123 [P2] closed - A late answer from an abandoned poll repaints older state

**File:** packages/create-religion/lib/dashboard.ts:556
**Found:** 2026-10-01 by audit (scope: current; lens: re-review of F-99, F-119, F-120)
**Why it matters:** The repair of F-120 races `refresh()` against a ten-second timer, which only stops waiting: the abandoned request keeps running and, when it answers, renders its older state over newer state, which is what F-117 closed. Reproduced in the page script with a fake clock: a hung request answering after a newer one left the older state on screen until the next poll. Abandoned requests are never cancelled, so they also pile up against the browser's per-host connection limit.
**Suggested fix:** Drop the race and give the request an abort signal with a ten-second timeout; the existing catch handles the abort, and an aborted request cannot land late.
**Resolution:** Repaired 2026-10-01: the race is gone and the request carries a ten-second abort signal, so a request that has not answered is cancelled rather than abandoned. Against a server that never answered, each request was cancelled 11 seconds after it started, the next poll followed a second later, and no more than one request was ever open; probe 6.03 is re-anchored on the new call with its verdict unchanged. Re-reviewed 2026-10-01 in a fresh-context pass: the page script, run against a fake clock, aborted an unanswered request at exactly ten seconds and rendered only the newer answer when the old one replied late; a body that stalled after its headers was rejected by the same signal; a two-minute soak against a server that never answered made eleven requests, at most one open at a time; probe 6.03 still tests a fetch with an options object and stays clean. Closed.
