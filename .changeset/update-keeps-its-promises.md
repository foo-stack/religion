---
"create-religion": minor
---

`update` no longer duplicates an edited entry file, removes what a newer version stopped
shipping, refuses a project a newer version installed, never writes through a symbolic link,
and says truthfully what it backed up.

- **An entry file `setup` edited is rebuilt, not duplicated.** A fresh install writes
  `CLAUDE.md` and `AGENTS.md` without markers, and `setup` fills in their Commands section,
  so the next `update` used to treat the file as your own and append a second copy of every
  Religion section. It now backs the file up and rebuilds it around the sections you wrote:
  your title, your Commands, and any section of your own stay outside the markers, and
  Religion's sections are replaced by the current block. Later updates replace only what is
  between the markers. If this already happened to your file, the duplicates are still
  there; remove the older copies by hand.
- **Files a newer version no longer ships are removed.** When a file the previous install
  recorded is gone from the template, `update` removes it if you never edited it, along with
  any directory that leaves empty. If you edited it, it is left where it is and becomes
  yours. Only plain files inside the project and outside `religion/` are ever removed.
- **A project installed by a newer version is refused.** `install` and `update` exit 1
  without writing anything when the manifest's version or format is newer than the package
  running, whatever the flags. Run `npx create-religion@latest update` instead.
- **Nothing is written through a symbolic link.** A file, entry file, manifest or
  `.claude/settings.json` reached through a link, dangling or not, is left alone and reported
  as linked, even with `--force`, and the run exits 1. A link anywhere on the way to the
  manifest or a backup refuses the run before anything is written. Removals are confined to
  Religion's own skill and hook folders, by exact case, and never follow a link.
- **Messages match what happened.** A declined entry-file merge is reported on its own,
  rather than as a local edit with `--force` advice that would not merge it. The merge prompt
  and the getting-started walkthrough no longer claim a declined merge is backed up, and the
  backup line says where backups went.
