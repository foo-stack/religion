/**
 * A local, read-only view of project state.
 *
 * Binds to the loopback interface only. It renders what the state files say and never
 * writes, runs a workflow command, or starts the project.
 */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

import { readIfPresent, statePath } from "./paths.js";
import { readProjectState } from "./state.js";
import { computeStatus } from "./status.js";

export interface Dashboard {
  url: string;
  close: () => Promise<void>;
}

export async function startDashboard(root: string): Promise<Dashboard> {
  const server = http.createServer((request, response) => {
    void handle(root, request, response);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}

async function handle(root: string, request: http.IncomingMessage, response: http.ServerResponse) {
  if (request.url === "/state.json") {
    const state = await readProjectState(root);
    const activity = await readActivity(root);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: computeStatus(state), plan: state.plan, findings: state.findings, activity }));
    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(PAGE);
}

async function readActivity(root: string): Promise<unknown> {
  const raw = await readIfPresent(statePath(root, ".state", "run.json"));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function historyCount(root: string): Promise<number> {
  let total = 0;
  for (const kind of ["features", "fixes", "rollbacks"]) {
    try {
      const entries = await fs.readdir(statePath(root, "history", kind));
      total += entries.filter((e) => e.endsWith(".md") && e !== "README.md").length;
    } catch {
      // absent directory contributes nothing
    }
  }
  return total;
}

const PAGE = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Religion</title>
<style>
  :root { color-scheme: light dark; --bg:#fbfbfa; --fg:#1a1a19; --dim:#6b6b68; --line:#e5e5e2; --card:#fff; --warn:#b45309; --block:#b91c1c; }
  @media (prefers-color-scheme: dark) { :root { --bg:#16161a; --fg:#e8e8e6; --dim:#9a9a96; --line:#2a2a30; --card:#1e1e24; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:2rem 1.25rem; background:var(--bg); color:var(--fg);
         font:14px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif; }
  main { max-width:56rem; margin:0 auto; }
  h1 { font-size:1.1rem; margin:0 0 1.5rem; letter-spacing:-.01em; }
  h1 span { color:var(--dim); font-weight:400; }
  .next { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:1rem 1.25rem; margin-bottom:1.25rem; }
  .next b { font-size:1.15rem; font-family:ui-monospace,monospace; }
  .next p { margin:.35rem 0 0; color:var(--dim); }
  .grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(15rem,1fr)); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:1rem 1.25rem; }
  .card h2 { font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; color:var(--dim); margin:0 0 .6rem; }
  .bar { height:5px; background:var(--line); border-radius:3px; overflow:hidden; margin:.5rem 0; }
  .bar i { display:block; height:100%; background:var(--fg); }
  ul { margin:.4rem 0 0; padding-left:1.1rem; }
  li { margin:.2rem 0; }
  .warn { color:var(--warn); } .block { color:var(--block); font-weight:600; }
  .dim { color:var(--dim); }
  code { font-family:ui-monospace,monospace; }
</style>
<main>
  <h1>Religion <span id="root"></span></h1>
  <div class="next"><b id="next">...</b><p id="why"></p></div>
  <div class="grid">
    <div class="card"><h2>Active work</h2><div id="work"></div></div>
    <div class="card"><h2>Plan</h2><div id="plan"></div></div>
    <div class="card"><h2>Findings</h2><div id="findings"></div></div>
    <div class="card"><h2>Warnings</h2><div id="warnings"></div></div>
  </div>
</main>
<script>
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[c]));
async function load() {
  let d; try { d = await (await fetch("/state.json")).json(); } catch { return; }
  const s = d.status;
  next.textContent = "/" + s.next.command;
  why.textContent = s.next.because;
  work.innerHTML = s.work.active
    ? "<b>" + esc(s.work.title || "untitled") + "</b><div class=bar><i style='width:" +
      (s.work.stepsTotal ? Math.round(s.work.stepsDone / s.work.stepsTotal * 100) : 0) +
      "%'></i></div><span class=dim>step " + s.work.stepsDone + " of " + s.work.stepsTotal +
      (s.work.status ? " &middot; " + esc(s.work.status) : "") + "</span>"
    : "<span class=dim>nothing in progress</span>";
  plan.innerHTML = "<div class=bar><i style='width:" +
    (s.plan.total ? Math.round(s.plan.done / s.plan.total * 100) : 0) + "%'></i></div><span class=dim>" +
    s.plan.done + " of " + s.plan.total + " complete</span>" +
    (s.plan.nextItem ? "<ul><li>" + esc(s.plan.nextItem) + "</li></ul>" : "");
  findings.innerHTML = s.findings.total === 0
    ? "<span class=dim>none</span>"
    : (s.findings.blocking.length
        ? "<ul>" + s.findings.blocking.map((f) => "<li class=block>" + esc(f) + "</li>").join("") + "</ul>"
        : "") + "<span class=dim>" +
      Object.entries(s.findings.byStatus).map(([k, v]) => v + " " + k).join(", ") + "</span>";
  warnings.innerHTML = s.warnings.length
    ? "<ul>" + s.warnings.map((w) => "<li class=warn>" + esc(w) + "</li>").join("") + "</ul>"
    : "<span class=dim>none</span>";
}
load(); setInterval(load, 3000);
</script>`;
