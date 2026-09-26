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
  "node:os",
  "node:util",
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
const FORBIDDEN_MEMBERS = new Set(["constructor", "getBuiltinModule", "mainModule", "sendBeacon", "require", "setEngine"]);
/** The members of `process` the tool uses; `process` reaches every built-in module through the rest. */
const PROCESS_MEMBERS = new Set([
  "argv",
  "cwd",
  "env",
  "exit",
  "exitCode",
  "nextTick",
  "on",
  "platform",
  "stdin",
  "stdout",
  "stderr",
  "version",
  "versions"
]);
/** Names the dashboard page's own script may not use, beyond the globals above. */
const PAGE_FORBIDDEN = new Set(["Image", "location", "navigator", "open", "RTCPeerConnection"]);
/** Objects in a browser through which any global can be reached by name. */
const GLOBAL_OBJECTS = new Set(["window", "self", "globalThis", "frames", "parent", "top", "document"]);
const HOOK = /^node \.claude\/hooks\/([a-z-]+\.mjs)$/;
/** Every way a response can be written; all of them belong inside `send`. */
const RESPONSE_MEMBERS = new Set([
  "writeHead",
  "setHeader",
  "appendHeader",
  "removeHeader",
  "end",
  "write",
  "statusCode",
  "statusMessage",
  "flushHeaders",
  "writeContinue"
]);

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
export async function networkProblems(root: string = repoRoot): Promise<string[]> {
  const problems: string[] = [];
  for (const file of (await Promise.all(shippedRoots(root).map(sources))).flat()) {
    const relative = path.relative(root, file);
    const code = ts.createSourceFile(relative, await fs.readFile(file, "utf8"), ts.ScriptTarget.Latest, true, kind(file));
    problems.push(...codeProblems(code, relative === DASHBOARD, root));
    if (relative === DASHBOARD) problems.push(...dashboardProblems(code));
  }
  problems.push(...(await hookProblems(root)), ...(await packageProblems(root)));
  return [...new Set(problems)];
}

/** Where shipped code lives. The package check below holds the build and the package to these. */
function shippedRoots(root: string): string[] {
  return [
    path.join(root, "packages", "create-religion", "bin"),
    path.join(root, "packages", "create-religion", "lib"),
    path.join(root, "src", "hooks")
  ];
}

/** A relative import ships whatever it reaches, so it must reach a file this check reads, or data. */
function reachesScanned(root: string, from: string, specifier: string): boolean {
  const target = path.resolve(root, path.dirname(from), specifier);
  if (target.endsWith(".json")) return true;
  const inside = shippedRoots(root).some((dir) => target.startsWith(dir + path.sep));
  return inside && !/\.test(\.[cm]?[jt]s)?$/.test(target);
}

function codeProblems(code: ts.SourceFile, dashboard: boolean, root: string): string[] {
  const problems: string[] = [];
  const at = (node: ts.Node) => `${code.fileName}:${code.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
  const allowed = (name: string) =>
    name.startsWith(".") ? reachesScanned(root, code.fileName, name) : ALLOWED_IMPORTS.has(name) || (dashboard && name === "node:http");

  const visit = (node: ts.Node): void => {
    const typeOnly =
      (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) || (ts.isExportDeclaration(node) && node.isTypeOnly);
    const specifier =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && !typeOnly
        ? node.moduleSpecifier
        : ts.isExternalModuleReference(node)
          ? node.expression
          : null;
    if (specifier) {
      if (!ts.isStringLiteral(specifier) || !allowed(specifier.text)) {
        problems.push(`${at(node)} imports ${specifier.getText(code)}, which shipped code may not use`);
      }
      // The server needs the module's default export and nothing else; a named or namespace
      // import would reach its request functions under a name this check does not follow.
      if (dashboard && ts.isImportDeclaration(node) && ts.isStringLiteral(specifier) && specifier.text === "node:http") {
        const clause = node.importClause;
        if (!clause?.name || clause.name.text !== "http" || clause.namedBindings) {
          problems.push(`${at(node)} imports node:http other than as its default, http`);
        }
      }
    }

    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || isName(node.expression, "require"))) {
      const [argument] = node.arguments;
      if (!argument || !ts.isStringLiteralLike(argument) || !allowed(argument.text)) {
        problems.push(`${at(node)} loads ${argument ? argument.getText(code) : "a module"} at run time`);
      }
    }

    const erased =
      node.parent &&
      ((ts.isImportDeclaration(node.parent) && node.parent.importClause?.isTypeOnly) ||
        (ts.isExportDeclaration(node.parent) && node.parent.isTypeOnly));
    if (ts.isStringLiteralLike(node) && /^node:[a-z_/]+$/.test(node.text) && !allowed(node.text) && !erased) {
      problems.push(`${at(node)} names ${node.text}`);
    }

    const member = ts.isPropertyAccessExpression(node)
      ? node.name.text
      : ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)
        ? node.argumentExpression.text
        : null;
    const namesOnly =
      member === "constructor" && ts.isPropertyAccessExpression(node.parent) && node.parent.name.text === "name";
    if (member !== null && FORBIDDEN_MEMBERS.has(member) && !namesOnly) problems.push(`${at(node)} uses .${member}`);

    if (ts.isIdentifier(node) && isReference(node)) {
      if (FORBIDDEN_GLOBALS.has(node.text)) problems.push(`${at(node)} uses ${node.text}`);
      if (node.text === "require" && !isCallee(node)) problems.push(`${at(node)} uses require other than to call it`);
      if (node.text === "process" && !isMemberOf(node, PROCESS_MEMBERS)) {
        problems.push(`${at(node)} uses process beyond the members the tool needs`);
      }
      if (dashboard && node.text === "http" && !isMemberOf(node, new Set(["createServer", "STATUS_CODES"]))) {
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
  // Every way to answer lives in `send`, which always carries the policy, and only the page
  // this check reads may be served as HTML.
  const collect = (node: ts.Node): void => {
    if (
      ts.isPropertyAccessExpression(node) &&
      RESPONSE_MEMBERS.has(node.name.text) &&
      !inside(node, "send") &&
      !["process", "console"].includes(rootName(node.expression))
    ) {
      problems.push(`${code.fileName} answers with .${node.name.text} outside send, which carries the policy`);
    }
    if (ts.isCallExpression(node) && isName(node.expression, "send")) {
      const [, , type, body] = node.arguments;
      const html = type && ts.isStringLiteralLike(type) ? /html/i.test(type.text) : true;
      if (html && !(body && isName(body, "PAGE"))) problems.push(`${code.fileName} serves HTML other than PAGE`);
    }
    if (ts.isFunctionDeclaration(node) && node.name?.text === "send") {
      // Exactly the type and the policy: a header like Location or Refresh would send the page away.
      const heads: ts.ObjectLiteralExpression[] = [];
      const find = (inner: ts.Node): void => {
        if (ts.isCallExpression(inner) && ts.isPropertyAccessExpression(inner.expression) && inner.expression.name.text === "writeHead") {
          const headers = inner.arguments[1];
          if (headers && ts.isObjectLiteralExpression(headers)) heads.push(headers);
          else problems.push(`${code.fileName} has a send whose headers this check cannot read`);
        }
        ts.forEachChild(inner, find);
      };
      find(node);
      for (const headers of heads) {
        const names = headers.properties.map((property) =>
          ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name) ? property.name.text : "?"
        );
        const policy = headers.properties.find(
          (property) => ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name) && property.name.text === "content-security-policy"
        );
        if (
          names.join() !== "content-type,content-security-policy" ||
          !policy ||
          !ts.isPropertyAssignment(policy) ||
          !isName(policy.initializer, "CONTENT_SECURITY_POLICY")
        ) {
          problems.push(`${code.fileName} has a send that sends headers other than its type and the policy`);
        }
      }
      if (heads.length === 0) problems.push(`${code.fileName} has a send that writes no headers`);
    }
    ts.forEachChild(node, collect);
  };
  collect(code);

  const page = declared("PAGE");
  if (!page || !ts.isNoSubstitutionTemplateLiteral(page)) {
    problems.push(`${code.fileName} has no fixed PAGE to check`);
    return problems;
  }
  const html = page.text.replace(/<script>[\s\S]*?<\/script>/g, "");
  if (/<script/i.test(html)) problems.push(`${code.fileName} has a page script tag this check does not read`);
  // An inline handler runs as script under the policy and is never parsed above.
  if (/\son[a-z]+\s*=/i.test(html)) problems.push(`${code.fileName} has a page with an inline event handler`);
  const loading = html.replace(/\b(href|src)\s*=\s*["']?(#|data:)/gi, "");
  if (/\b(src|srcset|href|action|http-equiv)\s*=|(url|image-set)\s*\(|@import|<(link|iframe|object|embed|form|base)\b/i.test(loading)) {
    problems.push(`${code.fileName} has a page that loads something beyond its own script`);
  }
  for (const [, body] of page.text.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const script = ts.createSourceFile("page.js", body!, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && isReference(node) && (FORBIDDEN_GLOBALS.has(node.text) || PAGE_FORBIDDEN.has(node.text))) {
        const call = node.parent;
        const ownRequest =
          node.text === "fetch" &&
          ts.isCallExpression(call) &&
          call.expression === node &&
          ts.isStringLiteral(call.arguments[0]!) &&
          call.arguments[0].text === "/state.json" &&
          (call.arguments.length === 1 || (call.arguments.length === 2 && ts.isObjectLiteralExpression(call.arguments[1]!)));
        if (!ownRequest) problems.push(`${code.fileName} has a page script that uses ${node.text}`);
      }
      // Reaching a forbidden name through an object, `window.fetch` or `window[name]`, is the same reach.
      const onGlobal =
        ts.isPropertyAccessExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ThisKeyword ||
          (ts.isIdentifier(node.expression) && GLOBAL_OBJECTS.has(node.expression.text)));
      if (
        ts.isPropertyAccessExpression(node) &&
        (FORBIDDEN_GLOBALS.has(node.name.text) || (onGlobal && PAGE_FORBIDDEN.has(node.name.text)))
      ) {
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
      // Markup the script writes into the page is the page too, and a navigation leaves it.
      if (ts.isStringLiteralLike(node)) {
        const markup = /\b(src|srcset|href|action|http-equiv)\s*=|(url|image-set)\s*\(|:\/\//i.test(node.text);
        const attribute = /^(src|srcset|href|action|formaction|http-equiv)$/i.test(node.text) || node.text.startsWith("//");
        if (markup || attribute) problems.push(`${code.fileName} has a page script that writes markup able to load or navigate`);
      }
      if (ts.isPropertyAccessExpression(node) && ["src", "srcset", "href", "action"].includes(node.name.text)) {
        problems.push(`${code.fileName} has a page script that sets .${node.name.text}`);
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        ["setTimeout", "setInterval"].includes(node.expression.text) &&
        node.arguments[0] &&
        !ts.isArrowFunction(node.arguments[0]) &&
        !ts.isFunctionExpression(node.arguments[0]) &&
        !ts.isIdentifier(node.arguments[0])
      ) {
        problems.push(`${code.fileName} has a page script that runs a string as code`);
      }
      ts.forEachChild(node, visit);
    };
    visit(script);
  }
  return problems;
}

/** Hooks must be files this check reads, and the settings template may run only them. */
async function hookProblems(root: string): Promise<string[]> {
  const hooks = path.join(root, "src", "hooks");
  const problems: string[] = [];
  const names = new Set<string>();
  for (const entry of await fs.readdir(hooks, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    names.add(entry.name);
    if (!/\.(mjs|js|cjs)$/.test(entry.name)) problems.push(`src/hooks/${entry.name} is not a file this check can read`);
  }

  const template = JSON.parse(
    await fs.readFile(path.join(root, "src", "state", ".state", "settings-template.json"), "utf8")
  ) as unknown;
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    const entry = value as Record<string, unknown>;
    if ("type" in entry || "command" in entry || "url" in entry) {
      const hook = typeof entry.command === "string" ? HOOK.exec(entry.command) : null;
      if (entry.type !== "command" || !hook || !names.has(hook[1]!) || "url" in entry) {
        problems.push(`the settings template runs ${JSON.stringify(entry)}, which is not a shipped hook`);
      }
    }
    Object.values(entry).forEach(walk);
  };
  walk(template);
  for (const key of Object.keys(template as object)) {
    if (key !== "hooks") problems.push(`the settings template sets ${key}, and may set only hooks`);
  }
  return problems;
}

/**
 * Nothing runs when the package is installed, and nothing ships that this check does not read.
 *
 * No dependency of any kind, since a dependency's own install script would run; entry points
 * only in the compiled `dist/bin`; published files only the compiled output, the template,
 * and two documents; and the build compiling only the folders this check reads.
 */
async function packageProblems(root: string): Promise<string[]> {
  const where = "packages/create-religion/package.json";
  const dir = path.join(root, "packages", "create-religion");
  const manifest = JSON.parse(await fs.readFile(path.join(dir, "package.json"), "utf8")) as Record<string, unknown>;
  const problems: string[] = [];

  for (const name of Object.keys((manifest.scripts as Record<string, string> | undefined) ?? {})) {
    if (["preinstall", "install", "postinstall", "prepare"].includes(name)) problems.push(`${where} runs a ${name} script when installed`);
  }
  for (const field of ["dependencies", "optionalDependencies", "peerDependencies", "bundleDependencies", "bundledDependencies"]) {
    const value = manifest[field];
    if (value && (Array.isArray(value) ? value.length : Object.keys(value as object).length)) {
      problems.push(`${where} declares ${field}, and the package ships none`);
    }
  }
  const bins = typeof manifest.bin === "string" ? [manifest.bin] : Object.values((manifest.bin as Record<string, string>) ?? {});
  for (const bin of bins) if (!/^dist\/bin\/[\w-]+\.js$/.test(bin)) problems.push(`${where} runs ${bin}, outside the compiled dist/bin`);
  for (const field of ["main", "module", "exports", "browser"]) {
    if (field in manifest) problems.push(`${where} declares ${field}, an entry point this check does not read`);
  }
  const files = (manifest.files as string[] | undefined) ?? [];
  for (const file of files) {
    if (!["dist/", "template/", "README.md", "LICENSE"].includes(file)) problems.push(`${where} publishes ${file}`);
  }

  const config = JSON.parse(await fs.readFile(path.join(dir, "tsconfig.json"), "utf8")) as { include?: string[] };
  for (const include of config.include ?? []) {
    if (!/^(bin|lib)\//.test(include)) problems.push(`packages/create-religion/tsconfig.json compiles ${include}, which this check does not read`);
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
  if (ts.isModuleDeclaration(parent) && parent.name === node) return false;
  if (ts.isBindingElement(parent) && (parent.propertyName === node || (parent.name === node && !parent.propertyName))) {
    return false;
  }
  if ((ts.isGetAccessor(parent) || ts.isSetAccessor(parent) || ts.isEnumMember(parent)) && parent.name === node) return false;
  for (let current: ts.Node = node; current.parent; current = current.parent) {
    // A class's `extends` runs; only other heritage and genuine type positions are erased.
    if (ts.isExpressionWithTypeArguments(current) && isClassExtends(current)) return true;
    if (ts.isTypeNode(current) || ts.isTypeAliasDeclaration(current) || ts.isInterfaceDeclaration(current)) return false;
  }
  return true;
}

function isClassExtends(node: ts.ExpressionWithTypeArguments): boolean {
  const clause = node.parent;
  return (
    ts.isHeritageClause(clause) &&
    clause.token === ts.SyntaxKind.ExtendsKeyword &&
    (ts.isClassDeclaration(clause.parent) || ts.isClassExpression(clause.parent))
  );
}

/** The name at the root of a member chain: `process` for `process.stdout.write`. */
function rootName(node: ts.Expression): string {
  let current: ts.Expression = node;
  while (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) current = current.expression;
  return ts.isIdentifier(current) ? current.text : "";
}

function inside(node: ts.Node, name: string): boolean {
  for (let current: ts.Node | undefined = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current) && current.name?.text === name) return true;
  }
  return false;
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
