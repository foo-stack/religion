/**
 * A local, read-only view of project state.
 *
 * Binds to the loopback interface only. It renders what the state files say and never
 * writes, runs a workflow command, or starts the project.
 */

import http from "node:http";
import path from "node:path";

import { runDoctor } from "./doctor.js";
import { readManifest } from "./install.js";
import { readIfPresent, statePath } from "./paths.js";
import { parseInbox, parseSpec, readHistory, readProjectState } from "./state.js";
import { computeStatus } from "./status.js";

export interface Dashboard {
  url: string;
  /** The address the server is bound to, which must be loopback. */
  address: string;
  close: () => Promise<void>;
}

/** `version` is the running tool's, shown beside the version that installed the project. */
export async function startDashboard(root: string, version: string | null = null): Promise<Dashboard> {
  let port = 0;
  const server = http.createServer((request, response) => {
    void handle(root, version, port, request, response);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  port = typeof address === "object" && address ? address.port : 0;

  return {
    url: `http://127.0.0.1:${port}`,
    address: typeof address === "object" && address ? address.address : "",
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}

/**
 * Whether a request was addressed to this server by name, not only by socket.
 *
 * Binding to loopback keeps other machines out, but not a page elsewhere whose domain has
 * been rebound to 127.0.0.1: the browser connects here and sends that domain as the Host.
 * Answering only our own name refuses it.
 */
export function isOwnHost(host: string | undefined, port: number): boolean {
  const name = host?.toLowerCase();
  return name === `127.0.0.1:${port}` || name === `localhost:${port}`;
}

/** What every response allows a browser to load: inline script and style, and its own server. */
export const CONTENT_SECURITY_POLICY =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'";

async function handle(
  root: string,
  version: string | null,
  port: number,
  request: http.IncomingMessage,
  response: http.ServerResponse
) {
  if (!isOwnHost(request.headers.host, port)) {
    send(response, 403, "text/plain; charset=utf-8", "Forbidden: this dashboard only answers requests addressed to itself.");
    return;
  }

  if (request.url === "/state.json") {
    // An unreadable project must answer, not take the server down with an unhandled rejection.
    let body: string;
    try {
      body = JSON.stringify(await readState(root, version));
    } catch (error) {
      send(response, 500, "application/json", JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      return;
    }
    send(response, 200, "application/json", body);
    return;
  }

  send(response, 200, "text/html; charset=utf-8", PAGE);
}

/** The only way this server answers, so no response can leave out the policy. */
function send(response: http.ServerResponse, status: number, type: string, body: string): void {
  response.writeHead(status, { "content-type": type, "content-security-policy": CONTENT_SECURITY_POLICY });
  response.end(body);
}

async function readState(root: string, version: string | null) {
  const state = await readProjectState(root);
  return {
    project: path.basename(root),
    status: computeStatus(state),
    plan: state.plan,
    findings: state.findings,
    activity: await readActivity(root),
    work: parseSpec(await readIfPresent(statePath(root, "context", "current-work.md"))),
    history: await readHistory(root),
    health: {
      checks: await runDoctor(root),
      config: state.config,
      install: await readInstall(root),
      tool: version,
      inbox: parseInbox(await readIfPresent(statePath(root, "context", "inbox.md"))),
      questions: state.openQuestions
    }
  };
}

/** The manifest is the project's file and may be hand-edited, so only well-formed parts are shown. */
async function readInstall(root: string) {
  const manifest: unknown = await readManifest(root);
  if (!manifest || typeof manifest !== "object") return null;
  const { version, adapters, managed } = manifest as Record<string, unknown>;
  return {
    version: typeof version === "string" ? version : null,
    adapters: Array.isArray(adapters) ? adapters.filter((a): a is string => typeof a === "string") : [],
    managed: managed && typeof managed === "object" ? Object.keys(managed).length : 0
  };
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

const PAGE = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Religion</title>
<style>
/* Tokens: every colour, size and space the page uses. */
:root {
  color-scheme: light dark;

  /* Type */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  --text-2xs: 10px;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-lg: 15px;
  --text-xl: 20px;
  --text-2xl: 26px;
  --leading-tight: 1.25;
  --leading-base: 1.5;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --tracking-label: 0.06em;

  /* Space */
  --space-1: 2px;
  --space-2: 4px;
  --space-3: 6px;
  --space-4: 8px;
  --space-5: 12px;
  --space-6: 16px;
  --space-7: 20px;
  --space-8: 24px;
  --space-9: 32px;

  /* Shape */
  --radius-sm: 3px;
  --radius-md: 5px;
  --radius-lg: 8px;
  --border-width: 1px;
  --bar-height: 4px;
  --dot-size: 7px;
  --mark-size: 12px;
  --mark-ring: 2px;
  --tracking-tight: -0.015em;

  /* Layout */
  --rail-width: 208px;
  --content-max: 1280px;
  --row-height: 28px;
  --tile-min: 168px;
  --mark-column: 16px;
  --number-column: 32px;
  --label-column: 96px;
  --grid-split: 1.15fr 1fr;
  --aside-width: 340px;
  --key-column: 132px;
  --chart-height: 8px;

  /* Light */
  --bg: #f6f6f7;
  --surface: #ffffff;
  --surface-2: #f2f2f4;
  --surface-hover: #ececf0;
  --border: #e4e4e9;
  --border-strong: #d1d1d9;
  --text: #17171c;
  --text-2: #55555f;
  --text-3: #8b8b96;
  --accent: #4f46e5;
  --accent-weak: #eceeff;
  --ok: #15803d;
  --ok-weak: #e7f6ec;
  --progress: #2563eb;
  --progress-weak: #e8f0fe;
  --warn: #b45309;
  --warn-weak: #fdf3e2;
  --block: #dc2626;
  --block-weak: #fdeaea;
  --sev-p0: #dc2626;
  --sev-p1: #ea580c;
  --sev-p2: #ca8a04;
  --sev-p3: #64748b;
  --heat-0: transparent;
  --heat-1: #eef0f6;
  --heat-2: #dde2ee;
  --heat-3: #c3cbe0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d0d10;
    --surface: #15151a;
    --surface-2: #1b1b21;
    --surface-hover: #22222a;
    --border: #25252d;
    --border-strong: #33333d;
    --text: #ececf1;
    --text-2: #a3a3ad;
    --text-3: #6f6f7a;
    --accent: #8b8cf8;
    --accent-weak: #1f1f3a;
    --ok: #4ade80;
    --ok-weak: #12261a;
    --progress: #60a5fa;
    --progress-weak: #13213a;
    --warn: #f59e0b;
    --warn-weak: #2a1f0c;
    --block: #f87171;
    --block-weak: #2c1414;
    --sev-p0: #f87171;
    --sev-p1: #fb923c;
    --sev-p2: #facc15;
    --sev-p3: #94a3b8;
    --heat-1: #1d1f2b;
    --heat-2: #262a3c;
    --heat-3: #323853;
  }
}

/* Components, shared by every screen. */

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: var(--text-base)/var(--leading-base) var(--font-sans); }
.app { display: grid; grid-template-columns: var(--rail-width) 1fr; min-height: 100vh; }
.mono { font-family: var(--font-mono); }
.dim { color: var(--text-2); } .faint { color: var(--text-3); }
.label { font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: var(--tracking-label); color: var(--text-3); font-weight: var(--weight-medium); }

/* Rail */
.rail { border-right: var(--border-width) solid var(--border); background: var(--surface); padding: var(--space-6) var(--space-4); display: flex; flex-direction: column; gap: var(--space-6); position: sticky; top: 0; height: 100vh; }
.brand { padding: 0 var(--space-4); }
.brand b { font-size: var(--text-lg); font-weight: var(--weight-semibold); letter-spacing: var(--tracking-tight); }
.brand div { font-size: var(--text-xs); color: var(--text-3); font-family: var(--font-mono); margin-top: var(--space-1); }
.nav { display: flex; flex-direction: column; gap: var(--space-1); }
.nav a { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); color: var(--text-2); text-decoration: none; font-weight: var(--weight-medium); }
.nav a:hover { background: var(--surface-hover); color: var(--text); }
.count { font-size: var(--text-xs); font-family: var(--font-mono); color: var(--text-3); }
.count.warn { color: var(--warn); }
.rail-foot { margin-top: auto; padding: 0 var(--space-4); font-size: var(--text-xs); color: var(--text-3); display: grid; gap: var(--space-2); }
.live { display: inline-flex; align-items: center; gap: var(--space-3); }
.live::before { content: ""; width: var(--dot-size); height: var(--dot-size); border-radius: 50%; background: var(--ok); }

/* Main */
main { padding: var(--space-7) var(--space-8) var(--space-9); max-width: var(--content-max); width: 100%; }
.head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-6); margin-bottom: var(--space-6); }
.head h1 { font-size: var(--text-xl); margin: 0; font-weight: var(--weight-semibold); letter-spacing: var(--tracking-tight); }
.head .meta { font-size: var(--text-xs); color: var(--text-3); font-family: var(--font-mono); display: flex; gap: var(--space-6); }

.next { display: flex; align-items: center; gap: var(--space-6); background: var(--accent-weak); border: var(--border-width) solid var(--accent); border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6); margin-bottom: var(--space-6); }
.next .cmd { font-family: var(--font-mono); font-size: var(--text-lg); font-weight: var(--weight-semibold); color: var(--accent); }
.next p { margin: 0; color: var(--text-2); }

.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--tile-min), 1fr)); gap: var(--space-4); margin-bottom: var(--space-6); }
.tile { background: var(--surface); border: var(--border-width) solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6); }
.tile .big { font-size: var(--text-2xl); font-weight: var(--weight-semibold); letter-spacing: var(--tracking-tight); line-height: var(--leading-tight); margin: var(--space-3) 0 var(--space-2); font-variant-numeric: tabular-nums; }
.tile .big small { font-size: var(--text-base); color: var(--text-3); font-weight: var(--weight-regular); }
.tile .sub { font-size: var(--text-xs); color: var(--text-2); }
.tile.good .big { color: var(--ok); }
.bar { height: var(--bar-height); background: var(--surface-2); border-radius: var(--radius-sm); overflow: hidden; display: flex; margin-top: var(--space-4); }
.bar i { display: block; height: 100%; }

.grid { display: grid; grid-template-columns: var(--grid-split); gap: var(--space-4); }
.panel { background: var(--surface); border: var(--border-width) solid var(--border); border-radius: var(--radius-lg); }
.panel > header { display: flex; align-items: baseline; justify-content: space-between; padding: var(--space-5) var(--space-6) var(--space-4); border-bottom: var(--border-width) solid var(--border); }
.panel > header h2 { margin: 0; font-size: var(--text-sm); font-weight: var(--weight-semibold); }
.panel > header a { font-size: var(--text-xs); color: var(--text-3); text-decoration: none; }
.panel .body { padding: var(--space-4) var(--space-6) var(--space-5); }

/* Steps */
.work-title { font-size: var(--text-lg); font-weight: var(--weight-semibold); margin: var(--space-2) 0 var(--space-2); }
.tags { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); }
.tag { font-size: var(--text-2xs); padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); background: var(--surface-2); color: var(--text-2); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: var(--tracking-label); }
.tag.progress { background: var(--progress-weak); color: var(--progress); }
.goal { color: var(--text-2); margin: 0 0 var(--space-5); font-size: var(--text-sm); }
.steps { list-style: none; margin: 0; padding: 0; }
.steps li { display: grid; grid-template-columns: var(--mark-column) 1fr auto; gap: var(--space-4); align-items: center; min-height: var(--row-height); border-top: var(--border-width) solid var(--border); font-size: var(--text-sm); }
.steps li:first-child { border-top: 0; }
.mark { width: var(--mark-size); height: var(--mark-size); border-radius: 50%; border: var(--border-width) solid var(--border-strong); }
.done .mark { background: var(--ok); border-color: var(--ok); }
.done .name { color: var(--text-2); }
.now { background: var(--progress-weak); margin: 0 calc(-1 * var(--space-6)); padding: 0 var(--space-6); }
.now .mark { border: var(--mark-ring) solid var(--progress); }
.now .name { font-weight: var(--weight-medium); }
.steps .side { font-size: var(--text-xs); color: var(--text-3); font-family: var(--font-mono); }

/* Matrix */
table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
th { font-weight: var(--weight-medium); color: var(--text-3); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: var(--tracking-label); text-align: right; padding: var(--space-3) var(--space-4); }
th:first-child { text-align: left; }
td { padding: var(--space-3) var(--space-4); text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; border-top: var(--border-width) solid var(--border); }
td:first-child { text-align: left; font-family: var(--font-sans); }
.sev { display: inline-flex; align-items: center; gap: var(--space-3); font-weight: var(--weight-medium); }
.sev::before { content: ""; width: var(--dot-size); height: var(--dot-size); border-radius: 50%; background: currentColor; }
.p0 { color: var(--sev-p0); } .p1 { color: var(--sev-p1); } .p2 { color: var(--sev-p2); } .p3 { color: var(--sev-p3); }
.h0 { color: var(--text-3); } .h1 { background: var(--heat-1); } .h2 { background: var(--heat-2); } .h3 { background: var(--heat-3); }
.callout { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-5); font-size: var(--text-xs); color: var(--ok); }
.callout::before { content: ""; width: var(--dot-size); height: var(--dot-size); border-radius: 50%; background: var(--ok); }

/* Plan */
.plan { list-style: none; margin: 0; padding: 0; font-size: var(--text-sm); }
.plan li { display: grid; grid-template-columns: var(--number-column) 1fr auto; gap: var(--space-4); align-items: center; min-height: var(--row-height); }
.plan .num { font-family: var(--font-mono); color: var(--text-3); font-size: var(--text-xs); }
.plan .sub { padding-left: var(--space-7); }
.plan .done .t { color: var(--text-2); }
.plan .next-item .t { color: var(--accent); font-weight: var(--weight-medium); }
.check { font-size: var(--text-xs); color: var(--ok); }
.queued { font-size: var(--text-xs); color: var(--accent); font-family: var(--font-mono); }

/* Activity and health */
.kv { display: grid; grid-template-columns: var(--label-column) 1fr; gap: var(--space-2) var(--space-5); font-size: var(--text-sm); }
.kv dt { color: var(--text-3); }
.kv dd { margin: 0; }
.run { display: inline-flex; align-items: center; gap: var(--space-3); font-weight: var(--weight-medium); color: var(--progress); }
.run::before { content: ""; width: var(--dot-size); height: var(--dot-size); border-radius: 50%; background: var(--progress); }
.checks { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2) var(--space-6); margin-top: var(--space-5); font-size: var(--text-xs); }
.checks span { display: flex; align-items: center; gap: var(--space-3); color: var(--text-2); }
.checks span::before { content: ""; width: var(--dot-size); height: var(--dot-size); border-radius: 50%; background: var(--ok); }
.divider { border-top: var(--border-width) solid var(--border); margin: var(--space-5) 0; }

/* History */
.hist { width: 100%; }
.hist td:first-child { width: var(--number-column); color: var(--text-3); font-family: var(--font-mono); font-size: var(--text-xs); }
.hist td.t { text-align: left; font-family: var(--font-sans); }
.stack { grid-column: 1 / -1; }

/* Detail views */
.layout { display: grid; grid-template-columns: 1fr var(--aside-width); gap: var(--space-4); align-items: start; }
.col { display: grid; gap: var(--space-4); }
.prose { margin: 0; color: var(--text-2); font-size: var(--text-sm); }
.prose + .prose { margin-top: var(--space-4); }
.prose b { color: var(--text); font-weight: var(--weight-semibold); }
code { font-family: var(--font-mono); font-size: var(--text-xs); background: var(--surface-2); padding: 0 var(--space-2); border-radius: var(--radius-sm); }
.list { margin: 0; padding-left: var(--space-6); font-size: var(--text-sm); color: var(--text-2); display: grid; gap: var(--space-2); }
.list b { color: var(--text); font-weight: var(--weight-medium); }
.section-label { margin: var(--space-6) 0 var(--space-3); }
.section-label:first-child { margin-top: 0; }

/* Step cards */
.step { display: grid; grid-template-columns: var(--mark-column) 1fr auto; gap: var(--space-2) var(--space-4); padding: var(--space-5) var(--space-6); border-top: var(--border-width) solid var(--border); }
.step:first-child { border-top: 0; }
.step .mark { margin-top: var(--space-1); }
.step h3 { margin: 0; font-size: var(--text-sm); font-weight: var(--weight-semibold); }
.step .n { color: var(--text-3); font-family: var(--font-mono); font-weight: var(--weight-regular); margin-right: var(--space-3); }
.step .what, .step .when { grid-column: 2 / -1; margin: 0; font-size: var(--text-sm); color: var(--text-2); }
.step .when { font-size: var(--text-xs); }
.step .when b { color: var(--text-3); font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: var(--tracking-label); font-size: var(--text-2xs); margin-right: var(--space-3); }
.step .side { font-size: var(--text-xs); color: var(--text-3); font-family: var(--font-mono); }
.step.done .mark { background: var(--ok); border-color: var(--ok); }
.step.done h3 { color: var(--text-2); }
.step.now { background: var(--progress-weak); margin: 0; padding: var(--space-5) var(--space-6); }
.step.now .mark { border: var(--mark-ring) solid var(--progress); }
.step.now .side { color: var(--progress); font-weight: var(--weight-medium); }

/* Horizontal bars */
.hbars { display: grid; gap: var(--space-3); font-size: var(--text-sm); }
.hbar { display: grid; grid-template-columns: var(--key-column) 1fr var(--number-column); gap: var(--space-4); align-items: center; }
.hbar .k { color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hbar .v { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--text-2); font-size: var(--text-xs); }
.track { height: var(--chart-height); background: var(--surface-2); border-radius: var(--radius-sm); overflow: hidden; display: flex; }
.track i { display: block; height: 100%; }

/* Filters and status */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-4) var(--space-6); border-bottom: var(--border-width) solid var(--border); flex-wrap: wrap; }
.chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.chip { font-size: var(--text-xs); padding: var(--space-1) var(--space-4); border-radius: var(--radius-md); border: var(--border-width) solid var(--border); color: var(--text-2); background: var(--surface); font-weight: var(--weight-medium); }
.chip.on { background: var(--text); border-color: var(--text); color: var(--surface); }
.chip .count { margin-left: var(--space-2); }
.chip.on .count { color: var(--surface); }
.status { font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: var(--tracking-label); font-weight: var(--weight-medium); padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-family: var(--font-sans); white-space: nowrap; }
.status.open { background: var(--warn-weak); color: var(--warn); }
.status.fixed { background: var(--progress-weak); color: var(--progress); }
.status.unverified { background: var(--surface-2); color: var(--text-2); }
.status.closed { background: var(--ok-weak); color: var(--ok); }

/* Dense tables */
.rows td { font-family: var(--font-sans); text-align: left; vertical-align: baseline; }
.rows th { text-align: left; }
.rows th:first-child, .rows td:first-child { padding-left: var(--space-6); }
.rows th:last-child, .rows td:last-child { padding-right: var(--space-6); }
.rows tr:hover td { background: var(--surface-hover); }
.rows tr.sel td { background: var(--accent-weak); }
.rows tr.sel td:first-child { box-shadow: inset var(--mark-ring) 0 0 var(--accent); }
.rows .id, .rows .file { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-3); white-space: nowrap; }
.rows .num, .rows th.num { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--text-2); }
.more { padding: var(--space-4) var(--space-6); font-size: var(--text-xs); color: var(--text-3); border-top: var(--border-width) solid var(--border); }

/* Health */
.checklist { list-style: none; margin: 0; padding: 0; }
.checklist li { display: grid; grid-template-columns: var(--mark-column) var(--key-column) 1fr auto; gap: var(--space-4); align-items: center; min-height: var(--row-height); padding: var(--space-3) var(--space-6); border-top: var(--border-width) solid var(--border); font-size: var(--text-sm); }
.checklist li:first-child { border-top: 0; }
.checklist .ok { width: var(--dot-size); height: var(--dot-size); border-radius: 50%; background: var(--ok); }
.checklist .detail { color: var(--text-2); }
.checklist .blocks { font-size: var(--text-xs); color: var(--text-3); }
.notice { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-5) var(--space-6); border: var(--border-width) solid var(--warn); background: var(--warn-weak); border-radius: var(--radius-lg); margin-bottom: var(--space-6); }
.notice .cmd { font-family: var(--font-mono); font-size: var(--text-lg); font-weight: var(--weight-semibold); color: var(--warn); white-space: nowrap; }
.notice p { margin: 0; color: var(--text-2); }
.grid.thirds { grid-template-columns: repeat(3, 1fr); margin-bottom: var(--space-4); }
.sticky { position: sticky; top: var(--space-7); }
.legend { gap: var(--space-5); font-size: var(--text-xs); margin-top: var(--space-2); }
.kv.spaced { margin: var(--space-4) 0; }
.rows .track { min-width: var(--key-column); }
.steps.flat li { grid-template-columns: 1fr auto; }

/* Views: one per hash, the overview when none is targeted, so no script reads the address. */
.view { display: none; scroll-margin-top: 100vh; }
.view:target, main:not(:has(.view:target)) #overview { display: block; }
.app:not(:has(.view:target)) .to-overview, .app:has(#overview:target) .to-overview, .app:has(#work:target) .to-work,
.app:has(#findings:target) .to-findings, .app:has(#history:target) .to-history, .app:has(#health:target) .to-health { background: var(--surface-2); color: var(--text); }
.live.off { color: var(--block); }
.live.off::before { background: var(--block); }
.problem { border: var(--border-width) solid var(--block); background: var(--block-weak); color: var(--block); border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6); margin-bottom: var(--space-6); font-size: var(--text-sm); }
.empty { margin: 0; color: var(--text-3); font-size: var(--text-sm); }
button.chip { font-family: inherit; cursor: pointer; }
[data-pick] { cursor: pointer; }
:focus-visible { outline: var(--mark-ring) solid var(--accent); outline-offset: var(--space-1); }
@media (max-width: 900px) {
  .app { grid-template-columns: 1fr; }
  .rail { position: static; height: auto; }
  .grid, .grid.thirds, .layout { grid-template-columns: 1fr; }
}
</style>
<div class="app">
  <nav class="rail">
    <div class="brand"><b>Religion</b><div id="project"></div></div>
    <div class="nav">
      <a class="to-overview" href="#overview">Overview</a>
      <a class="to-work" href="#work">Work <span class="count" id="count-work"></span></a>
      <a class="to-findings" href="#findings">Findings <span class="count" id="count-findings"></span></a>
      <a class="to-history" href="#history">History <span class="count" id="count-history"></span></a>
      <a class="to-health" href="#health">Health <span class="count" id="count-health"></span></a>
    </div>
    <div class="rail-foot">
      <span class="live off" id="live">Connecting</span>
      <span class="mono" id="tool"></span>
    </div>
  </nav>
  <main>
    <div class="problem" id="problem" hidden></div>
    <section class="view" id="overview">
      <div class="head"><h1>Overview</h1><div class="meta" id="ov-meta"></div></div>
      <div class="next"><span class="label">Next</span><span class="cmd" id="next-command">...</span><p id="next-because"></p></div>
    </section>
    <section class="view" id="work"><div class="head"><h1>Work</h1></div></section>
    <section class="view" id="findings"><div class="head"><h1>Findings</h1></div></section>
    <section class="view" id="history"><div class="head"><h1>Plan and history</h1></div></section>
    <section class="view" id="health"><div class="head"><h1>Activity and health</h1></div></section>
  </main>
</div>
<script>
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let last = "";
  let data = null;

  function setLive(ok, text) {
    $("live").className = ok ? "live" : "live off";
    $("live").textContent = text;
  }

  function showProblem(text) {
    $("problem").hidden = !text;
    $("problem").textContent = text || "";
  }

  async function load() {
    let response;
    let text;
    try {
      response = await fetch("/state.json", { cache: "no-store" });
      text = await response.text();
    } catch {
      setLive(false, "Disconnected, retrying");
      return;
    }
    if (!response.ok) {
      let reason = "the server answered " + response.status;
      try { reason = JSON.parse(text).error || reason; } catch {}
      showProblem("The project could not be read: " + reason);
      setLive(false, "Cannot read the project");
      return;
    }
    showProblem("");
    setLive(true, "Live, updated " + new Date().toLocaleTimeString());
    if (text === last) return;
    last = text;
    data = JSON.parse(text);
    render();
  }

  function render() {
    $("project").textContent = data.project;
    $("tool").textContent = data.health.tool ? "create-religion " + data.health.tool : "";
    $("next-command").textContent = data.status.next.command;
    $("next-because").textContent = data.status.next.because;
  }

  load();
  setInterval(load, 3000);
})();
</script>`;
