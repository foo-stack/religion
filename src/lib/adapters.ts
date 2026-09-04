/**
 * Adapter definitions and the token vocabulary skill sources are written against.
 *
 * Skills are authored once under `src/skills/<name>/SKILL.md`. This module describes
 * how that single source is rendered for each AI tool that reads it. Four tools are
 * supported across two physical trees, because Codex, GitHub Copilot, and OpenCode all
 * discover skills from the same `.agents/skills/` directory.
 */

export type TreeId = "claude" | "agents" | "shared";

export interface Tree {
  id: TreeId;
  /** Where the rendered tree is written, relative to a project root. */
  dir: string;
  /** The entry file this tree's tools read, relative to a project root. */
  entryFile: string;
  /** Tools that read this tree. */
  tools: readonly string[];
  /** Prose naming the tools, for `{{tool}}`. */
  toolLabel: string;
  /**
   * Renders `{{cmd:name}}`. Claude Code and Codex have real invocation syntax;
   * Copilot and OpenCode are asked in plain language, and read the Codex form as a
   * skill name.
   */
  command: (skill: string) => string;
}

export const TREES: readonly Tree[] = [
  {
    id: "claude",
    dir: ".claude/skills",
    entryFile: "CLAUDE.md",
    tools: ["Claude Code"],
    toolLabel: "Claude Code",
    command: (skill) => `/${skill}`
  },
  {
    id: "agents",
    dir: ".agents/skills",
    entryFile: "AGENTS.md",
    tools: ["Codex", "GitHub Copilot", "OpenCode"],
    toolLabel: "Codex, GitHub Copilot, or OpenCode",
    command: (skill) => `$${skill}`
  }
];

/** The state directory name, so renaming the system is a one-line change. */
export const STATE_DIR = "religion";

/**
 * The render target for state files.
 *
 * A project has one state directory shared by every tool it installed, so those files
 * cannot carry a single tool's invocation syntax: a file reading `/feature` is wrong for
 * Codex, and hedging with "`/feature` or `$feature`" in every sentence reads badly. They
 * render skill references as bare backticked names instead, and the entry files teach
 * each tool how to invoke them.
 */
export const SHARED: Tree = {
  id: "shared",
  dir: STATE_DIR,
  entryFile: "",
  tools: TREES.flatMap((tree) => tree.tools),
  toolLabel: "your AI coding tool",
  command: (skill) => `\`${skill}\``
};

/** The product name, for prose. */
export const PRODUCT = "Religion";

export interface RenderContext {
  tree: Tree;
  /** The skill currently being rendered, for bare `{{cmd}}` with no argument. */
  skill: string;
  /** Resolves `{{include:name}}` to a shared partial's raw source. */
  include?: (name: string) => string;
  /** Resolves `{{roster}}` to the generated skill list. */
  roster?: () => string;
}

const TOKEN = /\{\{\s*([a-z]+)(?::([A-Za-z0-9_-]+))?\s*\}\}/g;

/** Guards against a partial that includes itself, directly or through a cycle. */
const MAX_INCLUDE_DEPTH = 8;

/**
 * Substitutes the token vocabulary into a skill source.
 *
 * | Token             | Renders as                                          |
 * | ----------------- | --------------------------------------------------- |
 * | `{{cmd:feature}}` | `/feature` or `$feature`                            |
 * | `{{cmd}}`         | the current skill's own invocation                  |
 * | `{{tool}}`        | `Claude Code` or `Codex, GitHub Copilot, or OpenCode` |
 * | `{{dir}}`         | `.claude/skills` or `.agents/skills`                |
 * | `{{state}}`       | `religion`                                          |
 * | `{{product}}`     | `Religion`                                          |
 *
 * An unknown token is a build error rather than a silent passthrough, so a typo in a
 * skill source cannot ship as literal `{{cmd:featrue}}` text to a user.
 */
export function render(source: string, ctx: RenderContext, depth = 0): string {
  if (depth > MAX_INCLUDE_DEPTH) {
    throw new Error(`include nesting exceeded ${MAX_INCLUDE_DEPTH} levels; check for a cycle`);
  }

  const unknown: string[] = [];

  const out = source.replace(TOKEN, (match, name: string, arg?: string) => {
    switch (name) {
      case "cmd":
        return ctx.tree.command(arg ?? ctx.skill);
      case "tool":
        return ctx.tree.toolLabel;
      case "dir":
        return ctx.tree.dir;
      case "state":
        return STATE_DIR;
      case "product":
        return PRODUCT;
      case "include": {
        if (!arg) throw new Error("{{include}} needs a partial name, as {{include:name}}");
        if (!ctx.include) throw new Error(`{{include:${arg}}} used where partials are unavailable`);
        // Partials end with a newline as files should; the host template already
        // supplies the surrounding blank lines, so trim to avoid doubling them.
        return render(ctx.include(arg).replace(/\s+$/, ""), ctx, depth + 1);
      }
      case "roster": {
        if (!ctx.roster) throw new Error("{{roster}} used where the skill list is unavailable");
        return ctx.roster();
      }
      default:
        unknown.push(match);
        return match;
    }
  });

  if (unknown.length > 0) {
    throw new Error(`unknown token(s): ${[...new Set(unknown)].join(", ")}`);
  }

  return out;
}
