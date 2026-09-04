# Rules live in prose; hooks only enforce what the prose already requires

Every rule is written so that all supported tools behave identically. Hooks are a second
line of defence for the one tool that can run them.

**Why a hook may never be the only place a rule exists.** Three of the four supported tools
cannot run hooks. A rule that exists only as a hook silently applies to one tool and not the
others, which is worse than no rule, because it looks enforced.

**What a firing hook means.** Almost always that the prose it corresponds to was not
followed, and the fix is to ask why, not to tighten the hook.

**What would change this.** Universal hook support across the supported tools, which would
make an enforcement-first rule safe.

**Reversed:** no.
