# Finding identifiers scoped to their item

**Type:** Feature
**From build plan:** item 39a
**Status:** verified
**Approved:** 2026-10-25, 7473e4e35ddb5316

## Goal

A finding raised while a planned item is active carries that item's prefix from the moment it is
written, `39a/F-1` rather than `F-189`, so two items in separate worktrees can never hand out the
same identifier. Everything that reads the ledger accepts the prefixed form, and bare identifiers
keep parsing, so existing ledgers are untouched and the change releases as a minor version.

Grounded in `religion/history/spikes/does-resuming-two-items-cost-less-than-finishing-one.md`,
where two worktrees both assigned `F-189`.

## In scope

- The ledger parser keeps an identifier's prefix
- The handoff hook lists prefixed findings
- The dashboard orders findings by their place in the ledger, not by the number in the identifier
- `audit` assigns the active planned item's prefix when it raises a finding
- `complete` archives an already-prefixed finding under its own identifier
- `fix`, `implement` and `distill` show and accept the prefixed form
- The stability statement says ledger headings may carry an item prefix

## Out of scope

- Prefixes for unplanned work (fixes, refactors, rollbacks). They keep bare identifiers until
  item 39c lets them run beside other work, which is when their archive name has to be known
  in advance.
- The archive parser (`state.ts:417`), which already accepts a prefix and keeps reporting the
  bare identifier inside an archive.
- Renumbering existing bare entries in any ledger. They stay as they are.
- Finding items in flight (39b), starting items in worktrees (39c), landing one at a time (39d).

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - the ledger parser keeps the prefix** - in
  `packages/create-religion/lib/state.ts`, `parseFindings` matches an optional `<prefix>/`
  before `F-<n>` and keeps it in `id`; tests in `state.test.ts` beside the existing
  `parseFindings` test. *Done when:* `39a/F-1` parses with `id` `39a/F-1`, a bare `F-07` still
  parses as before, a header starting `/F-1` is not read as a finding, and `npm test` exits 0.
- [x] **Step 2 - the handoff hook lists prefixed findings** - both identifier patterns in
  `src/hooks/write-handoff.mjs` accept the optional prefix; cases in `scripts/hooks.test.ts`.
  *Done when:* a ledger holding `39a/F-1 [P1] open` and `39a/F-2 [P2] unverified` produces a
  handoff naming both, bare entries are listed as before, and `npm test` exits 0.
- [x] **Step 3 - the dashboard orders by ledger position** - in
  `packages/create-religion/lib/dashboard.ts`, the findings table's tie-break and the "oldest
  pending" tile order by each finding's position in the ledger instead of
  `Number(String(f.id).slice(2))`, which reads `39a/F-1` as 0. *Done when:* with a ledger of
  `F-07`, then `39a/F-2`, then `39a/F-1`, all P2 and open, the dashboard lists them in that
  order and names them as the three oldest, and `npm test` exits 0.
- [x] **Step 4 - audit raises prefixed findings** - in `src/skills/audit/SKILL.md`, the
  identifier rule: while the active spec carries `**From build plan:** item <n>`, a new finding
  is `<n>/F-<k>`, with `k` one past the highest present with that prefix, starting at 1;
  otherwise it is bare and sequential, as today. The header example and `**Surfaced by:**` use
  the full identifier. *Done when:* the rendered audit skill states the rule and shows a
  prefixed example, and `npm test` exits 0.
- [x] **Step 5 - complete keeps a prefix it finds** - in `src/skills/complete/SKILL.md`, the
  ledger prune prefixes only bare identifiers; an entry already carrying a prefix moves to the
  archive under it unchanged. *Done when:* the rendered complete skill says so, with an example
  of each, and `npm test` exits 0.
- [x] **Step 6 - fix, implement and distill take the prefixed form** - examples and wording in
  `src/skills/fix/SKILL.md`, `src/skills/implement/SKILL.md` and `src/skills/distill/SKILL.md`
  show `39a/F-2` beside the bare form; no `description` changes. *Done when:* each rendered skill
  shows the prefixed form, the routing corpus passes unchanged, and `npm test` exits 0.
- [x] **Step 7 - the stability statement** - `docs/stability.md`'s state-format promise says
  ledger headings may carry an item prefix and that bare ones keep parsing. *Done when:* the
  sentence is there and the docs check passes as part of `npm test`.

## Files and areas

- `packages/create-religion/lib/state.ts`, `packages/create-religion/lib/state.test.ts`
- `src/hooks/write-handoff.mjs`, `scripts/hooks.test.ts`
- `packages/create-religion/lib/dashboard.ts`
- `src/skills/audit/SKILL.md`, `src/skills/complete/SKILL.md`, `src/skills/fix/SKILL.md`,
  `src/skills/implement/SKILL.md`, `src/skills/distill/SKILL.md`
- `docs/stability.md`
- Rendered by `npm run build:skills:link`: the skill trees, `template/`

## Data and contracts

**The finding header (load-bearing).** Items 39b to 39d, the dashboard and `status --json` all
read it.

    ### [<prefix>/]F-<n> [P0|P1|P2|P3] <status> - <title>

- `<prefix>` matches `[\w-]+`, the class the archive parser already accepts; for a planned item
  it is the build-plan number, such as `39a` or `27`
- `<n>` is one or more digits; within one prefix it is one past the highest present, starting
  at 1; bare identifiers keep their existing sequence
- `Finding.id` is the whole identifier, prefix included; it stays a string, so `status --json`
  and the dashboard change no field or type
- An archived finding is `<archive name>/F-<n>`, as today; one raised with a prefix is already
  in that form
- A finding's age is its position in the ledger, which only ever appends; identifiers do not
  order findings across prefixes

## Testing

- The gate is `npm test`: the verification checks, the unit tests and the routing corpus.
- In-scope logic with tests: the `parseFindings` pattern (Step 1) and the hook's two patterns
  (Step 2), each with a prefixed case, a bare case and a malformed case.
- Step 3 is page script inside the dashboard, which has no unit harness, so it is verified by
  running the dashboard against a mixed ledger and reading the order it shows.
- Steps 4 to 7 are skill and documentation prose, held by the drift, token and docs checks in
  `npm test`; the routing corpus confirms no description moved.
- `check` proves the whole: a ledger with bare and prefixed entries read through
  `religion status --json`, the handoff hook and the dashboard, with both forms reported.

## Notes for the agent

- Keep bare identifiers working everywhere; nothing in this item may stop an existing ledger
  parsing. That is what keeps it a minor version.
- Skill prose uses the token vocabulary, never one tool's syntax. Edit `src/` only and render
  with `npm run build:skills:link`.
- The state-template check reads a word starting with a slash or a dollar sign as invocation
  syntax, so examples in state files must not start a word that way.
- No em dashes, en dashes or ellipsis characters, and no plan or item numbers in source
  comments or commit messages. Item numbers inside identifier examples (`39a/F-2`) are
  examples of the format, not plan references.

## Evidence

Checked 2026-10-25 at d9a9199, tree clean. The behavioural checks ran against a scratch project seeded from `template/` whose ledger held `F-07` (P2 open), `39a/F-1` (P1 open), `39a/F-2` (P2 unverified) and a stray `/F-4`.

- **Step 1 - the ledger parser keeps the prefix** - pass: the new `state.test.ts` case passes and fails with the parser change set aside; `status --json` counted 3 findings and reported `39a/F-1` as blocking, with `/F-4` not read; `npm test` exit 0, 185 passed.
- **Step 2 - the handoff hook lists prefixed findings** - pass: the new `hooks.test.ts` case passes and fails with the hook change set aside; run in the scratch project, the hook listed `39a/F-1 [P1] open` as blocking and `39a/F-2 [P2]` as unverified, without `/F-4`.
- **Step 3 - the dashboard orders by ledger position** - pass: running the served page script against a stand-in DOM, the oldest-pending panel named `F-07`, `39a/F-1`, `39a/F-2`, in ledger order, and with three P2 open findings the table showed `F-07`, `39a/F-2`, `39a/F-1`; before the change both put the prefixed ones first.
- **Step 4 - audit raises prefixed findings** - pass: the rendered `.claude/skills/audit/SKILL.md:112` states the rule with `12/F-1`; `npm test` exit 0.
- **Step 5 - complete keeps a prefix it finds** - pass: the rendered `.claude/skills/complete/SKILL.md:115-116` shows `12/F-3` staying and `F-03` becoming `12/F-03`; `npm test` exit 0.
- **Step 6 - fix, implement and distill take the prefixed form** - pass: each rendered skill shows `39a/F-2`; no `description` line changed and the routing corpus passed in `npm test`.
- **Step 7 - the stability statement** - pass: `docs/stability.md` carries the sentence and the docs check passed in `npm test`.

## Outcome

A finding raised while a planned item is active is headed with the item's number, `39a/F-1`, so
items built in separate worktrees cannot hand out the same identifier. The ledger parser, the
handoff hook and `status --json` read the prefixed form beside bare identifiers, which keep
parsing, so existing ledgers are untouched. The dashboard orders findings by their place in the
ledger, since numbers restart for each prefix. `audit` assigns the prefix, `complete` keeps it
when archiving, and `fix`, `implement` and `distill` show it.

### What went wrong on the way

- The first check that a new test fails without its fix set aside the test as well as the fix,
  so it proved nothing; redone by setting aside only the source file.
- Red-teaming the spec found the dashboard reading `39a/F-1` as number 0, which no step had
  covered; a step was added before any code existed.

### Deferred

- Prefixes for fixes, refactors and rollbacks, until item 39c lets them run beside other work.
