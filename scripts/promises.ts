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

const NETWORK_MODULES = ["net", "http", "https", "http2", "tls", "dgram", "dns", "undici"];

/**
 * No shipped module imports anything that can open a connection, or calls `fetch`.
 *
 * The one exception is the dashboard, which serves on loopback: it may import `node:http` to
 * create its server, never to make a request, and its page may fetch its own relative path.
 */
export async function networkProblems(): Promise<string[]> {
  const files = [
    ...(await sources(path.join(repoRoot, "packages", "create-religion", "bin"))),
    ...(await sources(path.join(repoRoot, "packages", "create-religion", "lib"))),
    ...(await sources(path.join(repoRoot, "src", "hooks")))
  ];
  const modules = NETWORK_MODULES.join("|");
  const imports = new RegExp(`(?:from|import|require)\\s*\\(?\\s*["'](?:node:)?(${modules})(?:/[^"']*)?["']`, "g");

  const problems: string[] = [];
  for (const file of files) {
    const relative = path.relative(repoRoot, file);
    const text = await fs.readFile(file, "utf8");
    const server = relative === "packages/create-religion/lib/dashboard.ts";

    for (const match of text.matchAll(imports)) {
      if (!(server && match[1] === "http")) problems.push(`${relative} imports ${match[1]}, which can open a connection`);
    }
    if (server && /\bhttp\.(request|get)\s*\(/.test(text)) problems.push(`${relative} makes an HTTP request`);
    for (const match of text.matchAll(/\bfetch\s*\(\s*(["'`]?)([^"'`)]*)/g)) {
      if (!(server && match[1] && match[2]!.startsWith("/"))) problems.push(`${relative} calls fetch`);
    }
    if (/\b(WebSocket|EventSource)\s*\(/.test(text)) problems.push(`${relative} opens a socket`);
  }
  return problems;
}

async function sources(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(ts|mjs|js)$/.test(entry.name) && !entry.name.endsWith(".test.ts"))
    .map((entry) => path.join(dir, entry.name));
}
