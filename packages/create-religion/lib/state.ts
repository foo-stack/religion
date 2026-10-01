/**
 * Parsers for the state files.
 *
 * Each file has one parser and one shape. These are deliberately tolerant: a half-written
 * plan or a hand-edited ledger should degrade into partial information, never an exception,
 * because the commands that use this are how someone finds out what is wrong.
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";

import { readIfPresent, statePath } from "./paths.js";

export interface PlanItem {
  number: string | null;
  title: string;
  done: boolean;
  depth: number;
}

export interface Finding {
  id: string;
  severity: "P0" | "P1" | "P2" | "P3";
  status: "unverified" | "open" | "fixed" | "closed" | "accepted" | "invalid";
  title: string;
  file?: string | null;
  found?: string | null;
  lens?: string | null;
  why?: string | null;
  fix?: string | null;
  resolution?: string | null;
}

export interface WorkItem {
  active: boolean;
  title: string | null;
  type: string | null;
  status: string | null;
  stepsDone: number;
  stepsTotal: number;
  nextStep: string | null;
}

export interface ProjectState {
  root: string;
  config: unknown;
  configValid: boolean;
  plan: PlanItem[];
  work: WorkItem;
  findings: Finding[];
  overviewPresent: boolean;
  overviewFresh: boolean | null;
  openQuestions: string[];
}

const CHECKBOX = /^(\s*)- \[( |x|X)\]\s*(.*)$/;

export function parsePlan(source: string | null): PlanItem[] {
  if (!source) return [];

  // The shipped template explains the format with worked examples, which are checkboxes
  // too. Reading the whole file counts those as real work. When a `## Plan` heading exists,
  // only what follows it is the plan; the guidance above it is documentation.
  const planSection = /^##\s+Plan\s*$/im.exec(source);
  const body = planSection ? source.slice(planSection.index + planSection[0].length) : source;

  const items: PlanItem[] = [];

  for (const line of body.split(/\r?\n/)) {
    const match = CHECKBOX.exec(line);
    if (!match) continue;

    const body = (match[3] ?? "").trim();
    // The template ships two placeholder items so the shape is visible. They are not work.
    if (/^\d+\.\s+\*\*(Feature one|Feature two)\*\*/.test(body)) continue;

    items.push({
      number: /^([\dA-Za-z]+)\./.exec(body)?.[1] ?? null,
      title: body.replace(/^[\dA-Za-z]+\.\s*/, "").replace(/\*\*/g, ""),
      done: (match[2] ?? " ").toLowerCase() === "x",
      depth: Math.floor((match[1] ?? "").length / 2)
    });
  }

  return items;
}

export function parseWork(source: string | null): WorkItem {
  const empty: WorkItem = {
    active: false,
    title: null,
    type: null,
    status: null,
    stepsDone: 0,
    stepsTotal: 0,
    nextStep: null
  };

  if (!source || /_Nothing in progress\./.test(source)) return empty;

  // The step's name is its bold text, which itself contains " - " in the template's shape.
  // Spaces and tabs only: `\s` here crosses newlines, which made blank lines quadratic.
  const steps = [...source.matchAll(/^[ \t]*- \[( |x|X)\][ \t]*(?:\*\*(.+?)\*\*|(.+?)(?:\s+-\s|$))/gim)];
  const done = steps.filter((s) => (s[1] ?? " ").toLowerCase() === "x").length;
  const next = steps.find((s) => (s[1] ?? " ").toLowerCase() !== "x");

  return {
    active: true,
    title: field(source, "#"),
    type: field(source, "Type"),
    status: field(source, "Status"),
    stepsDone: done,
    stepsTotal: steps.length,
    nextStep: (next?.[2] ?? next?.[3])?.trim() ?? null
  };
}

function field(source: string, name: string): string | null {
  const pattern = name === "#" ? /^#\s+(.+)$/m : new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+)$`, "m");
  return pattern.exec(source)?.[1]?.trim() ?? null;
}

export interface SpecStep {
  label: string;
  title: string;
  what: string;
  doneWhen: string | null;
  done: boolean;
}

export interface Spec {
  title: string | null;
  type: string | null;
  planItem: string | null;
  status: string | null;
  goal: string[];
  inScope: string[];
  outOfScope: string[];
  files: string[];
  steps: SpecStep[];
}

/** The active spec as written, for showing rather than deciding. Null when nothing is in progress. */
export function parseSpec(source: string | null): Spec | null {
  if (!source || /_Nothing in progress\./.test(source)) return null;
  const section = sections(source);

  return {
    title: field(source, "#"),
    type: field(source, "Type"),
    planItem: field(source, "From build plan")?.replace(/^item\s+/i, "") ?? null,
    status: field(source, "Status"),
    goal: (section.get("goal") ?? "").split(/\n\s*\n/).map(join).filter(Boolean),
    inScope: bullets(section.get("in scope")),
    outOfScope: bullets(section.get("out of scope")),
    files: bullets(section.get("files and areas")),
    steps: bullets(section.get("build steps"), true).map(parseStep)
  };
}

/** Each heading's body, keyed by the lowercased heading; `levels` widens it to `###` too. */
function sections(source: string, levels = "##"): Map<string, string> {
  const found = new Map<string, string>();
  const parts = source.split(new RegExp(`^(?:${levels})\\s+(.+)$`, "m"));
  for (let index = 1; index < parts.length; index += 2) {
    found.set((parts[index] ?? "").trim().toLowerCase(), parts[index + 1] ?? "");
  }
  return found;
}

/** Top-level list items with their wrapped lines joined; with `checkbox`, only `- [ ]` items, tick kept. */
function bullets(body: string | undefined, checkbox = false): string[] {
  if (!body) return [];
  const items: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^- /.test(line)) items.push(line.slice(2));
    else if (/^\s+\S/.test(line) && items.length > 0) items[items.length - 1] += " " + line.trim();
    else if (line.trim() !== "" && items.length > 0) items.push("");
  }
  const kept = items.filter(Boolean).map((item) => item.trim());
  return checkbox ? kept.filter((item) => /^\[( |x|X)\]/.test(item)) : kept;
}

function parseStep(item: string): SpecStep {
  const done = /^\[(x|X)\]/.test(item);
  const text = item.replace(/^\[( |x|X)\]\s*/, "");
  const bold = /^\*\*(.+?)\*\*\s*(?:-\s+)?([\s\S]*)$/.exec(text);
  const name = bold?.[1] ?? text.split(" - ")[0] ?? "";
  const rest = bold ? (bold[2] ?? "") : text.slice(name.length).replace(/^\s*-\s+/, "");
  const [label, ...title] = name.split(" - ");
  const [what, doneWhen] = rest.split(/\*Done when:\*\s*/);
  return {
    label: title.length > 0 ? (label ?? "").trim() : "",
    title: (title.length > 0 ? title.join(" - ") : name).trim(),
    what: (what ?? "").trim(),
    doneWhen: doneWhen?.trim() ?? null,
    done
  };
}

export interface Archive {
  kind: string;
  file: string;
  number: string | null;
  title: string | null;
  type: string | null;
  status: string | null;
  steps: number;
  repairs: number;
  commits: string[];
  findings: Pick<Finding, "id" | "severity" | "status" | "title">[];
  wentWrong: string[];
  deferred: string[];
}

export const HISTORY_KINDS = ["features", "fixes", "rollbacks", "refactors", "spikes"] as const;

/** One archive under `history/<kind>/`, named `NN-slug.md`. */
export function parseArchive(kind: string, file: string, source: string): Archive {
  const spec = parseSpec(source);
  const section = sections(source, "#{2,3}");
  const repairs = spec?.steps.filter((step) => /^repair\b/i.test(step.label)).length ?? 0;
  return {
    kind,
    file,
    number: /^0*(\d+[a-z]?)-/i.exec(file)?.[1] ?? null,
    title: spec?.title ?? null,
    type: spec?.type ?? null,
    status: spec?.status ?? null,
    steps: (spec?.steps.length ?? 0) - repairs,
    repairs,
    commits: (labelled(source, "Commits") ?? "").split(/[\s,]+/).filter((sha) => /^[0-9a-f]{7,40}$/.test(sha)),
    findings: [...source.matchAll(/^###\s+(?:[\w-]+\/)?(F-\d+)\s+\[(P[0-3])\]\s+(\w+)\s+-\s+(.+)$/gm)].map((m) => ({
      id: m[1] as string,
      severity: m[2] as Finding["severity"],
      status: m[3] as Finding["status"],
      title: (m[4] ?? "").trim()
    })),
    wentWrong: blocks(section.get("what went wrong on the way")),
    deferred: blocks(section.get("deferred"))
  };
}

/** Every archive, newest first within each kind; an absent folder contributes nothing. */
export async function readHistory(root: string): Promise<Archive[]> {
  const archives: Archive[] = [];
  for (const kind of HISTORY_KINDS) {
    let names: string[];
    try {
      names = await fs.readdir(statePath(root, "history", kind));
    } catch {
      continue;
    }
    for (const name of names.filter((n) => n.endsWith(".md") && n !== "README.md").sort().reverse()) {
      const source = await readIfPresent(statePath(root, "history", kind, name));
      if (source !== null) archives.push(parseArchive(kind, name, source));
    }
  }
  return archives;
}

export interface InboxNote {
  date: string | null;
  text: string;
}

/** The inbox's one-line notes, `- 2026-09-05 - text`, with the date when one leads. */
export function parseInbox(source: string | null): InboxNote[] {
  if (!source) return [];
  return [...source.matchAll(/^- (?:(\d{4}-\d{2}-\d{2}) - )?(.+)$/gm)].map((m) => ({
    date: m[1] ?? null,
    text: (m[2] ?? "").trim()
  }));
}

/** Paragraphs and list items, each as one line of text. */
function blocks(body: string | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\n\s*\n/)
    .flatMap((paragraph) => (/^\s*- /.test(paragraph) ? bullets(paragraph) : [join(paragraph)]))
    .filter(Boolean);
}

function join(paragraph: string): string {
  return paragraph.split(/\r?\n/).map((line) => line.trim()).join(" ").trim();
}

export function parseFindings(source: string | null): Finding[] {
  if (!source) return [];
  const entries = source.split(/^(?=###\s)/m);
  return entries.flatMap((entry) => {
    const m = /^###\s+(F-\d+)\s+\[(P[0-3])\]\s+(\w+)\s+-\s+(.+)$/im.exec(entry);
    if (!m) return [];
    // A finding raised while building has no lens: "2026-09-26 while writing the guide".
    // Matching from the last parenthesis keeps this linear; a whole-line pattern was quadratic.
    const found = labelled(entry, "Found");
    const paren = found ? found.lastIndexOf("(") : -1;
    const lensed = found && paren >= 0 ? /^\((?:scope:[^;)]*;\s*)?lens:\s*([^)]+)\)\s*$/.exec(found.slice(paren)) : null;
    return [
      {
        id: m[1] as string,
        severity: m[2] as Finding["severity"],
        status: m[3] as Finding["status"],
        title: (m[4] ?? "").trim(),
        file: labelled(entry, "File"),
        found: lensed && found ? found.slice(0, paren).trim() : found,
        lens: lensed ? (lensed[1] ?? "").trim() : null,
        why: labelled(entry, "Why it matters"),
        fix: labelled(entry, "Suggested fix"),
        resolution: labelled(entry, "Resolution")
      }
    ];
  });
}

/** The text after `**Label:**` on its line, or null when the label is absent or empty. */
function labelled(entry: string, label: string): string | null {
  const value = new RegExp(`^\\*\\*${label}:\\*\\*[ \\t]*(.*)$`, "m").exec(entry)?.[1]?.trim();
  return value ? value : null;
}

export function parseOpenQuestions(overview: string | null): string[] {
  if (!overview) return [];
  const section = /##\s+Open questions\s*\n([\s\S]*?)(?:\n##\s|$)/i.exec(overview);
  if (!section?.[1]) return [];
  return [...section[1].matchAll(/^-\s+\*\*(.+?)\*\*/gim)].map((m) => (m[1] ?? "").trim());
}

/** The stamp the overview carries, and the hash the current plans produce. */
export function overviewHash(projectPlan: string, buildPlan: string): string {
  return crypto.createHash("sha256").update(projectPlan).update(buildPlan).digest("hex").slice(0, 16);
}

export async function readProjectState(root: string): Promise<ProjectState> {
  const [configRaw, projectPlan, buildPlan, work, findings, overview] = await Promise.all([
    readIfPresent(statePath(root, "config.json")),
    readIfPresent(statePath(root, "project-plan.md")),
    readIfPresent(statePath(root, "build-plan.md")),
    readIfPresent(statePath(root, "context", "current-work.md")),
    readIfPresent(statePath(root, "context", "findings.md")),
    readIfPresent(statePath(root, "context", "project-overview.md"))
  ]);

  let config: unknown = null;
  let configValid = true;
  if (configRaw !== null) {
    try {
      config = JSON.parse(configRaw);
    } catch {
      configValid = false;
    }
  }

  const stamped = overview ? /source-hash\s+([0-9a-f]{16})/.exec(overview)?.[1] ?? null : null;
  const generated = overview !== null && !/_Not generated yet\./.test(overview);

  return {
    root,
    config,
    configValid,
    plan: parsePlan(buildPlan),
    work: parseWork(work),
    findings: parseFindings(findings),
    overviewPresent: generated,
    overviewFresh:
      !generated || stamped === null
        ? null
        : stamped === overviewHash(projectPlan ?? "", buildPlan ?? ""),
    openQuestions: parseOpenQuestions(overview)
  };
}
