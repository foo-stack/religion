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

import ts from "typescript";

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
const POLICY =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'";

/** Globals that reach the network, or reach something that can. */
const FORBIDDEN_GLOBALS = new Set([
  "fetch",
  "WebSocket",
  "EventSource",
  "XMLHttpRequest",
  "importScripts",
  "createRequire",
  "Worker",
  "eval",
  "Function",
  "globalThis",
  "global"
]);
/** Members that load modules or reach the global object, whatever they are called on. */
const FORBIDDEN_MEMBERS = new Set(["constructor", "getBuiltinModule", "mainModule", "sendBeacon"]);
/** The members of `process` the tool uses; `process` reaches every built-in module through the rest. */
const PROCESS_MEMBERS = new Set(["argv", "cwd", "env", "exit", "exitCode", "on", "platform", "stdin", "stdout", "stderr"]);
/** Names the dashboard page's own script may not use, beyond the globals above. */
const PAGE_FORBIDDEN = new Set(["Image", "location", "navigator", "open"]);
/** Objects in a browser through which any global can be reached by name. */
const GLOBAL_OBJECTS = new Set(["window", "self", "globalThis", "frames", "parent", "top", "document"]);
const HOOK = /^node \.claude\/hooks\/([a-z-]+\.mjs)$/;

/**
 * No shipped module can open a network connection.
 *
 * Each file is parsed as TypeScript parses it, so a comment or a string is never mistaken
 * for code. Imports are held to an allowlist, a run-time load must name an allowed module
 * literally, the globals and members that reach the network or the module loader are
 * refused, and `process` may be used only through the members the tool needs. The dashboard
 * may use `node:http` only to serve, its page's script may make one request, for its own
 * data, its HTML may load nothing, and every response carries one exact policy. Hooks must be
 * files this check reads, and the settings template may run nothing else.
 */
export async function networkProblems(): Promise<string[]> {
  const shipped = [
    path.join(repoRoot, "packages", "create-religion", "bin"),
    path.join(repoRoot, "packages", "create-religion", "lib"),
    path.join(repoRoot, "src", "hooks")
  ];
  const problems: string[] = [];
  for (const file of (await Promise.all(shipped.map(sources))).flat()) {
    const relative = path.relative(repoRoot, file);
    const code = ts.createSourceFile(relative, await fs.readFile(file, "utf8"), ts.ScriptTarget.Latest, true, kind(file));
    problems.push(...codeProblems(code, relative === DASHBOARD));
    if (relative === DASHBOARD) problems.push(...dashboardProblems(code));
  }
  problems.push(...(await hookProblems()));
  return [...new Set(problems)];
}

function codeProblems(code: ts.SourceFile, dashboard: boolean): string[] {
  const problems: string[] = [];
  const at = (node: ts.Node) => `${code.fileName}:${code.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
  const allowed = (name: string) => name.startsWith(".") || ALLOWED_IMPORTS.has(name) || (dashboard && name === "node:http");

  const visit = (node: ts.Node): void => {
    const specifier =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier
        ? node.moduleSpecifier
        : ts.isExternalModuleReference(node)
          ? node.expression
          : null;
    if (specifier) {
      if (!ts.isStringLiteral(specifier) || !allowed(specifier.text)) {
        problems.push(`${at(node)} imports ${specifier.getText(code)}, which shipped code may not use`);
      }
    }

    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || isName(node.expression, "require"))) {
      const [argument] = node.arguments;
      if (!argument || !ts.isStringLiteralLike(argument) || !allowed(argument.text)) {
        problems.push(`${at(node)} loads ${argument ? argument.getText(code) : "a module"} at run time`);
      }
    }

    if (ts.isStringLiteralLike(node) && node.text.startsWith("node:") && !allowed(node.text)) {
      problems.push(`${at(node)} names ${node.text}`);
    }

    const member = ts.isPropertyAccessExpression(node)
      ? node.name.text
      : ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)
        ? node.argumentExpression.text
        : null;
    if (member !== null && FORBIDDEN_MEMBERS.has(member)) problems.push(`${at(node)} uses .${member}`);

    if (ts.isIdentifier(node) && isReference(node)) {
      if (FORBIDDEN_GLOBALS.has(node.text)) problems.push(`${at(node)} uses ${node.text}`);
      if (node.text === "require" && !isCallee(node)) problems.push(`${at(node)} uses require other than to call it`);
      if (node.text === "process" && !isMemberOf(node, PROCESS_MEMBERS)) {
        problems.push(`${at(node)} uses process beyond the members the tool needs`);
      }
      if (dashboard && node.text === "http" && !isMemberOf(node, new Set(["createServer"]))) {
        problems.push(`${at(node)} uses http beyond serving`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(code);
  return problems;
}

/** The page's script, its HTML, and the policy every response carries. */
function dashboardProblems(code: ts.SourceFile): string[] {
  const problems: string[] = [];
  const declared = (name: string) => {
    let found: ts.Expression | undefined;
    const find = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && isName(node.name, name)) found = node.initializer;
      ts.forEachChild(node, find);
    };
    find(code);
    return found;
  };

  const policy = declared("CONTENT_SECURITY_POLICY");
  if (!policy || !ts.isStringLiteralLike(policy) || policy.text !== POLICY) {
    problems.push(`${code.fileName} does not declare exactly the expected CONTENT_SECURITY_POLICY`);
  }
  const writes: ts.CallExpression[] = [];
  const collect = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "writeHead") {
      writes.push(node);
    }
    ts.forEachChild(node, collect);
  };
  collect(code);
  for (const write of writes) {
    if (!write.getText(code).includes('"content-security-policy": CONTENT_SECURITY_POLICY')) {
      problems.push(`${code.fileName} answers without the content security policy`);
    }
  }

  const page = declared("PAGE");
  if (!page || !ts.isNoSubstitutionTemplateLiteral(page)) {
    problems.push(`${code.fileName} has no fixed PAGE to check`);
    return problems;
  }
  const html = page.text.replace(/<script>[\s\S]*?<\/script>/g, "");
  if (/\b(src|href|action|http-equiv)\s*=|url\s*\(|@import|<(link|iframe|object|embed|form|base)\b/i.test(html)) {
    problems.push(`${code.fileName} has a page that loads something beyond its own script`);
  }
  for (const [, body] of page.text.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const script = ts.createSourceFile("page.js", body!, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && isReference(node) && (FORBIDDEN_GLOBALS.has(node.text) || PAGE_FORBIDDEN.has(node.text))) {
        const ownRequest =
          node.text === "fetch" &&
          ts.isCallExpression(node.parent) &&
          node.parent.expression === node &&
          node.parent.arguments.length === 1 &&
          ts.isStringLiteral(node.parent.arguments[0]!) &&
          node.parent.arguments[0].text === "/state.json";
        if (!ownRequest) problems.push(`${code.fileName} has a page script that uses ${node.text}`);
      }
      // Reaching a forbidden name through an object, `window.fetch` or `window[name]`, is the same reach.
      if (ts.isPropertyAccessExpression(node) && (FORBIDDEN_GLOBALS.has(node.name.text) || PAGE_FORBIDDEN.has(node.name.text))) {
        problems.push(`${code.fileName} has a page script that uses .${node.name.text}`);
      }
      const global =
        ts.isElementAccessExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ThisKeyword ||
          (ts.isIdentifier(node.expression) && GLOBAL_OBJECTS.has(node.expression.text)));
      if (global && ts.isElementAccessExpression(node) && !ts.isNumericLiteral(node.argumentExpression)) {
        const name = ts.isStringLiteralLike(node.argumentExpression) ? node.argumentExpression.text : null;
        if (name === null || FORBIDDEN_GLOBALS.has(name) || PAGE_FORBIDDEN.has(name)) {
          problems.push(`${code.fileName} has a page script that looks up a member by a name it computes`);
        }
      }
      if (node.kind === ts.SyntaxKind.ImportKeyword) problems.push(`${code.fileName} has a page script that imports`);
      ts.forEachChild(node, visit);
    };
    visit(script);
  }
  return problems;
}

/** Hooks must be files this check reads, and the settings template may run only them. */
async function hookProblems(): Promise<string[]> {
  const hooks = path.join(repoRoot, "src", "hooks");
  const problems: string[] = [];
  const names = new Set<string>();
  for (const entry of await fs.readdir(hooks, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    names.add(entry.name);
    if (!/\.(mjs|js|cjs)$/.test(entry.name)) problems.push(`src/hooks/${entry.name} is not a file this check can read`);
  }

  const template = await fs.readFile(path.join(repoRoot, "src", "state", ".state", "settings-template.json"), "utf8");
  for (const [, command] of template.matchAll(/"command"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    const hook = HOOK.exec(command!);
    if (!hook || !names.has(hook[1]!)) problems.push(`the settings template runs ${command}, which is not a shipped hook`);
  }
  return problems;
}

function kind(file: string): ts.ScriptKind {
  return /\.[cm]?ts$/.test(file) ? ts.ScriptKind.TS : ts.ScriptKind.JS;
}

function isName(node: ts.Node, name: string): boolean {
  return ts.isIdentifier(node) && node.text === name;
}

function isCallee(node: ts.Identifier): boolean {
  return ts.isCallExpression(node.parent) && node.parent.expression === node;
}

/** `process.cwd` style use: the name followed directly by one of the allowed members. */
function isMemberOf(node: ts.Identifier, members: ReadonlySet<string>): boolean {
  return ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node && members.has(node.parent.name.text);
}

/**
 * Whether an identifier refers to a value, as opposed to naming a declaration, a property,
 * an import binding, or a type.
 */
function isReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if (ts.isQualifiedName(parent) && parent.right === node) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent) || ts.isPropertySignature(parent)) {
    if (parent.name === node) return false;
  }
  if (ts.isImportClause(parent) || ts.isImportSpecifier(parent) || ts.isNamespaceImport(parent)) return false;
  if ((ts.isFunctionDeclaration(parent) || ts.isClassDeclaration(parent) || ts.isVariableDeclaration(parent)) && parent.name === node) {
    return false;
  }
  if (ts.isParameter(parent) && parent.name === node) return false;
  for (let current: ts.Node = node; current.parent; current = current.parent) {
    if (ts.isTypeNode(current) || ts.isTypeAliasDeclaration(current) || ts.isInterfaceDeclaration(current)) return false;
  }
  return true;
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
