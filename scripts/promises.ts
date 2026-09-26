/**
 * Checks that hold the stability statement to what it says.
 *
 * The statement is a promise to people who cannot read the code, so two things about it are
 * checked rather than trusted: that it still names everything the surface record promises,
 * and that the shipped code still cannot open a network connection.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SURFACE_RECORD } from "./surface-current.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATEMENT = path.join(repoRoot, "docs", "stability.md");

/** Every recorded command, option, skill, adapter, setting and the Node range, named in the statement. */
export async function statementProblems(): Promise<string[]> {
  const record = JSON.parse(await fs.readFile(SURFACE_RECORD, "utf8")) as {
    commands: Record<string, string[]>;
    skills: string[];
    adapters: Record<string, unknown>;
    config: Record<string, unknown>;
    node: string;
  };
  const statement = await fs.readFile(STATEMENT, "utf8");
  // A name counts when it appears as code, alone or at the start of a usage like `install [dir]`.
  const named = (name: string) => statement.includes(`\`${name}\``) || statement.includes(`\`${name} `);

  const entries: [string, string][] = [
    ...Object.keys(record.commands).map((name): [string, string] => ["command", name]),
    ...[...new Set(Object.values(record.commands).flat())].map((name): [string, string] => ["option", name]),
    ...record.skills.map((name): [string, string] => ["skill", name]),
    ...Object.keys(record.adapters).map((name): [string, string] => ["adapter", name]),
    ...Object.keys(record.config).map((name): [string, string] => ["setting", name]),
    ["Node range", record.node]
  ];
  return entries.filter(([, name]) => !named(name)).map(([kind, name]) => `docs/stability.md does not name the ${kind} ${name}`);
}

/** Every module shipped code may import. Anything else fails, which is what makes this an allowlist. */
const ALLOWED_IMPORTS = new Set([
  "node:fs",
  "node:fs/promises",
  "node:path",
  "node:url",
  "node:crypto",
  "node:readline/promises"
]);
const DASHBOARD = "packages/create-religion/lib/dashboard.ts";
/** The only request any shipped code makes: the dashboard page asking its own server for its data. */
const OWN_REQUEST = 'fetch("/state.json")';
const ESCAPES =
  /\b(fetch|WebSocket|EventSource|XMLHttpRequest|sendBeacon|importScripts|createRequire|Worker|eval|Function|globalThis|getBuiltinModule|mainModule|constructor)\b|\b(global|window|self|process)\s*\[|\b(global|window|self)\s*\.|\.\s*(binding|dlopen)\b|["'](binding|dlopen|getBuiltinModule|constructor)["']/g;

/**
 * No shipped module can open a network connection.
 *
 * An allowlist rather than a list of spellings to refuse: each shipped file may import only
 * the modules above, the dashboard alone may add `node:http` to serve on loopback, an import
 * whose name is computed is refused outright, and the ways around an import, from a stored
 * `fetch` to a worker, are refused by name. The dashboard page's one request for its own data
 * is the single exception, and the page must carry a policy that lets it reach nothing else.
 */
export async function networkProblems(): Promise<string[]> {
  const roots = [
    path.join(repoRoot, "packages", "create-religion", "bin"),
    path.join(repoRoot, "packages", "create-religion", "lib"),
    path.join(repoRoot, "src", "hooks")
  ];
  const files = (await Promise.all(roots.map(sources))).flat();

  const problems: string[] = [];
  for (const file of files) {
    const relative = path.relative(repoRoot, file);
    const dashboard = relative === DASHBOARD;
    // Block comments go first, so one cannot sit between an import and its name unseen.
    let text = (await fs.readFile(file, "utf8")).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, "");
    if (dashboard) text = text.split(OWN_REQUEST).join("");

    // Any Node module named anywhere, in any syntax, must be one shipped code may use.
    for (const match of text.matchAll(/["'](node:[^"']+)["']/g)) {
      const name = match[1]!;
      if (!ALLOWED_IMPORTS.has(name) && !(dashboard && name === "node:http")) {
        problems.push(`${relative} names ${name}, which is not on the list shipped code may use`);
      }
    }

    for (const match of text.matchAll(/\b(?:from|import)\s*(?:\/\/[^\n]*\n\s*)*["']([^"']+)["']/g)) {
      const name = match[1]!;
      const allowed = name.startsWith(".") || ALLOWED_IMPORTS.has(name) || (dashboard && name === "node:http");
      if (!allowed) problems.push(`${relative} imports ${name}, which is not on the list shipped code may use`);
    }
    for (const match of text.matchAll(/\b(?:import|require)\s*\(\s*([^)]*)\)/g)) {
      const argument = match[1]!.trim();
      const literal = /^["'][^"']+["']$/.test(argument) ? argument.slice(1, -1) : null;
      if (!literal || !(literal.startsWith(".") || ALLOWED_IMPORTS.has(literal))) {
        problems.push(`${relative} loads ${argument || "a module"} at run time`);
      }
    }
    for (const match of text.matchAll(ESCAPES)) problems.push(`${relative} uses ${match[0]}`);

    // `process` reaches every built-in module through its members, so only the ones shipped
    // code uses are allowed, and any other mention, however it is spelled, is refused.
    const processUse = text.replace(/\bprocess\.(argv|cwd|exit|exitCode|on|stdin|stdout|stderr)\b/g, "");
    if (/\bprocess\b/.test(processUse)) problems.push(`${relative} uses process beyond the members shipped code needs`);

    if (dashboard) {
      // The server's import, the three members it uses, and its own address are the only
      // places `http` may appear; any other mention could be a way to make a request.
      const rest = text
        .replace(/import http from "node:http";/, "")
        .replace(/\bhttp\.(createServer|IncomingMessage|ServerResponse)\b/g, "")
        .replace(/`http:\/\/127\.0\.0\.1:\$\{port\}`/, "");
      if (/\bhttp\b/.test(rest)) problems.push(`${relative} uses http beyond its server`);
      if (!/default-src 'none'/.test(text) || !/connect-src 'self'/.test(text)) {
        problems.push(`${relative} serves its page without a policy confining it to its own server`);
      }
    }
  }
  return [...new Set(problems)];
}

/** Every file under `dir` that could ship as code, however deep, tests aside. */
async function sources(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await sources(full)));
    else if (/\.(ts|mts|cts|js|mjs|cjs)$/.test(entry.name) && !/\.test\.[cm]?ts$/.test(entry.name)) files.push(full);
  }
  return files;
}
