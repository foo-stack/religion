# Actions fall into three authority tiers, and configuration cannot move them

Merging, pushing to the default branch, deploying, deleting, and changing remote services
always ask. Committing, installing dependencies, and reaching a remote are granted for the
duration of an automated run. Reading, searching, building, testing, and writing the
workflow's own state files are free.

**Why not per-action configuration.** A settings file that can grant anything eventually
grants everything, usually on the day someone is in a hurry. Fixing the tiers in prose that
no skill and no setting may widen means the dangerous list is short, readable, and the same
in every project.

**Why the automated run grants a middle tier at all.** Without it an unattended run stops
every few minutes to ask about a commit, which makes it attended. The invocation is the
approval, and it is bounded: it never reaches the first tier.

**What would change this.** A first-tier action that turns out to be genuinely reversible,
or a second-tier action that turns out not to be.

**Reversed:** partly. Pushing began as first tier for every remote and every branch. It was
later narrowed to the default branch, once pull-request mode made pushing a topic branch a
routine, reversible act.
