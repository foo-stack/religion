Any skill that changes something writes an activity record to
`{{state}}/.state/run.json` as its **first action**, before inspecting the project or
calling anything else, and replaces it at meaningful milestones. Read-only skills do not.

This is generated local state. It is never committed, never part of a work commit, and
never contains secrets, raw output, prompts, or user content.

```json
{
  "schemaVersion": 1,
  "command": "auto",
  "status": "running",
  "summary": "Building the remaining plan",
  "detail": "Implementing item 3.",
  "boundary": "local-only",
  "startedAt": "<ISO-8601>",
  "updatedAt": "<ISO-8601>",
  "resumeCommand": "{{cmd:auto}} resume",
  "progress": { "current": 2, "total": 5, "label": "items" },
  "item": { "id": "3", "title": "Export reports" }
}
```

`status` is `running`, `blocked`, `ready`, or `completed`. Use `ready` when a skill reached
its intended handoff, such as an unattended run waiting for review. Use `blocked` with the
exact recovery command when work can resume. `boundary` is `read-only`, `reviewed`, or
`local-only`. Everything after `updatedAt` is optional.

An `auto` run given explicit items also writes `items`, the plan numbers it holds as strings,
such as `["6", "7", "8"]`, on every write in the checkout it runs from, starting once preflight
knows which that is. Other worktrees pass those items over, including the ones the run has not
reached yet. Only when none of them is left to build, after any aggregate pull request is open,
does its last write, `completed`, keep just the items it completed, and a parent number only
when all of its sub-items were; when none is left, a run that completed nothing releases at
once. Every earlier stop keeps them all and is `blocked`.

Writing this record grants nothing and bypasses nothing. A failure to write it is reported
and ignored: reporting must never turn into a workflow failure.
