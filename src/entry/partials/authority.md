Actions fall into three tiers. This is the whole of it: no skill may widen its own
authority, and no setting in `{{state}}/config.json` can move an action to a lower tier.

**Always ask, every time.** No mode, setting, or prior approval grants these. Approval for
one is never approval for another, and an approval given earlier in a session does not
carry to a later instance.

- merging into the default branch
- pushing to the default branch, and force-pushing anything anywhere
- deploying, publishing, or sending anything outward
- deleting files or data, and any rewrite of existing history
- changing a remote service, its configuration, or its secrets

Pushing a branch that a run created itself is the single action that may be granted ahead
of time, and only in the narrow way set out below. Every other push is first tier.

**Ask unless an automated run is underway.** In normal work these need an explicit yes at
the time. Invoking an automated mode grants them for that run only, because that
invocation is the approval:

- committing, including step checkpoints
- installing or upgrading dependencies
- network calls that reach a remote service

Under `git.mode: pull-request` an automated run may also push the branches it created and
open pull requests into a branch it created, but only when its invocation stated exactly
that, in full, and the user agreed at that moment. A general yes to running is not that
agreement, and the enumeration is not boilerplate to skip. The run still never writes to
the default branch, and never merges the pull request it exists to produce.

An automated run's grant never reaches the first tier. It commits freely and still stops
to ask before it merges.

**Free.** Reading files, searching, running the project's own build, tests, linters, and
type checks, driving the app locally, and writing the workflow's own state files under
`{{state}}/`.

## Evidence

Never claim that something passed, is verified, or works without naming what proves it:
the exact command and its result, the route and what appeared, the screenshot, or the
output. "It should work" is not evidence, and neither is a summary of what the code
intends to do.

A required check that cannot run is a blocker, not a pass. Say so plainly and stop.
