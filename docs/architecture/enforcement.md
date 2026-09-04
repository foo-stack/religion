# Enforcement

Religion's rules live in prose, in the Authority section of the generated entry files.
Hooks are a second line of defence for Claude Code, and nothing more.

## The rule

**Every rule is written so all four supported tools behave identically. A hook may only
enforce something the prose already requires.**

A rule that exists only as a hook is a bug: Codex, GitHub Copilot, and OpenCode cannot run
hooks, so such a rule would silently apply to one tool and not the others. When a hook
fires, the correct fix is almost always to find the prose it corresponds to and ask why
the model did not follow it.

This keeps the cross-tool promise honest. Claude Code is not a stricter Religion, it is
the same Religion with a safety net.

## The hooks

Four, matched to the prose they back up.

| Hook | Fires on | Enforces | Prose it backs |
| --- | --- | --- | --- |
| `PreToolUse` on Bash | a command that pushes, deploys, publishes, force-updates a ref, or merges | blocks it, naming the approval that is missing | Authority, first tier |
| `Stop` | end of a turn | regenerates `religion/context/handoff.md` from the state files | the handoff contract |
| `UserPromptSubmit` | any prompt, when the plans have changed since the overview was generated | injects a stale-overview notice so the next action refreshes it | the overview freshness rule |
| `PreToolUse` on Edit and Write | a write to a rendered adapter tree in a Religion source checkout | blocks it, pointing at the authored source instead | the never-edit-rendered-output rule |

The fourth applies only when working on Religion itself, not to installed projects.

## What hooks deliberately do not do

- **Grant authority.** A hook never approves anything. It can only block, or add context.
- **Replace a gate.** The completion gate on unresolved high-severity findings is enforced
  by the completion skill reading the ledger, not by a hook, because every tool must
  enforce it.
- **Silently repair.** A hook that fires means something upstream went wrong. It reports
  and stops rather than fixing the situation and continuing.

## Failure behavior

A hook that blocks legitimate work is a defect in the hook, not a reason to work around
it. The escape is to say what you want and approve it explicitly, which lifts the block
through the normal approval path. Editing or disabling a hook to get past it defeats its
only purpose.

A hook that cannot run must not fail the work. The prose still governs, and the tool
continues without the safety net.
