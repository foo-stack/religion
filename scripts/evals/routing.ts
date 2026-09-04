/**
 * Routing evaluation.
 *
 * With 22 skills sharing a bare namespace, the dominant failure is not a skill doing its
 * job badly: it is the wrong skill being selected, or a neighbour being pulled away from
 * one it owned. These cases are the corpus that catches it.
 *
 * Scoring a real selection needs a model, and this harness does not call one. What it does
 * deterministically catches the mechanical causes:
 *
 *  - every skill has cases, including negative ones
 *  - every case names a skill that exists
 *  - no two skills claim the same case
 *  - descriptions are discriminative: a skill whose distinctive vocabulary largely overlaps
 *    another's cannot be selected reliably, whatever model is doing the selecting
 *
 * `--report` prints the vocabulary overlap between every pair, worst first.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readSkills } from "../../src/lib/skills.js";
import type { Skill } from "../../src/lib/skills.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const evalsRoot = path.join(repoRoot, "evals", "routing");

interface EvalCase {
  prompt: string;
  owner?: string;
}

interface EvalFile {
  skill: string;
  positive: EvalCase[];
  negative: EvalCase[];
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "for", "on", "it", "its", "is", "are",
  "that", "this", "with", "when", "use", "user", "runs", "asks", "wants", "then", "from",
  "into", "not", "never", "always", "each", "one", "what", "which", "them", "their", "by",
  "be", "at", "as", "so", "but", "any", "all", "can", "has", "have", "was", "were", "than",
  "work", "project", "religion", "state", "context", "skill", "does", "done", "make"
]);

const OVERLAP_LIMIT = 0.5;

async function main(): Promise<void> {
  const report = process.argv.includes("--report");
  const skills = await readSkills(path.join(repoRoot, "src", "skills"));
  const files = await readEvals();
  const problems: string[] = [];

  const names = new Set(skills.map((s) => s.name));
  const covered = new Set(files.map((f) => f.skill));

  for (const skill of skills) {
    if (!covered.has(skill.name)) problems.push(`${skill.name}: no routing cases`);
  }

  const seen = new Map<string, string>();
  for (const file of files) {
    if (!names.has(file.skill)) problems.push(`${file.skill}.json: no such skill`);
    if (file.positive.length === 0) problems.push(`${file.skill}: no positive cases`);
    if (file.negative.length === 0) {
      problems.push(`${file.skill}: no negative cases; those are what catch a skill stealing from a neighbour`);
    }

    for (const item of file.negative) {
      if (item.owner && !names.has(item.owner)) {
        problems.push(`${file.skill}: negative case names unknown owner "${item.owner}"`);
      }
    }

    for (const item of file.positive) {
      const key = item.prompt.toLowerCase().trim();
      const other = seen.get(key);
      if (other && other !== file.skill) {
        problems.push(`"${item.prompt}" is claimed by both ${other} and ${file.skill}`);
      }
      seen.set(key, file.skill);
    }
  }

  const overlaps = overlapMatrix(skills);
  for (const entry of overlaps) {
    if (entry.score >= OVERLAP_LIMIT) {
      problems.push(
        `${entry.a} and ${entry.b} share ${Math.round(entry.score * 100)}% of their distinctive vocabulary; ` +
          `requests cannot reliably reach one rather than the other`
      );
    }
  }

  if (report) {
    console.log("Description overlap, worst first:\n");
    for (const entry of overlaps.slice(0, 12)) {
      console.log(`  ${String(Math.round(entry.score * 100)).padStart(3)}%  ${entry.a} / ${entry.b}`);
    }
    console.log("");
  }

  const cases = files.reduce((n, f) => n + f.positive.length + f.negative.length, 0);

  if (problems.length > 0) {
    console.error(`${problems.length} routing problem(s):\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log(`Routing corpus: ${files.length} skill(s), ${cases} case(s). No structural problems.`);
}

/** Jaccard overlap of each pair's distinctive description vocabulary. */
function overlapMatrix(skills: readonly Skill[]): { a: string; b: string; score: number }[] {
  const vocab = new Map<string, Set<string>>();
  for (const skill of skills) {
    vocab.set(
      skill.name,
      new Set(
        `${skill.summary} ${skill.description}`
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((word) => word.length > 3 && !STOP.has(word))
      )
    );
  }

  const pairs: { a: string; b: string; score: number }[] = [];
  const names = [...vocab.keys()].sort();

  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const first = vocab.get(names[i] as string) as Set<string>;
      const second = vocab.get(names[j] as string) as Set<string>;
      const shared = [...first].filter((word) => second.has(word)).length;
      const union = new Set([...first, ...second]).size;
      pairs.push({ a: names[i] as string, b: names[j] as string, score: union === 0 ? 0 : shared / union });
    }
  }

  return pairs.sort((x, y) => y.score - x.score);
}

async function readEvals(): Promise<EvalFile[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(evalsRoot);
  } catch {
    return [];
  }

  const files: EvalFile[] = [];
  for (const entry of entries.filter((e) => e.endsWith(".json")).sort()) {
    files.push(JSON.parse(await fs.readFile(path.join(evalsRoot, entry), "utf8")) as EvalFile);
  }
  return files;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
