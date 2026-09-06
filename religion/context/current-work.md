# Tests for the command-line tool

**Type:** Feature
**From build plan:** item 1
**Status:** not started

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

- [ ] **Step 1 - declare the runner** - add a `test:unit` script running `tsx --test` over
  `packages/create-religion/**/*.test.ts`, fold it into `npm test`, and exclude `*.test.ts`
  from the package's `tsconfig` so tests never compile into `dist/`. Ship one real assertion
  so the step proves itself. Add a verification check that the unit suite is not empty:
  `tsx --test` **exits 0 when it matches no files**, verified before spec'ing, so without a
  guard a deleted or misnamed suite reports success having run nothing. *Done when:*
  `npm test` runs unit tests and reports them; the new check fails when the test files are
  moved out of the way and passes when they are restored; and `npm pack` output contains no
  file matching `*.test.*`.
- [ ] **Step 2 - cover the merge surgery** - `merge.test.ts` over the pure functions.
  *Done when:* tests assert that `hasMarkers` needs both markers, that `hasDamagedMarkers`
  is true for a start without an end and for a reversed pair, that `spliceEntry` leaves the
  existing content byte-identical at the head of the result, that it does not add a second
  `## Commands` when one already exists, and that `replaceManagedBlock` returns null rather
  than guessing when the pair is damaged.
- [ ] **Step 3 - cover install planning** (with 2) - `install.test.ts` driving `planInstall`
  against temporary directories. *Done when:* every action it can return is asserted by a
  case that produces it: `create`, `unchanged`, `seed-skip`, `update`, `conflict`, `merge`,
  and `remerge`.
- [ ] **Step 4 - cover applying and the manifest** - extend `install.test.ts` to
  `applyInstall` and `writeManifest`. *Done when:* a conflict left alone is not written and
  keeps its previous manifest entry; a forced conflict is backed up before being replaced;
  and three consecutive updates against a locally edited managed file leave that edit intact
  every time, which is the failure the manifest exists to prevent.
- [ ] **Step 5 - cover the state parsers** (with 2) - `state.test.ts` over the plan, spec and
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
