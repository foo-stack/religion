# Skills are authored once and rendered into one tree per adapter

A skill exists once as source. The build emits a copy per adapter, substituting that tool's
own invocation syntax, directory, and entry file.

**Why not one file that serves every tool.** Because it would have to hedge. A skill that
says "run `/feature`, or `feature`, depending on your tool" is worse for every reader than
four files that each say the right thing. The hedging compounds: every cross-reference
between skills carries the same apology.

**Why not maintain the trees by hand.** Four copies of twenty-three skills drift within a
week, and the drift is invisible until someone using the third-most-popular tool hits it.

**How drift is prevented.** The rendered trees are committed so the skills are readable in
the repository, and the build re-renders and byte-compares them. Editing a rendered tree is
caught by the check and blocked by a hook.

**What would change this.** Convergence on a single cross-tool invocation convention.

**Reversed:** no.
