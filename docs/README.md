# Documentation

Two audiences, kept apart on purpose.

## Using Religion

Start here if you have installed it, or are deciding whether to.

| Document | What it is for |
| --- | --- |
| [Getting started](getting-started.md) | Install onto a repository you already have, through `setup` and the two plans, to the point where your first item is ready to spec |
| [What the loop actually feels like](the-loop.md) | One real work item walked from `feature` to `complete`: what you see, what you approve, and what it costs you |
| [What to do when doctor complains](doctor.md) | Every check `doctor` runs, what each failure means, and the fix that clears it |

## Understanding how it is built

Start here if you are extending Religion, changing a skill, or working out why something
behaves as it does.

| Document | What it is for |
| --- | --- |
| [Configuration](architecture/config.md) | Every setting in `religion/config.json`, its allowed values, and what each one changes |
| [State model](architecture/state-model.md) | Every state file, who writes it, and who reads it. The one-writer rule and why it makes fan-out safe |
| [Enforcement](architecture/enforcement.md) | What is carried by prose, what is carried by a hook, and why the split falls where it does |
| [Releasing](architecture/releasing.md) | How a change reaches npm |

## Why things are the way they are

| Document | What it is for |
| --- | --- |
| [Decisions](decisions.md) | Every decision taken while building Religion, in order, one line each |
| [Decision records](architecture/decisions/README.md) | The twelve where the alternative was real: what was decided, what was rejected, and what would have to change to revisit it. That index lists all twelve |

## Not here

The skills themselves are the reference for what each one does. They are readable in
`.claude/skills/` and `.agents/skills/`, one directory per skill, and they are what your
tool actually loads.
