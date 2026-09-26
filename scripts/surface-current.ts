/**
 * The public surface as the code defines it today, for comparison with its record.
 *
 * Read from the tables the tool itself runs on, never restated here, so the record is
 * compared with what actually ships rather than with a second copy of it.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GRAMMAR } from "../packages/create-religion/lib/args.js";
import { ALLOWED } from "../packages/create-religion/lib/doctor.js";
import { ADAPTERS } from "../packages/create-religion/lib/install.js";
import { PLANNED_SKILLS } from "../src/lib/skills.js";
import type { Surface } from "./surface.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const SURFACE_RECORD = path.join(repoRoot, "packages", "create-religion", "surface.json");

/** Commands and their options, skills, adapters and what they install, and settings. */
export async function currentSurface(): Promise<Record<string, Surface>> {
  const adapters = Object.fromEntries(
    Object.entries(ADAPTERS).map(([id, adapter]) => [id, { trees: [...adapter.trees], entry: [...adapter.entry] }])
  );

  return {
    commands: Object.fromEntries(Object.entries(GRAMMAR).map(([command, flags]) => [command, [...flags]])),
    skills: [...PLANNED_SKILLS],
    adapters,
    config: await currentConfig()
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
