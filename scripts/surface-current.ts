/**
 * The public surface as the code defines it today, for comparison with its record.
 *
 * Read from the tables the tool itself runs on, never restated here, so the record is
 * compared with what actually ships rather than with a second copy of it.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GRAMMAR } from "../packages/create-religion/lib/args.js";
import { ALLOWED, doctorReport, runDoctor } from "../packages/create-religion/lib/doctor.js";
import { ADAPTERS } from "../packages/create-religion/lib/install.js";
import { readProjectState } from "../packages/create-religion/lib/state.js";
import { computeStatus } from "../packages/create-religion/lib/status.js";
import { readSkills } from "../src/lib/skills.js";
import type { Surface } from "./surface.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const SURFACE_RECORD = path.join(repoRoot, "packages", "create-religion", "surface.json");

/** Commands and their options, skills, adapters and what they install, settings, and the Node range. */
export async function currentSurface(): Promise<Record<string, Surface>> {
  const { engines } = JSON.parse(
    await fs.readFile(path.join(repoRoot, "packages", "create-religion", "package.json"), "utf8")
  ) as { engines?: { node?: string } };

  const adapters = Object.fromEntries(
    Object.entries(ADAPTERS).map(([id, adapter]) => [id, { trees: [...adapter.trees], entry: [...adapter.entry] }])
  );

  return {
    commands: Object.fromEntries(Object.entries(GRAMMAR).map(([command, flags]) => [command, [...flags]])),
    // The authored sources, not the planned roster: the roster is kept by hand, and a skill
    // removed from both would otherwise leave nothing to notice.
    skills: (await readSkills(path.join(repoRoot, "src", "skills"))).map((skill) => skill.name),
    adapters,
    config: await currentConfig(),
    node: engines?.node ?? null
  };
}

/** Each setting with the values it accepts, or the type of its shipped default when it is not enumerated. */
async function currentConfig(): Promise<Record<string, Surface>> {
  const shipped = JSON.parse(await fs.readFile(path.join(repoRoot, "src", "state", "config.json"), "utf8")) as Record<
    string,
    unknown
  >;
  const config: Record<string, Surface> = {};

  for (const [section, value] of Object.entries(shipped)) {
    const entries = value !== null && typeof value === "object" ? Object.entries(value) : [["", value]];
    for (const [key, setting] of entries) {
      const name = key ? `${section}.${key}` : section;
      config[name] = ALLOWED[name] ? [...ALLOWED[name]] : setting === null ? "null" : typeof setting;
    }
  }
  return config;
}

/**
 * What `status --json` and `doctor --json` print, for an idle project and a busy one.
 *
 * Two projects because each shape has fields that are only filled in one state: an idle
 * project gives the nulls, a busy one gives populated arrays whose elements can be checked.
 */
export async function currentOutputs(): Promise<{ status: unknown[]; doctor: unknown[] }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-surface-"));
  try {
    const outputs = { status: [] as unknown[], doctor: [] as unknown[] };
    for (const [name, files] of Object.entries(PROJECTS)) {
      const project = path.join(root, name);
      for (const [relative, contents] of Object.entries(files)) {
        await fs.mkdir(path.dirname(path.join(project, relative)), { recursive: true });
        await fs.writeFile(path.join(project, relative), contents, "utf8");
      }
      outputs.status.push(JSON.parse(JSON.stringify(computeStatus(await readProjectState(project)))));
      outputs.doctor.push(JSON.parse(JSON.stringify(doctorReport(await runDoctor(project)))));
    }
    return outputs;
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

const PROJECTS: Record<string, Record<string, string>> = {
  idle: {
    "religion/config.json": "{}\n",
    "religion/build-plan.md": "## Plan\n\n- [x] 1. **Done** - finished\n",
    "religion/context/current-work.md": "# Current Work\n\n_Nothing in progress._\n"
  },
  busy: {
    "religion/config.json": '{ "git": { "mode": "not-a-mode" } }\n',
    "religion/project-plan.md": "# Plan\n",
    "religion/build-plan.md": "## Plan\n\n- [x] 1. **Done** - finished\n- [ ] 2. **Next** - queued\n",
    "religion/context/current-work.md":
      "# Export reports\n\n**Type:** Feature\n**Status:** in progress\n\n## Build steps\n\n" +
      "- [x] **Step 1 - the serializer** - done\n- [ ] **Step 2 - the route** - next\n",
    "religion/context/findings.md":
      "# Findings\n\n### F-01 [P1] open - A missing guard\n\n### F-02 [P3] closed - A cleanup\n",
    "religion/context/project-overview.md":
      "# Overview\n\n<!-- religion:source-hash 0000000000000000 -->\n\n## Open questions\n\n" +
      "- **Storage** (affects: item 2) - undecided\n"
  }
};
