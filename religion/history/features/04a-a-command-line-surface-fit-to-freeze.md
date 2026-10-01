# A command-line surface fit to freeze

**Type:** Feature
**From build plan:** item 4a
**Status:** verified

## Goal

The command-line tool is about to become something a 1.x release promises not to break, and
today it cannot be promised as it stands. It guesses at input it does not understand: an
unknown flag is ignored, so `religion update --dryrun` performs a real update, and an unknown
word becomes the target directory, so `religion stauts` installs Religion into a new
`./stauts`. Its exit codes are undocumented, an `update` that leaves conflicts behind exits 0,
`doctor --json` is a bare array that cannot grow without breaking its readers, and the
dashboard answers any `Host` header, which leaves it open to DNS rebinding despite binding
to loopback.

When this is done, the tool refuses anything it does not understand with a usage error that
writes nothing, every command exits with a documented code, both JSON outputs carry a
`schemaVersion`, and the dashboard only answers requests addressed to itself. That is the
surface item 4c will pin with checks and item 4d will promise.

## In scope

- A strict argument grammar, parsed by a pure function in its own module, with tests
- Usage errors for unknown commands, unknown flags, flags that do not apply to the command,
  and more than one directory argument, all exiting 2 and writing nothing
- Keeping the two invocations people already use: `npx create-religion` with no arguments,
  and a bare directory that already exists (`npx create-religion ./app`)
- Exit codes `0`, `1` and `2` with fixed meanings across every command, listed in `--help`
  and in the package readme
- `install` and `update` exit 1 when conflicts remain after writing
- `doctor --json` as an object carrying `schemaVersion`, `healthy` and `checks`
- A `Host` header check on the dashboard
- A changeset describing the user-visible changes

## Out of scope

- **`--version`.** Useful, and additive, so it can arrive in any 1.x minor. Not this item.
- **The dashboard's `/state.json` shape.** It feeds the dashboard's own page. Item 4d
  declares it internal rather than versioning it here.
- **`status --json`.** Already carries `schemaVersion: 1`, and its shape does not change.
- **Pinning any of this with verification checks.** Item 4c.
- **The update behaviour itself**: orphaned files, newer manifests, the declined-merge
  backup claim, the entry-file duplication. Item 4b. This item only changes the exit code
  when conflicts remain.
- **The `engines` range.** The package says Node 20 or later and the overview says 22. The
  statement in item 4d has to settle which one is promised.
- **A directory argument starting with `-`.** Unsupported before and after; nobody has asked.

## Build loop

Build one step at a time, never the whole item at once.

1. The step is planned before any code is written.
2. Just that step is implemented, as the smallest change that satisfies its outcome.
3. The diff is shown, not whole files, and explained in plain language.
4. Its stated outcome is proved with evidence, then the step is approved.

Never accept a step you have not read. If a diff is too large to review, the step was too
large, so split it.

## Build steps

- [x] **Step 1 - a strict argument grammar** - move `parse` out of `bin/religion.ts` into
  `lib/args.ts` as a pure function returning either the options or a usage error, following
  the grammar under Data and contracts. The existence check for a bare directory is passed in
  rather than performed, so the function stays pure. Wire it into `bin/religion.ts`: a usage
  error prints the message and `Run \`religion help\` for usage.` to stderr and exits 2
  before anything is read or written. Add `lib/args.test.ts`. *Done when:* the tests cover
  every row of the grammar including each refusal, `npm test` passes, and in a scratch
  directory `religion stauts`, `religion update --dryrun`, `religion status --force` and
  `religion install a b` each exit 2 with no new file or directory, while `religion`,
  `religion .` and `religion install ./new --dry-run` still behave as they did.
- [x] **Step 2 - exit codes, fixed and written down** - `install` and `update` exit 1 when
  `applyInstall` reports conflicts, and not on a dry run. Add an `Exit codes` block to
  `--help` and a matching section to `packages/create-religion/README.md`. *Done when:* in a
  scratch project each code is observed from a real run: 0 from a clean `update`, 1 from an
  `update` with a locally edited managed file, 1 from `status` outside any project, 1 from
  `doctor` with a failing check, 2 from a usage error; and the help text and readme list the
  same three codes with the same meanings.
- [x] **Step 3 - a versioned doctor report** - `doctor --json` prints
  `{ schemaVersion: 1, healthy, checks }` instead of a bare array, built by a pure function
  in `lib/doctor.ts` with a test beside it. Check `src/skills/doctor/SKILL.md` and
  `docs/doctor.md` for anything describing the old shape and correct it through the source,
  then rebuild the rendered trees. *Done when:* the test passes, a scratch project's
  `religion doctor --json` output parses and carries all three keys, `healthy` is false
  exactly when the exit code is 1, and `npm test` passes with the rendered trees in sync.
- [x] **Step 4 - a dashboard that answers only itself** (with 3) - requests whose `Host`
  header is not `127.0.0.1:<port>` or `localhost:<port>` for the dashboard's own port get a
  403 and no project state, on every path including the page itself. `localhost` matches
  case-insensitively; `[::1]` is not allowed, because the server binds IPv4 loopback only.
  The decision is a pure exported function in `lib/dashboard.ts` with a test beside it. *Done when:* the test covers a missing header, a foreign host, the
  wrong port, and both allowed forms; and against a running dashboard `curl` with its own
  address gets 200 on `/state.json` while `curl -H 'Host: evil.example'` gets 403 with no
  state in the body.
- [x] **Step 5 - a changeset** - add `.changeset/cli-surface.md` as a minor bump, naming the
  refused input, the new exit code for conflicts, the `doctor --json` shape change, and the
  dashboard check, so anyone scripting against 0.5 knows what moved. *Done when:* the
  changeset exists, names all four, and `npm test` passes.
- [x] **Repair F-01 - adapter flags match inherited object properties** - check adapter
  names with `Object.hasOwn` rather than `in`. *Done when:* `--toString` and `--__proto__`
  are refused as unknown options by a test and by a real run exiting 2.

## Files and areas

- `packages/create-religion/lib/args.ts`, `lib/args.test.ts` - new
- `packages/create-religion/bin/religion.ts` - parsing removed, usage errors, exit codes,
  help text, the doctor report
- `packages/create-religion/lib/doctor.ts` and a new `lib/doctor.test.ts` - the report shape
- `packages/create-religion/lib/dashboard.ts` and a new `lib/dashboard.test.ts` - the host check
- `packages/create-religion/README.md` - exit codes
- `src/skills/doctor/SKILL.md` and `docs/doctor.md` - only if they describe the old shape
- `.changeset/cli-surface.md` - new

## Data and contracts

All four are **load-bearing**: item 4c pins them with checks and item 4d promises them for
1.x.

**Argument grammar.** `religion [command] [dir] [flags]`, in any order.

| Input | Result |
| --- | --- |
| no positional | `install` into the current directory |
| `help`, `--help` or `-h` anywhere | `help`, whatever else is present, valid or not |
| a known command as the first positional | that command, even when a directory of the same name exists |
| an unknown first positional that is an existing directory | `install` into it |
| an unknown first positional that is anything else | usage error: unknown command, naming the closest command when one is within an edit distance of 2 |
| a second positional, when the first was a command | the directory |
| any other positional | usage error: `religion ./app status` is refused, not read as two directories |
| `--dry-run`, `--force`, `--yes`, `-y`, `--claude`, `--codex`, `--copilot`, `--opencode` | accepted with `install` and `update`; usage error with any other command |
| `--json` | accepted with `status` and `doctor`; usage error with any other command |
| any other argument starting with `-` | usage error: unknown option |

Commands are `install`, `update`, `status`, `doctor`, `dashboard`, `help`. `status`,
`doctor` and `dashboard` keep accepting a directory, from which they walk up to the project
as they do now.

**Exit codes**, the same for every command:

| Code | Meaning |
| --- | --- |
| 0 | the command did what it was asked |
| 1 | it ran and reports failure: no project found, a failing `doctor` check, conflicts left by `install` or `update`, or an unexpected error |
| 2 | usage error: nothing was read or written |

**`doctor --json`:**

```json
{
  "schemaVersion": 1,
  "healthy": false,
  "checks": [{ "name": "config", "ok": false, "detail": "...", "blocks": "work" }]
}
```

`healthy` is true exactly when every check is `ok`, which is exactly when the exit code is 0.
`checks` keeps the existing `CheckResult` shape unchanged.

**`status --json`** is unchanged: already `schemaVersion: 1`.

## Testing

The gate is on: the entry file declares `Test: npm test` and `Verify: npm test`, which runs
the ten verification checks, the command-line tool's unit tests, and the routing corpus.

In-scope logic, each with a test beside it:

| Logic | Test |
| --- | --- |
| the argument grammar, every row including each refusal | `lib/args.test.ts` |
| the doctor report and its `healthy` flag | `lib/doctor.test.ts` |
| the dashboard's host decision | `lib/dashboard.test.ts` |

Wiring in `bin/religion.ts` (printing, `process.exitCode`) is an integration surface. It is
proved by runs in a scratch directory, not by unit tests:

| Step | Evidence beyond `npm test` |
| --- | --- |
| 1 | the four refused invocations exit 2 with nothing created; the three accepted ones unchanged |
| 2 | each exit code observed from a real run |
| 3 | real `doctor --json` output, parsed, with `healthy` matching the exit code |
| 4 | `curl` against a running dashboard, with and without a foreign `Host` |
| 5 | the changeset file |

## Notes for the agent

- **Run the tool from source, in a scratch directory.** `npm run build` stages the template,
  then `npx tsx packages/create-religion/bin/religion.ts` runs it. Every run that could write
  goes into the session scratchpad, never this repository: the item-3 archive records a shell
  variable that expanded early and ran `update` against this repository by accident.
- **Refuse before touching anything.** A usage error must exit before `findProjectRoot`, the
  manifest read, or any prompt. "Writes nothing" is the property step 1 proves.
- **The parser stays pure.** It takes `argv` and a directory-exists predicate, and returns a
  value. No `process.exit`, no `console`, no filesystem inside it, which is what makes every
  row of the grammar testable.
- **Keep the existing forms working.** `npx create-religion@latest` with no arguments is the
  install line in both readmes and the walkthrough, and `status`, `doctor` and `dashboard`
  are documented without a directory. None of those may change behaviour.
- **One decision for review: conflicts exit 1.** Today an `update` that leaves files
  untouched because they were edited locally exits 0, so a script cannot tell a partial
  update from a complete one. This spec makes it 1. That includes a declined entry-file
  merge, which is already reported as a conflict, and so it also includes a non-interactive
  run without `--yes` against a repository whose `CLAUDE.md` or `AGENTS.md` it did not
  write, since that run declines the merge on its own. If you would rather it stay 0, say so
  before step 2.
- **The changeset is minor, not major.** Pre-1.0 releases have shipped removals as minors, and
  the major that makes this 1.0 belongs to item 4d.
- **Coding standards apply.** No em dashes, no plan or item numbers in anything committed,
  including the changeset and code comments.

## Outcome

The command-line tool now refuses what it does not understand, exits with fixed codes, and
versions its JSON output, which is the surface the stability statement will promise.

Unknown commands, unknown options, options that do not apply to the command, and extra
directories exit 2 with a usage error before anything is written, and a near miss names the
command it resembles. `install` and `update` exit 1 when conflicts remain. `doctor --json`
is `{ schemaVersion: 1, healthy, checks }`, with `healthy` matching the exit code. The
dashboard answers only requests addressed to its own loopback address and port.

Evidence behind it: `npm test` green (ten checks, 49 unit tests, 158 routing cases); a
`check` pass against the compiled `dist/bin/religion.js` in scratch directories observing
every refusal, every exit code, both `doctor --json` states, and eight `Host` variants
against a live dashboard; and a four-lens `audit` over the whole range.

### What went wrong on the way

**The first parser accepted `--toString` as an adapter.** Adapter flags were matched with
`in`, which walks the prototype chain, so any name every object inherits parsed as an
adapter and crashed the install with exit 1 instead of a usage error. The old parser had
the same bug; the new grammar made it a broken promise. Three audit lenses found it
independently. Repaired with `Object.hasOwn` and re-reviewed in a fresh context over 90
probe inputs.

**One drafted test asserted nothing.** The first test file ended in an assertion that
compared an expression with itself. Caught before it ran and replaced with real cases.

**A second drafted test pinned a contract nobody needed**: that a doctor report with no
checks is healthy. `runDoctor` always returns seven, so it was removed rather than frozen.

**The first scratch runs ran nothing.** zsh does not word-split a variable holding a
command, so the loop reported exit 127 for every case. Redone through a wrapper script
before any result was read as evidence.

### Deferred

- **Nine findings stay open in the ledger**, none blocking: two missing tests (F-02, F-03),
  the "nothing was read" wording (F-04), help text that does not show the grammar (F-05),
  a catch-all flag branch (F-06), thin flag coverage (F-07), an unbounded suggestion
  distance (F-08), an unused import and dead export in the dashboard (F-09), and a
  repeated adapter flag recorded twice (F-13). Three leads stay `unverified` (F-10 to F-12).
- **A declined entry-file merge is reported as "changed locally"**, which is misleading.
  The update path belongs to the next item.
- **`--version`**, the dashboard's `/state.json` shape, and the Node 20 or 22 `engines`
  question were out of scope by design.

## Findings

### 4a/F-01 [P1] closed - Adapter flags match inherited object properties

**File:** packages/create-religion/lib/args.ts:71
**Found:** 2026-09-26 by audit (scope: current; lens: security, quality, tests)
**Why it matters:** `flag.slice(2) in ADAPTERS` walks the prototype chain, so `--toString`, `--constructor`, `--__proto__` and `--hasOwnProperty` parse as adapters. The grammar promises exit 2 for any unknown option; instead `religion install --toString --dry-run --yes` crashes with `ADAPTERS[adapter].trees is not iterable` and exits 1 (reproduced in a scratch directory; nothing was written). This is the surface a stable release will freeze.
**Suggested fix:** `Object.hasOwn(ADAPTERS, name)`, with refusal cases for `--toString` and `--__proto__` in `lib/args.test.ts`.
**Resolution:** Repaired 2026-09-26: adapter names are checked with `Object.hasOwn(ADAPTERS, name)`, and `lib/args.test.ts` asserts `--toString`, `--__proto__` and `--constructor` are refused. A real run of `religion install --toString --dry-run --yes` now exits 2. Re-reviewed 2026-09-26 in a fresh-context audit of the whole of `lib/args.ts` and its tests: 90 probe cases over every `Object.prototype` name and each command were all refused as unknown options, the four real adapters are still accepted with install and update and refused elsewhere, real runs exit 2, and `Object.hasOwn` is available on every supported Node and TypeScript target. Closed.

## Landed

**Base:** a29e76714274da6466009fa0e4fbc8625bf3db86
**Commits:** 70fcef2674c73b8ce6701e15511636671f9aed5d, 7b6399886e943642cbbf75f4320083380526ffb2, 1dc7ffb9bb5e9b21349f425863cdfef24ba48431, a1b0ab13661d9652fe3f904dbcb1a36e1d5ed197, a079eb6189ef33bb107fb34dcad5554ba1ca54bc, d175f26e3e4c6f75f31111dce93c987393772559, f3865b74a30cf19f42299f30a43a14047191cc58, a3e77d2ceab591dab6b5eb245ede359a716b0a4b, 8dc9991ee296d4c37b0b01699d12ec3bb06af684
**Product paths:** packages/create-religion/lib/args.ts, packages/create-religion/lib/args.test.ts,
packages/create-religion/bin/religion.ts, packages/create-religion/lib/doctor.ts,
packages/create-religion/lib/doctor.test.ts, packages/create-religion/lib/dashboard.ts,
packages/create-religion/lib/dashboard.test.ts, packages/create-religion/README.md

The first commit also carries the plan edits that settled the stability promises and split
the item, which a reversal of this item should leave in place. The changeset at
`.changeset/cli-surface.md` travels with this item and is consumed by the next release
rather than being part of what it delivers.
