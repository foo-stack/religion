/**
 * Every setting in the configuration reference, with what it accepts.
 *
 * `doctor`, the surface record and the verification suite read this one table, and the
 * verification suite holds it to `docs/architecture/config.md`, so the reference, the shipped
 * defaults and the check cannot disagree without a failing check saying so.
 */

export type Setting =
  | { kind: "enum"; values: readonly string[]; default: string }
  | { kind: "boolean"; default: boolean }
  | { kind: "prefix"; default: string }
  | { kind: "integer"; min: number; max?: number; nullable?: boolean; default: number | null };

const prefix = (value: string): Setting => ({ kind: "prefix", default: value });

export const SETTINGS: Record<string, Setting> = {
  schemaVersion: { kind: "integer", min: 1, max: 1, default: 1 },
  "workflow.stepReview": { kind: "enum", values: ["every", "item"], default: "every" },
  "workflow.parallelSteps": { kind: "boolean", default: false },
  "git.mode": { kind: "enum", values: ["trunk", "branch-per-item", "pull-request"], default: "trunk" },
  "git.checkpoints": { kind: "enum", values: ["none", "every-step", "squash"], default: "every-step" },
  "git.featureBranchPrefix": prefix("feature/"),
  "git.fixBranchPrefix": prefix("fix/"),
  "git.rollbackBranchPrefix": prefix("rollback/"),
  "git.refactorBranchPrefix": prefix("refactor/"),
  "git.integrationBranchPrefix": prefix("auto/"),
  "verification.logicTests": { kind: "enum", values: ["when-configured", "required"], default: "when-configured" },
  "verification.uiEvidence": { kind: "enum", values: ["when-available", "required"], default: "when-available" },
  "qualityGates.audit": { kind: "enum", values: ["manual", "when-sensitive", "always"], default: "when-sensitive" },
  "qualityGates.check": { kind: "enum", values: ["manual", "when-behavioral", "always"], default: "when-behavioral" },
  "auto.maxItems": { kind: "integer", min: 1, nullable: true, default: null },
  "auto.maxRepairAttempts": { kind: "integer", min: 0, max: 10, default: 2 },
  "auto.finalAudit": { kind: "boolean", default: false },
  "security.blockInjection": { kind: "boolean", default: false },
  "refactor.maxFileLines": { kind: "integer", min: 1, default: 400 },
  "refactor.maxFunctionLines": { kind: "integer", min: 1, default: 50 }
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
