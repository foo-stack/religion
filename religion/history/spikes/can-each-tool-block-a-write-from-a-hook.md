# Can Codex, GitHub Copilot and OpenCode each block a file write from a hook?

**For:** item 21
**Settled:** yes

## Question

Can each tool run a hook or plugin that sees a file write before it lands, and stop it? The
answer per tool is yes, no, or observe-only.

Good enough meant the mechanism, the event, and whether it blocks, taken from current
documentation and confirmed by a local probe wherever the tool is installed here.

## Answer

| Tool | Mechanism | Pre-write event | Blocks? | How it blocks |
| --- | --- | --- | --- | --- |
| Codex | `hooks.json` or `[hooks]` in `config.toml`, project `.codex/` or user `~/.codex/` | `PreToolUse`, matcher `apply_patch`, `Edit` or `Write` | yes | exit `2` with the reason on stderr, or `hookSpecificOutput.permissionDecision: "deny"` with `permissionDecisionReason` |
| GitHub Copilot CLI and cloud agent | `.github/hooks/*.json` | `preToolUse`, tools `edit` and `create` | yes | stdout `permissionDecision: "deny"` with a required `permissionDecisionReason`, or exit `2` |
| OpenCode | JS or TS plugin in `.opencode/plugins/` | `tool.execute.before(input, output)` | yes | throw an `Error` |

All three have the other two events Religion uses:

| Religion hook | Codex | Copilot | OpenCode |
| --- | --- | --- | --- |
| rendered-output guard, drift warning (before a write) | `PreToolUse` | `preToolUse` | `tool.execute.before` |
| injection scan (after a read or fetch) | `PostToolUse`, but hosted `WebSearch` is not covered | `postToolUse` | `tool.execute.after` |
| handoff rewrite (end of turn) | `Stop` | `agentStop` | `session.idle` (inferred from the event list, not documented as turn end) |

## Evidence

Documentation only, read on 2026-10-21:

- Codex: https://learn.chatgpt.com/docs/hooks (redirected from developers.openai.com/codex/hooks).
  It lists `apply_patch` file edits as covered by `PreToolUse`, alongside Bash, `exec_command`,
  MCP and local function tools.
- Copilot: https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-hooks-reference.
  It names `edit` and `create` as the file-write tools, and maps `apply_patch` and
  `str_replace_editor` to `Edit` in its Claude-compatible format.
- OpenCode: https://opencode.ai/docs/plugins. Its `.env` example throws inside
  `tool.execute.before` to stop a `read`.

## What this means for item 21

Every tool can host the guard, so item 21 splits one sub-item per tool, as planned. Each
sub-item carries a constraint the docs surfaced:

- **Codex**
  - The `apply_patch` input is a patch held in a `command` string, not a file path, so the
    guard has to read the paths out of the patch headers.
  - Project hooks run only after the user trusts them with `/hooks`. Install cannot turn them
    on silently, so setup and doctor have to say so.
- **Copilot**
  - `toolArgs` is typed `unknown`, and the docs never name the field that holds the path.
    The sub-item's first step captures a real `edit` and `create` payload before writing the
    guard.
  - Timeouts fail open, so the guard has to stay fast.
  - In the cloud agent, `ask` counts as `deny`, and only `bash` command entries run.
- **OpenCode**
  - The guard is a plugin module, not a shell command, so it is a new rendered artifact
    rather than a copied `.mjs` hook.
  - The docs name only `read` and `shell`. The names of the write tools need the same capture
    step as Copilot's.

Off the table: nothing. No tool is observe-only.

## Still unknown

- **No local probe.** None of the three tools is installed here, and a spike installs
  nothing. Every row above rests on documentation, not on a run.
- The exact argument shapes for Copilot's and OpenCode's write tools.
- Whether Codex has specialized edit paths that skip hooks. Its docs warn that some tool
  paths "can opt out", and call hooks "a useful guardrail, not a complete enforcement
  boundary".
- One third-party guide (Akto) says Codex hooks cover Bash only. That contradicts the
  official page, which is the source this record follows.

## Budget

1 hour allowed, about 20 minutes used. No code was written, so nothing needed deleting.
