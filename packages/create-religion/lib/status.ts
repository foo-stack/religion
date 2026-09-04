/**
 * What the project's state means, and the one action that follows from it.
 *
 * The next action is the point. A report that lists five things someone could do has not
 * answered the question they asked, which is almost always "what now".
 */

import type { ProjectState } from "./state.js";

export interface Status {
  schemaVersion: 1;
  next: { command: string; because: string };
  plan: { done: number; total: number; nextItem: string | null };
  work: ProjectState["work"];
  findings: { total: number; blocking: string[]; byStatus: Record<string, number> };
  overview: { present: boolean; fresh: boolean | null };
  warnings: string[];
}

export function computeStatus(state: ProjectState): Status {
  const leaves = state.plan.filter(
    (item, index) => state.plan[index + 1] === undefined || state.plan[index + 1]!.depth <= item.depth
  );
  const done = leaves.filter((i) => i.done).length;
  const nextItem = leaves.find((i) => !i.done) ?? null;

  const byStatus: Record<string, number> = {};
  for (const finding of state.findings) {
    byStatus[finding.status] = (byStatus[finding.status] ?? 0) + 1;
  }
  const blocking = state.findings
    .filter((f) => (f.severity === "P0" || f.severity === "P1") && (f.status === "open" || f.status === "fixed"))
    .map((f) => `${f.id} [${f.severity}] ${f.status} - ${f.title}`);

  const warnings: string[] = [];
  if (!state.configValid) warnings.push("config.json does not parse; workflow commands will stop rather than guess");
  if (state.overviewFresh === false) warnings.push("the plans changed after the overview was generated");
  if (state.openQuestions.length > 0) {
    warnings.push(`open question(s) in the overview: ${state.openQuestions.join(", ")}`);
  }
  if (state.work.active && state.work.stepsTotal > 0 && state.work.stepsDone === state.work.stepsTotal &&
      state.work.status !== "verified") {
    warnings.push("every step is ticked but the work is not verified");
  }

  return {
    schemaVersion: 1,
    next: nextAction(state, nextItem?.title ?? null, blocking.length > 0),
    plan: { done, total: leaves.length, nextItem: nextItem?.title ?? null },
    work: state.work,
    findings: { total: state.findings.length, blocking, byStatus },
    overview: { present: state.overviewPresent, fresh: state.overviewFresh },
    warnings
  };
}

function nextAction(state: ProjectState, nextItem: string | null, blocked: boolean): Status["next"] {
  if (!state.configValid) return { command: "doctor", because: "configuration cannot be parsed" };
  if (!state.overviewPresent) return { command: "overview", because: "no source of truth has been generated" };
  if (state.overviewFresh === false) return { command: "overview", because: "the plans have changed since it was generated" };

  if (state.work.active) {
    if (blocked) return { command: "audit", because: "a blocking finding must be re-reviewed before completion" };
    if (state.work.stepsDone < state.work.stepsTotal) {
      return { command: "implement", because: `step ${state.work.stepsDone + 1} of ${state.work.stepsTotal} is next` };
    }
    if (state.work.status !== "verified") return { command: "check", because: "every step is built but nothing has proved it" };
    return { command: "complete", because: "the work is built and verified" };
  }

  if (nextItem) return { command: "feature", because: `next in the plan: ${nextItem}` };
  if (state.plan.length === 0) return { command: "overview", because: "the build plan has no items yet" };
  return { command: "release", because: "the build plan is complete" };
}

export function renderStatus(status: Status, cmd = "/"): string {
  const out: string[] = [];
  const pct = status.plan.total > 0 ? Math.round((status.plan.done / status.plan.total) * 100) : 0;

  out.push(`Next:     ${cmd}${status.next.command}  (${status.next.because})`, "");
  out.push(
    status.work.active
      ? `Active:   ${status.work.title ?? "untitled"} - step ${status.work.stepsDone}/${status.work.stepsTotal}` +
          (status.work.status ? ` (${status.work.status})` : "")
      : "Active:   nothing in progress"
  );
  out.push(`Plan:     ${status.plan.done}/${status.plan.total} complete (${pct}%)`);

  if (status.findings.total === 0) {
    out.push("Findings: none");
  } else {
    const summary = Object.entries(status.findings.byStatus).map(([k, v]) => `${v} ${k}`).join(", ");
    out.push(`Findings: ${summary}`);
    for (const item of status.findings.blocking) out.push(`          BLOCKING  ${item}`);
  }

  out.push(
    `Overview: ${!status.overview.present ? "not generated" : status.overview.fresh === false ? "stale" : "current"}`
  );

  if (status.warnings.length > 0) {
    out.push("", "Warnings:");
    for (const warning of status.warnings) out.push(`  - ${warning}`);
  }

  return out.join("\n");
}
