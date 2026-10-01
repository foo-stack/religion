# Stability

From 1.0, `create-religion` follows semantic versioning over the surface this page
describes. Everything named here is public: a 1.x release will not remove it, rename it, or
narrow it. Everything the page calls internal can change in any release.

The public surface is also written down as data, in
[`packages/create-religion/surface.json`](../packages/create-religion/surface.json), and the
verification suite fails when the code and that record disagree. Each promise below names
the check or test that holds the code to it. Where nothing does yet, it says so under
[Known limitations](#known-limitations) rather than promising anyway.

## What is public

### Commands and options

| Command | Options |
| --- | --- |
| `install [dir]` | `--dry-run`, `--force`, `--yes`, `-y`, `--claude`, `--codex`, `--copilot`, `--opencode`, `--help`, `-h` |
| `update [dir]` | the same as `install` |
| `status [dir]` | `--json`, `--help`, `-h` |
| `doctor [dir]` | `--json`, `--help`, `-h` |
| `dashboard [dir]` | `--help`, `-h` |
| `help` | `--help`, `-h` |

Run as `npx create-religion <command>`, or `religion <command>` when installed globally. With
no command it installs into the current directory, and a first word that names an existing
directory installs into it. Anything else it does not understand, an unknown command or
option, an option the command does not take, or a second directory, is refused before
anything is written. `help`, `--help` or `-h` anywhere shows the help and nothing
else.

**Held by:** the surface check, "the public surface matches its record", which compares this
grammar with the option table the parser runs on; and the parser's tests in
`packages/create-religion/lib/args.test.ts`, one or more per rule, each refusal included.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | the command did what it was asked |
| `1` | it ran and reports failure: no project found, a failing `doctor` check, conflicts, declined merges or linked files left by `install` or `update`, a project installed by a newer version, or an unexpected error |
| `2` | usage error: nothing was written |

`--dry-run` plans without writing and exits 0 even when the plan holds conflicts, so a
script that needs to know runs the update itself.

**Held by:** the help text and the package readme, which list the three codes with the same
meanings. No automated check runs the tool and compares its exit codes yet.

### JSON output

`religion status --json` and `religion doctor --json` each print one object carrying
`schemaVersion: 1`.

- **`status`**: `next` (`command`, `because`), `plan` (`done`, `total`, `nextItem`), `work`
  (`active`, `title`, `type`, `status`, `stepsDone`, `stepsTotal`, `nextStep`), `findings`
  (`total`, `blocking`, `byStatus`), `overview` (`present`, `fresh`), and `warnings`.
- **`doctor`**: `healthy`, true exactly when the exit code is 0, and `checks`, each with
  `name`, `ok`, `detail` and `blocks`.

A field may be added in a minor release, so read the fields you need rather than comparing
whole objects. A field is never removed, renamed, or given a different type within 1.x.

**Held by:** the surface check, which runs both commands' output for an idle and a busy
project against the shapes in the record and fails on a missing field or an unrecorded one.

### Skills

The twenty-six skill names are public: `audit`, `auto`, `browser-tests`, `capture`, `check`,
`ci`, `complete`, `debug`, `discovery`, `distill`, `doctor`, `extend`, `feature`, `fix`,
`implement`, `overview`, `prototype`, `refactor`, `release`, `rollback`, `scout`, `setup`,
`spike`, `status`, `tests`, and `try`.

So is how each is invoked: `/name` in Claude Code, and `$name` in Codex, GitHub Copilot and
OpenCode. What a skill says, the steps it takes, and how it words its reports are not
promised, and improve in any release.

**Held by:** the surface check, which reads the names from the skill sources and fails when
one is removed or renamed.

### Adapters

| Adapter | Installs |
| --- | --- |
| `claude` (Claude Code) | `.claude/skills`, `.claude/hooks`, `CLAUDE.md`, and `.claude/settings.json` when absent |
| `codex` (Codex) | `.agents/skills`, `AGENTS.md` |
| `copilot` (GitHub Copilot) | `.agents/skills`, `AGENTS.md` |
| `opencode` (OpenCode) | `.agents/skills`, `AGENTS.md` |

Every adapter also installs the `religion/` directory. All four are promised: adding an
adapter is a minor release, and dropping one is a major release.

**Held by:** the surface check, which records each adapter with its trees and entry file.

### Settings

Every key in `religion/config.json`, and the values it accepts:

| Setting | Values |
| --- | --- |
| `schemaVersion` | `1` |
| `workflow.stepReview` | `every`, `item` |
| `workflow.parallelSteps` | `true`, `false` |
| `git.mode` | `trunk`, `branch-per-item`, `pull-request` |
| `git.checkpoints` | `none`, `every-step`, `squash` |
| `git.featureBranchPrefix` | a lowercase prefix ending in `/` |
| `git.fixBranchPrefix` | a lowercase prefix ending in `/` |
| `git.rollbackBranchPrefix` | a lowercase prefix ending in `/` |
| `git.refactorBranchPrefix` | a lowercase prefix ending in `/` |
| `git.integrationBranchPrefix` | a lowercase prefix ending in `/` |
| `verification.logicTests` | `when-configured`, `required` |
| `verification.uiEvidence` | `when-available`, `required` |
| `qualityGates.audit` | `manual`, `when-sensitive`, `always` |
| `qualityGates.check` | `manual`, `when-behavioral`, `always` |
| `security.blockInjection` | `true`, `false` |
| `refactor.maxFileLines` | a positive integer |
| `refactor.maxFunctionLines` | a positive integer |
| `auto.maxItems` | a positive integer, or `null` for no limit |
| `auto.maxRepairAttempts` | an integer from 0 through 10 |
| `auto.finalAudit` | `true`, `false` |

What each one changes is in the [configuration reference](architecture/config.md). A setting
is never removed, and a value it accepts is never withdrawn, within 1.x.

**Held by:** the surface check, which records every key, with its values for the enumerated
settings and the type of its default for the rest; and `doctor`, which fails on an
enumerated setting holding a value outside its list. Ranges, formats and booleans are not
checked; see [Known limitations](#known-limitations).

### Where state lives, and who owns it

| Path | Owner | What 1.x promises |
| --- | --- | --- |
| `religion/` | you | a missing file is created; one that exists is never rewritten by `update`. The handoff, `religion/context/handoff.md`, is rewritten by a hook each turn |
| `religion/.state/` | the tool | machine state it rewrites: the install manifest, the activity record, backups. Its `settings-template.json` is seeded once and never refreshed |
| `.claude/skills`, `.claude/hooks`, `.agents/skills` | the tool | replaced by `update` when you have not edited them |
| `CLAUDE.md`, `AGENTS.md` | shared | Religion's until the first update or merge gives them markers; after that its part lives between them and everything outside is yours. That first rebuild keeps your title, your Commands and any section you added; edits inside Religion's sections, and import lines you added, survive only in the backup |

The state files keep their names and locations within 1.x, and the formats the tool reads
from them (the build plan's checkboxes, the active spec's steps, the findings ledger's
headings, the overview's source stamp) keep parsing.

**Held by:** the parser tests in `packages/create-religion/lib/state.test.ts`, for the build
plan, the spec, the ledger and the overview's stamp; the install tests in `packages/create-religion/lib/install.test.ts`; and the upgrade check
described under [What an update guarantees](#what-a-1x-update-guarantees).

### Node

Node 22 or later, as `engines` declares (`>=22`). CI runs the suite on Node 22 and Node 24.
A Node line may stop being supported in a minor release once it has reached its
end-of-life; dropping a line that is still supported is a major release.

**Held by:** the surface check, which records the `engines` range, and the CI job that runs
the suite on Node 22.

## What is internal

These can change in any release, and nothing outside this repository should depend on them:

- **Skill wording and steps**, and the reference files beside each skill
- **The token vocabulary** skills are authored in, and how they are rendered per tool
- **Adapter definitions** in the source, as opposed to the adapters and paths above
- **Library modules** under the package's `lib/` and `dist/`: there is no programmatic API
- **The dashboard's data**, `/state.json`, which exists to feed its own page
- **The verification checks** and their names
- **The hooks' behaviour**, beyond their being installed

## Three promises

**Religion never reaches outside your repository.** The command-line tool, the hooks and the
dashboard make no outbound network connections and write nothing outside the project
directory; the dashboard listens on the loopback address only and answers only requests
addressed to it. Reversing any of that is a major release. What an agent does while
following a skill is governed by the authority tiers in your entry file, not by this
promise.

**Held by:**

- the check "shipped code opens no network connection", which parses every shipped file and
  hook as TypeScript does and allows imports only from a fixed list; refuses any other module
  load and the globals and members that reach the network or the module loader; allows
  `process` only the members the tool uses; lets the dashboard use `node:http` only to serve,
  its page make only its one request for its own data, and its responses carry only one
  exact content security policy; lets the hook settings run only the shipped hooks; lets
  nothing run when the package is installed, which includes having no dependencies; and holds
  the build and the published files to what it reads
- the probe test in `scripts/network-probes.test.ts`, which replays every evasion and every
  legitimate pattern reviewers have tried against that check, 180 so far, and fails if any
  verdict changes
- the install tests that a path reached through a symbolic link, dangling or not, is never
  written, and that a recorded path outside Religion's own trees is never removed
- the hook test in `scripts/hooks.test.ts` that the handoff is never written through a link
- the dashboard test that starts it and checks its loopback address, its refusal of a
  foreign host, and the policy on every response

The check reads code rather than running it, so it catches a change that reaches for the
network by accident. Code written deliberately to hide a connection is a matter for the
review every change to shipped code goes through.

**The four adapters stay.** See [Adapters](#adapters).

**Third-party extensibility stays internal.** Skill sources, the token vocabulary and the
adapter definitions are not a public API. Opening them later would add a surface rather than
break one, which is why they are left out of the promise rather than ruled out.

## What a 1.x update guarantees

| Guarantee | Held by |
| --- | --- |
| A file under `religion/` that already exists is never rewritten | "a state file that already exists is never rewritten", and the upgrade check, which edits every file the project owns and fails if any changes |
| A managed file is replaced only while it still matches what was installed | "a managed file still matching the manifest is updated", "a locally edited managed file is a conflict", "a local edit survives three consecutive updates" |
| A file you edited is left alone and reported; `--force` replaces it after backing it up | "a conflict is left alone unless forced", "forcing a conflict backs the original up first" |
| An entry file you wrote is merged only if you agree, and only between markers | "an existing entry file is offered as a merge, not a conflict", the merge tests in `lib/merge.test.ts` |
| An entry file Religion installed and `setup` edited is rebuilt around your sections, once, with the original backed up | "an unmarked entry file Religion installed is rebuilt, not merged", "a rebuild keeps their sections once and backs the original up" |
| A file a newer version no longer ships is removed if unedited and left to you if edited, and only ever from Religion's own skill and hook folders | "a file the template dropped is removed when unedited and released when edited", "a recorded path outside Religion's trees is never acted on" |
| A project installed by a newer version is refused before anything is written | the `manifestRefusal` tests |
| Nothing is written through a symbolic link | the link tests in `lib/install.test.ts` |
| A project the last release installed updates cleanly | the upgrade check, "a project the last release installed updates cleanly" |

What `update` never does: refresh a seeded file under `religion/`, including the guidance
files Religion wrote there at install and the settings template; rewire an existing
`.claude/settings.json`; or remove the files of an adapter you stop choosing. [Updating a project](upgrading.md) walks through
every outcome.

## What counts as a breaking change

| Release | Changes |
| --- | --- |
| **Major** | removing, renaming or narrowing anything public above; changing what an exit code means; removing a JSON field or changing its type; changing what an update guarantees; moving where state lives; changing a state file's format so an existing one no longer reads; changing the entry files' marker text; dropping an adapter; dropping a Node line that is still supported |
| **Minor** | adding a command, option, skill, setting, value, adapter or JSON field; dropping a Node line after its end-of-life |
| **Patch** | a fix that changes nothing public |

Anything internal, including what a skill says and the steps it takes, can change in a
release of any kind.

## Known limitations

- **Exit codes** are documented, but no automated check runs the tool and compares them.
- **Hook wiring** reads its template, `religion/.state/settings-template.json`, without
  checking whether it is a symbolic link, so a repository that links it elsewhere can have
  that file's contents copied into a new `.claude/settings.json`. It never writes through a
  link.
- **Settings are only partly validated.** `doctor` checks the enumerated settings. Booleans,
  numeric ranges and branch prefix formats are not checked, so it accepts `"parallelSteps":
  "yes"`, and the record holds the other settings only by the type of their default.
- **The settings template is never refreshed.** `religion/.state/settings-template.json` is
  seeded at install like everything under `religion/`, so it wires the hooks of the version
  that installed the project. To see what the current version wires, look at a fresh
  install's `.claude/settings.json`.
- **A retired hook can stay wired.** When a version stops shipping a hook, `update` removes
  the unedited script, but it never rewires `.claude/settings.json`, which can still run it
  and then fail. Remove that entry by hand.
- **Seeded guidance is never refreshed.** A fix to a file Religion wrote under `religion/`
  reaches new installs only.
- **The dashboard** is readable by any process on the same machine while it runs: the
  loopback address is not per-user.
- **The dashboard escapes the text it shows.** A new field rendered without escaping would
  let text in the repository add a link to the page, which no check can see.
- **Windows** is not tested.
