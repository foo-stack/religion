# State files are seeded once, never re-rendered

The skills and entry files are regenerated on every build and drift-checked against their
source. The files under the state directory are written once, when they are absent, and then
left alone.

**Why not treat them as managed like everything else.** Because they stop being templates
the moment a project uses them. The plans, the active spec, the findings ledger and the
history hold real work within a day. Re-rendering would destroy it, and drift-checking would
flag every genuine edit as an error.

**How the two kinds are told apart.** By destination, not by name: a render into the package
template writes everything, a render into a working project writes only what is missing.

**What would change this.** A state file that turns out to be purely structural, with no
project content in it, could safely become managed.

**Reversed:** no. This replaced an earlier build that re-rendered everything, found while
testing an installation that already held real work.
