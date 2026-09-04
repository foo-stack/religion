# The installer is deliberately monorepo-blind

One application at the repository root, one state directory. The installer does not detect
workspaces, does not scope state per package, and does not try to work out which package a
work item belongs to.

**Why not detect workspaces.** It was going to. Per-package state was planned and then cut,
because every monorepo is arranged differently and a detector that is right most of the time
produces state directories in places nobody expected. Being predictably simple beats being
usually clever.

**What this costs.** A monorepo gets one shared workflow rather than one per package. In
practice that has been fine: the plans describe the product, not the packages.

**What would change this.** Evidence that people are installing separately into several
packages of the same repository and finding the shared state confusing.

**Reversed:** yes, before it shipped. The earlier decision adopted monorepo awareness; this
one removed it and kept the simpler behaviour.
