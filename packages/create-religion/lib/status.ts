/**
 * What the project's state means, and the one action that follows from it.
 *
 * The next action is the point. A report that lists five things someone could do has not
 * answered the question they asked, which is almost always "what now".
 */

import { waiting } from "./state.js";
import type { PlanItem, ProjectState } from "./state.js";

export interface Status {
  schemaVersion: 1;
  next: { command: string; because: string };
  plan: { done: number; total: number; nextItem: string | null };
  work: ProjectState["work"];
  findings: { total: number; blocking: string[]; byStatus: Record<string, number> };
  overview: { present: boolean; fresh: boolean | null };
  activity: ProjectState["activity"];
  inbox: { notes: number };
  warnings: string[];
}

/** Below this a distill pass has little to group, and recurrence is what it promotes on. */
export const DISTILL_AFTER = 5;

export function computeStatus(state: ProjectState): Status {
  const leaves = state.plan.filter(
    (item, index) => state.plan[index + 1] === undefined || state.plan[index + 1]!.depth <= item.depth
  );
  const done = leaves.filter((i) => i.done).length;
  const { waits, problems } = waiting(state.plan, new Set(state.settledSpikes));
  const waitsOn = (item: PlanItem) => (item.number ? waits.get(item.number) : undefined);
  const nextItem = leaves.find((i) => !i.done && !waitsOn(i)) ?? null;
  const passedOver = leaves.slice(0, nextItem ? leaves.indexOf(nextItem) : leaves.length).filter((i) => !i.done && waitsOn(i));

  const byStatus: Record<string, number> = {};
  for (const finding of state.findings) {
    byStatus[finding.status] = (byStatus[finding.status] ?? 0) + 1;
  }
  const blocking = state.findings
    .filter((f) => (f.severity === "P0" || f.severity === "P1") && (f.status === "open" || f.status === "fixed"))
    .map((f) => `${f.id} [${f.severity}] ${f.status} - ${f.title}`);

  const warnings: string[] = [];
  if (passedOver.length > 0) {
    const named = passedOver.map((i) => `${i.number} (${waitsOn(i)!.join(", ")})`);
    warnings.push(`passed over plan items that are waiting: ${named.join("; ")}`);
  }
  warnings.push(...problems.map((p) => `the build plan: ${p}`));
  if (!state.configValid) warnings.push("config.json does not parse; workflow commands will stop rather than guess");
  if (state.overviewFresh === false) warnings.push("the plans changed after the overview was generated");
  if (state.openQuestions.length > 0) {
    warnings.push(`open question(s) in the overview: ${state.openQuestions.join(", ")}`);
  }
  if (state.specDrifted) {
    warnings.push("the active spec changed since it was approved, with no amendment recording why");
  }
  if (state.learning.undecided >= DISTILL_AFTER) {
    warnings.push(`${state.learning.undecided} journal entries are waiting for distill`);
  }
  if (state.work.active && state.work.stepsTotal > 0 && state.work.stepsDone === state.work.stepsTotal &&
      state.work.status !== "verified") {
    warnings.push("every step is ticked but the work is not verified");
  }

  return {
    schemaVersion: 1,
    next: nextAction(state, nextItem?.title ?? null, blocking.length > 0, leaves.filter((i) => !i.done && waitsOn(i)), waitsOn),
    plan: { done, total: leaves.length, nextItem: nextItem?.title ?? null },
    work: state.work,
    findings: { total: state.findings.length, blocking, byStatus },
    overview: { present: state.overviewPresent, fresh: state.overviewFresh },
    activity: state.activity,
    inbox: { notes: state.inbox.length },
    warnings
  };
}

function nextAction(
  state: ProjectState,
  nextItem: string | null,
  blocked: boolean,
  waitingLeaves: readonly PlanItem[],
  waitsOn: (item: PlanItem) => string[] | undefined
): Status["next"] {
  if (!state.configValid) return { command: "doctor", because: "configuration cannot be parsed" };
  if (!state.overviewPresent) return { command: "overview", because: "no source of truth has been generated" };
  if (state.overviewFresh === false) return { command: "overview", because: "the plans have changed since it was generated" };

  const run = state.activity;
  if (run.status === "blocked" && run.resumeCommand) {
    return { command: run.resumeCommand.replace(/^[/$]/, ""), because: `the ${run.command} run is blocked: ${run.summary}` };
  }

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
  if (waitingLeaves.length > 0) {
    const onSpike = waitingLeaves.find((i) => waitsOn(i)!.includes("a spike"));
    return onSpike
      ? { command: "spike", because: `every remaining item waits, and item ${onSpike.number} waits on a spike` }
      : { command: "overview", because: "every remaining item waits on another; check the plan's after lines" };
  }
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

  const run = status.activity;
  out.push(
    run.recorded
      ? `Run:      ${cmd}${run.command} ${run.status} - ${run.summary}` + (run.updatedAt ? ` (updated ${run.updatedAt})` : "")
      : "Run:      none recorded"
  );
  out.push(`Inbox:    ${status.inbox.notes === 0 ? "empty" : `${status.inbox.notes} note(s)`}`);

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
