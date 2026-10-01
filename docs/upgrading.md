# Updating a project

Religion's files in your repository come from the version that installed them. `update`
brings them up to the version you run, and never touches what is yours. This page walks
through what it reports and what to do about each outcome. What it guarantees, and what it
never does, is in the [stability statement](stability.md#what-a-1x-update-guarantees).

Run it from the project root:

```bash
npx create-religion@latest update
```

or `religion update` when the package is installed globally. The examples below use the
second form. Every command here was run, and every line of output shown is quoted from that
run, though some are left out where they add nothing.

## Look before it writes

`--dry-run` plans the update and writes nothing. On a project a 0.5.0 install left behind,
after `setup` had filled in its Commands section:

```bash
religion update --dry-run
```

```text
Adapters: Claude Code
  create   1
  update   1
  keep     21  (your files, never overwritten)
  conflict 0
  rebuilt  1  (your sections kept, original backed up)

Dry run. Nothing written.
```

The summary counts what will happen to each file:

| Line | Meaning |
| --- | --- |
| `create` | new in this version, and not in your project yet |
| `update` | changed in this version, and untouched by you since it was installed, so it is replaced |
| `keep` | a file under `religion/`: yours, never overwritten |
| `conflict` | changed in this version, but you edited it too, so it is left alone |
| `merge` | an entry file you wrote yourself, waiting for your decision |
| `merged` | an entry file already carrying Religion's markers: only what is between them is replaced |
| `rebuilt` | an entry file Religion installed and you edited: rebuilt around your sections |
| `remove` | no longer shipped, and untouched by you, so it is removed |
| `release` | no longer shipped, but you edited it, so it is left in place and becomes yours |
| `linked` | reached through a symbolic link, so it is never written |

Lines that would read zero are left out, apart from the first four.

## Run it

```bash
religion update
```

```text
Wrote 2 file(s).
Rebuilt 1 entry file(s) around the sections you wrote. The originals are in religion/.state/backups.
Backed up 1 file(s) to religion/.state/backups before changing them.
```

The rebuild happens once. Religion's first install writes `CLAUDE.md` and `AGENTS.md` without
markers, and `setup` edits them, so the first update after that keeps your title, your
Commands and any section you added, puts Religion's sections back between markers, and backs
the original up. From then on, an update replaces only what is between the markers:

```text
Merged 1 entry file(s), keeping what you wrote.
```

It exits 0 when everything it planned was done, and 1 when something was left for you, as
below.

## When a file you edited has changed

```text
  conflict 1
    .claude/skills/audit/SKILL.md
```

```text
1 file(s) were changed locally and left alone.
Review them, then re-run with --force to replace them (originals are backed up).
```

The update exits 1. Your version is still in place, and the new one was not written. Look at
what you changed, then either keep your version and leave the conflict reported, or replace
it:

```bash
religion update --force
```

```text
Backed up 1 file(s) to religion/.state/backups before changing them.
```

## Getting a file back

Every file the update rebuilt, merged for the first time, or replaced with `--force` was
copied first to the same path under `religion/.state/backups/`. Later merges, which replace
only what is between the markers, keep no copy. To undo one, copy it back:

```bash
cp religion/.state/backups/.claude/skills/audit/SKILL.md .claude/skills/audit/SKILL.md
```

A later backup of the same file replaces the earlier one, so copy out anything you want to
keep before running `update --force` again.

## When your own entry file is there

Installing over a repository that already has a `CLAUDE.md` or `AGENTS.md` asks before
touching it:

```text
Religion can append its own sections to them inside markers, keeping everything
you wrote exactly where it is. Later updates then replace only what is between
those markers. The originals are backed up first.
```

Accept, or pass `--yes`, and the file is merged:

```text
Merged 1 entry file(s), keeping what you wrote.
Backed up 1 file(s) to religion/.state/backups before changing them.
```

Decline, or run without a terminal and without `--yes`, and it is left exactly as it was, and
the run exits 1:

```text
1 file(s) of yours were not merged, so Religion's instructions are not in them.
Run update again and accept the merge, or pass --yes, to add them.
```

## When a version stops shipping a file

```text
  remove   1  (no longer shipped)
  release  1  (no longer shipped, but edited by you, so left alone)
    .claude/skills/tweaked/SKILL.md
```

```text
Removed 1 file(s) this version no longer ships.
Left 1 file(s) this version no longer ships, because you edited them. They are yours now.
```

Only files in Religion's own skill and hook folders are ever removed, and only when they
still match what was installed. A released file is yours from then on: later updates do not
report it again. If a removed file was a hook, `.claude/settings.json` may still run it;
remove that entry by hand, since `update` never rewires the settings file.

## When a file is a symbolic link

```text
  linked   1  (reached through a symbolic link, never written)
    .claude/skills/audit/SKILL.md
```

```text
1 file(s) are reached through a symbolic link and were left alone, since writing
them would write wherever the link points. Replace the links with real files and run again.
```

The update exits 1. Writing through a link would put Religion's files wherever it points,
which could be outside your repository, so it never does. If the link was deliberate, keep
it and accept the report; otherwise replace it with a real file.

## When the project is newer than the tool

```text
This project was installed by create-religion 9.0.0, newer than this 0.5.0. Run `npx create-religion@latest update` instead.
```

Nothing is written, whatever the options, and the run exits 1. Running an older version over
a newer install would quietly downgrade it.

## What it leaves alone

- **Everything under `religion/`** once it exists: your plans, the active spec, the ledger,
  the history, and the guidance files Religion wrote there at install. A fix to that
  guidance reaches new installs only.
- **`.claude/settings.json`** once it exists. Religion writes it on the first install; after
  that, every update says so:

  ```text
  .claude/settings.json already exists and was left alone.
  If a hook is missing, compare it with a fresh install's .claude/settings.json.
  ```

  If you have not changed the file since Religion wrote it, the hooks that version shipped
  are enabled. A hook added by a later version is not: `religion/.state/settings-template.json`
  is seeded once like the rest of `religion/` and is never refreshed, so install into an
  empty directory and copy the new entry from the `.claude/settings.json` there.
- **The files of an adapter you stop choosing.** `religion update --claude` on a project that
  also has `.agents/skills` leaves that tree where it is.
