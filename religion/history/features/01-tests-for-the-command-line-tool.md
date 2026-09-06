# Tests for the command-line tool

**Type:** Feature
**From build plan:** item 1
**Status:** verified

## Goal

The command-line tool is the part a new user meets first and the only part of Religion with
real logic rather than prose: manifest hashing, conflict detection, and the marker surgery
that merges an entry file. None of it has an automated test. Everything protecting it today
is a handful of manual runs done once.

When this is done, that logic runs under a test command on every build, every pull request,
and inside the release workflow before publishing, and the three bugs that were found by
hand in this area would now be caught by the suite.

## In scope

- A test runner declared as a command, wired into `npm test` and therefore into CI
- Coverage for `merge.ts`: marker detection, the damaged-marker case, splicing, and block
  replacement
- Coverage for `install.ts`: the `planInstall` action matrix, `applyInstall` writing and
  backing up, and `writeManifest` recording what was installed
- Coverage for `state.ts`: the plan, spec and findings parsers
- Test files excluded from the published package

## Out of scope

- `dashboard.ts`, which is a server and an integration surface. The coding standards say to
  verify those by running them, not with unit tests
- The argument parsing in `bin/religion.ts`, which is a thin dispatch over the covered
  modules
- The workspace's own build and render scripts, which the nine verification checks already
  cover
- `doctor.ts` and `status.ts`. Their reporting is a thin layer over the `state.ts` parsers
  this item does cover, and their own logic is a settings table and a next-action table that
  read as data. Worth revisiting once the parsers underneath them are covered
- Any change to the behaviour under test. This item adds tests; anything it uncovers becomes
  a finding or a fix, not a silent repair

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - declare the runner** - add a `test:unit` script running `tsx --test` over
  `packages/create-religion/**/*.test.ts`, fold it into `npm test`, and exclude `*.test.ts`
  from the package's `tsconfig` so tests never compile into `dist/`. Ship one real assertion
  so the step proves itself. Add a verification check that the unit suite is not empty:
  `tsx --test` **exits 0 when it matches no files**, verified before spec'ing, so without a
  guard a deleted or misnamed suite reports success having run nothing. *Done when:*
  `npm test` runs unit tests and reports them; the new check fails when the test files are
  moved out of the way and passes when they are restored; and `npm pack` output contains no
  file matching `*.test.*`.
- [x] **Step 2 - cover the merge surgery** - `merge.test.ts` over the pure functions.
  *Done when:* tests assert that `hasMarkers` needs both markers, that `hasDamagedMarkers`
  is true for a start without an end and for a reversed pair, that `spliceEntry` leaves the
  existing content byte-identical at the head of the result, that it does not add a second
  `## Commands` when one already exists, and that `replaceManagedBlock` returns null rather
  than guessing when the pair is damaged.
- [x] **Step 3 - cover install planning** (with 2) - `install.test.ts` driving `planInstall`
  against temporary directories. *Done when:* every action it can return is asserted by a
  case that produces it: `create`, `unchanged`, `seed-skip`, `update`, `conflict`, `merge`,
  and `remerge`.
- [x] **Step 4 - cover applying and the manifest** - extend `install.test.ts` to
  `applyInstall` and `writeManifest`. *Done when:* a conflict left alone is not written and
  keeps its previous manifest entry; a forced conflict is backed up before being replaced;
  and three consecutive updates against a locally edited managed file leave that edit intact
  every time, which is the failure the manifest exists to prevent.
- [x] **Step 5 - cover the state parsers** (with 2) - `state.test.ts` over the plan, spec and
  findings readers. *Done when:* a build plan is counted correctly with checked and unchecked
  items; the template's own worked examples outside the `## Plan` section are not counted;
  spec step counting matches a spec with ticked and unticked steps; and a findings file with
  mixed statuses reports the blocking ones.

## Files and areas

- `package.json` - the `test:unit` script, and `npm test` composed from it
- `packages/create-religion/tsconfig.json` - exclude `**/*.test.ts`
- `packages/create-religion/lib/merge.test.ts` - new
- `packages/create-religion/lib/install.test.ts` - new
- `packages/create-religion/lib/state.test.ts` - new
- No product module is modified by this item.

## Data and contracts

- **The test command is load-bearing.** It is declared in the Commands section of the entry
  file, which is what turns testing into a gate for logic-bearing work. Changing its name or
  its meaning changes when the whole loop demands tests.
- Test files live next to the source they cover, per the coding standards, and are excluded
  from the compiled output rather than moved elsewhere.
- No production type or stored shape changes.

## Testing

This item is the testing. The gate is already on: the entry file declares `Test: npm test`
and `Verify: npm test`.

In-scope logic, which is what the standards say to unit test:

| Module | What is asserted |
| --- | --- |
| `merge.ts` | pure string surgery, including the damaged-marker case found by trying it |
| `install.ts` | the action matrix, backup behaviour, and manifest hash recording |
| `state.ts` | parsers over markdown the loop depends on reading correctly |

Out of scope for unit tests by the same standards: the dashboard server and the command-line
dispatch, both integration surfaces verified by running them.

Each step is proved by running the declared command and showing the result, not by asserting
that the tests exist.

## Notes for the agent

- **No new dependency.** `node:test` is built in and `tsx` is already a devDependency. This
  was verified before spec'ing: `tsx --test` runs `node:test` against real TypeScript modules
  and imports `merge.js` directly. The published package has no runtime dependencies and this
  item does not change that.
- **An empty suite must fail.** A run that finds no test files reporting success is the exact
  "nothing fails with success" defect the standards call out, and it is worse than no runner.
- **Tests exercise real code, never source text.** Import the module and call it. A test that
  greps a file for a string passes when the behaviour is broken.
- **Do not fix what the tests uncover.** This item adds coverage. A genuine defect found on
  the way is a finding or a fix with its own spec, so that the repair gets its own review
  rather than arriving inside a testing diff.
- Temporary directories go under the system temp directory and are cleaned up, never inside
  the repository.

## Outcome

31 unit tests across three files, run by `npm test` and therefore by CI and by the release
workflow before publishing. No product module was modified.

Every assertion was proved able to fail by mutating the source and restoring it. Nine
mutations, each reintroducing a defect that actually happened in this codebase:

| Mutation | Tests that failed |
| --- | --- |
| `hasDamagedMarkers` always false | 1 |
| splice stops skipping a duplicate Commands section | 1 |
| seed-once removed, state files become managed | 1 |
| entry files treated like any other file | 2 |
| manifest comparison ignored | 1 |
| skipped conflict loses its previous entry | 1 |
| force ignored, conflicts written without a backup | 2 |
| the `## Plan` scoping removed from the plan parser | 1 |
| findings status ignored | 1 |

### What went wrong on the way

- A step was ticked before the full suite ran. The unit tests passed while `typecheck`
  failed on five fixtures missing a required field. `tsx --test` does not typecheck, so a
  green unit run says nothing about types.
- One mutation was described as reintroducing the original manifest bug and did not fail
  anything. It was an equivalent mutant in every path the tests reach. The real defect was
  a different branch, and that one did fail.
- The first fixture created temporary directories and never removed them, against this
  spec's own note. Cleanup is now wired through the test context.

### Deferred

- `parseWork.nextStep` truncates a step title at the first ` - `, which is the separator
  the spec template uses inside the bold title. Latent: the field is parsed and never read.
  Recorded in the inbox.
- `writeManifest` after a merge is uncovered. It is the only path where the target and the
  template genuinely differ. Not a live defect, since planning routes entry files by markers
  before consulting hashes.

## Landed

**Base:** c388f8959c359a7e48c7f5a086e90661ab11e7d6
**Commits:** ab2e7451fc8a4d3a91ccb31206413d0b56d60d0c
**Product paths:** package.json, packages/create-religion/tsconfig.json,
packages/create-religion/lib/merge.test.ts, packages/create-religion/lib/install.test.ts,
packages/create-religion/lib/state.test.ts, scripts/verify.ts

The guard-hook change that followed on the same branch is separate work and is deliberately
not listed here: a reversal of this item must not take it with them.
