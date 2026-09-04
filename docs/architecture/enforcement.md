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
| `PreToolUse` on Edit and Write | a write to a rendered adapter tree in a Religion source checkout | blocks it, pointing at the authored source instead | the never-edit-rendered-output rule |
| `PostToolUse` on Read, WebFetch and WebSearch | content carrying known prompt-injection signatures | warns, naming the file and what it tried to do | the untrusted-input rule |

The third applies only when working on Religion itself, not to installed projects.

## What ships is scanned before it ships

Religion publishes prompt text, not code that runs. Every skill and state file lands in
someone else's context as trusted, always-loaded instructions, in the one place the
untrusted-input rule deliberately does not apply: a project is supposed to trust these
files. A poisoned line here would be read as an instruction by every install.

So the verification suite scans what the package ships, and the sources it is built from,
for known injection signatures and for anything shaped like a credential. It runs locally,
on every pull request, and inside the release workflow before publishing, because that
workflow runs the same suite.

The rule document and the scanner are exempt: both quote these phrasings in order to
describe them, and a check that fires on its own documentation is one people learn to skip.

This is a blocklist of known wordings. It raises the cost of the obvious attempt. It does
not recognise novel phrasing, and it does not decode content hidden inside an encoded blob.

## What a hook does when it breaks

Every hook declares what happens if it crashes, and the two guards declare the same thing:
**they ask.**

A guard that fails open becomes the exact outcome it exists to prevent. The command runs,
nobody is asked, and nothing says the check was skipped. That is worse than having no guard,
because the absence is invisible.

Failing closed is not the answer either. One malformed payload from a runtime change would
block every push, merge and publish until somebody edits a hook, and the rule these hooks
back up says not to edit them to get past a block.

So a crashed guard degrades to the prompt it would have raised anyway, naming the failure.
The worst case of a bug in a guard is one extra prompt, rather than a first-tier action
that silently went unchecked. The handoff hook is advisory and fails open, because a missing
handoff file costs a re-read and nothing else.

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
