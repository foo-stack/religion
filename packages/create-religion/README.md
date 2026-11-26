# create-religion

A file-backed, spec-driven AI development workflow.

```bash
npx create-religion@latest
```

You write two planning documents. The workflow turns them into project context, work-item
specs, and small reviewable build steps. You review every spec before code exists, and
every diff before it lands.

## What it installs

- **25 skills** your AI tool can run: `feature`, `implement`, `check`, `audit`, `complete`,
  and the rest of the loop around them.
- **A state directory** holding your plans, the active spec, the findings ledger, and the
  archive of everything finished.
- **Enforcement hooks** for Claude Code, backing rules that apply to every supported tool.

Works with Claude Code, Codex, GitHub Copilot, and OpenCode. Each tool's files are
generated separately, so they carry that tool's own invocation syntax.

## After installing

1. Run the `setup` skill. On an existing codebase it surveys what is there and drafts your
   plans from it.
2. Fill in `religion/project-plan.md` and `religion/build-plan.md`.
3. Run `overview`, then the loop: `feature`, `implement`, `check`, `complete`.

## Commands

```bash
npx create-religion status      # where the work stands, and the one thing to do next
npx create-religion doctor      # is the setup healthy
npx create-religion dashboard   # a local read-only view
npx create-religion update      # update the workflow files, preserving yours
npx create-religion uninstall   # take it back out, keeping the plans and history
npx create-religion export      # bundle state kept out of git, for another machine
npx create-religion import <file>  # unpack a bundle another machine exported
```

Installing the package globally shortens these to `religion status` and the rest.

`update` will not overwrite a file you have edited. It tells you what conflicts and backs
up the original if you choose to replace it.

`export` is for a project that keeps `religion/` out of git. It writes everything there except
`.state/` to one bundle, `religion/.state/export/religion-bundle.zip`, inside the project. Point a
sync client that can sync a chosen folder, such as Google Drive for desktop, at
`religion/.state/export/` to carry it to your other machines. Religion itself makes no network
connection.

On the other machine, install Religion first, then run `import` with the path the sync client
shows that bundle at. It checks every file's hash and that the bundle was made for this
repository, shows what it would create or replace, and asks before writing. It refuses outright
when a file it would replace was changed on this machine since the last export or import, so it
never discards work. A bundle's hashes prove it arrived whole, not who made it: anyone who can
write to the synced folder can write what your agent reads, so import only bundles you made.

### Exit codes

The same for every command, so a script can rely on them:

| Code | Meaning |
| --- | --- |
| `0` | the command did what it was asked |
| `1` | it ran and reports failure: no project found, a failing `doctor` check, conflicts, declined merges or linked files left by `install` or `update`, a file `uninstall` meant to change but left, a project installed by a newer version, or an unexpected error |
| `2` | usage error: nothing was written |

## Documentation

- [Getting started](https://github.com/foo-stack/religion/blob/main/docs/getting-started.md)
- [What the loop actually feels like](https://github.com/foo-stack/religion/blob/main/docs/the-loop.md)
- [What to do when doctor complains](https://github.com/foo-stack/religion/blob/main/docs/doctor.md)
- [Updating a project](https://github.com/foo-stack/religion/blob/main/docs/upgrading.md)
- [Stability](https://github.com/foo-stack/religion/blob/main/docs/stability.md)

[github.com/foo-stack/religion](https://github.com/foo-stack/religion)

MIT.
