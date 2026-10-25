/**
 * Parsers for the state files.
 *
 * Each file has one parser and one shape. These are deliberately tolerant: a half-written
 * plan or a hand-edited ledger should degrade into partial information, never an exception,
 * because the commands that use this are how someone finds out what is wrong.
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { installedSkills, readIfPresent, statePath } from "./paths.js";

export interface PlanItem {
  number: string | null;
  title: string;
  done: boolean;
  depth: number;
  /** Item numbers this line says it comes after. */
  after: string[];
  /** Whether the line says a spike must answer its question first. */
  spikeFirst: boolean;
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

export interface Activity {
  recorded: boolean;
  command: string | null;
  status: "running" | "blocked" | "ready" | "completed" | null;
  summary: string | null;
  updatedAt: string | null;
  resumeCommand: string | null;
}

export interface JournalEntry {
  heading: string;
  date: string | null;
  archive: string | null;
  surprised: string | null;
  wentWrong: string | null;
  deferred: string | null;
  summary: string | null;
  decided: boolean;
}

export interface Learning {
  lessons: string[];
  journal: JournalEntry[];
  undecided: number;
}

/** Item numbers a spike archive says it answered and settled, from `**For:** item N` and `**Settled:** yes`. */
export function parseSettledSpike(source: string): string | null {
  const item = /^\*\*For:\*\*\s*item\s+(\d+[a-z]?)\b/im.exec(source)?.[1]?.toLowerCase();
  return item && /^\*\*Settled:\*\*\s*yes\b/im.test(source) ? item : null;
}

/**
 * What each unticked item still waits on, and the references that cannot be met at all.
 * An item waits on an earlier one until that is ticked, and on its spike until one settles it.
 */
export function waiting(plan: readonly PlanItem[], settled: ReadonlySet<string>): { waits: Map<string, string[]>; problems: string[] } {
  const byNumber = new Map<string, PlanItem>();
  const problems: string[] = [];
  for (const item of plan.filter((i) => i.number)) {
    if (byNumber.has(item.number!)) problems.push(`item ${item.number} appears more than once`);
    else byNumber.set(item.number!, item);
  }
  const waits = new Map<string, string[]>();

  // A sub-item inherits what its parent waits on: splitting an item does not answer its spike.
  const parents: PlanItem[] = [];
  for (const item of plan) {
    while (parents.length && parents[parents.length - 1]!.depth >= item.depth) parents.pop();
    const inherited = parents.flatMap((p) => (p.number && !p.done ? waits.get(p.number) ?? [] : []));
    parents.push(item);
    if (item.done || !item.number) continue;
    const reasons: string[] = [...inherited];
    for (const n of item.after) {
      const other = byNumber.get(n);
      if (!other) problems.push(`item ${item.number} comes after item ${n}, which the plan does not have`);
      else if (!other.done) reasons.push(`item ${n}`);
    }
    if (item.spikeFirst && !settled.has(item.number)) reasons.push("a spike");
    if (reasons.length) waits.set(item.number, [...new Set(reasons)]);
  }

  // A cycle never resolves by ticking anything, so it is named once rather than waited on.
  const seen = new Set<string>();
  for (const start of byNumber.keys()) {
    const path: string[] = [];
    const visit = (n: string): void => {
      if (seen.has(n)) return;
      const at = path.indexOf(n);
      if (at >= 0) {
        problems.push(`items ${[...path.slice(at), n].join(" -> ")} wait on each other`);
        return;
      }
      path.push(n);
      for (const next of byNumber.get(n)?.after ?? []) if (byNumber.has(next) && !byNumber.get(next)!.done) visit(next);
      path.pop();
      seen.add(n);
    };
    visit(start);
  }
  return { waits, problems };
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
  activity: Activity;
  inbox: InboxNote[];
  learning: Learning;
  /** Plan items a spike archive says it settled. */
  settledSpikes: string[];
  /** The active spec's hash, its approval stamp, and whether it drifted from that stamp. */
  spec: { hash: string | null; approved: string | null; drifted: boolean };
  /** Work items active in any worktree of the repository, this one included. */
  inFlight: InFlight[];
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

    // A line that only mentions the syntax, in a code span, does not wait on anything.
    const prose = body.replace(/`[^`]*`/g, "");
    const after = [...prose.matchAll(/\bafter items? (\d+[a-z]?(?:(?:,\s*(?:and\s+)?|\s+and\s+)\d+[a-z]?)*)/gi)].map((m) => m[1]!);
    items.push({
      number: /^([\dA-Za-z]+)\./.exec(body)?.[1]?.toLowerCase() ?? null,
      title: body.replace(/^[\dA-Za-z]+\.\s*/, "").replace(/\*\*/g, ""),
      done: (match[2] ?? " ").toLowerCase() === "x",
      depth: Math.floor((match[1] ?? "").length / 2),
      after: after.flatMap((list) => list.split(/,\s*(?:and\s+)?|\s+and\s+/)).map((n) => n.trim().toLowerCase()).filter(Boolean),
      spikeFirst: /\bspike first\b/i.test(prose)
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
  // Spaces and tabs only: `\s` here crosses newlines, which made blank lines quadratic and
  // joined consecutive unbolded steps into one.
  const steps = [...source.matchAll(/^[ \t]*- \[( |x|X)\][ \t]*(?:\*\*(.+?)\*\*|(.+?)(?:[ \t]-[ \t]|$))/gim)];
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
  evidence: Evidence | null;
  /** The stamp implementation wrote when it started: when, and the hash of what was approved. */
  approved: { date: string; hash: string } | null;
  /** Dated changes to what the spec asks for, each with its reason. */
  amendments: string[];
  /** True only when a stamp exists and the spec no longer matches it. */
  drifted: boolean;
}

/** What `check` recorded: its stamp, and one verdict per outcome. */
export interface Evidence {
  stamp: string | null;
  entries: { outcome: string; verdict: string; detail: string }[];
}

/** The active spec as written, for showing rather than deciding. Null when nothing is in progress. */
export function parseSpec(source: string | null): Spec | null {
  if (!source || /_Nothing in progress\./.test(source)) return null;
  // A heading inside a code fence is an example, not a section of the spec.
  const section = sections(outsideFences(source));

  return {
    title: field(source, "#"),
    type: field(source, "Type"),
    planItem: field(source, "From build plan")?.replace(/^item\s+/i, "") ?? null,
    status: field(source, "Status"),
    goal: (section.get("goal") ?? "").split(/\n\s*\n/).map(join).filter(Boolean),
    inScope: bullets(section.get("in scope")),
    outOfScope: bullets(section.get("out of scope")),
    files: bullets(section.get("files and areas")),
    steps: bullets(section.get("build steps"), true).map(parseStep),
    evidence: parseEvidence(section.get("evidence")),
    ...approval(source)
  };
}

function approval(source: string): Pick<Spec, "approved" | "amendments" | "drifted"> {
  // An example of the stamp or the section inside a code fence is documentation, not the record.
  const prose = outsideFences(source);
  const line = /^\*\*Approved:\*\*.*$/m.exec(prose)?.[0];
  const stamp = line ? /^\*\*Approved:\*\*\s*(\d{4}-\d{2}-\d{2})\s*,\s*([0-9a-f]{16})\s*$/i.exec(line) : null;
  const approved = stamp ? { date: stamp[1]!, hash: stamp[2]!.toLowerCase() } : null;
  return {
    approved,
    amendments: bullets(sections(prose).get("amendments")),
    // A stamp line that cannot be read proves nothing, so it counts as drift rather than hiding it.
    drifted: line !== undefined && (approved === null || approved.hash !== specHash(source))
  };
}

function specState(work: string | null): ProjectState["spec"] {
  const spec = parseSpec(work);
  if (!spec || !work) return { hash: null, approved: null, drifted: false };
  return { hash: specHash(work), approved: spec.approved?.hash ?? null, drifted: spec.drifted };
}

const FENCE = /^\s*(```|~~~)/;

/** The source with every line inside a ``` or ~~~ fence blanked, so line structure stays but nothing inside is read. */
function outsideFences(source: string): string {
  let fenced = false;
  return source
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        return "";
      }
      return fenced ? "" : line;
    })
    .join("\n");
}

/**
 * The hash of what a spec asks for. Ticks, the status, the stamp, and the Evidence and
 * Amendments sections change as work proceeds without changing what was approved, so they are
 * left out; anything else that changes is a change to the spec.
 */
export function specHash(source: string): string {
  const kept: string[] = [];
  let fenced = false;
  let skipping = false;
  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    if (FENCE.test(line)) fenced = !fenced;
    else if (!fenced && /^##\s/.test(line)) skipping = /^##\s+(evidence|amendments)\s*$/i.test(line);
    if (skipping) continue;
    if (!fenced && /^\*\*(Status|Approved):\*\*/.test(line)) continue;
    kept.push((fenced ? line : line.replace(/^(\s*- \[)[xX](\])/, "$1 $2")).replace(/\s+$/, ""));
  }
  const text = kept.join("\n").replace(/\s+$/, "");
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function parseEvidence(body: string | undefined): Evidence | null {
  if (body === undefined) return null;
  return {
    stamp: /^Checked .+$/m.exec(body)?.[0].trim() ?? null,
    entries: bullets(body).map((item) => {
      const m = /^\*\*(.+?)\*\*\s*-\s*(pass|fail|could not check):?\s*([\s\S]*)$/i.exec(item);
      return m ? { outcome: m[1]!.trim(), verdict: m[2]!.toLowerCase(), detail: m[3]!.trim() } : { outcome: item, verdict: "unknown", detail: "" };
    })
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

const ACTIVITY_STATUSES = new Set(["running", "blocked", "ready", "completed"]);

const SKILL_NAME = /^[a-z][a-z-]{0,39}$/;

// The blocked skill's own invocation and plain word arguments, such as `/auto resume`.
// Anything else in the record could be a shell command dressed up as the next thing to run.
// The length bound comes first: the repeated group overflows the regex stack on megabytes.
const RESUME_ARGUMENTS = /^(?: [\w-]+)*$/;
const RESUME_MAX = 200;

// A record is written by an agent, so it must not be able to move the cursor, print lines,
// or reorder the text around it.
const CONTROL = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

/**
 * The activity record a running skill writes. Skills write it, so only its named fields are
 * read, and a record naming a skill that is not installed is not believed at all: whoever can
 * write the record controls every field in it.
 */
export function parseActivity(source: string | null, skills: ReadonlySet<string>): Activity {
  const none: Activity = { recorded: false, command: null, status: null, summary: null, updatedAt: null, resumeCommand: null };
  if (!source) return none;

  let record: unknown;
  try {
    record = JSON.parse(source);
  } catch {
    return none;
  }
  if (!record || typeof record !== "object") return none;

  const { command, status, summary, updatedAt, resumeCommand } = record as Record<string, unknown>;
  if (typeof command !== "string" || !SKILL_NAME.test(command) || !skills.has(command)) return none;
  if (typeof summary !== "string") return none;
  if (typeof status !== "string" || !ACTIVITY_STATUSES.has(status)) return none;

  return {
    recorded: true,
    command,
    status: status as Activity["status"],
    summary: summary.replace(CONTROL, " "),
    updatedAt: typeof updatedAt === "string" ? updatedAt.replace(CONTROL, " ") : null,
    resumeCommand: resumes(command, resumeCommand) ? resumeCommand : null
  };
}

function resumes(command: string, resumeCommand: unknown): resumeCommand is string {
  if (typeof resumeCommand !== "string" || resumeCommand.length > RESUME_MAX) return false;
  const invocation = resumeCommand.replace(/^[/$]/, "");
  return (invocation === command || invocation.startsWith(command + " ")) &&
    RESUME_ARGUMENTS.test(invocation.slice(command.length));
}

/** The lessons after the file's own heading and note, or none while it holds only the stub. */
export function parseLessons(source: string | null): string[] {
  if (!source) return [];
  const body = source
    .split(/\r?\n/)
    .filter((line) => !/^#{1,6}[ \t]/.test(line) && !/^>/.test(line) && !/^_Nothing learned yet\._$/.test(line.trim()))
    .join("\n");
  return blocks(body);
}

/** One entry per `##` heading, each decided once `journal-archive.md` carries that heading. */
export function parseJournal(source: string | null, archive: string | null): JournalEntry[] {
  if (!source) return [];
  const decided = new Set(
    (archive ?? "").split(/\r?\n/).flatMap((line) => /^##[ \t]+(\S.*)$/.exec(line)?.[1]?.trim() ?? [])
  );
  return source.split(/^(?=##[ \t])/m).flatMap((entry) => {
    const heading = /^##[ \t]+(\S.*)$/.exec(entry.split(/\r?\n/, 1)[0] ?? "")?.[1]?.trim();
    if (!heading) return [];
    const unlabelled = entry
      .split(/\r?\n/)
      .slice(1)
      .filter((line) => !/^\*\*[^*]+:\*\*/.test(line))
      .join("\n");
    return [
      {
        heading,
        date: /^(\d{4}-\d{2}-\d{2})\b/.exec(heading)?.[1] ?? null,
        archive: labelled(entry, "Archive"),
        surprised: labelled(entry, "Surprised"),
        wentWrong: labelled(entry, "Went wrong"),
        deferred: labelled(entry, "Deferred"),
        summary: blocks(unlabelled)[0] ?? null,
        decided: decided.has(heading)
      }
    ];
  });
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
    // A finding raised during a planned item carries the item's prefix, `39a/F-1`; older ones are bare.
    const m = /^###\s+((?:[\w-]+\/)?F-\d+)\s+\[(P[0-3])\]\s+(\w+)\s+-\s+(.+)$/im.exec(entry);
    if (!m) return [];
    // A finding raised while building has no lens: "2026-09-26 while writing the guide".
    // Matching from the last parenthesis, with no two parts able to take the same spaces, keeps this linear.
    const found = labelled(entry, "Found");
    const paren = found ? found.lastIndexOf("(") : -1;
    const lensed = found && paren >= 0 ? /^\((?:scope:[^;)]*;\s*)?lens:([^)]+)\)\s*$/.exec(found.slice(paren)) : null;
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

export interface Worktree {
  /** Resolved absolute path. */
  path: string;
  /** Short branch name; null when detached. */
  branch: string | null;
}

function headBranch(head: string | null): string | null {
  return /^ref:\s*refs\/heads\/(.+)$/m.exec(head ?? "")?.[1]?.trim() ?? null;
}

/** The git directory a `.git` entry stands for: itself, or where its `gitdir:` line points. */
async function gitDir(dotgit: string): Promise<string | null> {
  const stat = await fs.stat(dotgit).catch(() => null);
  if (!stat) return null;
  if (stat.isDirectory()) return dotgit;
  const target = /^gitdir:\s*(.+)$/m.exec((await readIfPresent(dotgit)) ?? "")?.[1]?.trim();
  return target ? path.resolve(path.dirname(dotgit), target) : null;
}

/**
 * The repository's worktrees and the one holding `root`, read from git's own records under
 * `worktrees/` rather than by running git, which shipped code may not do. A worktree whose
 * directory is gone is left out, and so is the main entry of a bare repository. Null outside
 * a repository.
 */
export async function listWorktrees(root: string): Promise<{ home: string; trees: Worktree[] } | null> {
  let home = await fs.realpath(root).catch(() => null);
  let own: string | null = null;
  while (home && !(own = await gitDir(path.join(home, ".git")))) {
    const up = path.dirname(home);
    home = up === home ? null : up;
  }
  if (!home || !own) return null;
  const commondir = await readIfPresent(path.join(own, "commondir"));
  const common = commondir ? path.resolve(own, commondir.trim()) : own;
  const records = [{ dir: path.basename(common) === ".git" ? path.dirname(common) : null, git: common }];
  for (const id of await fs.readdir(path.join(common, "worktrees")).catch(() => [])) {
    const git = path.join(common, "worktrees", id);
    const target = (await readIfPresent(path.join(git, "gitdir")))?.trim();
    // Git calls a record prunable once the `.git` file it points at is gone.
    const dotgit = target ? path.resolve(git, target) : null;
    if (dotgit && (await fs.stat(dotgit).catch(() => null))) records.push({ dir: path.dirname(dotgit), git });
  }
  const trees: Worktree[] = [];
  for (const { dir, git } of records) {
    const resolved = dir ? await fs.realpath(dir).catch(() => null) : null;
    if (resolved) trees.push({ path: resolved, branch: headBranch(await readIfPresent(path.join(git, "HEAD"))) });
  }
  if (!trees.some((t) => t.path === home)) trees.unshift({ path: home, branch: headBranch(await readIfPresent(path.join(own, "HEAD"))) });
  return { home, trees };
}

export interface InFlight {
  /** Resolved absolute path. */
  worktree: string;
  branch: string | null;
  /** The spec's build-plan number, null for unplanned work. */
  item: string | null;
  title: string | null;
  stepsDone: number;
  stepsTotal: number;
  /** True for the worktree this command ran in. */
  here: boolean;
}

/** Far above any real spec; a larger file in another worktree is not read. */
const SPEC_MAX = 256 * 1024;

/**
 * A file another worktree's branch controls: a link could point at a device that never ends,
 * or at a file whose first heading would be reported as a title. So it is opened without
 * following a link or blocking, checked through the open handle, and read up to the cap.
 */
async function readPlain(file: string, within: string): Promise<string | null> {
  // A linked directory on the way would lead outside that worktree.
  // Only the folder is resolved, so the open below still refuses a spec that is itself a link.
  const folder = await fs.realpath(path.dirname(file)).catch(() => null);
  if (!folder || !(folder + path.sep).startsWith(within + path.sep)) return null;
  const resolved = path.join(folder, path.basename(file));
  const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0) | (fs.constants.O_NONBLOCK ?? 0);
  const handle = await fs.open(resolved, flags).catch(() => null);
  if (!handle) return null;
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > SPEC_MAX) return null;
    const buffer = Buffer.alloc(stat.size);
    const { bytesRead } = await handle.read(buffer, 0, stat.size, 0);
    return buffer.subarray(0, bytesRead).toString("utf8");
  } catch {
    return null;
  } finally {
    await handle.close().catch(() => undefined);
  }
}

/** Active specs across the repository's worktrees; empty outside a repository. */
export async function readInFlight(root: string): Promise<InFlight[]> {
  const listed = await listWorktrees(root);
  const self = await fs.realpath(root).catch(() => null);
  if (!listed || !self) return [];
  // Religion may live below the repository's top, so each spec sits at the same offset in its worktree.
  const offset = path.relative(listed.home, self);
  const found: InFlight[] = [];
  for (const { path: worktree, branch } of listed.trees) {
    // A wave's step worktree holds a copy of its parent item's spec, not an item of its own.
    if (/^step-\d+$/.test(path.basename(worktree)) && (await readIfPresent(path.join(path.dirname(worktree), "base"))) !== null) continue;
    const spec = statePath(path.join(worktree, offset), "context", "current-work.md");
    // This worktree's spec is read as `work` reads it; another's comes from someone else's branch.
    const source = worktree === listed.home ? await readIfPresent(spec) : await readPlain(spec, worktree);
    const work = parseWork(source);
    if (!source || !work.active) continue;
    const plan = field(source, "From build plan");
    found.push({
      worktree,
      branch,
      // Plan numbers are compared lowercased, as the build plan's parser stores them.
      item: plan ? /^item\s+([0-9a-z]+)/i.exec(plan)?.[1]?.toLowerCase() ?? null : null,
      title: work.title,
      stepsDone: work.stepsDone,
      stepsTotal: work.stepsTotal,
      here: worktree === listed.home
    });
  }
  return found;
}

/** The stamp the overview carries, and the hash the current plans produce. */
export function overviewHash(projectPlan: string, buildPlan: string): string {
  return crypto.createHash("sha256").update(projectPlan).update(buildPlan).digest("hex").slice(0, 16);
}

export async function readProjectState(root: string): Promise<ProjectState> {
  const [configRaw, projectPlan, buildPlan, work, findings, overview, activity, inbox] = await Promise.all([
    readIfPresent(statePath(root, "config.json")),
    readIfPresent(statePath(root, "project-plan.md")),
    readIfPresent(statePath(root, "build-plan.md")),
    readIfPresent(statePath(root, "context", "current-work.md")),
    readIfPresent(statePath(root, "context", "findings.md")),
    readIfPresent(statePath(root, "context", "project-overview.md")),
    readIfPresent(statePath(root, ".state", "run.json")),
    readIfPresent(statePath(root, "context", "inbox.md"))
  ]);
  const [lessons, journal, journalArchive] = await Promise.all([
    readIfPresent(statePath(root, "learning", "lessons.md")),
    readIfPresent(statePath(root, "learning", "journal.md")),
    readIfPresent(statePath(root, "learning", "journal-archive.md"))
  ]);
  const entries = parseJournal(journal, journalArchive);
  const settledSpikes: string[] = [];
  try {
    for (const name of (await fs.readdir(statePath(root, "history", "spikes"))).filter((n) => n.endsWith(".md") && n !== "README.md")) {
      const item = parseSettledSpike((await readIfPresent(statePath(root, "history", "spikes", name))) ?? "");
      if (item) settledSpikes.push(item);
    }
  } catch {
    // No spikes directory: nothing settled.
  }

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
    openQuestions: parseOpenQuestions(overview),
    activity: parseActivity(activity, await installedSkills(root)),
    inbox: parseInbox(inbox),
    learning: { lessons: parseLessons(lessons), journal: entries, undecided: entries.filter((e) => !e.decided).length },
    settledSpikes,
    spec: specState(work),
    inFlight: await readInFlight(root)
  };
}
