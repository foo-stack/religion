import { test } from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { CONTENT_SECURITY_POLICY, isOwnHost, startDashboard } from "./dashboard.js";

test("isOwnHost accepts the loopback address and localhost on its own port", () => {
  assert.equal(isOwnHost("127.0.0.1:4321", 4321), true);
  assert.equal(isOwnHost("localhost:4321", 4321), true);
  assert.equal(isOwnHost("LocalHost:4321", 4321), true);
});

test("isOwnHost refuses a missing header", () => {
  assert.equal(isOwnHost(undefined, 4321), false);
  assert.equal(isOwnHost("", 4321), false);
});

test("isOwnHost refuses a foreign host, even one rebound to loopback", () => {
  assert.equal(isOwnHost("evil.example:4321", 4321), false);
  assert.equal(isOwnHost("evil.example", 4321), false);
});

test("isOwnHost refuses the wrong port, a missing port, and IPv6 loopback", () => {
  assert.equal(isOwnHost("127.0.0.1:4322", 4321), false);
  assert.equal(isOwnHost("localhost", 4321), false);
  assert.equal(isOwnHost("[::1]:4321", 4321), false);
});

function get(url: string, host: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { headers: { host } }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => (body += chunk));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, headers: response.headers, body }));
    });
    // A request the server never answers fails the test rather than hanging it.
    request.setTimeout(5000, () => request.destroy(new Error(`no answer from ${url}`)));
    request.on("error", reject);
  });
}

test("the dashboard binds loopback, refuses a foreign host, and confines every response", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-dashboard-"));
  const dashboard = await startDashboard(root);
  t.after(async () => {
    await dashboard.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  const own = new URL(dashboard.url).host;

  assert.equal(dashboard.address, "127.0.0.1");
  const refused = await get(`${dashboard.url}/state.json`, "evil.example");
  const data = await get(`${dashboard.url}/state.json`, own);
  const page = await get(`${dashboard.url}/`, own);
  const other = await get(`${dashboard.url}/anything-else`, own);
  assert.deepEqual([refused.status, data.status, page.status, other.status], [403, 200, 200, 200]);

  assert.equal(
    CONTENT_SECURITY_POLICY,
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'"
  );
  for (const response of [refused, data, page, other]) {
    assert.equal(response.headers["content-security-policy"], CONTENT_SECURITY_POLICY, "every response carries the exact policy");
  }
});


test("the dashboard's data carries every view's section", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-dashboard-"));
  const dashboard = await startDashboard(root, "9.9.9");
  t.after(async () => {
    await dashboard.close();
    await fs.rm(root, { recursive: true, force: true });
  });

  const response = await get(`${dashboard.url}/state.json`, new URL(dashboard.url).host);
  const data = JSON.parse(response.body) as Record<string, unknown>;
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(data), ["status", "plan", "findings", "activity", "work", "history", "health"]);
  assert.deepEqual(Object.keys(data.health as object), ["checks", "config", "install", "tool", "inbox", "questions"]);
  assert.equal((data.health as { tool: string }).tool, "9.9.9");
});

test("a project the dashboard cannot read answers 500 with the error, and the server keeps serving", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-dashboard-"));
  // A skill tree that is a file makes doctor's directory read throw.
  await fs.mkdir(path.join(root, ".claude"));
  await fs.writeFile(path.join(root, ".claude", "skills"), "not a directory");
  const dashboard = await startDashboard(root);
  t.after(async () => {
    await dashboard.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  const own = new URL(dashboard.url).host;

  const failed = await get(`${dashboard.url}/state.json`, own);
  assert.equal(failed.status, 500);
  assert.equal(failed.headers["content-security-policy"], CONTENT_SECURITY_POLICY);
  assert.match((JSON.parse(failed.body) as { error: string }).error, /ENOTDIR/);
  assert.equal((await get(`${dashboard.url}/`, own)).status, 200, "the server survives the failure");
});
