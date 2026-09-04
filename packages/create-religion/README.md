# create-religion

A file-backed, spec-driven AI development workflow.

```bash
npx create-religion@latest
```

You write two planning documents. The workflow turns them into project context, work-item
specs, and small reviewable build steps. You review every spec before code exists, and
every diff before it lands.

## What it installs

- **22 skills** your AI tool can run: `feature`, `implement`, `check`, `audit`, `complete`,
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
religion status      # where the work stands, and the one thing to do next
religion doctor      # is the setup healthy
religion dashboard   # a local read-only view
religion update      # update the workflow files, preserving yours
```

`update` will not overwrite a file you have edited. It tells you what conflicts and backs
up the original if you choose to replace it.

## Documentation

[github.com/foo-stack/religion](https://github.com/foo-stack/religion)

MIT.
