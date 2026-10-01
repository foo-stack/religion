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
const EVERY: ReadonlySet<Command> = new Set(COMMANDS);

interface Flag {
  commands: ReadonlySet<Command>;
  apply: (options: Options) => void;
}

/** Every option, the commands it applies to, and what it does. Parsing dispatches on this alone. */
const FLAGS: Readonly<Record<string, Flag>> = {
  "--help": { commands: EVERY, apply: (options) => void (options.command = "help") },
  "-h": { commands: EVERY, apply: (options) => void (options.command = "help") },
  "--dry-run": { commands: WRITES, apply: (options) => void (options.dryRun = true) },
  "--force": { commands: WRITES, apply: (options) => void (options.force = true) },
  "--yes": { commands: WRITES, apply: (options) => void (options.yes = true) },
  "-y": { commands: WRITES, apply: (options) => void (options.yes = true) },
  "--json": { commands: REPORTS, apply: (options) => void (options.json = true) },
  ...Object.fromEntries(
    (Object.keys(ADAPTERS) as Adapter[]).map((adapter): [string, Flag] => [
      `--${adapter}`,
      {
        commands: WRITES,
        apply: (options) => {
          const chosen = options.adapters ?? [];
          if (!chosen.includes(adapter)) options.adapters = [...chosen, adapter];
        }
      }
    ])
  )
};

/** The options each command accepts, read from the same table parsing uses. */
export const GRAMMAR: Readonly<Record<Command, readonly string[]>> = grammar();

function grammar(): Record<Command, readonly string[]> {
  const table = {} as Record<Command, readonly string[]>;
  for (const command of COMMANDS) table[command] = Object.keys(FLAGS).filter((flag) => FLAGS[flag]!.commands.has(command));
  return table;
}

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

  for (const flag of argv.filter((arg) => arg.startsWith("-"))) {
    const known = Object.hasOwn(FLAGS, flag) ? FLAGS[flag] : undefined;
    if (!known) return fail(`Unknown option '${flag}'.`);
    if (!known.commands.has(options.command)) return fail(`Option '${flag}' does not apply to ${options.command}.`);
    known.apply(options);
  }

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
