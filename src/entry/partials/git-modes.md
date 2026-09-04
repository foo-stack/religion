`git.mode` decides where work lands. It ships as `trunk`.

**`trunk`** keeps work on the branch you already have checked out. Nothing is branched,
nothing is merged, and the first tier of the authority rules stays dormant because there
is no merge to ask about. This is the default because creating branches is a decision
that belongs to you, not to a workflow.

**`branch-per-item`** creates a branch per work item using the configured prefix, then
squash-merges it once the work is done and you have said yes. The merge and any push are
asked for separately: agreeing to a merge is never agreement to push.

`git.checkpoints` decides what happens to intermediate work, in either mode:

| Value | Behavior |
| --- | --- |
| `none` | Steps accumulate in the working tree; completion makes one commit for the whole item. |
| `every-step` | Each approved step becomes its own commit, left in place. |
| `squash` | Each approved step is committed, then completion collapses them into one. |

In `trunk` mode, `squash` collapses commits on the branch you are working on, which
rewrites local history. That is a first-tier action: it is never done without asking, and
never done at all when any of those commits has already been pushed.
