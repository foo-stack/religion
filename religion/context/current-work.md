# A dashboard worth opening

**Type:** Feature
**From build plan:** item 5
**Status:** in progress

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
- [ ] **Step 3 - history** - `parseArchive` reads one archive's number, title, kind, status,
  step and repair counts, commits, closed findings, what went wrong and what was deferred;
  the dashboard reads every archive under the five history folders, replacing
  `historyCount` and its unused import (F-09). *Done when:* tests cover a full archive, one
  with no `Landed` or `Findings` section, and the folder README being skipped, and this
  repository's seven archives parse with 62 commits and 30 closed findings between them.
- [ ] **Step 4 - health, and a read that cannot crash** - `/state.json` gains doctor's
  checks, the configuration, the install record's version, adapters and managed count, the
  tool's version passed in by the command, and the inbox parsed into dated notes; a failure
  building the response answers 500 with a JSON error instead of an unhandled rejection
  (F-10). *Done when:* an inbox parsing test passes, the dashboard test asserts the
  response's top-level keys and a 500 when state cannot be read, and `npm test` passes.
- [ ] **Step 5 - the theme and the shell** - port `prototypes/theme.css` into `PAGE`; build
  the rail with the five views switched by `:target`, so links, the back button and a
  reload work with no script reading the address; the live indicator, the loading and
  disconnected states, and the tool's version. Until Step 6 the overview shows the next
  action, as the old page did, so the page stays useful between steps. *Done when:* the page
  renders the rail and switches views against this repository in light and dark, shown by
  screenshots, a stopped server shows as disconnected, and the network check passes.
- [ ] **Step 6 - the overview** - the next action, the five tiles, Active work, the findings
  matrix and oldest unresolved, the plan, activity and health, and recently shipped. *Done
  when:* a screenshot against this repository shows every panel filled from its state files,
  and one against a fresh install shows each panel's empty state rather than a blank.
- [ ] **Step 7 - work** - the spec view: tags, tiles, goal, step cards with the next one
  highlighted, scope, files, and how the work is built. *Done when:* a screenshot against a
  project with this spec in progress shows every step's description and *Done when*, and
  the view says plainly when nothing is in progress.
- [ ] **Step 8 - findings** - tiles, the lens, file and per-item analytics, the ledger with
  status and severity filters, and the selected finding's detail. *Done when:* screenshots
  show the analytics against this repository's ledger, a filter narrowing the table, and a
  clicked row filling the detail panel.
- [ ] **Step 9 - history** - tiles, the shipped table, the build plan, and the selected
  item's detail. *Done when:* a screenshot shows the seven archives and a clicked item's
  lessons and deferrals.
- [ ] **Step 10 - health** - the update notice when the install is older than the tool,
  the activity record, doctor's checks, the configuration, the install and the inbox. *Done
  when:* a screenshot against this repository shows the notice for its 0.5.0 install, and
  one against a fresh install shows none.
- [ ] **Step 11 - land it** - the changeset, and `prototypes/` deleted now its theme lives
  in the page. *Done when:* `npm test` passes and nothing references `prototypes/`.

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
- **Its top level is `status`, `plan`, `findings`, `activity`, `work`, `history` and
  `health`** (load-bearing for the page). `work` is the parsed spec or `null`; `history` is
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
