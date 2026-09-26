# The stability statement

**Type:** Feature
**From build plan:** item 4d
**Status:** in progress

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
- [ ] **Step 4 - checks behind the words** - a verification check that every command, option,
  skill, adapter, setting and the Node range in `surface.json` appears in
  `docs/stability.md`; and a second that the shipped code, the command-line tool and the
  hooks, imports no module that can open a network connection, the dashboard's loopback
  server excepted, since the statement promises that and nothing checks it today. *Done
  when:* both pass, adding an entry to the record without naming it in the statement fails,
  and adding a `fetch` call or a `node:https` import to a shipped module fails, each shown by
  a temporary edit.
- [ ] **Step 5 - claims that agree** - correct the stale claims: twenty-two skills and nine
  checks in `README.md` and the entry sources, OpenCode reading either tree, the state
  model's missing paths and its claim that `CLAUDE.md` imports `AGENTS.md`, thirteen
  settings in the configuration reference, and the versioning rule in the release notes,
  which now points at the statement. Rebuild the rendered trees. *Done when:* each corrected
  claim is checked against the code or a count taken from it, and `npm test` passes with
  the rendered trees in sync.
- [ ] **Step 6 - where to find it** - add both documents to `docs/README.md` and link them
  from `README.md` and the package readme; add decision entries for the settled promises,
  the Node policy, and the retired shell-command hook, which never got one. *Done when:*
  every file under `docs/` is in the index and every new relative link resolves.
- [ ] **Step 7 - the major changeset** - add `.changeset/one-point-zero.md` as a major bump
  naming the stability statement and every breaking change since 0.5.0: Node 22, refused
  input and exit codes, the `doctor --json` shape, and conflicts and declined merges
  exiting 1. *Done when:* the changeset exists, names each, and `npm test` passes.

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
