import { test } from "node:test";
import assert from "node:assert/strict";

import { GRAMMAR, parseArgs } from "./args.js";
import type { Options, Parsed } from "./args.js";

const context = { cwd: "/work", isDirectory: (candidate: string) => candidate === "./app" || candidate === "status" };

function options(argv: string[]): Options {
  const parsed = parseArgs(argv, context);
  assert.ok(parsed.ok, `expected ${JSON.stringify(argv)} to parse`);
  return parsed.options;
}

function error(argv: string[]): string {
  const parsed: Parsed = parseArgs(argv, context);
  assert.ok(!parsed.ok, `expected ${JSON.stringify(argv)} to be refused`);
  return parsed.error;
}

test("no arguments installs into the working directory", () => {
  const parsed = options([]);
  assert.equal(parsed.command, "install");
  assert.equal(parsed.target, "/work");
  assert.equal(parsed.adapters, null);
});

test("help wins over anything else, valid or not", () => {
  assert.equal(options(["help"]).command, "help");
  assert.equal(options(["status", "--help"]).command, "help");
  assert.equal(options(["-h", "--dryrun", "stauts"]).command, "help");
});

test("a known command is taken even when a directory has its name", () => {
  const parsed = options(["status"]);
  assert.equal(parsed.command, "status");
  assert.equal(parsed.target, "/work");
});

test("an unknown first word that is an existing directory installs into it", () => {
  const parsed = options(["./app"]);
  assert.equal(parsed.command, "install");
  assert.equal(parsed.target, "./app");
});

test("an unknown first word that is not a directory is refused, naming a near command", () => {
  assert.equal(error(["stauts"]), "Unknown command 'stauts'. Did you mean 'status'?");
  assert.equal(error(["updat"]), "Unknown command 'updat'. Did you mean 'update'?");
  assert.equal(error(["deploy"]), "Unknown command 'deploy', and no directory of that name exists.");
});

test("a second positional after a command is its directory", () => {
  assert.equal(options(["install", "./new"]).target, "./new");
  assert.equal(options(["doctor", "../elsewhere"]).target, "../elsewhere");
});

test("any further positional is refused", () => {
  assert.equal(error(["install", "a", "b"]), "Unexpected argument 'b'. install takes at most one directory.");
  assert.equal(error(["./app", "status"]), "Unexpected argument 'status'. install takes at most one directory.");
});

test("install flags apply to install and update", () => {
  const parsed = options(["update", "--dry-run", "--force", "-y", "--claude", "--codex"]);
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.force, true);
  assert.equal(parsed.yes, true);
  assert.deepEqual(parsed.adapters, ["claude", "codex"]);
  assert.equal(options(["--yes"]).yes, true);
});

test("install flags are refused with any other command", () => {
  assert.equal(error(["status", "--force"]), "Option '--force' does not apply to status.");
  assert.equal(error(["dashboard", "--opencode"]), "Option '--opencode' does not apply to dashboard.");
});

test("--json applies to status and doctor only", () => {
  assert.equal(options(["status", "--json"]).json, true);
  assert.equal(options(["--json", "doctor"]).json, true);
  assert.equal(error(["install", "--json"]), "Option '--json' does not apply to install.");
});

test("an unknown option is refused", () => {
  assert.equal(error(["update", "--dryrun"]), "Unknown option '--dryrun'.");
  assert.equal(error(["--claud"]), "Unknown option '--claud'.");
  assert.equal(error(["status", "--json=true"]), "Unknown option '--json=true'.");
  assert.equal(error(["-yf"]), "Unknown option '-yf'.");
});

test("an option named after an inherited object property is not an adapter", () => {
  assert.equal(error(["--toString"]), "Unknown option '--toString'.");
  assert.equal(error(["update", "--__proto__"]), "Unknown option '--__proto__'.");
  assert.equal(error(["install", "--constructor"]), "Unknown option '--constructor'.");
});

test("GRAMMAR lists the options each command accepts", () => {
  const writes = ["--help", "-h", "--dry-run", "--force", "--yes", "-y", "--claude", "--codex", "--copilot", "--opencode"];
  assert.deepEqual(GRAMMAR, {
    install: writes,
    update: writes,
    status: ["--help", "-h", "--json"],
    doctor: ["--help", "-h", "--json"],
    dashboard: ["--help", "-h"],
    help: ["--help", "-h"]
  });
});

test("every option GRAMMAR lists is accepted by its command", () => {
  for (const [command, flags] of Object.entries(GRAMMAR)) {
    for (const flag of flags) assert.ok(parseArgs([command, flag], context).ok, `${command} ${flag}`);
  }
});

test("a repeated adapter option is recorded once, in first-seen order", () => {
  assert.deepEqual(options(["--codex", "--claude", "--codex", "--claude"]).adapters, ["codex", "claude"]);
});

