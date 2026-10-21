/**
 * Every setting in the configuration reference, with what it accepts.
 *
 * `doctor`, the surface record and the verification suite read this one table, and the
 * verification suite holds it to `docs/architecture/config.md`, so the reference, the shipped
 * defaults and the check cannot disagree without a failing check saying so.
 */

export type Setting = (
  | { kind: "enum"; values: readonly string[]; default: string }
  | { kind: "boolean"; default: boolean }
  | { kind: "prefix"; default: string }
  | { kind: "integer"; min: number; max?: number; nullable?: boolean; default: number | null }
) & { summary: string };

const prefix = (value: string, summary: string): Setting => ({ kind: "prefix", default: value, summary });

export const SETTINGS: Record<string, Setting> = {
  schemaVersion: { kind: "integer", min: 1, max: 1, default: 1, summary: "The format of this file." },
  "workflow.stepReview": {
    kind: "enum", values: ["every", "item"], default: "every",
    summary: "When implementation stops for review: after every step, or once with the whole item."
  },
  "workflow.parallelSteps": {
    kind: "boolean", default: false,
    summary: "Whether steps a spec marks as independent build together as one reviewed wave."
  },
  "git.mode": {
    kind: "enum", values: ["trunk", "branch-per-item", "pull-request"], default: "trunk",
    summary: "Where work lands: the branch you are on, a branch merged per item, or a pull request per item."
  },
  "git.checkpoints": {
    kind: "enum", values: ["none", "every-step", "squash"], default: "every-step",
    summary: "What happens to each step's work: one commit at completion, a commit per step, or per-step commits squashed at completion."
  },
  "git.featureBranchPrefix": prefix("feature/", "The prefix of a feature's branch, outside trunk mode."),
  "git.fixBranchPrefix": prefix("fix/", "The prefix of a fix's branch, outside trunk mode."),
  "git.rollbackBranchPrefix": prefix("rollback/", "The prefix of a rollback's branch, outside trunk mode."),
  "git.refactorBranchPrefix": prefix("refactor/", "The prefix of a refactor campaign's branch, outside trunk mode."),
  "git.integrationBranchPrefix": prefix("auto/", "The prefix of the branch an automated run lands every item on, under pull-request mode."),
  "verification.logicTests": {
    kind: "enum", values: ["when-configured", "required"], default: "when-configured",
    summary: "Whether a logic change needs passing tests only when a test command is declared, or always."
  },
  "verification.uiEvidence": {
    kind: "enum", values: ["when-available", "required"], default: "when-available",
    summary: "Whether an interface outcome needs browser evidence when it can be had, or always."
  },
  "qualityGates.audit": {
    kind: "enum", values: ["manual", "when-sensitive", "always"], default: "when-sensitive",
    summary: "When the read-only review runs on its own: never, for sensitive work, or for every item."
  },
  "qualityGates.check": {
    kind: "enum", values: ["manual", "when-behavioral", "always"], default: "when-behavioral",
    summary: "When the outside proof runs on its own: never, when an outcome needs observed behaviour, or for every item."
  },
  "auto.maxItems": {
    kind: "integer", min: 1, nullable: true, default: null,
    summary: "How many items one automated run may complete; null for no limit."
  },
  "auto.maxRepairAttempts": {
    kind: "integer", min: 0, max: 10, default: 2,
    summary: "How many times an automated run tries to repair one finding before it stops and reports."
  },
  "auto.finalAudit": { kind: "boolean", default: false, summary: "Whether an automated run ends with one review across everything it produced." },
  "security.blockInjection": {
    kind: "boolean", default: false,
    summary: "Whether content carrying three or more injection signatures is blocked, rather than read with a warning."
  },
  "refactor.maxFileLines": { kind: "integer", min: 1, default: 400, summary: "The file length the structure lens of a refactor survey measures against." },
  "refactor.maxFunctionLines": { kind: "integer", min: 1, default: 50, summary: "The function length the structure lens of a refactor survey measures against." }
};

const PREFIX = /^[a-z0-9][a-z0-9._/-]*\/$/;

// What git refuses in a branch name, checked per path component of the prefix.
const BAD_COMPONENT = (part: string) => part === "" || part.startsWith(".") || part.endsWith(".lock") || part.includes("..");

/** The reference's Values and Default cells for a setting, as `docs/architecture/config.md` writes them. */
export function referenceCells(setting: Setting): { values: string; default: string } {
  const code = (value: unknown) => "`" + String(value) + "`";
  const values =
    setting.kind === "enum"
      ? setting.values.map(code).join(", ")
      : setting.kind === "boolean"
        ? "`true`, `false`"
        : setting.kind === "prefix"
          ? "lowercase prefix ending in `/`"
          : (setting.min === 1 && setting.max === undefined ? "positive integer" : `integer from ${setting.min} through ${setting.max}`) +
            (setting.nullable ? ", or `null` for no limit" : "");
  return { values, default: code(setting.default) };
}

/** What each setting present in `config` gets wrong, one sentence each. Absent settings take their default. */
export function settingProblems(config: unknown): string[] {
  if (config === null || typeof config !== "object" || Array.isArray(config)) return ["not an object"];

  const problems: string[] = [];
  const sections = new Set(Object.keys(SETTINGS).filter((k) => k.includes(".")).map((k) => k.split(".")[0]!));
  for (const section of sections) {
    const value = (config as Record<string, unknown>)[section];
    if (value !== undefined && (value === null || typeof value !== "object" || Array.isArray(value))) {
      problems.push(`${section} is ${JSON.stringify(value)}, expected an object of settings`);
    }
  }

  for (const [key, setting] of Object.entries(SETTINGS)) {
    const value = key.split(".").reduce<unknown>(
      (node, part) => (node && typeof node === "object" && !Array.isArray(node) ? (node as Record<string, unknown>)[part] : undefined),
      config
    );
    if (value === undefined) continue;
    const wanted = expected(setting, value);
    if (wanted) problems.push(`${key} is ${JSON.stringify(value)}, expected ${wanted}`);
  }
  return problems;
}

/** What would have been accepted, or null when the value is fine. */
function expected(setting: Setting, value: unknown): string | null {
  switch (setting.kind) {
    case "enum":
      return typeof value === "string" && setting.values.includes(value) ? null : `one of ${setting.values.join(", ")}`;
    case "boolean":
      return typeof value === "boolean" ? null : "true or false";
    case "prefix":
      return typeof value === "string" && PREFIX.test(value) && !value.slice(0, -1).split("/").some(BAD_COMPONENT)
        ? null
        : "a lowercase prefix ending in /";
    case "integer": {
      if (value === null && setting.nullable) return null;
      const ok = Number.isInteger(value) && (value as number) >= setting.min && (setting.max === undefined || (value as number) <= setting.max);
      if (ok) return null;
      const range = setting.max === undefined ? `${setting.min} or more` : setting.min === setting.max ? `${setting.min}` : `from ${setting.min} through ${setting.max}`;
      return `an integer ${range}` + (setting.nullable ? ", or null" : "");
    }
  }
}

export interface SettingRow {
  key: string;
  summary: string | null;
  accepts: string | null;
  default: string | null;
  value: string | null;
  problem: string | null;
}

/** Every setting, set or not, with what it means and accepts, then any key the schema does not name. */
export function describeSettings(config: unknown): SettingRow[] {
  const problems = settingProblems(config);
  const read = (key: string) =>
    key.split(".").reduce<unknown>(
      (node, part) => (node && typeof node === "object" && !Array.isArray(node) ? (node as Record<string, unknown>)[part] : undefined),
      config
    );
  const rows: SettingRow[] = Object.entries(SETTINGS).map(([key, setting]) => {
    const value = read(key);
    const cells = referenceCells(setting);
    return {
      key,
      summary: setting.summary,
      accepts: cells.values,
      default: cells.default,
      value: value === undefined ? null : JSON.stringify(value),
      problem: problems.find((p) => p.startsWith(`${key} is `)) ?? null
    };
  });

  if (config && typeof config === "object" && !Array.isArray(config)) {
    for (const [section, value] of Object.entries(config)) {
      const keys = value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).map((k) => `${section}.${k}`) : [section];
      for (const key of keys) {
        if (!SETTINGS[key] && !(key === section && sectionNamed(section))) {
          rows.push({ key, summary: null, accepts: null, default: null, value: JSON.stringify(read(key)), problem: "not a setting Religion reads" });
        }
      }
    }
  }
  return rows;
}

function sectionNamed(section: string): boolean {
  return Object.keys(SETTINGS).some((key) => key.startsWith(`${section}.`));
}
