/**
 * The command-line grammar.
 *
 * Pure, so every rule is testable: the working directory and the one filesystem question it
 * needs, whether a bare word names an existing directory, are passed in. Anything it does
 * not understand is refused rather than guessed at, because a guess here is an install into
 * the wrong place.
 */

import { ADAPTERS } from "./install.js";
import type { Adapter } from "./install.js";

export type Command = "install" | "update" | "status" | "doctor" | "dashboard" | "help";

export interface Options {
  command: Command;
  adapters: Adapter[] | null;
  json: boolean;
  dryRun: boolean;
  force: boolean;
  yes: boolean;
  target: string;
}

export type Parsed = { ok: true; options: Options } | { ok: false; error: string };

export interface ParseContext {
  cwd: string;
  isDirectory: (candidate: string) => boolean;
}

const COMMANDS: readonly Command[] = ["install", "update", "status", "doctor", "dashboard", "help"];
const WRITES: ReadonlySet<Command> = new Set(["install", "update"]);
const REPORTS: ReadonlySet<Command> = new Set(["status", "doctor"]);

export function parseArgs(argv: readonly string[], context: ParseContext): Parsed {
  const options: Options = {
    command: "install",
    adapters: null,
    json: false,
    dryRun: false,
    force: false,
    yes: false,
    target: context.cwd
  };

  if (argv.some((arg) => arg === "help" || arg === "--help" || arg === "-h")) {
    return { ok: true, options: { ...options, command: "help" } };
  }

  const [first, ...rest] = argv.filter((arg) => !arg.startsWith("-"));
  let extra: string[] = [];

  if (first !== undefined && isCommand(first)) {
    options.command = first;
    if (rest[0] !== undefined) options.target = rest[0];
    extra = rest.slice(1);
  } else if (first !== undefined) {
    if (!context.isDirectory(first)) return fail(unknownCommand(first));
    options.target = first;
    extra = rest;
  }

  if (extra.length > 0) {
    return fail(`Unexpected argument '${extra[0]}'. ${options.command} takes at most one directory.`);
  }

  const adapters: Adapter[] = [];
  for (const flag of argv.filter((arg) => arg.startsWith("-"))) {
    const scope = flag === "--json" ? REPORTS : WRITES;
    const adapter = flag.startsWith("--") && flag.slice(2) in ADAPTERS ? (flag.slice(2) as Adapter) : null;
    const known = ["--json", "--dry-run", "--force", "--yes", "-y"].includes(flag) || adapter !== null;

    if (!known) return fail(`Unknown option '${flag}'.`);
    if (!scope.has(options.command)) return fail(`Option '${flag}' does not apply to ${options.command}.`);

    if (adapter) adapters.push(adapter);
    else if (flag === "--json") options.json = true;
    else if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--force") options.force = true;
    else options.yes = true;
  }

  if (adapters.length > 0) options.adapters = adapters;
  return { ok: true, options };
}

function isCommand(word: string): word is Command {
  return (COMMANDS as readonly string[]).includes(word);
}

function fail(error: string): Parsed {
  return { ok: false, error };
}

function unknownCommand(word: string): string {
  const closest = COMMANDS.map((command) => ({ command, distance: editDistance(word, command) }))
    .filter((candidate) => candidate.distance <= 2)
    .sort((a, b) => a.distance - b.distance)[0];

  return closest
    ? `Unknown command '${word}'. Did you mean '${closest.command}'?`
    : `Unknown command '${word}', and no directory of that name exists.`;
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min(previous[j]! + 1, current[j - 1]! + 1, substitution));
    }
    previous = current;
  }
  return previous[b.length]!;
}
