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
| `PreToolUse` on Bash | a command that pushes, deploys, publishes, force-updates a ref, or merges | asks, naming the approval that is missing | Authority, first tier |
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

Long base64 blobs are decoded and asked the same questions, because a regex over literal
text is defeated by one round of encoding and that is cheap enough to be the first thing
anyone tries. A decoded blob has to look like text before it is scanned, which is what
keeps every checksum and integrity string in the tree from being reported.

This is still a blocklist of known wordings. It raises the cost of the obvious attempt and
of the obvious attempt wearing a disguise. It does not recognise novel phrasing, and it
does not look inside an archive or an image.

## What the patterns actually match

They match how a command is usually written, not what it does. `bash deploy.sh` pushes and
passes silently. So does a one-line script that deletes a tree, or `find -delete`, or the
same effect spelled with a different tool. Every pattern here has that property.

This is not a gap to close by adding more patterns. The next spelling is always one
substitution away, and a longer list mostly produces false positives: a pattern broad
enough to catch every script would ask about every script.

Deletion is the case where that arithmetic failed outright, so it is not covered here at
all. `rm -rf` has more everyday spellings than the other actions put together, most of them
harmless, and a pattern for it asked constantly about throwaway directories while missing
the equivalent one-liner entirely. A guard that catches the common spelling of a dangerous
action and silently misses the rest is worse than no guard, because the gap is invisible to
the person relying on it. Deleting data is still first tier; it is carried by the prose,
which applies to all four tools rather than to one way of typing it.

That is the general rule these hooks live under. The prose is the enforcement. This is a
reminder for the one tool that can run reminders, and it is worth exactly what a reminder
is worth.

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
