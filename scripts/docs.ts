/**
 * What the documentation says that the public surface does not back up.
 *
 * Invocations are read from inline code and shell blocks only. Output blocks show what the
 * tool prints, including its errors for the very mistakes this looks for, so they are left
 * alone. Links are checked on disk and never fetched.
 */

import path from "node:path";

import { editDistance } from "../packages/create-religion/lib/args.js";

export interface Recorded {
  commands: Record<string, string[]>;
  exitCodes: number[];
}

export interface Disk {
  exists: (relative: string) => boolean;
  read: (relative: string) => string | null;
}

const INVOCATION = /(?:^|[\s(])(?:npx\s+)?(?:religion|create-religion(?:@[\w.-]+)?)(?=\s|$)(.*)$/;
const STOP = new Set(["#", "|", "||", "&&", ";"]);
const SHELL = new Set(["bash", "sh", "shell", "zsh", "console"]);
const EXIT = /\bexit(?:s| code| with)? `?(\d+)`?/g;
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/** Every problem in the given documents, as `file:line: what`, in file order. */
export function docsProblems(files: Record<string, string>, record: Recorded, disk: Disk): string[] {
  const problems: string[] = [];
  for (const [file, text] of Object.entries(files)) {
    let fence: string | null = null;
    text.split(/\r?\n/).forEach((line, index) => {
      const at = `${file}:${index + 1}`;
      const opened = /^\s*```\s*(\w*)/.exec(line);
      if (opened) {
        fence = fence === null ? opened[1]! : null;
        return;
      }
      if (fence !== null) {
        if (SHELL.has(fence)) problems.push(...invocationProblems(line, record).map((p) => `${at}: ${p}`));
        return;
      }
      for (const span of line.match(/`[^`]+`/g) ?? []) {
        problems.push(...invocationProblems(span.slice(1, -1), record).map((p) => `${at}: ${p}`));
      }
      for (const match of line.matchAll(EXIT)) {
        if (!record.exitCodes.includes(Number(match[1]))) problems.push(`${at}: exit code ${match[1]} is not recorded`);
      }
      for (const match of line.matchAll(LINK)) {
        const problem = linkProblem(file, text, match[1]!, disk);
        if (problem) problems.push(`${at}: ${problem}`);
      }
    });
  }
  return problems;
}

function invocationProblems(code: string, record: Recorded): string[] {
  const rest = INVOCATION.exec(code)?.[1];
  if (rest === undefined) return [];
  const words: string[] = [];
  for (const word of rest.trim().split(/\s+/).filter(Boolean)) {
    if (STOP.has(word) || word.startsWith("#")) break;
    words.push(word);
  }

  const first = words.find((word) => !word.startsWith("-"));
  const commands = Object.keys(record.commands);
  let command = "install";
  if (first !== undefined && commands.includes(first)) {
    command = first;
  } else if (first !== undefined && commands.some((known) => editDistance(first, known) <= 2)) {
    return [`\`${first}\` is not a recorded command`];
  }

  const flags = record.commands[command] ?? [];
  return words
    .filter((word) => word.startsWith("-") && !flags.includes(word))
    .map((flag) => `\`${flag}\` is not a recorded option of ${command}`);
}

function linkProblem(file: string, text: string, target: string, disk: Disk): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  const [pathPart, anchor] = target.split("#", 2) as [string, string | undefined];
  const resolved = pathPart ? path.posix.normalize(path.posix.join(path.posix.dirname(file), pathPart)).replace(/\/$/, "") : file;
  if (pathPart && !disk.exists(resolved)) return `link to ${target} leads nowhere`;
  if (!anchor || !resolved.endsWith(".md")) return null;
  const source = resolved === file ? text : disk.read(resolved);
  if (source !== null && !slugs(source).has(anchor)) return `link to ${target} names an anchor ${resolved} does not have`;
  return null;
}

/** GitHub's heading anchors: lowercase, punctuation dropped, spaces as hyphens, repeats numbered. */
function slugs(markdown: string): Set<string> {
  const seen = new Map<string, number>();
  const found = new Set<string>();
  let fenced = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = fenced ? null : /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)?.[1];
    if (!heading) continue;
    const base = heading.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s/g, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    found.add(count === 0 ? base : `${base}-${count}`);
  }
  return found;
}
