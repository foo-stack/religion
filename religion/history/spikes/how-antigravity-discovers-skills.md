# How does Antigravity discover skills?

**For:** item 50
**Settled:** yes

## Question

Where do Antigravity skills live, in what file format with what frontmatter, and what
invocation syntax invokes one? Answer is a named layout or no.

Good enough meant the docs stating all three: directory, `SKILL.md` shape, invocation.

## Answer

- **Directory:** `.agents/skills/<name>/SKILL.md`, at the workspace root and each parent
  up to the repository root. `.agents/` is recommended; `.agent/skills` keeps backward
  compatibility. `.agent/`, `_agents/`, and `_agent/` are also recognized as folder names.
- **Bundle:** required `SKILL.md`, plus optional `scripts/`, `examples/`, `resources/`.
- **Frontmatter:** `description` required (the trigger text the agent evaluates);
  `name` optional, defaulting to the folder name (lowercase, hyphenated).
- **Invocation:** `/<skill-name>` explicitly, or autonomously by the agent (progressive
  disclosure: discovery, activation, execution). The CLI auto-converts every skill to a
  slash command; `/skills reload` picks up new ones.
- **Entry files:** both `AGENTS.md` and `GEMINI.md` are read at the workspace folder and
  each parent to the repo root, plus the `.agents/` folder. Personal scope mirrors this
  under `~/.gemini/config/`.
- **Custom directories** are possible via discovery manifests (`skills.json`,
  `entries[].path`, one level deep, absolute paths allowed), so a non-default tree is
  reachable without renaming anything.
- Adjacent, not this question: Antigravity has hooks (`hooks.json` in `.agents/`),
  running scripts at points in the agent loop; the event model was not compared.

## Evidence

Doc reads only (no IDE to run against here); web search returned nothing usable, so the
product docs were fetched directly:

| Page | What it stated |
| --- | --- |
| `/docs/skills/` | `.agents/skills` default with `.agent/skills` back-compat; `SKILL.md` bundle layout; `description` required, `name` optional; `/skill-name` explicit invocation; CLI auto-conversion and `/skills reload` |
| `/docs/customization-discovery/` | `AGENTS.md` and `GEMINI.md` both read per level; `.agent/`, `_agents/`, `_agent/` recognized; `skills.json` manifest paths; `~/.gemini/config/` personal scope; CLI-only skill folders; hooks exist |
| `/docs/getting-started` | skills listed under Extend as "Agent skills"; CLI sessions pick up the same customizations as the App |

## What this means for item 50

- The rendered output is already compatible: every `SKILL.md` carries `name` plus
  `description` frontmatter, and bodies are tool-agnostic prose through the token
  vocabulary. The renderer needs a third tree whose `command` renders `/skill`.
- The spec's real decision is the tree collision: the existing `.agents` tree renders
  `$skill` for Codex/Copilot/OpenCode, which is wrong text for Antigravity. Candidates
  are a separate tree under back-compat `.agent/skills`, a manifest-pointed directory,
  or sharing `.agents/skills` and accepting the wrong invocation text (autonomous
  discovery makes the text matter less, but the entry file would still say `$feature`).
- Off the table: inventing an undiscoverable directory, and assuming a `GEMINI.md`
  entry is needed (`AGENTS.md` is read). `ADAPTERS` in `install.ts` and `TREES` in
  `adapters.ts` already enumerate per-adapter trees and entries, so a new adapter
  propagates to install, doctor, uninstall, and the drift check once listed.
- The installer's adapter flags, the entry-file merge, and the compatibility guards in
  `scripts/promises.ts` enumerate the same adapter set and move with it.

## Not tested

- Real IDE behavior; duplicate skill names when both `.agents/skills` and
  `.agent/skills` exist in one project; whether `_agents/` and `_agent/` carry skills
  in practice rather than just being recognized; the hooks event model against
  Claude Code's; CLI-only paths, which do not affect an install.

Budget: none set; doc reads only, no code written, so nothing to delete.
